"use client";

import React, { JSX, useEffect, useRef, useState } from "react";
import { motion, useAnimation, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { Home, Share2, ChevronRight } from "lucide-react";
import Link from "next/link";
import { readStreamableValue } from "ai/rsc";
import { ProgressIndicator } from "../components/ProgressIndicator";
import { useWrapStore } from "../store/wrapStore";
import { generatePersonaDescription } from "../actions/generate-persona";

// --- Asset Mapping ---
const ARCHETYPE_DATA: Record<string, { description: string }> = {
  "The Wizard": {
    description:
      "Like Gandalf in Middle-earth, you wield DeFi magic with wisdom. The blockchain bends to your will.",
  },
};

// Removed theme system - using standard CSS variables from globals.css
const useConfetti = (color?: string) => {
  return () => {
    const end = Date.now() + 1200;
    (function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: [color ?? "var(--color-theme-primary)", "#ffffff"],
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: [color ?? "var(--color-theme-primary)", "#ffffff"],
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  };
};

type GlowingStarProps = { className?: string; delay?: number };
const GlowingStar: React.FC<GlowingStarProps> = ({
  className = "",
  delay = 0,
}) => (
  <motion.div
    initial={{ opacity: 0.2, scale: 0.8 }}
    animate={{
      opacity: [0.4, 1, 0.4],
      scale: [0.8, 1.2, 0.8],
      boxShadow: [
        "0 0 5px var(--accent)",
        "0 0 15px var(--accent-light)",
        "0 0 5px var(--accent)",
      ],
    }}
    transition={{ duration: 3, repeat: Infinity, delay }}
    className={`absolute h-1.5 w-1.5 rounded-full ${className}`}
    style={{ backgroundColor: "var(--color-theme-primary)" }}
  />
);

const useTypewriter = (text: string, speed = 30, startDelay = 0) => {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    // 1. Reset text immediately when text source changes
    setDisplayedText("");

    let i = 0;
    let timer: NodeJS.Timeout;

    const startTimeout = setTimeout(() => {
      timer = setInterval(() => {
        // Use functional update to ensure we aren't using stale 'i'
        setDisplayedText(text.slice(0, i + 1));
        i++;

        if (i >= text.length) {
          clearInterval(timer);
        }
      }, speed);
    }, startDelay);

    // 2. IMPORTANT: Cleanup function clears BOTH timeout and interval
    // This prevents multiple "ghost" typewriters from misspelling words
    return () => {
      clearTimeout(startTimeout);
      if (timer) clearInterval(timer);
    };
  }, [text, speed, startDelay]);

  return displayedText;
};

// --- Custom Social Icons (SVG paths to match brand logos exactly) ---
const SocialIcons = {
  X: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-white">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  WhatsApp: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.008-.57-.008-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  ),
  Facebook: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  ),
  LinkedIn: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-white">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9H12.76v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  ),
  Telegram: () => (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-6 h-6 text-white ml-[-2px]"
    >
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.638z" />
    </svg>
  ),
};

