/**
 * Stellar Horizon Indexing Service
 * Fetches and processes transaction data from Stellar Horizon API
 */

import { getHorizonServer } from "@/app/utils/stellarClient";
// Inline types for transaction and operation records
type OperationRecord = {
  type: string;
  amount?: string;
  asset_code?: string;
  memo?: string;
  [key: string]: unknown;
};
type TransactionRecord = {
  created_at: string;
  memo?: string;
  operations: OperationRecord[];
  paging_token?: string;
  [key: string]: unknown;
};
import {
  IndexerResult,
  IndexerResultWithMeta,
  PERIODS,
  WrapPeriod,
  getCacheKey,
  isCacheValid,
} from "@/app/utils/indexer";
import { getCacheEntry, setCacheEntry } from "@/app/utils/indexedDbCache";
import { calculateAchievements } from "./achievementCalculator";
import { IndexerEventEmitter } from "@/app/utils/indexerEventEmitter";
import { INDEXING_STEPS, IndexingStep } from "@/app/types/indexing";

const MAX_CONCURRENT_REQUESTS = 5;

interface QueueItem {
  cursor?: string;
  resolve: () => void;
  reject: () => void;
}

class ConcurrencyManager {
  private active = 0;
  private queue: QueueItem[] = [];

  async run<T>(fn: () => Promise<T>): Promise<T> {
    while (this.active >= MAX_CONCURRENT_REQUESTS) {
      await new Promise<void>((resolve) => {
        this.queue.push({
          resolve: () => resolve(),
          reject: () => {},
        });
      });
    }

    this.active++;
    try {
      return await fn();
    } finally {
      this.active--;
      const next = this.queue.shift();
      if (next) {
        next.resolve();
      }
    }
  }
}

const concurrencyManager = new ConcurrencyManager();

/**
 * Runs `workFn` immediately (so we capture the result), then animates step
 * progress smoothly over `estimatedDuration` ms before marking it complete.
 * When background is true, skips all UI emissions.
 */
async function animateStep<T>(
  step: IndexingStep,
  emitter: IndexerEventEmitter,
  workFn: () => T | Promise<T>,
  background: boolean,
): Promise<T> {
  const result = await workFn();
  if (background) return result;

  const duration = INDEXING_STEPS[step].estimatedDuration;
  const startTime = Date.now();
  await new Promise<void>((resolve) => {
    const tickMs = 80;
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(95, Math.round((elapsed / duration) * 95));
      emitter.emitStepProgress(step, progress);
      if (elapsed >= duration) {
        clearInterval(interval);
        resolve();
      }
    }, tickMs);
  });
  emitter.emitStepComplete(step);
  return result;
}

/**
 * Internal: run full Horizon indexing. When background is true, no step events are emitted.
 */
