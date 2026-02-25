
import {
  Contract,
  Transaction,
  FeeBumpTransaction,
  TransactionBuilder,
  xdr,
  BASE_FEE,
} from 'stellar-sdk';
import { Server, Api } from 'stellar-sdk/rpc';
import { signTransaction } from '@stellar/freighter-api';
import { Network, NETWORK_PASSPHRASES, SOROBAN_RPC_URLS } from '../config';
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

const MAX_CONFIRMATION_ATTEMPTS = 60;
const CONFIRMATION_POLL_INTERVAL = 2000;
const TRANSACTION_TIMEOUT = 120000;


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


async function simulateTransaction(
  server: Server,
  transaction: Transaction | FeeBumpTransaction,
  observer: TransactionObserver | undefined,
): Promise<void> {
  emitState(observer, 'simulating');

  try {
    const simulation = await server.simulateTransaction(transaction);

    if (Api.isSimulationError(simulation)) {
      const errorMessage = parseContractError(simulation.error);
      emitState(observer, 'failed', { error: errorMessage });
      throw new Error(`Transaction simulation failed: ${errorMessage}`);
    }

    if (Api.isSimulationRestore(simulation)) {
      console.warn('Transaction requires restore preamble:', simulation.restorePreamble);
    }
  } catch (error) {
    const errorMessage = parseContractError(error);
    emitState(observer, 'failed', { error: errorMessage });
    throw new Error(`Transaction simulation error: ${errorMessage}`);
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

    await simulateTransaction(server, transaction, observer);

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