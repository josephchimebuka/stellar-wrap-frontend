
import {
  Contract,
  Transaction,
  TransactionBuilder,
  xdr,
  BASE_FEE,
} from 'stellar-sdk';
import { Horizon } from '@stellar/stellar-sdk';
import { Server, Api } from 'stellar-sdk/rpc';
import { signTransaction } from '@stellar/freighter-api';
import { Network, NETWORK_PASSPHRASES, SOROBAN_RPC_URLS, RPC_ENDPOINTS } from '../config';
import { getContractAddress } from '../../config/contracts';
import { buildContractArgs, type ContractStatsInput } from '../utils/contractArgsBuilder';

export type TransactionState =
  | 'pending'
  | 'simulating'
  | 'signed'
  | 'submitted'
  | 'confirmed'
  | 'failed';

export type TransactionObserver = (state: TransactionState, data?: unknown) => void;

export interface MintWrapOptions {
  accountAddress: string;
  stats: ContractStatsInput;
  network: Network;
  observer?: TransactionObserver;
}

export interface MintResult {
  transactionHash: string;
  ledger: number;
  state: TransactionState;
}

export interface TransactionError {
  message: string;
  code?: string;
  state: TransactionState;
  originalError?: unknown;
}

/**
 * Resource costs from simulation
 */
export interface SimulationCost {
  /** CPU instructions */
  cpuInsns: number;
  /** Memory bytes */
  memBytes: number;
}

/**
 * Contract footprint from simulation
 */
export interface SimulationFootprint {
  /** Read-only contract keys */
  readOnly: string[];
  /** Read-write contract keys */
  readWrite: string[];
}

/**
 * Detailed simulation result
 */
export interface SimulationResult {
  /** Whether simulation succeeded */
  success: boolean;
  /** Error message if simulation failed */
  error?: string;
  /** Resource costs */
  cost?: SimulationCost;
  /** Contract footprint */
  footprint?: SimulationFootprint;
  /** Return value from contract (if successful) */
  result?: unknown;
  /** Estimated transaction fee in XLM */
  estimatedFee?: number;
  /** Account balance in XLM */
  accountBalance?: number;
  /** Whether restore preamble is required */
  requiresRestore?: boolean;
}

// ─── Constants ──────────────────────────────────────────────────────────────

/** Maximum number of confirmation polling attempts */
const MAX_CONFIRMATION_ATTEMPTS = 60;
const CONFIRMATION_POLL_INTERVAL = 2000;

/** Transaction timeout (ms) */
const TRANSACTION_TIMEOUT = 120000; // 2 minutes

/** Simulation cache duration (ms) */
const SIMULATION_CACHE_DURATION = 30000; // 30 seconds

/** Simulation cache */
const simulationCache = new Map<string, { result: SimulationResult; timestamp: number }>();

// ─── Helper Functions ───────────────────────────────────────────────────────

/**
 * Creates a Soroban RPC server instance for the given network
 */
function createSorobanServer(network: Network): Server {
  const rpcUrl = SOROBAN_RPC_URLS[network];
  return new Server(rpcUrl, { allowHttp: rpcUrl.startsWith('http://') });
}

function getNetworkPassphrase(network: Network): string {
  return NETWORK_PASSPHRASES[network];
}

function emitState(
  observer: TransactionObserver | undefined,
  state: TransactionState,
  data?: unknown,
): void {
  if (observer) {
    try {
      observer(state, data);
    } catch (error) {
      console.error('Transaction observer error:', error);
    }
  }
}

