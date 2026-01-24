"use client";

import React, { JSX, useEffect, useRef, useState } from "react";
import { motion, useAnimation, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { Home, Share2, ChevronRight, Palette, X } from "lucide-react";
import Link from "next/link";

// --- Mock Store ---
const useWrapperStore = {
  data: {
    archetype: "The Wizard",
  },
};

// --- Asset Mapping ---
const ARCHETYPE_DATA: Record<string, { description: string }> = {
  "The Wizard": {
    description:
      "Like Gandalf in Middle-earth, you wield DeFi magic with wisdom. The blockchain bends to your will.",
  },
};

type ThemeKey = "spotify" | "neon" | "yellow" | "red" | "purple";

type Theme = {
  key: ThemeKey;
  label: string;
  accent: string;
  accentLight: string;
  accentDark: string;
  accentCard: string;
  glow: string;
  selection: string;
};

const THEMES: Record<ThemeKey, Theme> = {
  spotify: {
    key: "spotify",
    label: "Spotify Green",
    accent: "#1DB954",
    accentLight: "#4ade80",
    accentDark: "#083015",
    accentCard: "#235133",
    glow: "rgba(29,185,84,0.4)",
    selection: "rgba(29,185,84,0.3)",
  },
  neon: {
    key: "neon",
    label: "Neon Pink",
    accent: "#FF3D90",
    accentLight: "#FF80B8",
    accentDark: "#2A0612",
    accentCard: "#5A0E2A",
    glow: "rgba(255,61,144,0.35)",
    selection: "rgba(255,61,144,0.25)",
  },
  yellow: {
    key: "yellow",
    label: "Electric Yellow",
    accent: "#FFCC00",
    accentLight: "#FFE680",
    accentDark: "#2A2606",
    accentCard: "#5A4B08",
    glow: "rgba(255,204,0,0.35)",
    selection: "rgba(255,204,0,0.25)",
  },
  red: {
    key: "red",
    label: "Hot Red",
    accent: "#FF3B30",
    accentLight: "#FF6B62",
    accentDark: "#2A0606",
    accentCard: "#5A0B0B",
    glow: "rgba(255,59,48,0.35)",
    selection: "rgba(255,59,48,0.25)",
  },
  purple: {
    key: "purple",
    label: "Deep Purple",
    accent: "#8A2BE2",
    accentLight: "#B892FF",
    accentDark: "#120615",
    accentCard: "#3E1552",
    glow: "rgba(138,43,226,0.35)",
    selection: "rgba(138,43,226,0.25)",
  },
};

const THEME_KEY = "app-theme-v1";

const setDocumentThemeVars = (t: Theme): void => {
  const root = document.documentElement;
  root.style.setProperty("--accent", t.accent);
  root.style.setProperty("--accent-light", t.accentLight);
  root.style.setProperty("--accent-dark", t.accentDark);
  root.style.setProperty("--accent-card", t.accentCard);
  root.style.setProperty("--accent-glow", t.glow);
  root.style.setProperty("--selection-color", t.selection);
};

const useConfetti = (color?: string) => {
  return () => {
    const end = Date.now() + 1200;
    (function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: [color ?? "#1DB954", "#ffffff"],
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: [color ?? "#1DB954", "#ffffff"],
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
    className={`absolute h-1.5 w-1.5 rounded-full bg-[var(--accent-light)] ${className}`}
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

  // theme state + dropdown
  const [themeKey, setThemeKey] = useState<ThemeKey>(() => {
    if (typeof window === "undefined") return "spotify";
    return (localStorage.getItem(THEME_KEY) as ThemeKey) || "spotify";
  });

  // Menu states
  const [open, setOpen] = useState<boolean>(false); // Palette menu
  const [shareOpen, setShareOpen] = useState<boolean>(false); // Share menu

  // Refs
  const menuRef = useRef<HTMLDivElement | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const shareMenuRef = useRef<HTMLDivElement | null>(null);
  const shareBtnRef = useRef<HTMLButtonElement | null>(null);

  const archetypeKey = useWrapperStore.data.archetype;
  const data = ARCHETYPE_DATA[archetypeKey] || ARCHETYPE_DATA["The Wizard"];
  const displayedDescription = useTypewriter(data.description, 25, 2200);

  // apply theme on mount & when changed
  useEffect(() => {
    const t = THEMES[themeKey] ?? THEMES.spotify;
    setDocumentThemeVars(t);
    if (typeof window !== "undefined")
      localStorage.setItem(THEME_KEY, themeKey);
  }, [themeKey]);

  // click-outside to close menus
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (!target) return;

      // Close Palette Menu
      if (
        open &&
        !menuRef.current?.contains(target) &&
        !btnRef.current?.contains(target)
      ) {
        setOpen(false);
      }

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
  }, [open, shareOpen]);

  const triggerConfetti = useConfetti(THEMES[themeKey].accent);

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

  // Handler when a theme is chosen
  const handleChooseTheme = (key: ThemeKey): void => {
    setThemeKey(key);
    setOpen(false);
    const t = THEMES[key];
    setTimeout(() => {
      confetti({
        particleCount: 18,
        spread: 60,
        origin: { y: 0.5 },
        colors: [t.accent, "#ffffff"],
      });
    }, 80);
  };

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
          <div className="z-50 flex w-full items-center justify-between mt-2 relative px-2 sm:px-0">
            <Link href="/">
              <button className="flex cursor-pointer items-center gap-1 sm:gap-2 justify-center rounded-xl border border-white/10 h-8 w-16 sm:h-10 sm:w-24 bg-black/60 text-[9px] sm:text-[11px] font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em] backdrop-blur-xl transition hover:bg-white/5">
                <Home className="h-3 w-3 sm:h-4 sm:w-4" />{" "}
                <span className="hidden sm:inline">HOME</span>
                <span className="sm:hidden">HOME</span>
              </button>
            </Link>

            <div className="relative">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-1.5 sm:gap-3 opacity-95">
                <div
                  className="h-[3px] sm:h-[4px] w-8 sm:w-14 rounded-full"
                  style={{
                    background: "var(--accent)",
                    boxShadow: "0 6px 20px var(--accent-glow)",
                  }}
                />
                <div
                  className="h-[3px] sm:h-[4px] w-12 sm:w-20 rounded-full"
                  style={{
                    background: "var(--accent)",
                    boxShadow: "0 6px 20px var(--accent-glow)",
                  }}
                />
                <div
                  className="h-[3px] sm:h-[4px] w-6 sm:w-10 rounded-full"
                  style={{
                    background: "var(--accent)",
                    boxShadow: "0 6px 20px var(--accent-glow)",
                  }}
                />
              </div>
              <h3 className="relative text-xs sm:text-2xl font-bold uppercase tracking-[0.3em] sm:tracking-[0.7em] text-gray-200 mix-blend-screen whitespace-nowrap">
                The Oracle Has Spoken
              </h3>
            </div>

            {/* Palette Button + Dropdown */}
            <div className="relative">
              <button
                ref={btnRef}
                onClick={() => setOpen((s) => !s)}
                className="flex h-10 w-10 sm:h-14 sm:w-14 cursor-pointer items-center justify-center rounded-full border bg-[rgba(0,0,0,0.06)] transition hover:scale-105"
                style={{
                  borderColor: "var(--accent)",
                  borderWidth: open ? "2px" : "1px",
                  background: "rgba(0,0,0,0.06)",
                  boxShadow: open
                    ? "0 0 60px var(--accent-glow)"
                    : "0 0 40px var(--accent-glow)",
                  transition: "box-shadow 160ms ease, border-width 160ms ease",
                }}
                aria-haspopup="true"
                aria-expanded={open}
                title={open ? "Close themes" : "Choose theme"}
              >
                {open ? (
                  <X className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                ) : (
                  <Palette className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                )}
              </button>

              {open && (
                <div
                  ref={menuRef}
                  className="absolute right-0 mt-3 w-48 sm:w-52 mx-auto rounded-2xl border bg-[#060607]/90 backdrop-blur-xl p-3 sm:p-4 z-9999!"
                  style={{
                    borderColor: "rgba(255,255,255,0.04)",
                    boxShadow: "0 12px 40px rgba(0,0,0,0.6)",
                  }}
                  role="menu"
                  aria-label="Choose your vibe"
                >
                  <div className="px-2 sm:px-3 pb-2 sm:pb-3 mt-3 sm:mt-4 h-8 sm:h-10 flex justify-center items-center">
                    <div className="text-[10px] sm:text-[11px] text-center font-bold tracking-wider uppercase text-gray-200">
                      CHOOSE YOUR VIBE
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-3 sm:gap-4 px-1">
                    {Object.values(THEMES).map((t) => {
                      const active = t.key === themeKey;
                      return (
                        <button
                          key={t.key}
                          onClick={() => handleChooseTheme(t.key)}
                          className="w-40 sm:w-44 mx-auto flex items-center gap-3 sm:gap-4 cursor-pointer rounded-xl p-2.5 sm:p-3 transition"
                          style={{
                            background: active
                              ? `linear-gradient(180deg, rgba(255,255,255,0.02), rgba(0,0,0,0.12))`
                              : "rgba(255,255,255,0.02)",
                            border: active
                              ? `2px solid var(--accent)`
                              : "1px solid rgba(255,255,255,0.03)",
                            boxShadow: active
                              ? `0 8px 30px ${t.glow}`
                              : "inset 0 1px 0 rgba(255,255,255,0.02)",
                            paddingLeft: 12,
                            paddingRight: 12,
                            paddingBottom: 10,
                            paddingTop: 10,
                          }}
                          role="menuitem"
                          aria-checked={active}
                        >
                          <div
                            className="h-7 w-7 sm:h-8 sm:w-8 rounded-full flex-shrink-0"
                            style={{
                              background: t.accent,
                              boxShadow: `0 8px 30px ${t.glow}`,
                              border: active
                                ? `1px solid rgba(0,0,0,0.28)`
                                : `1px solid rgba(0,0,0,0.25)`,
                            }}
                          />
                          <div className="flex-1 text-left">
                            <div className="text-xs sm:text-sm font-semibold text-gray-100">
                              {t.label}
                            </div>
                          </div>

                          {active ? (
                            <div className="flex items-center justify-center w-5 sm:w-6">
                              <div
                                className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full"
                                style={{
                                  background: "var(--accent)",
                                  boxShadow: `0 0 10px var(--accent-glow)`,
                                  border: "1px solid rgba(255,255,255,0.04)",
                                }}
                              />
                            </div>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>

                  <div className="w-44 sm:w-48 text-[11px] sm:text-[12px] text-gray-400 h-12 sm:h-14 flex items-center justify-center text-center">
                    Your theme persists across sessions
                  </div>
                </div>
              )}
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
                className="absolute inset-0 flex items-center justify-center rounded-3xl sm:rounded-[48px] border border-white/10 bg-[var(--accent-card)]/20 backdrop-blur-md"
                style={{ backfaceVisibility: "hidden" }}
              >
                <div className="text-2xl sm:text-4xl animate-pulse opacity-40">
                  🔮
                </div>
              </div>

              {/* BACK */}
              <div
                className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl sm:rounded-[48px] border bg-gradient-to-br from-[var(--accent-card)] via-[var(--accent-dark)] to-[rgba(0,0,0,0.12)] overflow-hidden px-2 sm:px-4"
                style={{
                  backfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                  boxShadow: `0 0 100px var(--accent-glow)`,
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
                  style={{ borderColor: "var(--accent-light)" }}
                />
                <div
                  className="absolute top-4 sm:top-8 right-4 sm:right-8 h-6 w-6 sm:h-8 sm:w-8 border-r-[3px] sm:border-r-[4px] border-t-[3px] sm:border-t-[4px] rounded-tr-md"
                  style={{ borderColor: "var(--accent-light)" }}
                />
                <div
                  className="absolute bottom-4 sm:bottom-8 left-4 sm:left-8 h-6 w-6 sm:h-8 sm:w-8 border-l-[3px] sm:border-l-[4px] border-b-[3px] sm:border-b-[4px] rounded-bl-md"
                  style={{ borderColor: "var(--accent-light)" }}
                />
                <div
                  className="absolute bottom-4 sm:bottom-8 right-4 sm:right-8 h-6 w-6 sm:h-8 sm:w-8 border-r-[3px] sm:border-r-[4px] border-b-[3px] sm:border-b-[4px] rounded-br-md"
                  style={{ borderColor: "var(--accent-light)" }}
                />

                <h1
                  className="bg-clip-text text-5xl sm:text-8xl md:text-9xl font-black tracking-tighter text-transparent filter drop-shadow-[0_0_30px_rgba(0,0,0,0.5)] leading-none"
                  style={{
                    backgroundImage:
                      "linear-gradient(to bottom, #fff, var(--accent-light), var(--accent-card))",
                  }}
                >
                  {archetypeKey}
                </h1>
              </div>
            </motion.div>
          </div>

          {/* --- BOTTOM ROW --- */}
          <div className="z-30 flex w-full items-center justify-between mb-4 sm:mb-30 relative px-2 sm:px-0">
            {/* Share Popup Implementation */}
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

            <motion.div
              className="w-[280px] sm:w-[740px] max-w-[65vw] sm:max-w-[56vw] min-h-[140px] sm:min-h-[160px] rounded-2xl border border-white/5 bg-black/40 backdrop-blur-2xl relative flex items-center justify-center shadow-2xl"
              initial={{ opacity: 0, y: 30 }}
              animate={isFlipped ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.8, duration: 0.6 }}
            >
              <GlowingStar
                className="top-4 sm:top-6 left-6 sm:left-12"
                delay={0.3}
              />
              <GlowingStar
                className="top-6 sm:top-10 right-10 sm:right-20"
                delay={0.9}
              />
              <GlowingStar
                className="bottom-6 sm:bottom-10 left-1/4"
                delay={1.5}
              />
              <GlowingStar
                className="bottom-4 sm:bottom-6 right-6 sm:right-12"
                delay={0.1}
              />
              <GlowingStar className="top-1/2 right-4 sm:right-8" delay={2.1} />

              <p className="text-center text-sm sm:text-2xl font-semibold leading-[1.5] text-gray-100 px-4 sm:px-14 drop-shadow-md max-w-[88%]">
                {displayedDescription}
                <span className="ml-1 inline-block h-4 sm:h-6 w-0.5 sm:w-1 bg-[var(--accent)] animate-pulse align-middle" />
              </p>
            </motion.div>
            <Link href="/share">
              <button className="flex h-12 cursor-pointer w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full border border-white/10 bg-black/60 text-white backdrop-blur-md transition hover:bg-white/5">
                <ChevronRight className="h-6 w-6 sm:h-9 sm:w-9" />
              </button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
