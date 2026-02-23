/**
 * Zustand store for managing indexing state and progress
 */

import { create } from "zustand";
import {
  IndexingStep,
  IndexingProgress,
  INDEXING_STEPS,
  STEP_ORDER,
  PersistedIndexingState,
} from "@/app/types/indexing";

const PERSISTENCE_KEY = "stellar-wrap-indexing-state";
const PERSISTENCE_TIMEOUT = 5 * 60 * 1000; // 5 minutes

interface IndexingStoreState extends IndexingProgress {
  completedStepRecord: Record<IndexingStep, boolean>;
  // Actions
  setCurrentStep: (step: IndexingStep | null) => void;
  setStepProgress: (step: IndexingStep, progress: number) => void;
  updateOverallProgress: () => void;
  setError: (
    step: IndexingStep,
    message: string,
    recoverable?: boolean,
  ) => void;
  clearError: () => void;
  startIndexing: () => void;
  completeStep: (step: IndexingStep) => void;
  cancelIndexing: () => void;
  reset: () => void;
  saveState: () => void;
  loadState: () => boolean; // returns true if state was loaded
  clearPersistedState: () => void;
}

const initialCompletedStepRecord: Record<IndexingStep, boolean> = {
  initializing: false,
  "fetching-transactions": false,
  "filtering-timeframes": false,
  "calculating-volume": false,
  "identifying-assets": false,
  "counting-contracts": false,
  finalizing: false,
};

const initialState: IndexingProgress & {
  completedStepRecord: Record<IndexingStep, boolean>;
} = {
  currentStep: null,
  stepProgress: {
    initializing: 0,
    "fetching-transactions": 0,
    "filtering-timeframes": 0,
    "calculating-volume": 0,
    "identifying-assets": 0,
    "counting-contracts": 0,
    finalizing: 0,
  },
  completedStepRecord: { ...initialCompletedStepRecord },
  overallProgress: 0,
  completedSteps: 0,
  totalSteps: STEP_ORDER.length,
  startTime: null,
  estimatedTimeRemaining: null,
  error: null,
  isLoading: false,
  isCancelled: false,
};

export const useIndexingStore = create<IndexingStoreState>((set, get) => ({
  ...initialState,

  setCurrentStep: (step) => {
    set({ currentStep: step });
    get().updateOverallProgress();
    get().saveState();
  },

  setStepProgress: (step, progress) => {
    const clamped = Math.max(0, Math.min(100, progress));
    set((state) => ({
      stepProgress: {
        ...state.stepProgress,
        [step]: clamped,
      },
    }));
    get().updateOverallProgress();
  },

  updateOverallProgress: () => {
    const state = get();
    // When not loading, preserve the current progress value; don't force it to 0 or 100
    if (!state.isLoading || state.isCancelled) {
      return;
    }

    let totalProgress = 0;
    STEP_ORDER.forEach((step) => {
      const weight = INDEXING_STEPS[step].weight;
      const progress = state.stepProgress[step];
      totalProgress += (progress / 100) * weight;
    });

    // Calculate estimated time remaining
    let estimatedTimeRemaining: number | null = null;
    if (state.startTime && totalProgress > 0) {
      const elapsedTime = Date.now() - state.startTime;
      const timePerPercent = elapsedTime / totalProgress;
      estimatedTimeRemaining = Math.max(
        0,
        Math.round(timePerPercent * (100 - totalProgress)),
      );
    }

    set({
      overallProgress: Math.round(totalProgress),
      estimatedTimeRemaining,
    });
  },

  setError: (step, message, recoverable = true) => {
    set({
      error: { step, message, recoverable },
      isLoading: false,
    });
    get().saveState();
  },

  clearError: () => {
    set({ error: null });
  },

  startIndexing: () => {
    set({
      ...initialState,
      isLoading: true,
      startTime: Date.now(),
      totalSteps: STEP_ORDER.length,
      completedSteps: 0,
    });
    get().saveState();
  },

  completeStep: (step) => {
    set((state) => {
      // Idempotency guard: use a dedicated boolean record, not stepProgress,
      // so the check is independent of animation state.
      const record = state.completedStepRecord;
      if (record[step]) return state;
      return {
        completedStepRecord: { ...record, [step]: true },
        stepProgress: {
          ...state.stepProgress,
          [step]: 100,
        },
        completedSteps: Math.min(
          state.completedSteps + 1,
          STEP_ORDER.length, // hard cap — can never exceed total steps
        ),
      };
    });
    get().updateOverallProgress();
    get().saveState();
  },

  cancelIndexing: () => {
    set({
      isCancelled: true,
      isLoading: false,
      currentStep: null,
    });
    get().clearPersistedState();
  },

  reset: () => {
    set(initialState);
    get().clearPersistedState();
  },

  saveState: () => {
    const state = get();
    if (!state.isLoading || state.isCancelled) return;

    const stepTimings: Record<IndexingStep, number> = {} as Record<
      IndexingStep,
      number
    >;
    STEP_ORDER.forEach((step) => {
      stepTimings[step] = 0; // Simplified for now; can be enhanced
    });

    const persistedState: PersistedIndexingState = {
      currentStep: state.currentStep,
      completedSteps: state.completedSteps,
      stepTimings,
      startTime: state.startTime,
      timestamp: Date.now(),
    };

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(PERSISTENCE_KEY, JSON.stringify(persistedState));
      } catch (error) {
        console.warn("Failed to persist indexing state:", error);
      }
    }
  },

  loadState: () => {
    if (typeof window === "undefined") return false;

    try {
      const saved = localStorage.getItem(PERSISTENCE_KEY);
      if (!saved) return false;

      const persistedState: PersistedIndexingState = JSON.parse(saved);
      const now = Date.now();

      // Check if persisted state is still valid (within 5 minutes)
      if (now - persistedState.timestamp > PERSISTENCE_TIMEOUT) {
        localStorage.removeItem(PERSISTENCE_KEY);
        return false;
      }

      // Restore state
      set({
        currentStep: persistedState.currentStep,
        completedSteps: persistedState.completedSteps,
        startTime: persistedState.startTime,
        isLoading: persistedState.currentStep !== null,
        isCancelled: false,
      });

      return true;
    } catch (error) {
      console.warn("Failed to load persisted indexing state:", error);
      return false;
    }
  },

  clearPersistedState: () => {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(PERSISTENCE_KEY);
      } catch (error) {
        console.warn("Failed to clear persisted state:", error);
      }
    }
  },
}));
