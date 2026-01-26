"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useWrapperStore } from "../store/useWrapperStore";

export default function LoadingPage() {
  const router = useRouter();
  const { address, isConnected } = useWrapperStore();
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState(
    "Connecting to Stellar network...",
  );

  useEffect(() => {
    
    if (!isConnected || !address) {
      router.push("/connect");
      return;
    }

 
    const steps = [
      { text: "Connecting to Stellar network...", duration: 1000 },
      { text: "Fetching your transaction history...", duration: 1500 },
      { text: "Analyzing your Soroban contracts...", duration: 1200 },
      { text: "Discovering your NFT activity...", duration: 1000 },
      { text: "Calculating your DeFi stats...", duration: 1300 },
      { text: "Preparing your 2026 wrap...", duration: 1000 },
    ];

    let currentStep = 0;
    let currentProgress = 0;

    const progressInterval = setInterval(() => {
      if (currentStep < steps.length) {
        const step = steps[currentStep];
        setLoadingText(step.text);

        // Increment progress
        currentProgress += 100 / steps.length;
        setProgress(Math.min(currentProgress, 100));

        currentStep++;
      } else {
        clearInterval(progressInterval);
        // Navigate to results page
        setTimeout(() => {
          router.push("/results");
        }, 800);
      }
    }, 1200);

    return () => clearInterval(progressInterval);
  }, [isConnected, address, router]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-bg-primary">
      {/* Animated Gradient Background */}
      <div className="fixed inset-0 bg-gradient-subtle opacity-30 pointer-events-none animate-pulse" />

      {/* Main Content */}
      <main className="relative z-20 flex min-h-screen flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-2xl mx-auto space-y-12">
          {/* Logo/Title */}
          <div className="text-center space-y-4 animate-fade-in">
            <h1 className="text-6xl sm:text-7xl font-black">
              <span className="gradient-text">STELLAR</span>
              <span className="block text-text-primary">WRAP</span>
            </h1>
          </div>

          {/* Loading Animation */}
          <div className="space-y-8 animate-fade-in-up delay-200">
            {/* Spinner */}
            <div className="flex justify-center">
              <div className="relative w-24 h-24">
                <div className="absolute inset-0 border-4 border-bg-elevated rounded-full"></div>
                <div className="absolute inset-0 border-4 border-accent-primary border-t-transparent rounded-full animate-spin"></div>
                <div
                  className="absolute inset-2 border-4 border-accent-secondary border-b-transparent rounded-full animate-spin"
                  style={{
                    animationDirection: "reverse",
                    animationDuration: "1.5s",
                  }}
                ></div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-3">
              <div className="w-full h-2 bg-bg-elevated rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-primary transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-center text-text-secondary text-sm">
                {Math.round(progress)}% Complete
              </p>
            </div>

            {/* Loading Text */}
            <div className="text-center">
              <p className="text-xl font-medium text-text-primary animate-pulse">
                {loadingText}
              </p>
            </div>

            {/* Connected Wallet Info */}
            {address && (
              <div className="mt-8 p-4 bg-bg-elevated border border-muted rounded-xl">
                <p className="text-xs text-text-muted text-center mb-1">
                  Connected Wallet
                </p>
                <p className="text-sm font-mono text-accent-primary text-center truncate">
                  {address}
                </p>
              </div>
            )}
          </div>

          {/* Fun Facts */}
          <div className="text-center space-y-2 animate-fade-in delay-600">
            <p className="text-sm text-text-muted italic">
              Did you know? The Stellar network processes transactions in 3-5
              seconds! ⚡
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
