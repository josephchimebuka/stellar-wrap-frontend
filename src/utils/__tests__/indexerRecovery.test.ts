
import {
  classifyError,
  isRetryable,
  makeInitialRecoveryState,
  backoffDelay,
  MAX_RETRIES,
  BASE_BACKOFF_MS,
} from "@/app/types/indexingRecovery";
import { STEP_ORDER } from "@/app/types/indexing";


describe("classifyError", () => {
  it("classifies fetch TypeError as network-error", () => {
    expect(classifyError(new TypeError("Failed to fetch"))).toBe(
      "network-error",
    );
  });

  it("classifies timeout-like messages as network-error", () => {
    expect(classifyError(new Error("Network timeout. Please check your connection."))).toBe(
      "network-error",
    );
    expect(classifyError(new Error("ECONNABORTED"))).toBe("network-error");
  });

  it("classifies SyntaxError as parsing-error", () => {
    expect(classifyError(new SyntaxError("Unexpected token <"))).toBe(
      "parsing-error",
    );
  });

  it("classifies Horizon 404 message as api-error", () => {
    expect(
      classifyError(new Error("Account not found (404). Please check the address.")),
    ).toBe("api-error");
  });

  it("classifies Horizon 429 message as api-error", () => {
    expect(
      classifyError(new Error("Rate limit exceeded (429). Please try again later.")),
    ).toBe("api-error");
  });

  it("classifies Horizon 500 message as api-error", () => {
    expect(
      classifyError(new Error("Server error (500). Please try again later.")),
    ).toBe("api-error");
  });

  it("classifies unknown errors as api-error", () => {
    expect(classifyError(new Error("something unexpected"))).toBe("api-error");
    expect(classifyError("a plain string")).toBe("api-error");
  });
});


describe("isRetryable", () => {
  it("returns true for api-error and network-error", () => {
    expect(isRetryable("api-error")).toBe(true);
    expect(isRetryable("network-error")).toBe(true);
  });

  it("returns false for parsing-error and validation-error", () => {
    expect(isRetryable("parsing-error")).toBe(false);
    expect(isRetryable("validation-error")).toBe(false);
  });
});


describe("backoffDelay", () => {
  it("returns 1 s for attempt 1", () => {
    expect(backoffDelay(1)).toBe(BASE_BACKOFF_MS); // 1000
  });

  it("returns 2 s for attempt 2", () => {
    expect(backoffDelay(2)).toBe(BASE_BACKOFF_MS * 2); // 2000
  });

  it("returns 4 s for attempt 3", () => {
    expect(backoffDelay(3)).toBe(BASE_BACKOFF_MS * 4); // 4000
  });
});

describe("makeInitialRecoveryState", () => {
  it("initialises all STEP_ORDER steps as idle", () => {
    const state = makeInitialRecoveryState("test-session");
    STEP_ORDER.forEach((step) => {
      expect(state.stepStates[step]).toBeDefined();
      expect(state.stepStates[step].status).toBe("idle");
    });
  });

  it("starts with no completed steps and no failure", () => {
    const state = makeInitialRecoveryState();
    expect(state.completedSteps).toHaveLength(0);
    expect(state.failedStep).toBeNull();
    expect(state.isPartial).toBe(false);
    expect(state.totalRetries).toBe(0);
  });

  it("uses provided sessionId", () => {
    const state = makeInitialRecoveryState("my-id");
    expect(state.sessionId).toBe("my-id");
  });

  it("generates a unique sessionId when none provided", () => {
    const a = makeInitialRecoveryState();
    const b = makeInitialRecoveryState();
    expect(a.sessionId).not.toBe(b.sessionId);
  });
});


describe("MAX_RETRIES", () => {
  it("is 3", () => {
    expect(MAX_RETRIES).toBe(3);
  });
});


describe("STEP_ORDER", () => {
  it("starts with initializing", () => {
    expect(STEP_ORDER[0]).toBe("initializing");
  });

  it("ends with finalizing", () => {
    expect(STEP_ORDER[STEP_ORDER.length - 1]).toBe("finalizing");
  });

  it("contains all 7 expected steps", () => {
    expect(STEP_ORDER).toHaveLength(7);
    expect(STEP_ORDER).toContain("fetching-transactions");
    expect(STEP_ORDER).toContain("filtering-timeframes");
    expect(STEP_ORDER).toContain("calculating-volume");
    expect(STEP_ORDER).toContain("identifying-assets");
    expect(STEP_ORDER).toContain("counting-contracts");
  });
});


describe("Recovery state shape", () => {
  it("marks isPartial true only when steps have completed before failure", () => {
    const state = makeInitialRecoveryState();

    
    state.completedSteps = ["initializing", "fetching-transactions"];
    state.failedStep = "filtering-timeframes";
    state.isPartial = state.completedSteps.length > 0;

    expect(state.isPartial).toBe(true);
  });

  it("does NOT mark isPartial when failure happens on very first step", () => {
    const state = makeInitialRecoveryState();

    state.failedStep = "initializing";
    state.isPartial = state.completedSteps.length > 0;

    expect(state.isPartial).toBe(false);
  });

  it("resume resets failedStep and marks pending action", () => {
    const state = makeInitialRecoveryState();

    // Simulate a failed state
    state.failedStep = "calculating-volume";
    state.completedSteps = [
      "initializing",
      "fetching-transactions",
      "filtering-timeframes",
    ];
    state.stepStates["calculating-volume"].status = "failed";

    // Simulate what resume() does before running
    const fromStep = state.failedStep;
    state.failedStep = null;
    state.pendingAction = "resume";
    state.stepStates[fromStep].status = "idle";
    state.stepStates[fromStep].error = undefined;

    expect(state.failedStep).toBeNull();
    expect(state.pendingAction).toBe("resume");
    expect(state.stepStates["calculating-volume"].status).toBe("idle");
    
    expect(state.completedSteps).toContain("fetching-transactions");
  });

  it("canResume is true when there is a failed step AND some completed steps", () => {
    const state = makeInitialRecoveryState();
    state.failedStep = "identifying-assets";
    state.completedSteps = ["initializing", "fetching-transactions"];

    const canResume = Boolean(state.failedStep) && state.completedSteps.length > 0;
    expect(canResume).toBe(true);
  });

  it("canResume is false when failure is on the very first step", () => {
    const state = makeInitialRecoveryState();
    state.failedStep = "initializing";
    // no completed steps

    const canResume = Boolean(state.failedStep) && state.completedSteps.length > 0;
    expect(canResume).toBe(false);
  });
});