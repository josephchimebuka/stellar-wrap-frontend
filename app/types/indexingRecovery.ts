import { IndexingStep, STEP_ORDER } from "./indexing";


export type IndexerErrorType =
  | "api-error"
  | "network-error"
  | "parsing-error"
  | "validation-error";


export function classifyError(err: unknown): IndexerErrorType {
  if (err instanceof TypeError && err.message.toLowerCase().includes("fetch")) {
    return "network-error";
  }
  if (err instanceof SyntaxError) {
    return "parsing-error";
  }
  if (
    err instanceof Error &&
    (err.message.includes("404") ||
      err.message.includes("429") ||
      err.message.includes("500") ||
      err.message.includes("Rate limit") ||
      err.message.includes("Server error") ||
      err.message.includes("Account not found"))
  ) {
    return "api-error";
  }
  if (
    err instanceof Error &&
    (err.message.includes("timeout") ||
      err.message.includes("ECONNABORTED") ||
      err.message.includes("network") ||
      err.message.includes("connection"))
  ) {
    return "network-error";
  }
  return "api-error";
}


export function isRetryable(type: IndexerErrorType): boolean {
  return type === "api-error" || type === "network-error";
}


export interface IndexerStepError {
  step: IndexingStep;
  type: IndexerErrorType;
  message: string;
  retryable: boolean;
  timestamp: number;
  attempt: number; // 1-based
}

export type StepRecoveryStatus =
  | "idle"
  | "running"
  | "completed"
  | "failed"
  | "skipped";

export interface StepRecoveryState {
  step: IndexingStep;
  status: StepRecoveryStatus;
  error?: IndexerStepError;
  completedAt?: number;
}

export interface IndexerRecoveryState {
  /** Stable ID for the current session (used by logger / cache) */
  sessionId: string;
  stepStates: Record<IndexingStep, StepRecoveryState>;
  completedSteps: IndexingStep[];
  failedStep: IndexingStep | null;
  /** Whether we have usable results from at least one completed step */
  isPartial: boolean;
  totalRetries: number;
  /** One-off recovery action currently in flight */
  pendingAction: "retry" | "resume" | "restart" | null;
}


export function makeInitialRecoveryState(
  sessionId = crypto.randomUUID(),
): IndexerRecoveryState {
  const stepStates = Object.fromEntries(
    STEP_ORDER.map((s) => [s, { step: s, status: "idle" as StepRecoveryStatus }]),
  ) as Record<IndexingStep, StepRecoveryState>;

  return {
    sessionId,
    stepStates,
    completedSteps: [],
    failedStep: null,
    isPartial: false,
    totalRetries: 0,
    pendingAction: null,
  };
}



export const MAX_RETRIES = 3;
export const BASE_BACKOFF_MS = 1000; 

export function backoffDelay(attempt: number): number {
  return BASE_BACKOFF_MS * Math.pow(2, attempt - 1);
}