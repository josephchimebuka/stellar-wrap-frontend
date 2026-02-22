"use client";

import { motion } from "motion/react";
import { useCallback, useEffect, useMemo } from "react";
import { Home, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { ProgressIndicator } from "../components/ProgressIndicator";
import { StepProgressDisplay } from "../components/StepProgressDisplay";
import { MuteToggle } from "../components/MuteToggle";
import { useWrapStore } from "../store/wrapStore";
import { useIndexingStore } from "../store/indexingStore";
import { mockData } from "../data/mockData";
import { useSound } from "../hooks/useSound";
import { SOUND_NAMES } from "../utils/soundManager";
import { indexAccount } from "../services/indexerService";
import { IndexerEventEmitter } from "../utils/indexerEventEmitter";

export default function LoadingScreen() {
  const router = useRouter();
  const { address, period, network, setStatus, setResult, setError } =
    useWrapStore();
  const { startIndexing, cancelIndexing, loadState } = useIndexingStore();
  const { playSound } = useSound();

  const handleComplete = useCallback(() => {
    playSound(SOUND_NAMES.SLIDE_WHOOSH);
    router.push("/persona");
  }, [router, playSound]);

  const handleCancel = useCallback(() => {
    cancelIndexing();
    router.push("/");
  }, [cancelIndexing, router]);

  const handleRetry = useCallback(() => {
    // Reset error state and re-run the loading flow by reloading the page
    // (useEffect cleanup + re-mount is the cleanest way without prop-drilling)
    window.location.reload();
  }, []);

  useEffect(() => {
    let isMounted = true;

    // Initialize event emitter connection to store on first load
    IndexerEventEmitter.getInstance().connectToStore();

    const loadWrap = async () => {
      try {
        setStatus("loading");
        setError(null);

        // Attempt to resume from persisted state; only start fresh if no state is restored
        const wasRestored = loadState();
        if (!wasRestored) {
          startIndexing();
        }

        // Call real indexer service - will emit step progress events
        let result;

        if (address) {
          try {
            const indexerResult = await indexAccount(
              address,
              network as "mainnet" | "testnet",
              period as "weekly" | "monthly" | "yearly",
            );

            // Map indexer result to wrap result format
            result = {
              username: mockData.username,
              totalTransactions:
                indexerResult.totalTransactions || mockData.transactions,
              percentile: mockData.percentile,
              dapps: mockData.dapps.map((dapp) => ({
                name: dapp.name,
                interactions: dapp.transactions,
                color: dapp.color,
                gradient: dapp.gradient,
              })),
              vibes: mockData.vibes,
              persona: mockData.persona,
              personaDescription: mockData.personaDescription,
            };
          } catch (indexerError) {
            // Fallback to mock data if real indexer fails
            console.warn("Real indexer failed, using mock data:", indexerError);
            result = {
              username: mockData.username,
              totalTransactions: mockData.transactions,
              percentile: mockData.percentile,
              dapps: mockData.dapps.map((dapp) => ({
                name: dapp.name,
                interactions: dapp.transactions,
                color: dapp.color,
                gradient: dapp.gradient,
              })),
              vibes: mockData.vibes,
              persona: mockData.persona,
              personaDescription: mockData.personaDescription,
            };
          }
        } else {
          result = {
            username: mockData.username,
            totalTransactions: mockData.transactions,
            percentile: mockData.percentile,
            dapps: mockData.dapps.map((dapp) => ({
              name: dapp.name,
              interactions: dapp.transactions,
              color: dapp.color,
              gradient: dapp.gradient,
            })),
            vibes: mockData.vibes,
            persona: mockData.persona,
            personaDescription: mockData.personaDescription,
          };
        }

        if (!isMounted) return;

        setResult(result);
        setStatus("ready");

        // small delay for animation before continuing
        setTimeout(() => {
          if (isMounted) {
            handleComplete();
          }
        }, 800);
      } catch (error: unknown) {
        if (!isMounted) return;
        setStatus("error");
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError("Failed to load wrap data");
        }
        // Fallback: still navigate so user isn’t stuck
        setTimeout(() => {
          if (isMounted) {
            handleComplete();
          }
        }, 1200);
      }
    };

    loadWrap();

    return () => {
      isMounted = false;
      IndexerEventEmitter.getInstance().reset();
    };
  }, [
    address,
    period,
    network,
    setError,
    setResult,
    setStatus,
    handleComplete,
    startIndexing,
    loadState,
  ]);

  const starConfigs = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => ({
        left: (i * 13) % 100,
        top: (i * 29) % 100,
        duration: 3 + (i % 5),
        delay: i % 6,
      })),
    [],
  );

  return (
    <div className="relative w-full min-h-screen h-screen overflow-hidden flex items-center justify-center bg-theme-background">
      <ProgressIndicator currentStep={3} totalSteps={6} showNext={false} />

      {/* Step Progress Display - Shows granular indexing progress */}
      <div className="relative z-20 pointer-events-auto">
        <StepProgressDisplay onCancel={handleCancel} onRetry={handleRetry} />
      </div>

      <div className="absolute inset-0 from-black via-black to-black opacity-60" />

      <motion.button
        onClick={() => router.push("/")}
        className="absolute top-6 left-6 md:top-8 md:left-8 z-30 group"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <div
          className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-3 rounded-xl backdrop-blur-xl border border-white/20"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
        >
          <Home className="w-4 h-4 md:w-5 md:h-5 text-white/80 group-hover:text-white transition-colors" />
          <span className="text-xs md:text-sm font-black text-white/80 group-hover:text-white transition-colors hidden sm:inline">
            HOME
          </span>
        </div>
      </motion.button>

      <motion.div
        className="absolute top-6 right-6 md:top-8 md:right-8 z-30"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
      >
        <MuteToggle />
      </motion.div>

      <motion.button
        onClick={() => {
          playSound(SOUND_NAMES.SLIDE_WHOOSH);
          handleComplete();
        }}
        className="absolute bottom-8 right-8 md:bottom-12 md:right-12 z-30 group"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="flex flex-col items-center gap-2">
          <div className="relative">
            <motion.div
              className="absolute -inset-2 rounded-full blur-lg"
              style={{ backgroundColor: "rgba(0, 0, 0, 0.4)" }}
              animate={{
                opacity: [0.4, 0.7, 0.4],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
              }}
            />
            <div
              className="relative w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center border-2 transition-all"
              style={{
                backgroundColor: "#000000",
                borderColor: "rgba(255, 255, 255, 0.3)",
              }}
            >
              <ChevronRight className="w-6 h-6 md:w-7 md:h-7 text-white" />
            </div>
          </div>
          <span className="text-xs font-black text-white/60 group-hover:text-white/80 transition-colors">
            SKIP
          </span>
        </div>
      </motion.button>

      <div className="absolute inset-0 opacity-20">
        <motion.div
          className="w-full h-full"
          style={{
            backgroundImage: `linear-gradient(rgba(var(--color-theme-primary-rgb), 0.3) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(var(--color-theme-primary-rgb), 0.3) 1px, transparent 1px)`,
            backgroundSize: "100px 100px",
          }}
          animate={{
            backgroundPosition: ["0px 0px", "100px 100px"],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </div>

      {starConfigs.map((cfg, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full"
          style={{
            left: `${cfg.left}%`,
            top: `${cfg.top}%`,
            backgroundColor: "var(--color-theme-primary)",
          }}
          animate={{
            y: [0, -100, -200],
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: cfg.duration,
            repeat: Infinity,
            delay: cfg.delay,
          }}
        />
      ))}

      <motion.div
        className="absolute w-96 h-96 rounded-full blur-[120px]"
        style={{ backgroundColor: "rgba(var(--color-theme-primary-rgb), 0.3)" }}
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.3, 0.5, 0.3],
          x: [-50, 50, -50],
          y: [-50, 50, -50],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="absolute w-80 h-80 rounded-full blur-[100px]"
        style={{ backgroundColor: "rgba(var(--color-theme-primary-rgb), 0.2)" }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.4, 0.2],
          x: [50, -50, 50],
          y: [50, -50, 50],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <div className="relative z-10 text-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 100 }}
        >
          <motion.h1
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white mb-4 md:mb-6 tracking-tighter leading-none"
            animate={{
              textShadow: [
                `0 0 20px rgba(var(--color-theme-primary-rgb), 0.5)`,
                `0 0 40px rgba(var(--color-theme-primary-rgb), 0.8)`,
                `0 0 20px rgba(var(--color-theme-primary-rgb), 0.5)`,
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
          >
            WRAPPING
          </motion.h1>
          <motion.h2
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white/80 mb-6 md:mb-10 tracking-tight leading-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            YOUR JOURNEY
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.9 }}
            className="inline-block"
          >
            <div className="relative">
              <motion.div
                className="absolute inset-0 blur-lg md:blur-xl rounded-xl md:rounded-2xl"
                style={{
                  backgroundColor: "rgba(var(--color-theme-primary-rgb), 0.4)",
                }}
                animate={{
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
              />
              <div
                className="relative backdrop-blur-sm px-6 py-3 sm:px-8 sm:py-4 md:px-12 md:py-6 rounded-xl md:rounded-2xl"
                style={{
                  backgroundColor: "rgba(0, 0, 0, 0.5)",
                  borderColor: "rgba(var(--color-theme-primary-rgb), 0.5)",
                  borderWidth: "1px",
                }}
              >
                <h3
                  className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black"
                  style={{
                    background: `linear-gradient(to right, #ffffff, var(--color-theme-primary))`,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  STELLAR
                </h3>
              </div>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          className="mt-12 md:mt-16 w-48 sm:w-56 md:w-64 h-1 bg-white/10 rounded-full mx-auto overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          <motion.div
            className="h-full"
            style={{ backgroundColor: "var(--color-theme-primary)" }}
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 2.5, ease: "easeInOut" }}
          />
        </motion.div>
      </div>
    </div>
  );
}
