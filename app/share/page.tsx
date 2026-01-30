"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Share2 } from "lucide-react";
import { mockData } from "@/app/data/mockData";
import { ProgressIndicator } from "@/app/components/ProgressIndicator";
import { ShareCard } from "../components/ShareCard";
import { ShareImageCard } from "../components/ShareImageCard";
import { useTheme, themeColors } from "../context/ThemeContext";
import {
  XIcon,
  WhatsAppIcon,
  FacebookIcon,
  LinkedInIcon,
  TelegramIcon,
} from "../components/SocialIcons";

const SocialIcons = {
  X: XIcon,
  WhatsApp: WhatsAppIcon,
  Facebook: FacebookIcon,
  LinkedIn: LinkedInIcon,
  Telegram: TelegramIcon,
};

export default function ShareCardPage() {
  const [shareOpen, setShareOpen] = useState<boolean>(false);
  const shareMenuRef = useRef<HTMLDivElement | null>(null);
  const shareBtnRef = useRef<HTMLButtonElement | null>(null);
  const shareImageRef = useRef<HTMLDivElement>(null!);
  const { color } = useTheme();

  // Get computed theme color from CSS variable
  const [themeColor] = useState<string>(() => {
    if (typeof window === "undefined") return themeColors.green.primary;

    const tempDiv = document.createElement("div");
    tempDiv.style.color = "var(--color-theme-primary)";
    document.body.appendChild(tempDiv);

    const computedColor = window.getComputedStyle(tempDiv).color;
    document.body.removeChild(tempDiv);

    return computedColor || themeColors[color].primary;
  });

  // --- Share Functionality ---
  const handleShare = (platform: string) => {
    const url = window.location.href;
    const text = `Check out my Stellar Wrapped 2026! ${mockData.transactions} transactions, ${mockData.persona} persona, ${mockData.vibes[0].percentage}% ${mockData.vibes[0].label}! 🎉 #StellarWrapped`;
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

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
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

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Off-screen ShareImageCard for html2canvas export */}
      <div
        ref={shareImageRef}
        className="absolute"
        style={{ left: "-9999px", top: 0 }}
      >
        <ShareImageCard themeColor={themeColor} />
      </div>

      <ShareCard
        username={mockData.username}
        transactions={mockData.transactions}
        persona={mockData.persona}
        topVibe={mockData.vibes[0].label}
        vibePercentage={mockData.vibes[0].percentage}
        shareImageRef={shareImageRef}
      />

      <ProgressIndicator currentStep={6} totalSteps={6} showNext={false} />

      <div className="absolute bottom-6 left-6 z-30">
        <div className="relative">
          <AnimatePresence>
            {shareOpen && (
              <motion.div
                ref={shareMenuRef}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute bottom-18 left-0 w-[200px] h-[350px] bg-[#060607] border border-[#232325] rounded-2xl shadow-2xl p-2 z-50 flex flex-col items-center justify-center gap-2"
                style={{ boxShadow: "0 10px 40px rgba(0,0,0,0.8)" }}
              >
                {/* X / Twitter */}
                <button
                  onClick={() => handleShare("x")}
                  className="flex cursor-pointer items-center pl-4 w-42 h-15 gap-3 p-2 rounded-xl bg-[#0F0F10] hover:bg-[#1a1a1c] transition-colors group"
                >
                  <div className="h-10 w-10 flex items-center justify-center rounded-full bg-black border border-white/10">
                    <SocialIcons.X />
                  </div>
                  <span className="font-bold text-white tracking-wide">x</span>
                </button>

                <button
                  onClick={() => handleShare("x")}
                  className="flex cursor-pointer items-center pl-4 w-42 h-15 gap-3 p-2 rounded-xl bg-[#0F0F10] hover:bg-[#1a1a1c] transition-colors group"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#25D366]">
                    <SocialIcons.WhatsApp />
                  </div>
                  <span className="font-bold text-white tracking-wide">
                    WhatsApp
                  </span>
                </button>

                <button
                  onClick={() => handleShare("facebook")}
                  className="flex items-center cursor-pointer pl-4 gap-3 p-2 w-42 h-15 rounded-xl bg-[#0F0F10] hover:bg-[#1a1a1c] transition-colors"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1877F2]">
                    <SocialIcons.Facebook />
                  </div>
                  <span className="font-bold text-white tracking-wide">
                    Facebook
                  </span>
                </button>

                <button
                  onClick={() => handleShare("linkedin")}
                  className="flex items-center pl-4 cursor-pointer gap-3 p-2 w-42 h-15 rounded-xl bg-[#0F0F10] hover:bg-[#1a1a1c] transition-colors"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0077B5]">
                    <SocialIcons.LinkedIn />
                  </div>
                  <span className="font-bold text-white tracking-wide">
                    LinkedIn
                  </span>
                </button>

                <button
                  onClick={() => handleShare("telegram")}
                  className="flex items-center cursor-pointer pl-4 gap-3 p-2 w-42 h-15 rounded-xl bg-[#0F0F10] hover:bg-[#1a1a1c] transition-colors"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#229ED9]">
                    <SocialIcons.Telegram />
                  </div>
                  <span className="font-bold text-white tracking-wide">
                    Telegram
                  </span>
                </button>
              </motion.div>
            )}
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
    </div>
  );
}
