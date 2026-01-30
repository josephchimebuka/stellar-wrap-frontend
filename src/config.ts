/**
 * Global configuration for Stellar Wrap
 * Defines network types and RPC endpoints
 */

export const NETWORKS = {
  MAINNET: 'mainnet',
  TESTNET: 'testnet',
} as const;

export type Network = typeof NETWORKS[keyof typeof NETWORKS];

/**
 * RPC endpoint configuration for each network
 */
export const RPC_ENDPOINTS: Record<Network, string> = {
  mainnet: 'https://horizon.stellar.org',
  testnet: 'https://horizon-testnet.stellar.org',
};

/**
 * Network passphrases for transaction signing
 */
export const NETWORK_PASSPHRASES: Record<Network, string> = {
  mainnet: 'Public Global Stellar Network ; September 2015',
  testnet: 'Test SDF Network ; September 2015',
};

/**
 * Default network for the application
 */
export const DEFAULT_NETWORK: Network = NETWORKS.MAINNET;

/**
 * Validates if a string is a valid network
 */
export function isValidNetwork(network: string): network is Network {
  return network === NETWORKS.MAINNET || network === NETWORKS.TESTNET;
}
