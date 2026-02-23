/**
 * Type definitions for Stellar Horizon indexing service
 */

export type WrapPeriod = "weekly" | "biweekly" | "monthly" | "yearly";

export interface DappInfo {
  name: string;
  icon?: string;
  volume: number;
  transactionCount: number;
}

export interface VibeTag {
  tag: string;
  count: number;
}

export interface IndexerResult {
  accountId: string;
  totalTransactions: number;
  totalVolume: number;
  mostActiveAsset: string;
  contractCalls: number;
  gasSpent: number;
  dapps: DappInfo[];
  vibes: VibeTag[];
}

export interface CacheEntry {
  result: IndexerResult;
  timestamp: number;
}

export interface CacheStore {
  [key: string]: CacheEntry;
}

export const PERIODS: Record<WrapPeriod, number> = {
  weekly: 7,
  biweekly: 14,
  monthly: 30,
  yearly: 365,
};

export const NEXT_PUBLIC_RPC_ENDPOINTS = {
  mainnet: "https://horizon.stellar.org",
  testnet: "https://horizon-testnet.stellar.org",
};

export function getCacheKey(
  accountId: string,
  network: "mainnet" | "testnet",
  period: WrapPeriod,
): string {
  return `${accountId}:${network}:${period}`;
}

export function isCacheValid(
  entry: CacheEntry,
  ttlMinutes: number = 5,
): boolean {
  const now = Date.now();
  const age = now - entry.timestamp;
  return age < ttlMinutes * 60 * 1000;
}
