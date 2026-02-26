"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, RotateCcw, X, TrendingUp, Coins, FileText, Zap } from "lucide-react";
import { useIndexingStore } from "@/app/store/indexingStore";
import { INDEXING_STEPS, STEP_ORDER, IndexingStep } from "@/app/types/indexing";

interface IndexingSkeletonProps {
  onRetry?: () => void;
  onCancel?: () => void;
}

/**
 * IndexingSkeleton - Main loading component with step-specific visualizations
 * Shows real-time progress with animated metrics based on the current indexing step
 */
export function IndexingSkeleton({
  onRetry,
  onCancel,
}: IndexingSkeletonProps) {
  const {
    currentStep,
    stepProgress,
    overallProgress,
    completedSteps,
    totalSteps,
    error,
    estimatedTimeRemaining,
    isLoading,
    metrics,
  } = useIndexingStore();

  const formatTime = (ms: number): string => {
    const seconds = Math.ceil(ms / 1000);
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.ceil(seconds / 60);
    return `${minutes}m`;
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  // Step-specific visualization data
  const getStepVisualization = (step: IndexingStep | null) => {
    if (!step) return null;

    switch (step) {
      case "fetching-transactions":
        return {
          icon: FileText,
          metric: metrics.transactionCount,
          label: "Transactions",
          color: "#00D4FF",
          pulse: true,
        };
      case "filtering-timeframes":
        return {
          icon: TrendingUp,
          metric: metrics.timeframesProcessed,
          label: "Timeframes",
          color: "#FF6B35",
          pulse: true,
        };
      case "calculating-volume":
        return {
          icon: Coins,
          metric: metrics.volumeProcessed,
          label: "Volume",
          color: "#FFD93D",
          pulse: true,
        };
      case "identifying-assets":
        return {
          icon: Zap,
          metric: metrics.assetCount,
          label: "Assets",
          color: "#6BCF7F",
          pulse: true,
        };
      case "counting-contracts":
        return {
          icon: FileText,
          metric: metrics.contractCount,
          label: "Contracts",
          color: "#B794F6",
          pulse: true,
        };
      default:
        return null;
    }
  };

  const stepViz = getStepVisualization(currentStep);

  if (!isLoading && !error) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-3xl mx-auto px-4"
    >
      {/* Main Progress Container with Neon/Cyberpunk aesthetic */}
      <div className="relative rounded-2xl border border-white/10 bg-linear-to-b from-white/5 to-transparent backdrop-blur-xl p-6 md:p-8 space-y-6 shadow-2xl">
        {/* Neon glow effect */}
        <div
          className="absolute -inset-0.5 rounded-2xl opacity-20 blur-xl"
          style={{
            background: `linear-gradient(45deg, ${stepViz?.color || "#00D4FF"}, transparent)`,
          }}
        />

        {/* Header Section */}
        <div className="relative space-y-2">
          <h2 className="text-2xl md:text-3xl font-black text-white">
            {error ? "Indexing Error" : "Scanning the Blockchain"}
          </h2>
          <p className="text-neutral-400 text-sm md:text-base">
            {error
              ? error.message
              : currentStep
                ? INDEXING_STEPS[currentStep].description
                : "Preparing your data..."}
          </p>
        </div>

        {/* Step-Specific Real-Time Visualization */}
        <AnimatePresence mode="wait">
          {stepViz && !error && (
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="relative"
            >
              <div
                className="relative rounded-xl p-6 border border-white/20"
                style={{
                  background: `linear-gradient(135deg, ${stepViz.color}15, transparent)`,
                }}
              >
                {/* Pulse animation for active state */}
                {stepViz.pulse && (
                  <motion.div
                    className="absolute inset-0 rounded-xl"
                    style={{
                      backgroundColor: stepViz.color,
                      opacity: 0.1,
                    }}
                    animate={{
                      opacity: [0.1, 0.2, 0.1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                )}

                <div className="relative flex items-center gap-6">
                  {/* Animated Icon */}
                  <motion.div
                    className="p-4 rounded-xl"
                    style={{
                      backgroundColor: `${stepViz.color}20`,
                      borderColor: `${stepViz.color}40`,
                    }}
                    animate={{
                      scale: [1, 1.05, 1],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <stepViz.icon
                      className="w-8 h-8"
                      style={{ color: stepViz.color }}
                    />
                  </motion.div>

                  {/* Metric Display */}
                  <div className="flex-1">
                    <p className="text-xs uppercase tracking-widest text-neutral-500 mb-1">
                      {stepViz.label}
                    </p>
                    <motion.p
                      key={`${stepViz.metric}`}
                      initial={{ scale: 1.2, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.2 }}
                      className="text-3xl md:text-4xl font-black"
                      style={{ color: stepViz.color }}
                    >
                      {typeof stepViz.metric === "number"
                        ? formatNumber(stepViz.metric)
                        : stepViz.metric}
                    </motion.p>
                  </div>

                  {/* Progress percentage */}
                  <div className="text-right">
                    <p className="text-4xl font-black text-white">
                      {stepProgress[currentStep!]}%
                    </p>
                    <p className="text-xs text-neutral-500">Complete</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step Progress Bar */}
        <div className="relative space-y-3">
          <div className="flex items-center justify-between">
            <label
              htmlFor="step-progress"
              className="text-xs uppercase tracking-widest text-neutral-500"
            >
              {currentStep ? INDEXING_STEPS[currentStep].label : "Initializing"}
            </label>
            <span className="text-xs font-mono text-neutral-400">
              {currentStep ? stepProgress[currentStep] : 0}%
            </span>
          </div>
          <motion.div
            id="step-progress"
            className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/10"
            role="progressbar"
            aria-valuenow={currentStep ? stepProgress[currentStep] : 0}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <motion.div
              className="h-full rounded-full"
              initial={{ width: "0%" }}
              animate={{
                width: `${currentStep ? stepProgress[currentStep] : 0}%`,
              }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              style={{
                backgroundColor: stepViz?.color || "var(--color-theme-primary)",
                boxShadow: `0 0 10px ${stepViz?.color || "var(--color-theme-primary)"}`,
              }}
            />
          </motion.div>
        </div>

        {/* Overall Progress Bar */}
        <div className="relative space-y-3">
          <div className="flex items-center justify-between">
            <label
              htmlFor="overall-progress"
              className="text-xs uppercase tracking-widest text-neutral-500"
            >
              Overall Progress
            </label>
            <span className="text-xs font-mono text-neutral-400">
              {completedSteps}/{totalSteps} steps
            </span>
          </div>
          <motion.div
            id="overall-progress"
            className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/10"
            role="progressbar"
            aria-valuenow={overallProgress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <motion.div
              className="h-full"
              initial={{ width: "0%" }}
              animate={{ width: `${overallProgress}%` }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              style={{
                background: `linear-gradient(90deg, #00D4FF, #6BCF7F, #FFD93D)`,
                boxShadow: "0 0 15px rgba(0, 212, 255, 0.5)",
              }}
            />
          </motion.div>
        </div>

        {/* Step Timeline */}
        <div className="relative space-y-2">
          <p className="text-xs uppercase tracking-widest text-neutral-500">
            Steps
          </p>
          <div className="grid grid-cols-7 gap-2">
            {STEP_ORDER.map((step, index) => {
              const isCompleted = completedSteps > index;
              const isCurrentStep = currentStep === step;

              return (
                <motion.div
                  key={step}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative"
                  title={INDEXING_STEPS[step].label}
                >
                  <div
                    className={`h-10 rounded-lg border-2 flex items-center justify-center text-xs font-bold transition-all ${
                      isCompleted
                        ? "border-green-500 bg-green-500/20 text-green-400"
                        : isCurrentStep
                          ? "border-cyan-400 bg-cyan-400/40 text-cyan-300 shadow-lg shadow-cyan-500/50"
                          : "border-white/20 bg-white/5 text-neutral-500"
                    }`}
                  >
                    {isCompleted ? (
                      <span>✓</span>
                    ) : isCurrentStep ? (
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                        className="inline-block"
                      >
                        ◆
                      </motion.span>
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Time Estimate */}
        {estimatedTimeRemaining && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-sm text-neutral-400"
          >
            Estimated time remaining:{" "}
            <span className="font-semibold text-white">
              {formatTime(estimatedTimeRemaining)}
            </span>
          </motion.div>
        )}

        {/* Error State */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 space-y-3"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-red-300">
                    Error in {INDEXING_STEPS[error.step].label}
                  </p>
                  <p className="text-sm text-red-200/80">{error.message}</p>
                </div>
              </div>

              {/* Error Actions */}
              <div className="flex gap-3 pt-2">
                {error.recoverable && onRetry && (
                  <motion.button
                    onClick={onRetry}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-sm font-medium text-red-300 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Retry
                  </motion.button>
                )}
                {onCancel && (
                  <motion.button
                    onClick={onCancel}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2 px-4 py-2 bg-neutral-500/20 hover:bg-neutral-500/30 border border-neutral-500/30 rounded-lg text-sm font-medium text-neutral-300 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </motion.button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
