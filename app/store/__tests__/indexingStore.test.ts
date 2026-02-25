/**
 * Unit Tests for indexingStore (Zustand)
 *
 * Run with: npx tsx app/store/__tests__/indexingStore.test.ts
 *
 * @module indexingStore.test
 */

import { create } from 'zustand';

// ─── Inline types (avoids @/ alias issues) ──────────────────────────────────

type IndexingStep = 'initializing' | 'fetching-transactions' | 'filtering-timeframes'
    | 'calculating-volume' | 'identifying-assets' | 'counting-contracts' | 'finalizing';

interface StepMetadata { id: IndexingStep; label: string; description: string; weight: number; estimatedDuration: number; }

const INDEXING_STEPS: Record<IndexingStep, StepMetadata> = {
    initializing: { id: 'initializing', label: 'Initializing', description: '', weight: 5, estimatedDuration: 500 },
    'fetching-transactions': { id: 'fetching-transactions', label: 'Fetching', description: '', weight: 25, estimatedDuration: 3000 },
    'filtering-timeframes': { id: 'filtering-timeframes', label: 'Filtering', description: '', weight: 15, estimatedDuration: 1000 },
    'calculating-volume': { id: 'calculating-volume', label: 'Calculating', description: '', weight: 20, estimatedDuration: 1500 },
    'identifying-assets': { id: 'identifying-assets', label: 'Identifying', description: '', weight: 20, estimatedDuration: 1500 },
    'counting-contracts': { id: 'counting-contracts', label: 'Counting', description: '', weight: 10, estimatedDuration: 1000 },
    finalizing: { id: 'finalizing', label: 'Finalizing', description: '', weight: 5, estimatedDuration: 500 },
};

const STEP_ORDER: IndexingStep[] = [
    'initializing', 'fetching-transactions', 'filtering-timeframes',
    'calculating-volume', 'identifying-assets', 'counting-contracts', 'finalizing',
];

interface IndexingError { step: IndexingStep; message: string; recoverable: boolean; }

interface IndexingStoreState {
    currentStep: IndexingStep | null;
    stepProgress: Record<IndexingStep, number>;
    completedStepRecord: Record<IndexingStep, boolean>;
    overallProgress: number; completedSteps: number; totalSteps: number;
    startTime: number | null; estimatedTimeRemaining: number | null;
    error: IndexingError | null; isLoading: boolean; isCancelled: boolean;
    setCurrentStep: (step: IndexingStep | null) => void;
    setStepProgress: (step: IndexingStep, progress: number) => void;
    updateOverallProgress: () => void;
    setError: (step: IndexingStep, message: string, recoverable?: boolean) => void;
    clearError: () => void;
    startIndexing: () => void;
    completeStep: (step: IndexingStep) => void;
    cancelIndexing: () => void;
    reset: () => void;
}

const initialCompletedStepRecord: Record<IndexingStep, boolean> = {
    initializing: false, 'fetching-transactions': false, 'filtering-timeframes': false,
    'calculating-volume': false, 'identifying-assets': false, 'counting-contracts': false, finalizing: false,
};

const initialStepProgress: Record<IndexingStep, number> = {
    initializing: 0, 'fetching-transactions': 0, 'filtering-timeframes': 0,
    'calculating-volume': 0, 'identifying-assets': 0, 'counting-contracts': 0, finalizing: 0,
};

const initialState = {
    currentStep: null as IndexingStep | null, stepProgress: { ...initialStepProgress },
    completedStepRecord: { ...initialCompletedStepRecord },
    overallProgress: 0, completedSteps: 0, totalSteps: STEP_ORDER.length,
    startTime: null as number | null, estimatedTimeRemaining: null as number | null,
    error: null as IndexingError | null, isLoading: false, isCancelled: false,
};

