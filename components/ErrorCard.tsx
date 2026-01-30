

"use client";

import { motion } from "framer-motion";
import { AlertCircle, RotateCcw } from "lucide-react";

interface ErrorCardProps {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
}

export function ErrorCard({ error, reset, title = "Something went wrong" }: ErrorCardProps) {
  return (
    <div className="relative w-full min-h-screen h-screen overflow-hidden flex items-center justify-center bg-theme-background">
      <div className="absolute inset-0 bg-linear-to-br from-black via-black to-black opacity-60" />
      
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 max-w-md w-full mx-auto px-4"
      >
        <div
          className="backdrop-blur-xl p-8 rounded-2xl border"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            borderColor: "rgba(239, 68, 68, 0.5)",
          }}
        >
          <div className="flex flex-col items-center text-center">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
              style={{ backgroundColor: "rgba(239, 68, 68, 0.2)" }}
            >
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            
            <h2 className="text-2xl font-black text-white mb-2">{title}</h2>
            <p className="text-white/60 text-sm mb-6">
              {error?.message || "An unexpected error occurred"}
            </p>
            
            <motion.button
              onClick={reset}
              className="w-full relative group"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div
                className="px-6 py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Retry</span>
              </div>
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}