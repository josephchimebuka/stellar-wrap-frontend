"use client";

import React from "react";
import { INDEXING_STEPS, STEP_ORDER, type IndexingStep } from "@/app/types/indexing";
import type { IndexerRecoveryState } from "@/app/types/indexingRecovery";


const ERROR_LABELS: Record<string, string> = {
  "api-error": "API Error",
  "network-error": "Network Error",
  "parsing-error": "Parsing Error",
  "validation-error": "Validation Error",
};

function StepRow({
  step,
  state,
}: {
  step: IndexingStep;
  state: IndexerRecoveryState;
}) {
  const meta = INDEXING_STEPS[step];
  const stepState = state.stepStates[step];
  const status = stepState?.status ?? "idle";

  const dot: Record<string, string> = {
    idle: "bg-white/10 border border-white/20",
    running: "bg-indigo-400 animate-pulse",
    completed: "bg-emerald-400",
    failed: "bg-red-400",
    skipped: "bg-white/15",
  };

  const label: Record<string, string> = {
    idle: "text-white/35",
    running: "text-indigo-300 font-medium",
    completed: "text-emerald-300",
    failed: "text-red-300",
    skipped: "text-white/25",
  };

  const badge: Record<string, string> = {
    idle: "",
    running: "…",
    completed: "✓",
    failed: "✕",
    skipped: "—",
  };

  return (
    <li className="flex items-center gap-3 min-h-[28px]">
      <span
        className={`h-2 w-2 flex-shrink-0 rounded-full ${dot[status]}`}
      />
      <span className={`flex-1 text-sm ${label[status]}`}>
        {meta.label}
        {status === "running" && (
          <span className="ml-1.5 text-xs text-white/30">{meta.description}</span>
        )}
      </span>

      {status === "failed" && stepState.error ? (
        <span
          className="max-w-[200px] truncate text-xs text-red-400/70"
          title={stepState.error.message}
        >
          {stepState.error.message}
        </span>
      ) : (
        badge[status] && (
          <span className={`text-xs tabular-nums ${label[status]}`}>
            {badge[status]}
          </span>
        )
      )}
    </li>
  );
}