const useIndexingStore = create<IndexingStoreState>((set, get) => ({
    ...initialState,
    setCurrentStep: (step) => { set({ currentStep: step }); get().updateOverallProgress(); },
    setStepProgress: (step, progress) => {
        const clamped = Math.max(0, Math.min(100, progress));
        set((state) => ({ stepProgress: { ...state.stepProgress, [step]: clamped } }));
        get().updateOverallProgress();
    },
    updateOverallProgress: () => {
        const state = get();
        if (!state.isLoading || state.isCancelled) return;
        let totalProgress = 0;
        STEP_ORDER.forEach((step) => {
            totalProgress += (state.stepProgress[step] / 100) * INDEXING_STEPS[step].weight;
        });
        set({ overallProgress: Math.round(totalProgress) });
    },
    setError: (step, message, recoverable = true) => { set({ error: { step, message, recoverable }, isLoading: false }); },
    clearError: () => { set({ error: null }); },
    startIndexing: () => { set({ ...initialState, isLoading: true, startTime: Date.now(), totalSteps: STEP_ORDER.length, completedSteps: 0 }); },
    completeStep: (step) => {
        set((state) => {
            if (state.completedStepRecord[step]) return state;
            return {
                completedStepRecord: { ...state.completedStepRecord, [step]: true },
                stepProgress: { ...state.stepProgress, [step]: 100 },
                completedSteps: Math.min(state.completedSteps + 1, STEP_ORDER.length),
            };
        });
        get().updateOverallProgress();
    },
    cancelIndexing: () => { set({ isCancelled: true, isLoading: false, currentStep: null }); },
    reset: () => { set(initialState); },
}));

// ─── Test Helpers ───────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const failures: string[] = [];

function assert(condition: boolean, message: string): void {
    if (condition) { passed++; } else { failed++; failures.push(message); console.error(`  ✗ ${message}`); }
}

function section(name: string): void {
    console.log(`\n▸ ${name}`);
}

// ─── Initial State ──────────────────────────────────────────────────────────

section('Initial state');
{
    const state = useIndexingStore.getState();
    assert(state.currentStep === null, 'currentStep starts null');
    assert(state.overallProgress === 0, 'overallProgress starts 0');
    assert(state.completedSteps === 0, 'completedSteps starts 0');
    assert(state.totalSteps === 7, 'totalSteps is 7');
    assert(state.isLoading === false, 'isLoading starts false');
    assert(state.isCancelled === false, 'isCancelled starts false');
    assert(state.error === null, 'error starts null');
}

// ─── startIndexing ──────────────────────────────────────────────────────────

section('startIndexing');
{
    useIndexingStore.getState().startIndexing();
    const state = useIndexingStore.getState();
    assert(state.isLoading === true, 'startIndexing: isLoading is true');
    assert(state.startTime !== null, 'startIndexing: startTime is set');
    assert(state.completedSteps === 0, 'startIndexing: completedSteps reset to 0');
    assert(state.overallProgress === 0, 'startIndexing: overallProgress reset to 0');
}

// ─── setCurrentStep ─────────────────────────────────────────────────────────

section('setCurrentStep');
{
    useIndexingStore.getState().setCurrentStep('initializing');
    assert(useIndexingStore.getState().currentStep === 'initializing', 'currentStep set');

    useIndexingStore.getState().setCurrentStep('fetching-transactions');
    assert(useIndexingStore.getState().currentStep === 'fetching-transactions', 'currentStep updated');
}

// ─── setStepProgress ────────────────────────────────────────────────────────

section('setStepProgress');
{
    useIndexingStore.getState().setStepProgress('initializing', 50);
    assert(useIndexingStore.getState().stepProgress.initializing === 50, 'step progress set to 50');

    // Clamped to 0-100
    useIndexingStore.getState().setStepProgress('initializing', 150);
    assert(useIndexingStore.getState().stepProgress.initializing === 100, 'step progress clamped to 100');

    useIndexingStore.getState().setStepProgress('initializing', -10);
    assert(useIndexingStore.getState().stepProgress.initializing === 0, 'step progress clamped to 0');
}

// ─── completeStep ───────────────────────────────────────────────────────────

section('completeStep');
{
    useIndexingStore.getState().reset();
    useIndexingStore.getState().startIndexing();

    useIndexingStore.getState().completeStep('initializing');
    let state = useIndexingStore.getState();
    assert(state.stepProgress.initializing === 100, 'completeStep: progress set to 100');
    assert(state.completedSteps === 1, 'completeStep: completedSteps is 1');
    assert(state.completedStepRecord.initializing === true, 'completeStep: record set to true');

    // Idempotent — completing same step again should not increment
    useIndexingStore.getState().completeStep('initializing');
    state = useIndexingStore.getState();
    assert(state.completedSteps === 1, 'completeStep: idempotent — still 1');
}