async function waitForConfirmation(
  server: Server,
  transactionHash: string,
  observer: TransactionObserver | undefined,
  startTime: number,
): Promise<{ ledger: number }> {
  let attempts = 0;

  while (attempts < MAX_CONFIRMATION_ATTEMPTS) {
    if (Date.now() - startTime > TRANSACTION_TIMEOUT) {
      throw new Error('Transaction confirmation timeout');
    }

    try {
      const response = await server.getTransaction(transactionHash);

      if (response.status === Api.GetTransactionStatus.SUCCESS) {
        const ledger = response.ledger ?? 0;
        emitState(observer, 'confirmed', { ledger, transactionHash });
        return { ledger };
      }

      if (response.status === Api.GetTransactionStatus.FAILED) {
        const errorMessage = 'Transaction failed on network';
        emitState(observer, 'failed', { error: errorMessage });
        throw new Error(errorMessage);
      }
      // NOT_FOUND or other — continue polling
    } catch (error) {
      if (error instanceof Error && error.message.includes('Transaction failed')) {
        throw error;
      }
      console.warn(`Polling attempt ${attempts + 1} failed:`, error);
    }

    attempts++;
    await new Promise((resolve) => setTimeout(resolve, CONFIRMATION_POLL_INTERVAL));
  }

  throw new Error(
    `Transaction not confirmed after ${MAX_CONFIRMATION_ATTEMPTS} attempts`,
  );
}

function parseContractError(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message;
    if (message.includes('insufficient_fee') || message.includes('fee')) {
      return 'Insufficient transaction fee. Please try again.';
    }
    if (message.includes('HostError') || message.includes('ContractError')) {
      return `Contract error: ${message}`;
    }
    if (message.includes('User declined') || message.includes('rejected')) {
      return 'Transaction was rejected by user';
    }
    if (message.includes('network') || message.includes('timeout')) {
      return 'Network error. Please check your connection and try again.';
    }
    return message;
  }
  if (typeof error === 'string') return error;
  return 'Unknown error occurred during transaction';
}


async function buildMintTransaction(
  accountAddress: string,
  stats: ContractStatsInput,
  network: Network,
): Promise<{ transaction: Transaction; contract: Contract }> {
  const contractAddress = getContractAddress(network);
  if (!contractAddress || contractAddress.startsWith('CAAAAAAAA')) {
    throw new Error(
      `Invalid contract address for ${network}. Please configure NEXT_PUBLIC_CONTRACT_ADDRESS_${network.toUpperCase()} environment variable.`,
    );
  }

  const sorobanServer = createSorobanServer(network);

  let account;
  try {
    account = await sorobanServer.getAccount(accountAddress);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('Not Found') || errorMessage.includes('404')) {
      throw new Error(
        `Account ${accountAddress} not found on ${network}. ` +
        `Please ensure the account exists and is funded on the ${network} network.`,
      );
    }
    throw new Error(
      `Failed to load account: ${errorMessage}. ` +
      `Please check that the account address is correct and exists on ${network}.`,
    );
  }

  const argsResult = buildContractArgs(stats, accountAddress);
  if (!argsResult.success) {
    throw new Error(
      `Failed to build contract arguments: ${argsResult.errors.join(', ')}`,
    );
  }

  const contract = new Contract(contractAddress);
  const operation = contract.call('mint_wrap', ...argsResult.data.args);

  const transaction = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: getNetworkPassphrase(network),
  })
    .addOperation(operation)
    .setTimeout(300)
    .build();

  return { transaction, contract };
}

/**
 * Calculates estimated transaction fee from simulation
 */
function calculateEstimatedFee(simulation: { cost?: SimulationCost }, baseFee = 100): number {
  // Base fee is in stroops (1 XLM = 10,000,000 stroops)
  // Default base fee is 100 stroops (0.00001 XLM)
  let estimatedFee = baseFee;

  // Add resource costs if available
  if (simulation.cost) {
    // CPU instructions cost (rough estimate: 1 instruction = 0.00001 stroops)
    if (simulation.cost.cpuInsns) {
      estimatedFee += Math.ceil(simulation.cost.cpuInsns * 0.00001);
    }
    // Memory cost (rough estimate: 1 byte = 0.000001 stroops)
    if (simulation.cost.memBytes) {
      estimatedFee += Math.ceil(simulation.cost.memBytes * 0.000001);
    }
  }

  // Convert stroops to XLM
  return estimatedFee / 10000000;
}

/**
 * Checks if account has sufficient balance for transaction
 */