async function runIndexingInternal(
  accountId: string,
  network: "mainnet" | "testnet",
  period: WrapPeriod,
  background: boolean,
): Promise<IndexerResult> {
  const cacheKey = getCacheKey(accountId, network, period);
  const emitter = IndexerEventEmitter.getInstance();
  const server = getHorizonServer(network);
  const days = PERIODS[period];
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  let currentEmittedStep: IndexingStep = "initializing";

  const emit = (fn: () => void) => {
    if (!background) fn();
  };

  try {
    currentEmittedStep = "initializing";
    emit(() => console.log("Emitting step change: initializing"));
    emit(() => emitter.emitStepChange("initializing"));
    await animateStep("initializing", emitter, () => {
      getHorizonServer(network);
    }, background);
    emit(() => console.log("Step complete: initializing"));

    currentEmittedStep = "fetching-transactions";
    emit(() => emitter.emitStepChange("fetching-transactions"));

    const allTransactions: unknown[] = [];
    const fetchDuration =
      INDEXING_STEPS["fetching-transactions"].estimatedDuration;
    const fetchStart = Date.now();

    let cursor: string | undefined;
    let hasMore = true;
    let pageCount = 0;

    while (hasMore) {
      let response: unknown;
      try {
        response = await concurrencyManager.run(async () => {
          const builder = server
            .transactions()
            .forAccount(accountId)
            .limit(200);
          if (cursor) {
            builder.cursor(cursor);
          }
          return builder.call();
        });
      } catch (error: unknown) {
        const errorObj = error as {
          response?: { status?: number };
          code?: string;
          name?: string;
          message?: string;
        };
        if (errorObj?.response?.status === 404) {
          throw new Error("Account not found (404). Please check the address.");
        } else if (errorObj?.response?.status === 429) {
          throw new Error("Rate limit exceeded (429). Please try again later.");
        } else if (errorObj?.response?.status === 500) {
          throw new Error("Server error (500). Please try again later.");
        } else if (
          errorObj?.code === "ECONNABORTED" ||
          errorObj?.name === "TimeoutError"
        ) {
          throw new Error("Network timeout. Please check your connection.");
        } else {
          throw new Error(
            "Unknown error fetching transactions: " +
              (errorObj?.message || String(error)),
          );
        }
      }

      const respRecords = (response as { records: TransactionRecord[] })
        .records;
      if (!respRecords || respRecords.length === 0) {
        hasMore = false;
        break;
      }

      pageCount++;
      const timeProgress = Math.round(
        ((Date.now() - fetchStart) / fetchDuration) * 95,
      );
      emit(() =>
        emitter.emitStepProgress(
          "fetching-transactions",
          Math.min(95, Math.max(pageCount * 15, timeProgress)),
        ),
      );

      // Fetch operations for each transaction and attach as array
      const recordsWithOps = await Promise.all(
        respRecords.map(async (tx: TransactionRecord) => {
          const txRecord = tx as {
            operations: () => Promise<{ records: OperationRecord[] }>;
          } & TransactionRecord;
          const opsPage = await txRecord.operations();
          return {
            ...txRecord,
            operations: opsPage.records as OperationRecord[],
          };
        }),
      );
      const recordsInRange = recordsWithOps.filter((tx: TransactionRecord) => {
        return new Date(tx.created_at) >= cutoffDate;
      });
      allTransactions.push(...recordsInRange);

      if (
        recordsWithOps.some((tx: TransactionRecord) => {
          return new Date(tx.created_at) < cutoffDate;
        })
      ) {
        hasMore = false;
        break;
      }

      cursor =
        respRecords.length === 200 &&
        respRecords[respRecords.length - 1].paging_token
          ? String(respRecords[respRecords.length - 1].paging_token)
          : undefined;
      if (!cursor) hasMore = false;
    }

    const fetchElapsed = Date.now() - fetchStart;
    if (!background && fetchElapsed < fetchDuration) {
      const remaining = fetchDuration - fetchElapsed;
      const tickMs = 80;
      await new Promise<void>((resolve) => {
        let spent = 0;
        const interval = setInterval(() => {
          spent += tickMs;
          const progress = Math.min(
            95,
            Math.round(((fetchElapsed + spent) / fetchDuration) * 95),
          );
          emitter.emitStepProgress("fetching-transactions", progress);
          if (spent >= remaining) {
            clearInterval(interval);
            resolve();
          }
        }, tickMs);
      });
    }
    emit(() => emitter.emitStepProgress("fetching-transactions", 100));
    emit(() => emitter.emitStepComplete("fetching-transactions"));

    currentEmittedStep = "filtering-timeframes";
    emit(() => emitter.emitStepChange("filtering-timeframes"));
    const filteredTransactions = await animateStep(
      "filtering-timeframes",
      emitter,
      () =>
        allTransactions.filter((tx) => {
          const txData = tx as unknown as Record<string, unknown>;
          return new Date(txData.created_at as string) >= cutoffDate;
        }),
      background,
    );

    currentEmittedStep = "calculating-volume";
    emit(() => emitter.emitStepChange("calculating-volume"));
    await animateStep("calculating-volume", emitter, () => {
      filteredTransactions.forEach((tx) => {
        const txData = tx as Record<string, unknown>;
        (Array.isArray(txData.operations) ? txData.operations : []).forEach(
          (op) => {
            const opData = op as Record<string, unknown>;
            if (opData.type === "payment" && opData.amount) {
              parseFloat(String(opData.amount));
            }
          },
        );
      });
    }, background);

    currentEmittedStep = "identifying-assets";
    emit(() => emitter.emitStepChange("identifying-assets"));
    const assetMap = await animateStep("identifying-assets", emitter, () => {
      const map = new Map<string, number>();
      filteredTransactions.forEach((tx) => {
        const txData = tx as Record<string, unknown>;
        (Array.isArray(txData.operations) ? txData.operations : []).forEach(
          (op) => {
            const opData = op as Record<string, unknown>;
            if (opData.type === "payment") {
              const key = String(opData.asset_code || "native");
              map.set(key, (map.get(key) || 0) + 1);
            }
          },
        );
      });
      return map;
    }, background);

    currentEmittedStep = "counting-contracts";
    emit(() => emitter.emitStepChange("counting-contracts"));
    await animateStep("counting-contracts", emitter, () =>
      filteredTransactions.reduce((count: number, tx) => {
        const txData = tx as Record<string, unknown>;
        return (
          count +
          (Array.isArray(txData.operations) ? txData.operations : []).filter(
            (op) =>
              (op as Record<string, unknown>).type === "invoke_host_function",
          ).length
        );
      }, 0),
    background);

    currentEmittedStep = "finalizing";
    emit(() => emitter.emitStepChange("finalizing"));
    const result = await animateStep("finalizing", emitter, () => {
      const typedTransactions = allTransactions.map((tx) => {
        const txData = tx as Record<string, unknown>;
        return {
          created_at: String(txData.created_at || new Date().toISOString()),
          memo: txData.memo ? String(txData.memo) : undefined,
          operations: Array.isArray(txData.operations) ? txData.operations : [],
        };
      });
      const r = calculateAchievements(typedTransactions);
      r.accountId = accountId;
      void assetMap; // consumed by achievementCalculator indirectly
      return r;
    }, background);

    emit(() => emitter.emitIndexingComplete(result));
    await setCacheEntry(cacheKey, { result, timestamp: Date.now() });
    return result;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error during indexing";
    console.error(`Error indexing account ${accountId}:`, error);
    emit(() => emitter.emitStepError(currentEmittedStep, errorMessage, true));
    throw error;
  }
}

/**
 * Index account with cache: return cached data if fresh, else index and optionally
 * return stale cache while re-indexing in background.
 */
export async function indexAccount(
  accountId: string,
  network: "mainnet" | "testnet" = "mainnet",
  period: WrapPeriod = "monthly",
): Promise<IndexerResultWithMeta> {
  const cacheKey = getCacheKey(accountId, network, period);
  const cached = await getCacheEntry(cacheKey);

  if (cached && isCacheValid(cached)) {
    return {
      result: cached.result,
      fromCache: true,
      cacheTimestamp: cached.timestamp,
    };
  }

  if (cached && !isCacheValid(cached)) {
    // Return stale cache immediately and refresh in background
    void runIndexingInternal(accountId, network, period, true).then(
      (result) => {
        setCacheEntry(cacheKey, { result, timestamp: Date.now() });
      },
      (err) => {
        console.warn("[Indexer] Background refresh failed:", err);
      },
    );
    return {
      result: cached.result,
      fromCache: true,
      cacheTimestamp: cached.timestamp,
      refreshingInBackground: true,
    };
  }

  const result = await runIndexingInternal(accountId, network, period, false);
  return {
    result,
    fromCache: false,
  };
}