function Pill({
  children,
  color,
}: {
  children: React.ReactNode;
  color: "amber" | "blue" | "red";
}) {
  const classes = {
    amber:
      "bg-amber-500/15 text-amber-300 border-amber-500/30",
    blue: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    red: "bg-red-500/15 text-red-300 border-red-500/30",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${classes[color]}`}
    >
      {children}
    </span>
  );
}


function ActionButton({
  onClick,
  disabled,
  variant = "primary",
  children,
}: {
  onClick: () => void;
  disabled: boolean;
  variant?: "primary" | "success" | "ghost" | "info";
  children: React.ReactNode;
}) {
  const base =
    "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50";
  const styles = {
    primary: "bg-indigo-500 hover:bg-indigo-400 text-white",
    success: "bg-emerald-600 hover:bg-emerald-500 text-white",
    ghost:
      "border border-white/15 text-white/70 hover:bg-white/6 hover:text-white",
    info: "border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300",
  };
  return (
    <button
      type="button"
      className={`${base} ${styles[variant]}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}


const RetryIcon = ({ spin }: { spin: boolean }) => (
  <svg
    className={`h-3.5 w-3.5 ${spin ? "animate-spin" : ""}`}
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <path d="M13.5 2.5A6.5 6.5 0 1 1 2.5 8" strokeLinecap="round" />
    <path d="M10 2.5h3.5V6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ResumeIcon = () => (
  <svg
    className="h-3.5 w-3.5"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <path d="M4 8h8M9 5l3 3-3 3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const RestartIcon = () => (
  <svg
    className="h-3.5 w-3.5"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <path
      d="M2 8a6 6 0 1 1 12 0A6 6 0 0 1 2 8z"
      strokeLinecap="round"
    />
    <path d="M8 5v3l2 2" strokeLinecap="round" />
  </svg>
);

const PartialIcon = () => (
  <svg
    className="h-3.5 w-3.5"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <path d="M2 10l4-4 4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const WarnIcon = () => (
  <svg className="h-4 w-4 text-red-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
    <path
      fillRule="evenodd"
      d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
      clipRule="evenodd"
    />
  </svg>
);

interface Props {
  state: IndexerRecoveryState;
  isRunning: boolean;
  canResume: boolean;
  hasPartialResults: boolean;
  onRetry: () => void;
  onResume: () => void;
  onRestart: () => void;
  onAcceptPartial?: () => void;
}

export default function IndexerErrorRecovery({
  state,
  isRunning,
  canResume,
  hasPartialResults,
  onRetry,
  onResume,
  onRestart,
  onAcceptPartial,
}: Props) {
  const failedStep = state.failedStep;
  const failedError = failedStep ? state.stepStates[failedStep]?.error : null;
  const completedCount = state.completedSteps.length;
  const totalSteps = STEP_ORDER.length;
  const progressPct = Math.round((completedCount / totalSteps) * 100);

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d1a] text-white shadow-2xl shadow-black/50">
      <div className="flex items-start justify-between gap-4 border-b border-white/8 px-5 pb-4 pt-5">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5">
            <WarnIcon />
            <h2 className="text-sm font-semibold">
              {failedStep
                ? `Indexing failed at "${INDEXING_STEPS[failedStep].label}"`
                : "Indexing failed"}
            </h2>
          </div>

          {failedError && (
            <p className="pl-6 text-xs leading-relaxed text-white/50">
              <span className="mr-1 font-medium text-red-400/90">
                {ERROR_LABELS[failedError.type] ?? failedError.type}:
              </span>
              {failedError.message}
            </p>
          )}
        </div>

        <div className="flex flex-shrink-0 flex-wrap items-center gap-2">
          {state.totalRetries > 0 && (
            <Pill color="amber">
              <RetryIcon spin={false} />
              {state.totalRetries} {state.totalRetries === 1 ? "retry" : "retries"}
            </Pill>
          )}
          {hasPartialResults && <Pill color="blue">Partial data</Pill>}
          {failedError && !failedError.retryable && (
            <Pill color="red">Not retryable</Pill>
          )}
        </div>
      </div>

      <div className="px-5 pb-2 pt-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs text-white/40">
            {completedCount} / {totalSteps} steps completed
          </span>
          <span className="tabular-nums text-xs text-white/30">
            {progressPct}%
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/8">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>
      <ul className="flex flex-col gap-2 px-5 py-4">
        {STEP_ORDER.map((step) => (
          <StepRow key={step} step={step} state={state} />
        ))}
      </ul>

      <div className="flex flex-wrap items-center gap-2.5 border-t border-white/8 px-5 pb-5 pt-3">
        {failedStep && failedError?.retryable && (
          <ActionButton
            variant="primary"
            disabled={isRunning}
            onClick={onRetry}
          >
            <RetryIcon spin={isRunning} />
            {isRunning && state.pendingAction === "retry"
              ? "Retrying…"
              : "Retry step"}
          </ActionButton>
        )}

        {canResume && (
          <ActionButton
            variant="success"
            disabled={isRunning}
            onClick={onResume}
          >
            <ResumeIcon />
            {isRunning && state.pendingAction === "resume"
              ? "Resuming…"
              : "Resume from last step"}
          </ActionButton>
        )}

        <ActionButton
          variant="ghost"
          disabled={isRunning}
          onClick={onRestart}
        >
          <RestartIcon />
          {isRunning && state.pendingAction === "restart"
            ? "Restarting…"
            : "Restart"}
        </ActionButton>

        {hasPartialResults && onAcceptPartial && (
          <ActionButton
            variant="info"
            disabled={isRunning}
            onClick={onAcceptPartial}
          >
            <PartialIcon />
            Use partial results
          </ActionButton>
        )}
      </div>
    </div>
  );
}