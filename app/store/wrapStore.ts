import { create } from "zustand";
import { Network, DEFAULT_NETWORK } from "../../src/config";

export type WrapPeriod = "weekly" | "monthly" | "yearly";

export interface DappData {
  name: string;
  logo?: string;
  interactions: number;
  isFanFavorite?: boolean;
  // optional visual fields used by some UIs
  color?: string;
  gradient?: string;
}

export interface VibeSlice {
  type: string;
  percentage: number;
  color: string;
  label: string;
}

export interface WrapResult {
  username: string;
  totalTransactions: number;
  percentile: number;
  dapps: DappData[];
  vibes: VibeSlice[];
  persona: string;
  personaDescription: string;
}

type WrapStatus = "idle" | "loading" | "ready" | "error";

interface WrapStoreState {
  address: string | null;
  period: WrapPeriod;
  network: Network;
  status: WrapStatus;
  error: string | null;
  result: WrapResult | null;
  // setters
  setAddress: (address: string | null) => void;
  setPeriod: (period: WrapPeriod) => void;
  setNetwork: (network: Network) => void;
  setStatus: (status: WrapStatus) => void;
  setError: (error: string | null) => void;
  setResult: (result: WrapResult | null) => void;
  reset: () => void;
}

export const useWrapStore = create<WrapStoreState>((set) => ({
  address: null,
  period: "yearly",
  network: DEFAULT_NETWORK,
  status: "idle",
  error: null,
  result: null,
  setAddress: (address) => set({ address }),
  setPeriod: (period) => set({ period }),
  setNetwork: (network) => set({ network }),
  setStatus: (status) => set({ status }),
  setError: (error) => set({ error }),
  setResult: (result) => set({ result }),
  reset: () =>
    set({
      address: null,
      period: "yearly",
      network: DEFAULT_NETWORK,
      status: "idle",
      error: null,
      result: null,
    }),
}));

