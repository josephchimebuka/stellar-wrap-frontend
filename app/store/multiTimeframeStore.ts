/**
 * Zustand store for multi-timeframe indexing state.
 *
 * Manages the results, progress, and status for all three timeframes
 * (1w, 2w, 1m) plus the comparative analysis.
 *
 * Issue #46
 */

import { create } from "zustand";
import {
  MultiTimeframeResult,
  TimeframeResult,
  TimeframeProgress,
  TimeframeStatus,
  Timeframe,
  indexAccountMultiTimeframe,
  TimeframeComparison,
} from "@/app/services/multiTimeframeIndexer";

// ── Types ─────────────────────────────────────────────────────────────────────

interface TimeframeProgressState {
  "1w": number;
  "2w": number;
  "1m": number;
}

interface TimeframeStatusState {
  "1w": TimeframeStatus;
  "2w": TimeframeStatus;
  "1m": TimeframeStatus;
}

interface MultiTimeframeStoreState {
  // ── Data ──
  accountId: string | null;
  results: {
    "1w": TimeframeResult;
    "2w": TimeframeResult;
    "1m": TimeframeResult;
  };
  comparison: TimeframeComparison | null;
  indexedAt: string | null;

  // ── Progress ──
  isLoading: boolean;
  progress: TimeframeProgressState;
  statuses: TimeframeStatusState;
  /** 0-100 aggregated across all timeframes */
  overallProgress: number;

  // ── Error ──
  error: string | null;

  // ── Actions ──
  startIndexing: (
    accountId: string,
    network: "mainnet" | "testnet"
  ) => Promise<void>;
  retryTimeframe: (
    timeframe: Timeframe,
    accountId: string,
    network: "mainnet" | "testnet"
  ) => Promise<void>;
  reset: () => void;
}

// ── Initial state ─────────────────────────────────────────────────────────────

const emptyTimeframeResult: TimeframeResult = {
  status: "pending",
  data: null,
  error: null,
};

const initialState = {
  accountId: null,
  results: {
    "1w": { ...emptyTimeframeResult },
    "2w": { ...emptyTimeframeResult },
    "1m": { ...emptyTimeframeResult },
  },
  comparison: null,
  indexedAt: null,
  isLoading: false,
  progress: { "1w": 0, "2w": 0, "1m": 0 },
  statuses: {
    "1w": "pending" as TimeframeStatus,
    "2w": "pending" as TimeframeStatus,
    "1m": "pending" as TimeframeStatus,
  },
  overallProgress: 0,
  error: null,
};

// ── Store ─────────────────────────────────────────────────────────────────────

export const useMultiTimeframeStore = create<MultiTimeframeStoreState>(
  (set, get) => ({
    ...initialState,

    /**
     * Kick off parallel indexing across all three timeframes.
     * Progress is streamed back via the onProgress callback.
     */
    startIndexing: async (accountId, network) => {
      set({
        ...initialState,
        accountId,
        isLoading: true,
      });

      const handleProgress = (p: TimeframeProgress) => {
        set((state) => ({
          progress: {
            ...state.progress,
            [p.timeframe]: p.progress,
          },
          statuses: {
            ...state.statuses,
            [p.timeframe]: p.status,
          },
          overallProgress: p.overallProgress,
        }));
      };

      try {
        const multiResult: MultiTimeframeResult =
          await indexAccountMultiTimeframe(accountId, network, handleProgress);

        set({
          results: {
            "1w": multiResult["1w"],
            "2w": multiResult["2w"],
            "1m": multiResult["1m"],
          },
          comparison: multiResult.comparison,
          indexedAt: multiResult.indexedAt,
          isLoading: false,
          overallProgress: 100,
          statuses: {
            "1w": multiResult["1w"].status,
            "2w": multiResult["2w"].status,
            "1m": multiResult["1m"].status,
          },
          progress: { "1w": 100, "2w": 100, "1m": 100 },
          error: null,
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unknown error during indexing";
        set({
          isLoading: false,
          error: message,
        });
      }
    },

    /**
     * Retry a single failed timeframe without re-fetching the successful ones.
     */
    retryTimeframe: async (timeframe, accountId, network) => {
      const { results } = get();

      // Mark timeframe as loading again
      set((state) => ({
        statuses: { ...state.statuses, [timeframe]: "loading" as TimeframeStatus },
        progress: { ...state.progress, [timeframe]: 0 },
        results: {
          ...state.results,
          [timeframe]: { status: "loading" as TimeframeStatus, data: null, error: null },
        },
        isLoading: true,
        error: null,
      }));

      try {
        // Run only this timeframe
        const singleResult: MultiTimeframeResult =
          await indexAccountMultiTimeframe(accountId, network, (p) => {
            if (p.timeframe !== timeframe) return;
            set((state) => ({
              progress: { ...state.progress, [timeframe]: p.progress },
              statuses: { ...state.statuses, [timeframe]: p.status },
              overallProgress: Math.round(
                (state.progress["1w"] + state.progress["2w"] + state.progress["1m"]) / 3
              ),
            }));
          });

        const retried = singleResult[timeframe];

        // Merge with existing successful results
        const merged = {
          ...results,
          [timeframe]: retried,
        };

        // Recompute comparison with merged data
        const { comparison } = singleResult;

        set((state) => ({
          results: merged,
          comparison,
          statuses: { ...state.statuses, [timeframe]: retried.status },
          progress: { ...state.progress, [timeframe]: 100 },
          isLoading: false,
        }));
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Retry failed";
        set((state) => ({
          results: {
            ...state.results,
            [timeframe]: { status: "failed" as TimeframeStatus, data: null, error: message },
          },
          statuses: { ...state.statuses, [timeframe]: "failed" as TimeframeStatus },
          isLoading: false,
          error: message,
        }));
      }
    },

    reset: () => {
      set({ ...initialState });
    },
  })
);

// ── Selectors ─────────────────────────────────────────────────────────────────

/** Returns true if all three timeframes completed (success or failed). */
export function selectIsComplete(state: MultiTimeframeStoreState): boolean {
  return (
    !state.isLoading &&
    state.statuses["1w"] !== "pending" &&
    state.statuses["1w"] !== "loading" &&
    state.statuses["2w"] !== "pending" &&
    state.statuses["2w"] !== "loading" &&
    state.statuses["1m"] !== "pending" &&
    state.statuses["1m"] !== "loading"
  );
}

/** Returns how many timeframes succeeded. */
export function selectSuccessCount(state: MultiTimeframeStoreState): number {
  return (["1w", "2w", "1m"] as Timeframe[]).filter(
    (tf) => state.statuses[tf] === "success"
  ).length;
}

/** Returns which timeframes failed. */
export function selectFailedTimeframes(
  state: MultiTimeframeStoreState
): Timeframe[] {
  return (["1w", "2w", "1m"] as Timeframe[]).filter(
    (tf) => state.statuses[tf] === "failed"
  );
}