export default function ArchetypeReveal(): JSX.Element {
  const controls: ReturnType<typeof useAnimation> = useAnimation();
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [streamedDescription, setStreamedDescription] = useState<string>("");

  // Menu states
  const [shareOpen, setShareOpen] = useState<boolean>(false); // Share menu

  // Refs
  const shareMenuRef = useRef<HTMLDivElement | null>(null);
  const shareBtnRef = useRef<HTMLButtonElement | null>(null);

  const { result } = useWrapStore();
  const archetypeKey = result?.persona || "The Wizard";

  // Use streamed description if available, otherwise fall back to stored or default
  const data = {
    description:
      streamedDescription ||
      result?.personaDescription ||
      ARCHETYPE_DATA[archetypeKey]?.description ||
      ARCHETYPE_DATA["The Wizard"].description,
  };

  const displayedDescription = useTypewriter(data.description, 25, 2200);

  // Generate persona description on mount if not already streamed
  useEffect(() => {
    const generatePersona = async () => {
      if (streamedDescription || !result) return;

      try {
        const metrics = {
          username: result.username,
          topDapp: result.dapps?.[0]?.name,
          transactionCount: result.totalTransactions,
          favoriteChain: "Stellar", // You can extract this from result if available
          percentile: result.percentile,
          vibes: result.vibes,
          totalDapps: result.dapps?.length,
        };

        const response = await generatePersonaDescription(metrics);

        let fullText = "";
        for await (const chunk of readStreamableValue(response)) {
          if (chunk) {
            fullText += chunk;
            setStreamedDescription(fullText);
          }
        }
      } catch (error) {
        console.error("Failed to generate persona:", error);
        // Fall back to existing description
        setStreamedDescription(result?.personaDescription || data.description);
      }
    };

    generatePersona();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  // click-outside to close share menu
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (!target) return;

      // Close Share Menu
      if (
        shareOpen &&
        !shareMenuRef.current?.contains(target) &&
        !shareBtnRef.current?.contains(target)
      ) {
        setShareOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [shareOpen]);

  const triggerConfetti = useConfetti();

  useEffect(() => {
    const sequence = async () => {
      await controls.start({
        y: 0,
        scale: 1,
        opacity: 1,
        transition: { duration: 0.8, type: "spring" },
      });

      await controls.start({
        x: [0, -4, 4, -4, 4, 0],
        rotateZ: [0, -1, 1, -1, 1, 0],
        transition: { duration: 0.4 },
      });

      setIsFlipped(true);
      triggerConfetti();

      await controls.start({
        rotateY: 180,
        transition: { duration: 0.8, ease: "easeInOut" },
      });
    };
    sequence();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Share Functionality ---
  const handleShare = (platform: string) => {
    const url = window.location.href;
    const text = `I got ${archetypeKey} in the Archetype Reveal! ${data.description}`;
    let shareUrl = "";

    switch (platform) {
      case "x":
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        break;
      case "whatsapp":
        shareUrl = `https://wa.me/?text=${encodeURIComponent(text + " " + url)}`;
        break;
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case "linkedin":
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        break;
      case "telegram":
        shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, "_blank", "width=600,height=500");
    }
    setShareOpen(false);
  };

  return (
    <>
      <div
        className="w-full bg-[#020202] md:min-h-screen flex items-center justify-center selection:bg-[var(--selection-color)]"
        style={{ WebkitTapHighlightColor: "transparent" }}
      >
        {/* Progress Indicator */}
        <ProgressIndicator currentStep={5} totalSteps={6} showNext={false} />

        <div className="md:max-w-[1330px] w-96  md:w-full p-4 sm:p-12 flex flex-col items-center justify-center gap-4 sm:gap-8 overflow-hidden bg-[#020202] text-white min-h-screen sm:min-h-0">
          {/* Background Layer (ring wave + ambient) */}
          <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] sm:h-[900px] w-[500px] sm:w-[900px] rounded-full opacity-30 blur-[120px]"
              style={{ background: "var(--accent-dark)" }}
            />
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[300px] sm:h-[500px] w-[300px] sm:w-[500px] rounded-full opacity-10 blur-[80px]"
              style={{ background: "var(--accent-dark)" }}
            />

            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute left-1/2 top-1/2 rounded-full border"
                style={{
                  transform: "translate(-50%, -50%)",
                  borderColor: "var(--accent)",
                  opacity: 0.28,
                  willChange: "transform, width, height, opacity",
                }}
                initial={{ width: "0px", height: "0px", opacity: 0 }}
                animate={{
                  width: ["0px", "1800px"],
                  height: ["0px", "1800px"],
                  opacity: [0, 0.3, 0],
                }}
                transition={{
                  duration: 15,
                  repeat: Infinity,
                  delay: i * 0.8,
                  ease: "linear",
                }}
              />
            ))}

            <div className="absolute inset-0 opacity-[0.2] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
          </div>

          {/* --- TOP ROW --- */}
          {/* Home Button - Absolute positioned like share page */}
          <Link href="/">
            <motion.button
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
          </Link>

          {/* Center Title */}
          <div className="absolute top-16 md:top-20 left-1/2 -translate-x-1/2 z-30">
            <div className="relative">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-1.5 sm:gap-3 opacity-95">
                <div
                  className="h-[3px] sm:h-[4px] w-8 sm:w-14 rounded-full"
                  style={{
                    background: "var(--color-theme-primary)",
                    boxShadow: `0 6px 20px rgba(var(--color-theme-primary-rgb), 0.4)`,
                  }}
                />
                <div
                  className="h-[3px] sm:h-[4px] w-12 sm:w-20 rounded-full"
                  style={{
                    background: "var(--color-theme-primary)",
                    boxShadow: `0 6px 20px rgba(var(--color-theme-primary-rgb), 0.4)`,
                  }}
                />
                <div
                  className="h-[3px] sm:h-[4px] w-6 sm:w-10 rounded-full"
                  style={{
                    background: "var(--color-theme-primary)",
                    boxShadow: `0 6px 20px rgba(var(--color-theme-primary-rgb), 0.4)`,
                  }}
                />
              </div>
              <h3 className="relative text-xs sm:text-2xl font-bold uppercase tracking-[0.3em] sm:tracking-[0.7em] text-gray-200 mix-blend-screen whitespace-nowrap">
                The Oracle Has Spoken
              </h3>
            </div>
          </div>

          {/* --- CENTER: 3D CARD --- */}
          <div
            className="z-10 flex-1 flex items-center justify-center relative w-full"
            style={{ perspective: "1500px" }}
          >
            <GlowingStar
              className="-top-6 sm:-top-12 left-4 sm:left-10"
              delay={0.2}
            />
            <GlowingStar
              className="-top-6 sm:-top-12 right-4 sm:right-10"
              delay={0.5}
            />

            <motion.div
              initial={{ y: 40, scale: 0.95, opacity: 0, rotateY: 0 }}
              animate={controls}
              className="relative h-[200px] sm:h-[280px] w-full max-w-[800px]"
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* FRONT */}
              <div
                className="absolute inset-0 flex items-center justify-center rounded-3xl sm:rounded-[48px] border border-white/10 backdrop-blur-md"
                style={{
                  backgroundColor: "rgba(var(--color-theme-primary-rgb), 0.1)",
                  backfaceVisibility: "hidden",
                }}
              >
                <div className="text-2xl sm:text-4xl animate-pulse opacity-40">
                  🔮
                </div>
              </div>

              {/* BACK */}
              <div
                className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl sm:rounded-[48px] border overflow-hidden px-2 sm:px-4"
                style={{
                  backfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                  background: `linear-gradient(to bottom right, rgba(var(--color-theme-primary-rgb), 0.2), rgba(var(--color-theme-primary-rgb), 0.05), rgba(0,0,0,0.12))`,
                  boxShadow: `0 0 100px rgba(var(--color-theme-primary-rgb), 0.4)`,
                }}
              >
                <GlowingStar
                  className="top-1/4 left-8 sm:left-16"
                  delay={0.1}
                />
                <GlowingStar
                  className="bottom-1/4 left-12 sm:left-24"
                  delay={0.8}
                />
                <GlowingStar
                  className="top-1/3 right-10 sm:right-20"
                  delay={0.4}
                />
                <GlowingStar
                  className="bottom-1/3 right-8 sm:right-16"
                  delay={1.2}
                />

                <div
                  className="absolute top-4 sm:top-8 left-4 sm:left-8 h-6 w-6 sm:h-8 sm:w-8 border-l-[3px] sm:border-l-[4px] border-t-[3px] sm:border-t-[4px] rounded-tl-md"
                  style={{ borderColor: "var(--color-theme-primary)" }}
                />
                <div
                  className="absolute top-4 sm:top-8 right-4 sm:right-8 h-6 w-6 sm:h-8 sm:w-8 border-r-[3px] sm:border-r-[4px] border-t-[3px] sm:border-t-[4px] rounded-tr-md"
                  style={{ borderColor: "var(--color-theme-primary)" }}
                />
                <div
                  className="absolute bottom-4 sm:bottom-8 left-4 sm:left-8 h-6 w-6 sm:h-8 sm:w-8 border-l-[3px] sm:border-l-[4px] border-b-[3px] sm:border-b-[4px] rounded-bl-md"
                  style={{ borderColor: "var(--color-theme-primary)" }}
                />
                <div
                  className="absolute bottom-4 sm:bottom-8 right-4 sm:right-8 h-6 w-6 sm:h-8 sm:w-8 border-r-[3px] sm:border-r-[4px] border-b-[3px] sm:border-b-[4px] rounded-br-md"
                  style={{ borderColor: "var(--color-theme-primary)" }}
                />

                <h1
                  className="bg-clip-text text-5xl sm:text-8xl md:text-9xl font-black tracking-tighter text-transparent filter drop-shadow-[0_0_30px_rgba(0,0,0,0.5)] leading-none"
                  style={{
                    backgroundImage:
                      "linear-gradient(to bottom, #fff, var(--color-theme-primary), rgba(var(--color-theme-primary-rgb), 0.6))",
                  }}
                >
                  {archetypeKey}
                </h1>
              </div>
            </motion.div>
          </div>

          {/* Description Text Below Card */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-[200px] sm:translate-y-[240px] md:translate-y-[280px] z-10 w-[280px] sm:w-[740px] max-w-[65vw] sm:max-w-[56vw]"
            initial={{ opacity: 0, y: 30 }}
            animate={isFlipped ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 1, duration: 0.6 }}
          >
            <div className="relative backdrop-blur-sm px-6 py-4 sm:px-8 sm:py-5 md:px-12 md:py-6 rounded-xl md:rounded-2xl border border-white/5 bg-black/40 shadow-2xl">
              <p className="text-center text-sm sm:text-lg md:text-xl font-semibold leading-relaxed text-gray-100 px-4 sm:px-8 drop-shadow-md">
                {displayedDescription}
                <span className="ml-1 inline-block h-4 sm:h-6 w-0.5 sm:w-1 bg-[var(--color-theme-primary)] animate-pulse align-middle" />
              </p>
            </div>
          </motion.div>

          {/* --- BOTTOM ROW --- */}
          {/* Share Popup Implementation - Absolute positioned like share page */}
          <div className="absolute bottom-6 left-6 md:bottom-8 md:left-8 z-30">
            <div className="relative">
              <AnimatePresence>
                {" "}
                {shareOpen && (
                  <motion.div
                    ref={shareMenuRef}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    /* Added items-center to center buttons and py-6 for vertical padding */ className="absolute bottom-18 left-0 w-[200px] h-[350px] bg-[#060607] border border-[#232325] rounded-2xl shadow-2xl p-2 z-50 flex flex-col items-center justify-center gap-2"
                    style={{ boxShadow: "0 10px 40px rgba(0,0,0,0.8)" }}
                  >
                    {" "}
                    {/* X / Twitter */}{" "}
                    <button
                      onClick={() => handleShare("x")}
                      className=" flex cursor-pointer items-center pl-6 w-42 h-15 gap-3 p-2 rounded-xl bg-[#0F0F10] hover:bg-[#1a1a1c] transition-colors group"
                    >
                      {" "}
                      <div className="flex items-center gap-3 relative left-5">
                        {" "}
                        <div className="h-10 w-10 flex items-center justify-center rounded-full bg-black border border-white/10">
                          {" "}
                          <SocialIcons.X />{" "}
                        </div>{" "}
                        <span className="font-bold text-white tracking-wide">
                          {" "}
                          x{" "}
                        </span>{" "}
                      </div>{" "}
                    </button>{" "}
                    {/* WhatsApp */}{" "}
                    <button
                      onClick={() => handleShare("whatsapp")}
                      className="flex items-center cursor-pointer justify-center gap-3 p-2 w-42 h-15 rounded-xl bg-[#0F0F10] hover:bg-[#1a1a1c] transition-colors"
                    >
                      {" "}
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#25D366]">
                        {" "}
                        <SocialIcons.WhatsApp />{" "}
                      </div>{" "}
                      <span className="font-bold text-white tracking-wide">
                        {" "}
                        WhatsApp{" "}
                      </span>{" "}
                    </button>{" "}
                    {/* Facebook */}{" "}
                    <button
                      onClick={() => handleShare("facebook")}
                      className="flex items-center cursor-pointer justify-center gap-3 p-2 w-42 h-15 rounded-xl bg-[#0F0F10] hover:bg-[#1a1a1c] transition-colors"
                    >
                      {" "}
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1877F2]">
                        {" "}
                        <SocialIcons.Facebook />{" "}
                      </div>{" "}
                      <span className="font-bold text-white tracking-wide">
                        {" "}
                        Facebook{" "}
                      </span>{" "}
                    </button>{" "}
                    {/* LinkedIn */}{" "}
                    <button
                      onClick={() => handleShare("linkedin")}
                      className="flex items-center justify-center cursor-pointer gap-3 p-2 w-42 h-15 rounded-xl bg-[#0F0F10] hover:bg-[#1a1a1c] transition-colors"
                    >
                      {" "}
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0077B5]">
                        {" "}
                        <SocialIcons.LinkedIn />{" "}
                      </div>{" "}
                      <span className="font-bold text-white tracking-wide">
                        {" "}
                        LinkedIn{" "}
                      </span>{" "}
                    </button>{" "}
                    {/* Telegram */}{" "}
                    <button
                      onClick={() => handleShare("telegram")}
                      className="flex items-center cursor-pointer justify-center gap-3 p-2 w-42 h-15 rounded-xl bg-[#0F0F10] hover:bg-[#1a1a1c] transition-colors"
                    >
                      {" "}
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#229ED9]">
                        {" "}
                        <SocialIcons.Telegram />{" "}
                      </div>{" "}
                      <span className="font-bold text-white tracking-wide">
                        {" "}
                        Telegram{" "}
                      </span>{" "}
                    </button>{" "}
                  </motion.div>
                )}{" "}
              </AnimatePresence>

              <button
                ref={shareBtnRef}
                onClick={() => setShareOpen(!shareOpen)}
                className="flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full border border-white/10 bg-black/60 text-white backdrop-blur-md transition hover:bg-white/5"
              >
                <motion.div
                  animate={{ rotate: shareOpen ? 50 : 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                >
                  <Share2 className="h-5 w-5 sm:h-7 sm:w-7 cursor-pointer" />
                </motion.div>
              </button>
            </div>
          </div>

          {/* Skip/Next Button - Absolute positioned like share page */}
          <Link href="/share">
            <motion.button
              className="absolute bottom-6 right-6 md:bottom-8 md:right-8 z-30 group"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full border border-white/10 bg-black/60 text-white backdrop-blur-md transition hover:bg-white/5">
                <ChevronRight className="h-6 w-6 sm:h-9 sm:w-9" />
              </div>
            </motion.button>
          </Link>
        </div>
      </div>
    </>
  );
}
