
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getIndexerRecoveryService,
  resetIndexerRecoveryService,
  IndexerRecoveryService,
} from "@/app/services/indexerRecoveryService";
import type { IndexerRecoveryState } from "@/app/types/indexingRecovery";
import type { IndexerResult, WrapPeriod } from "@/app/utils/indexer";



interface IndexerOpts {
  accountId: string;
  network?: "mainnet" | "testnet";
  period?: WrapPeriod;
}



export interface UseIndexerRecoveryReturn {
  state: IndexerRecoveryState;
  isRunning: boolean;
  canResume: boolean;
  hasPartialResults: boolean;
  start: (opts: IndexerOpts) => Promise<IndexerResult | null>;
  retryFailedStep: (opts: IndexerOpts) => Promise<IndexerResult | null>;
  resume: (opts: IndexerOpts) => Promise<IndexerResult | null>;
  restart: (opts: IndexerOpts) => Promise<IndexerResult | null>;
  acceptPartial: () => IndexerResult | null;
}

export function useIndexerRecovery(): UseIndexerRecoveryReturn {
  const serviceRef = useRef<IndexerRecoveryService>(
    getIndexerRecoveryService(),
  );
  const [state, setState] = useState<IndexerRecoveryState>(() =>
    serviceRef.current.getState(),
  );
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    const service = serviceRef.current;
    const unsub = service.subscribe((next) => setState({ ...next }));
    return unsub;
  }, []);


  async function run<T>(fn: () => Promise<T>): Promise<T> {
    setIsRunning(true);
    try {
      return await fn();
    } finally {
      setIsRunning(false);
    }
  }


  const start = useCallback(
    (opts: IndexerOpts) =>
      run(() => serviceRef.current.start(opts)),
    [],
  );

  const retryFailedStep = useCallback(
    (opts: IndexerOpts) =>
      run(() => serviceRef.current.retryFailedStep(opts)),
    [],
  );

  const resume = useCallback(
    (opts: IndexerOpts) =>
      run(() => serviceRef.current.resume(opts)),
    [],
  );

  const restart = useCallback(
    async (opts: IndexerOpts) => {
      resetIndexerRecoveryService();
      serviceRef.current = getIndexerRecoveryService();
      serviceRef.current.subscribe((next) => setState({ ...next }));
      return run(() => serviceRef.current.start(opts));
    },
    [],
  );

  const acceptPartial = useCallback(
    () => serviceRef.current.acceptPartialResults(),
    [],
  );

  const canResume =
    Boolean(state.failedStep) && state.completedSteps.length > 0;

  const hasPartialResults =
    state.isPartial && state.completedSteps.length > 0;

  return {
    state,
    isRunning,
    canResume,
    hasPartialResults,
    start,
    retryFailedStep,
    resume,
    restart,
    acceptPartial,
  };
}