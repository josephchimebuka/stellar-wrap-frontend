import { Network, RPC_ENDPOINTS, isValidNetwork, DEFAULT_NETWORK } from '../config';

/**
 * Get the RPC endpoint URL for a given network
 */
export function getRpcEndpoint(network: Network): string {
  return RPC_ENDPOINTS[network];
}

/**
 * Build an API URL with network query parameter
 */
export function buildApiUrl(path: string, network: Network): string {
  const url = new URL(path, window.location.origin);
  url.searchParams.set('network', network);
  return url.toString();
}

/**
 * Parse network from query parameters or return default
 */
export function parseNetworkParam(param: string | null): Network {
  if (!param || !isValidNetwork(param)) {
    return DEFAULT_NETWORK;
  }
  return param;
}

/**
 * Get network display name
 */
export function getNetworkDisplayName(network: Network): string {
  return network.charAt(0).toUpperCase() + network.slice(1);
}
