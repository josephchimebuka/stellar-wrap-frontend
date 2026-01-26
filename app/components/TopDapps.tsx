"use client";

import { motion } from "framer-motion";
import { useWrapperStore } from "../store/useWrapperStore";
import { DappCard } from "./DappCard";

export function TopDapps() {
  const { data } = useWrapperStore();
  const topDapps = data.topDapps;

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.4,
      },
    },
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto px-8 md:px-16 flex flex-col gap-10 md:gap-14">
      {/* Header Section */}
      <motion.div
        initial={{ x: -60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{
          duration: 1,
          ease: [0.23, 1, 0.32, 1],
        }}
        className="space-y-0"
      >
        <h1 className="text-[48px] md:text-[72px] lg:text-[90px] font-black leading-[0.95] tracking-tight text-white uppercase">
          Your Top
        </h1>
        <h1
          className="text-[48px] md:text-[72px] lg:text-[90px] font-black leading-[0.95] tracking-tight uppercase"
          style={{
            background: "linear-gradient(180deg, #B4F4D1 0%, #1DB954 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            filter: "drop-shadow(0 0 30px rgba(29, 185, 84, 0.4))",
          }}
        >
          Dapps
        </h1>
      </motion.div>

      {/* Cards Row */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6 w-full"
      >
        {topDapps.slice(0, 3).map((dapp, index) => (
          <DappCard
            key={dapp.name}
            rank={index + 1}
            name={dapp.name}
            interactions={dapp.interactions}
            delay={index * 0.15}
          />
        ))}
      </motion.div>
    </div>
  );
}
