import type { IndexingStep } from "@/app/types/indexing";
import type { IndexerStepError } from "@/app/types/indexingRecovery";

const isDev = process.env.NODE_ENV !== "production";

function log(level: "info" | "warn" | "error", ...args: unknown[]) {
  if (isDev) {
    console[level]("[IndexerRecovery]", ...args);
  }
}

export const indexerErrorLogger = {
  stepFailed(error: IndexerStepError) {
    log("error", `Step "${error.step}" failed`, {
      type: error.type,
      message: error.message,
      retryable: error.retryable,
      attempt: error.attempt,
      at: new Date(error.timestamp).toISOString(),
    });
  },

  retryScheduled(step: IndexingStep, attempt: number, delayMs: number) {
    log(
      "warn",
      `Retrying "${step}" — attempt ${attempt} in ${delayMs}ms`,
    );
  },

  stepCompleted(step: IndexingStep) {
    log("info", `Step "${step}" ✓`);
  },

  sessionComplete(sessionId: string, isPartial: boolean, retries: number) {
    log("info", `Session ${sessionId} done`, { partial: isPartial, retries });
  },

  resuming(fromStep: IndexingStep, alreadyDone: IndexingStep[]) {
    log("info", `Resuming from "${fromStep}"`, { skipping: alreadyDone });
  },
};