import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Network, DEFAULT_NETWORK } from "../../src/config";
import {
  getContractAddress,
  getContractConfigForAllNetworks,
} from "../../config/contracts";
import { CacheStore } from "@/app/utils/indexer";

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

/** Cache metadata for UI (badge, age, refresh). Issue #48 */
export interface CacheMeta {
  fromCache: boolean;
  cacheTimestamp?: number;
  refreshingInBackground?: boolean;
}

/** Contract addresses per network (from config/env), synced on load and network change */
export type ContractAddressesByNetwork = Partial<Record<Network, string>>;
// In-memory cache for API results
let cacheStore: CacheStore = {};

export function getCacheStore(): CacheStore {
  return cacheStore;
}

export function resetCache(): void {
  cacheStore = {};
}

interface WrapStoreState {
  address: string | null;
  period: WrapPeriod;
  network: Network;
  status: WrapStatus;
  error: string | null;
  result: WrapResult | null;
  /** Cache metadata for "Using cached data" badge and age. Issue #48 */
  cacheMeta: CacheMeta | null;
  /** Contract address for the current network; updated when network changes */
  currentContractAddress: string | null;
  /** Contract addresses per network (mainnet, testnet); synced from config */
  contractAddresses: ContractAddressesByNetwork;
  // setters
  setAddress: (address: string | null) => void;
  setPeriod: (period: WrapPeriod) => void;
  setNetwork: (network: Network) => void;
  setStatus: (status: WrapStatus) => void;
  setError: (error: string | null) => void;
  setResult: (result: WrapResult | null) => void;
  setCacheMeta: (meta: CacheMeta | null) => void;
  setContractAddresses: (addresses: ContractAddressesByNetwork) => void;
  reset: () => void;
}

function syncContractState(network: Network): {
  currentContractAddress: string | null;
  contractAddresses: ContractAddressesByNetwork;
} {
  try {
    const config = getContractConfigForAllNetworks();
    const currentContractAddress = getContractAddress(network);
    return {
      currentContractAddress,
      contractAddresses: {
        mainnet: config.mainnet?.contractAddress,
        testnet: config.testnet?.contractAddress,
      },
    };
  } catch {
    return {
      currentContractAddress: null,
      contractAddresses: {},
    };
  }
}

export const useWrapStore = create<WrapStoreState>()(
  persist(
    (set) => ({
      address: null,
      period: "yearly",
      network: DEFAULT_NETWORK,
      status: "idle",
      error: null,
      result: null,
      cacheMeta: null,
      currentContractAddress: null,
      contractAddresses: {},
      setAddress: (address) => set({ address }),
      setPeriod: (period) => set({ period }),
      setNetwork: (network) => set({ network, ...syncContractState(network) }),
      setStatus: (status) => set({ status }),
      setError: (error) => set({ error }),
      setResult: (result) => set({ result }),
      setCacheMeta: (cacheMeta) => set({ cacheMeta }),
      setContractAddresses: (contractAddresses) => set({ contractAddresses }),
      reset: () =>
        set({
          address: null,
          period: "yearly",
          network: DEFAULT_NETWORK,
          status: "idle",
          error: null,
          result: null,
          cacheMeta: null,
          currentContractAddress: null,
          contractAddresses: {},
        }),
    }),
    {
      name: "stellar-wrap-store",
      partialize: (state) => ({ network: state.network }),
      storage: createJSONStorage(() =>
        typeof window !== "undefined"
          ? localStorage
          : {
              getItem: () => null,
              setItem: () => {},
              removeItem: () => {},
            },
      ),
    },
  ),
);
