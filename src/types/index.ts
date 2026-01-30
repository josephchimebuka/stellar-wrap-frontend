export type { Network } from '../config';

export interface TransactionStats {
  totalTransactions: number;
  totalVolume: number;
  mostActiveMonth: string;
  gasSpent: number;
  rank: number;
  percentile: number;
}

export interface TopDapp {
  name: string;
  transactions: number;
  color: string;
  gradient: string;
}

export interface Vibe {
  type: string;
  percentage: number;
  color: string;
  label: string;
}

export interface Archetype {
  name: string;
  description: string;
  image: string;
}

export interface WrappedData {
  username: string;
  address: string;
  stats: TransactionStats;
  topDapps: TopDapp[];
  vibes: Vibe[];
  archetype: Archetype;
}