async function validateAccountBalance(
  accountAddress: string,
  network: Network,
  requiredFee: number,
): Promise<{ sufficient: boolean; balance: number; required: number }> {
  try {
    // Use Horizon API to get account balance
    const horizonUrl = RPC_ENDPOINTS[network];
    const horizonServer = new Horizon.Server(horizonUrl);
    const account = await horizonServer.loadAccount(accountAddress);
    
    // Get native XLM balance (first balance entry)
    const xlmBalance = account.balances.find((b) => b.asset_type === 'native');
    const balance = xlmBalance ? parseFloat(xlmBalance.balance) : 0;
    
    return {
      sufficient: balance >= requiredFee,
      balance,
      required: requiredFee,
    };
  } catch {
    // If we can't get account, assume insufficient (will fail later anyway)
    return {
      sufficient: false,
      balance: 0,
      required: requiredFee,
    };
  }
}

/**
 * Generates a cache key for simulation results
 */
function getSimulationCacheKey(transaction: Transaction, accountAddress: string): string {
  // Use transaction hash or XDR as cache key
  try {
    const xdr = transaction.toXDR();
    return `${accountAddress}:${xdr.substring(0, 50)}`;
  } catch {
    // Fallback to account address + timestamp if we can't get XDR
    return `${accountAddress}:${Date.now()}`;
  }
}

/**
 * Clears expired simulation cache entries
 */
function clearExpiredSimulationCache(): void {
  const now = Date.now();
  for (const [key, value] of simulationCache.entries()) {
    if (now - value.timestamp > SIMULATION_CACHE_DURATION) {
      simulationCache.delete(key);
    }
  }
}

/**
 * Simulates a transaction before signing and returns detailed results
 * 
 * This function:
 * - Checks cache for recent simulation results
 * - Simulates the transaction using Soroban RPC
 * - Validates account balance
 * - Returns detailed simulation results including costs and fees
 */
async function simulateTransaction(
  server: Server,
  transaction: Transaction,
  accountAddress: string,
  network: Network,
  observer: TransactionObserver | undefined,
): Promise<SimulationResult> {
  emitState(observer, 'simulating');

  // Clear expired cache entries
  clearExpiredSimulationCache();

  // Check cache
  const cacheKey = getSimulationCacheKey(transaction, accountAddress);
  const cached = simulationCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < SIMULATION_CACHE_DURATION) {
    emitState(observer, 'simulating', { simulation: cached.result, cached: true });
    return cached.result;
  }

  try {
    const simulation = await server.simulateTransaction(transaction);

    // Check if simulation failed
    const simulationAny = simulation as unknown as Record<string, unknown>;
    if ('error' in simulation || simulationAny.errorResult) {
      const errorResult = (simulationAny.errorResult || simulationAny.error) as unknown;
      const errorMessage = parseContractError(errorResult || simulation);
      
      const result: SimulationResult = {
        success: false,
        error: errorMessage,
      };
      
      emitState(observer, 'failed', { error: errorMessage, simulation: result });
      return result;
    }

    // Parse successful simulation
    const costData = simulationAny.cost as { cpuInsns?: number; memBytes?: number } | undefined;
    const cost: SimulationCost | undefined = costData
      ? {
          cpuInsns: costData.cpuInsns || 0,
          memBytes: costData.memBytes || 0,
        }
      : undefined;

    const footprintData = simulationAny.footprint as { readOnly?: string[]; readWrite?: string[] } | undefined;
    const footprint: SimulationFootprint | undefined = footprintData
      ? {
          readOnly: footprintData.readOnly || [],
          readWrite: footprintData.readWrite || [],
        }
      : undefined;

    const result: SimulationResult = {
      success: true,
      cost,
      footprint,
      result: simulationAny.result,
      estimatedFee: calculateEstimatedFee(simulationAny as { cost?: SimulationCost }),
      requiresRestore: !!(simulationAny.restorePreamble),
    };

    // Validate account balance
    if (result.estimatedFee) {
      const balanceCheck = await validateAccountBalance(
        accountAddress,
        network,
        result.estimatedFee,
      );

      if (!balanceCheck.sufficient) {
        const errorMessage = `Insufficient balance. Required: ${balanceCheck.required.toFixed(7)} XLM, Available: ${balanceCheck.balance.toFixed(7)} XLM`;
        result.success = false;
        result.error = errorMessage;
        emitState(observer, 'failed', { error: errorMessage, simulation: result });
        return result;
      }

      // Add balance info to result
      result.accountBalance = balanceCheck.balance;
    }

    // Cache successful simulation result
    simulationCache.set(cacheKey, {
      result,
      timestamp: Date.now(),
    });

    // Emit simulation success with details
    emitState(observer, 'simulating', { simulation: result });

    return result;
  } catch (error) {
    const errorMessage = parseContractError(error);
    const result: SimulationResult = {
      success: false,
      error: errorMessage,
    };
    
    emitState(observer, 'failed', { error: errorMessage, simulation: result });
    return result;
  }
}


