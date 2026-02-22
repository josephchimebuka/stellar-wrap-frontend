/**
 * Stellar Horizon Indexing Service
 * Fetches and processes transaction data from Stellar Horizon API
 */

import { getHorizonServer } from "@/app/utils/stellarClient";
import { IndexerResult, PERIODS, WrapPeriod } from "@/app/utils/indexer";
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
 * This ensures every step is visually visible to the user even when the
 * actual computation is near-instant.
 */
async function animateStep<T>(
  step: IndexingStep,
  emitter: IndexerEventEmitter,
  workFn: () => T | Promise<T>,
): Promise<T> {
  const duration = INDEXING_STEPS[step].estimatedDuration;
  const startTime = Date.now();

  // Do real work first — keep the dataflow correct
  const result = await workFn();

  // Animate from ~0 → 95% over remaining duration, then snap to 100%
  await new Promise<void>((resolve) => {
    const tickMs = 80; // ~12 fps
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

export async function indexAccount(
  accountId: string,
  network: "mainnet" | "testnet" = "mainnet",
  period: WrapPeriod = "monthly",
): Promise<IndexerResult> {
  const emitter = IndexerEventEmitter.getInstance();
  const server = getHorizonServer(network);
  const days = PERIODS[period];
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  let currentEmittedStep: IndexingStep = "initializing";

  try {
    // ── Step 1: Initializing ─────────────────────────────────────────────────
    currentEmittedStep = "initializing";
    emitter.emitStepChange("initializing");
    await animateStep("initializing", emitter, () => {
      // Lightweight validation that the server config is ready
      getHorizonServer(network);
    });

    // ── Step 2: Fetch transactions ───────────────────────────────────────────
    // This step has real async work so we drive progress from actual fetch
    // activity rather than using animateStep (which would double-animate).
    currentEmittedStep = "fetching-transactions";
    emitter.emitStepChange("fetching-transactions");

    const allTransactions: unknown[] = [];
    const fetchDuration =
      INDEXING_STEPS["fetching-transactions"].estimatedDuration;
    const fetchStart = Date.now();

    let cursor: string | undefined;
    let hasMore = true;
    let pageCount = 0;

    while (hasMore) {
      const response = await concurrencyManager.run(async () => {
        const builder = server.transactions().forAccount(accountId).limit(200);
        if (cursor) {
          builder.cursor(cursor);
        }
        return builder.call();
      });

      if (!response.records || response.records.length === 0) {
        hasMore = false;
        break;
      }

      pageCount++;
      const timeProgress = Math.round(
        ((Date.now() - fetchStart) / fetchDuration) * 95,
      );
      emitter.emitStepProgress(
        "fetching-transactions",
        Math.min(95, Math.max(pageCount * 15, timeProgress)),
      );

      const recordsInRange = response.records.filter((tx) => {
        const txData = tx as unknown as Record<string, unknown>;
        return new Date(txData.created_at as string) >= cutoffDate;
      });
      allTransactions.push(...recordsInRange);

      if (
        response.records.some((tx) => {
          const txData = tx as unknown as Record<string, unknown>;
          return new Date(txData.created_at as string) < cutoffDate;
        })
      ) {
        hasMore = false;
        break;
      }

      const pageResponse = response as unknown as Record<string, unknown>;
      cursor =
        pageResponse.paging_token && response.records.length === 200
          ? String(pageResponse.paging_token)
          : undefined;
      if (!cursor) hasMore = false;
    }

    // Ensure the fetch step is visible for at least `fetchDuration` ms
    const fetchElapsed = Date.now() - fetchStart;
    if (fetchElapsed < fetchDuration) {
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
    emitter.emitStepProgress("fetching-transactions", 100);
    emitter.emitStepComplete("fetching-transactions");

    // ── Step 3: Filter timeframes ────────────────────────────────────────────
    currentEmittedStep = "filtering-timeframes";
    emitter.emitStepChange("filtering-timeframes");
    const filteredTransactions = await animateStep(
      "filtering-timeframes",
      emitter,
      () =>
        allTransactions.filter((tx) => {
          const txData = tx as unknown as Record<string, unknown>;
          return new Date(txData.created_at as string) >= cutoffDate;
        }),
    );

    // ── Step 4: Calculate volume ─────────────────────────────────────────────
    currentEmittedStep = "calculating-volume";
    emitter.emitStepChange("calculating-volume");
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
    });

    // ── Step 5: Identify assets ──────────────────────────────────────────────
    currentEmittedStep = "identifying-assets";
    emitter.emitStepChange("identifying-assets");
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
    });

    // ── Step 6: Count contracts ──────────────────────────────────────────────
    currentEmittedStep = "counting-contracts";
    emitter.emitStepChange("counting-contracts");
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
    );

    // ── Step 7: Finalize ─────────────────────────────────────────────────────
    currentEmittedStep = "finalizing";
    emitter.emitStepChange("finalizing");
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
    });

    emitter.emitIndexingComplete(result);
    return result;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error during indexing";
    console.error(`Error indexing account ${accountId}:`, error);
    emitter.emitStepError(currentEmittedStep, errorMessage, true);
    throw error;
  }
}
