"use client";

import { motion } from "framer-motion";
import { Home, Share2, ChevronRight, Palette } from "lucide-react";
import { useRouter } from "next/navigation";
import { ReactNode } from "react";

interface StoryShellProps {
  children: ReactNode;
  activeSegment?: number;
}

export function StoryShell({ children, activeSegment = 1 }: StoryShellProps) {
  const router = useRouter();

  return (
    <div className="relative min-h-screen bg-[#0a0a0a] text-white overflow-hidden flex flex-col font-sans">
      {/* Deep space gradient - like landing page */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40" />

      {/* Hexagonal grid pattern - matching landing page */}
      <div className="absolute inset-0 opacity-[0.08]">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              id="hexagons"
              width="60"
              height="52"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M30 0 L55.98 15 L55.98 45 L30 60 L4.02 45 L4.02 15 Z"
                fill="none"
                stroke="#1DB954"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hexagons)" />
        </svg>
      </div>

      {/* Animated scan lines */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(29,185,84,0.02) 2px, rgba(29,185,84,0.02) 4px)",
        }}
        animate={{
          backgroundPosition: ["0px 0px", "0px 4px"],
        }}
        transition={{
          duration: 0.15,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* Animated glow orbs - like landing page */}
      <motion.div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] rounded-full blur-[200px] pointer-events-none"
        style={{ backgroundColor: "rgba(29, 185, 84, 0.08)" }}
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.08, 0.15, 0.08],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="absolute bottom-0 left-1/4 w-[600px] h-[400px] rounded-full blur-[150px] pointer-events-none"
        style={{ backgroundColor: "rgba(29, 185, 84, 0.06)" }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.06, 0.12, 0.06],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Top Controls */}
      <div className="relative z-50 flex justify-between items-center px-8 md:px-12 py-8">
        {/* Home Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          onClick={() => router.push("/")}
          className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-black/50 border border-white/10 backdrop-blur-xl hover:bg-white/10 hover:border-white/20 transition-all font-black text-[11px] tracking-widest uppercase text-white/80 group"
        >
          <Home className="w-4 h-4 group-hover:scale-110 transition-transform" />
          <span>Home</span>
        </motion.button>

        {/* Segmented Progress Bar */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex gap-2"
        >
          {[...Array(7)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.4 + i * 0.05 }}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i === activeSegment
                  ? "w-10 bg-[#1DB954] shadow-[0_0_12px_rgba(29,185,84,0.8)]"
                  : i < activeSegment
                    ? "w-6 bg-[#1DB954]/50"
                    : "w-6 bg-white/15"
              }`}
            />
          ))}
        </motion.div>

        {/* Palette Button */}
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="p-3 rounded-full bg-black/50 border border-[#1DB954]/30 backdrop-blur-xl hover:bg-[#1DB954]/10 hover:border-[#1DB954]/50 transition-all shadow-[0_0_20px_rgba(29,185,84,0.15)]"
        >
          <Palette className="w-5 h-5 text-[#1DB954]" />
        </motion.button>
      </div>

      {/* Main Content */}
      <main className="flex-1 relative z-10 flex flex-col items-center justify-center">
        {children}
      </main>

      {/* Bottom Controls */}
      <div className="relative z-50 flex justify-between items-center px-8 md:px-12 py-8">
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="p-4 rounded-full bg-black/50 border border-white/10 backdrop-blur-xl hover:bg-white/10 hover:border-white/20 transition-all"
        >
          <Share2 className="w-5 h-5 text-white/70" />
        </motion.button>
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="p-4 rounded-full bg-black/50 border border-white/10 backdrop-blur-xl hover:bg-white/10 hover:border-white/20 transition-all group"
        >
          <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform text-white/70" />
        </motion.button>
      </div>
    </div>
  );
}