async function signTransactionWithFreighter(
  transactionXdr: string,
  network: Network,
  observer: TransactionObserver | undefined,
): Promise<string> {
  emitState(observer, 'signed');

  try {
    const result = await signTransaction(transactionXdr, {
      networkPassphrase: getNetworkPassphrase(network),
    });

    if (result.error) {
      const errorMessage = parseContractError(result.error);
      emitState(observer, 'failed', { error: errorMessage });
      throw new Error(`Signing failed: ${errorMessage}`);
    }

    if (!result.signedTxXdr) {
      throw new Error('Freighter returned empty signed transaction');
    }

    return result.signedTxXdr;
  } catch (error) {
    const errorMessage = parseContractError(error);
    emitState(observer, 'failed', { error: errorMessage });
    throw error;
  }
}


async function submitTransaction(
  server: Server,
  signedXdr: string,
  observer: TransactionObserver | undefined,
): Promise<string> {
  emitState(observer, 'submitted');

  try {
    const envelopeXdr = xdr.TransactionEnvelope.fromXDR(signedXdr, 'base64');
    const signedTransaction = TransactionBuilder.fromXDR(
      envelopeXdr.toXDR('base64'),
      // network passphrase is embedded in the XDR; TransactionBuilder.fromXDR
      // accepts a base64 envelope directly
      '*', // wildcard passphrase — we are only re-submitting, not re-signing
    ) as Transaction;

    const response = await server.sendTransaction(signedTransaction);

    if (response.errorResult) {
      const errorMessage = parseContractError(response.errorResult);
      emitState(observer, 'failed', { error: errorMessage });
      throw new Error(`Transaction submission failed: ${errorMessage}`);
    }

    // hash is always present on BaseSendTransactionResponse
    return response.hash;
  } catch (error) {
    const errorMessage = parseContractError(error);
    emitState(observer, 'failed', { error: errorMessage });
    throw error;
  }
}

export async function mintWrap(options: MintWrapOptions): Promise<MintResult> {
  const { accountAddress, stats, network, observer } = options;

  emitState(observer, 'pending');

  const startTime = Date.now();

  try {
    const { transaction } = await buildMintTransaction(accountAddress, stats, network);

    const server = createSorobanServer(network);

    // 3. Simulate transaction
    const simulationResult = await simulateTransaction(
      server,
      transaction,
      accountAddress,
      network,
      observer,
    );

    // Only proceed if simulation succeeded
    if (!simulationResult.success) {
      throw new Error(
        simulationResult.error || 'Transaction simulation failed',
      );
    }

    const transactionXdr = transaction.toXDR();

    const signedXdr = await signTransactionWithFreighter(transactionXdr, network, observer);

    const transactionHash = await submitTransaction(server, signedXdr, observer);

    const { ledger } = await waitForConfirmation(server, transactionHash, observer, startTime);

    return { transactionHash, ledger, state: 'confirmed' };
  } catch (error) {
    const errorMessage = parseContractError(error);
    emitState(observer, 'failed', { error: errorMessage });
    throw new Error(`Minting failed: ${errorMessage}`);
  }
}

/**
 * Clears the simulation cache (useful for testing or when account balance changes)
 */
export function clearSimulationCache(): void {
  simulationCache.clear();
}