// ─── Overall Progress Calculation ───────────────────────────────────────────

section('Overall progress calculation');
{
    useIndexingStore.getState().reset();
    useIndexingStore.getState().startIndexing();

    // Complete all steps
    STEP_ORDER.forEach((step) => useIndexingStore.getState().completeStep(step));
    const state = useIndexingStore.getState();
    assert(state.completedSteps === 7, 'all steps: completedSteps is 7');
    assert(state.overallProgress === 100, 'all steps: overallProgress is 100');
}

// ─── setError ───────────────────────────────────────────────────────────────

section('setError');
{
    useIndexingStore.getState().reset();
    useIndexingStore.getState().startIndexing();

    useIndexingStore.getState().setError('fetching-transactions', 'Horizon 503', true);
    const state = useIndexingStore.getState();
    assert(state.error !== null, 'error is set');
    assert(state.error!.step === 'fetching-transactions', 'error step matches');
    assert(state.error!.message === 'Horizon 503', 'error message matches');
    assert(state.error!.recoverable === true, 'error is recoverable');
    assert(state.isLoading === false, 'setError stops loading');
}

// ─── clearError ─────────────────────────────────────────────────────────────

section('clearError');
{
    useIndexingStore.getState().clearError();
    assert(useIndexingStore.getState().error === null, 'error cleared');
}

// ─── cancelIndexing ─────────────────────────────────────────────────────────

section('cancelIndexing');
{
    useIndexingStore.getState().reset();
    useIndexingStore.getState().startIndexing();
    useIndexingStore.getState().setCurrentStep('fetching-transactions');

    useIndexingStore.getState().cancelIndexing();
    const state = useIndexingStore.getState();
    assert(state.isCancelled === true, 'cancel: isCancelled true');
    assert(state.isLoading === false, 'cancel: isLoading false');
    assert(state.currentStep === null, 'cancel: currentStep null');
}

// ─── reset ──────────────────────────────────────────────────────────────────

section('reset');
{
    useIndexingStore.getState().startIndexing();
    useIndexingStore.getState().completeStep('initializing');
    useIndexingStore.getState().setError('finalizing', 'oops');

    useIndexingStore.getState().reset();
    const state = useIndexingStore.getState();
    assert(state.currentStep === null, 'reset: currentStep null');
    assert(state.completedSteps === 0, 'reset: completedSteps 0');
    assert(state.overallProgress === 0, 'reset: overallProgress 0');
    assert(state.isLoading === false, 'reset: isLoading false');
    assert(state.error === null, 'reset: error null');
    assert(state.isCancelled === false, 'reset: isCancelled false');
}

// ─── Progress Does Not Update When Not Loading ──────────────────────────────

section('Progress guard: does not update when not loading');
{
    useIndexingStore.getState().reset();
    // Do NOT call startIndexing — isLoading remains false
    useIndexingStore.getState().setStepProgress('initializing', 100);
    assert(useIndexingStore.getState().overallProgress === 0, 'progress stays 0 when not loading');
}

// ─── Step Completion Cap ────────────────────────────────────────────────────

section('Step completion cap');
{
    useIndexingStore.getState().reset();
    useIndexingStore.getState().startIndexing();

    // Complete all 7 + try to exceed
    STEP_ORDER.forEach((step) => useIndexingStore.getState().completeStep(step));
    // Re-completing should not push beyond 7
    STEP_ORDER.forEach((step) => useIndexingStore.getState().completeStep(step));
    assert(useIndexingStore.getState().completedSteps === 7, 'completedSteps capped at 7');
}

// ─── Report ─────────────────────────────────────────────────────────────────

console.log('\n══════════════════════════════════════════════════════');
console.log(`  Results:  ${passed} passed, ${failed} failed`);
console.log('══════════════════════════════════════════════════════');

if (failures.length > 0) {
    console.log('\nFailed tests:');
    failures.forEach((f) => console.log(`  ✗ ${f}`));
}

process.exit(failed > 0 ? 1 : 0);
