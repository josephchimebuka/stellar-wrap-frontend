"use client"

import { motion } from 'framer-motion';
import { Box, Database } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ColorToggle } from './ColorToggle';
import { NetworkToggle } from './NetworkToggle';
import { useWrapStore, WrapPeriod } from '../store/wrapStore';

export function LandingPage() {
  const router = useRouter();
  const { period, setPeriod, reset } = useWrapStore();
  const [selectedPeriod, setSelectedPeriod] = useState<WrapPeriod>(period);
  
  const handleStart = () => {
    // Reset any existing wrap data when starting a new session,
    // but preserve the currently selected period.
    reset();
    setPeriod(selectedPeriod);
    router.push('/connect');
  };

  return (
    <div className="relative w-full min-h-screen h-screen overflow-hidden bg-theme-background">
      {/* Deep space gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/20" />
      
      {/* Hexagonal grid pattern */}
      <div className="absolute inset-0 opacity-20">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="hexagons" width="100" height="86.6" patternUnits="userSpaceOnUse">
              <path d="M50 0 L93.3 25 L93.3 75 L50 100 L6.7 75 L6.7 25 Z" fill="none" stroke="var(--color-theme-primary)" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hexagons)" />
        </svg>
      </div>

      {/* Animated scan lines */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(var(--color-theme-primary-rgb), 0.03) 2px, rgba(var(--color-theme-primary-rgb), 0.03) 4px)',
        }}
        animate={{
          backgroundPosition: ['0px 0px', '0px 4px'],
        }}
        transition={{
          duration: 0.1,
          repeat: Infinity,
          ease: "linear"
        }}
      />

      {/* Multiple layered glows for depth */}
      <motion.div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[800px] rounded-full blur-[200px]"
        style={{ backgroundColor: 'rgba(var(--color-theme-primary-rgb), 0.1)' }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      <motion.div
        className="absolute bottom-0 left-1/4 w-[800px] h-[600px] rounded-full blur-[180px]"
        style={{ backgroundColor: 'rgba(var(--color-theme-primary-rgb), 0.08)' }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.15, 0.1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      <motion.div
        className="absolute top-1/3 right-1/4 w-[600px] h-[600px] rounded-full blur-[160px]"
        style={{ backgroundColor: 'rgba(var(--color-theme-primary-rgb), 0.06)' }}
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.08, 0.12, 0.08],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Floating blockchain nodes (geometric shapes) */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute hidden md:block"
          style={{
            left: `${10 + i * 12}%`,
            top: `${20 + (i % 3) * 25}%`,
          }}
          animate={{
            y: [0, -30, 0],
            rotate: [0, 180, 360],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: 8 + i * 2,
            repeat: Infinity,
            delay: i * 0.5,
          }}
        >
          <div 
            className="w-12 h-12 md:w-20 md:h-20"
            style={{
              border: '1px solid rgba(var(--color-theme-primary-rgb), 0.2)',
              transform: 'rotate(45deg)',
              background: 'linear-gradient(135deg, rgba(var(--color-theme-primary-rgb), 0.05), transparent)',
            }}
          />
        </motion.div>
      ))}

      {/* Blockchain connection lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20 hidden md:block">
        {[...Array(6)].map((_, i) => {
          const x1 = 20 + i * 15;
          const y1 = 30 + (i % 2) * 40;
          const x2 = 30 + i * 12;
          const y2 = 60 + (i % 2) * 20;
          return (
            <motion.line
              key={`line-${i}`}
              x1={`${x1}%`}
              y1={`${y1}%`}
              x2={`${x2}%`}
              y2={`${y2}%`}
              stroke="var(--color-theme-primary)"
              strokeWidth="2"
              strokeDasharray="5,5"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ 
                pathLength: [0, 1, 0],
                opacity: [0, 0.5, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                delay: i * 0.5,
              }}
            />
          );
        })}
      </svg>

      {/* Animated block chain visualization */}
      <div className="absolute left-4 md:left-12 top-1/2 -translate-y-1/2 hidden sm:block">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={`block-${i}`}
            className="mb-2 md:mb-4"
            initial={{ x: -100, opacity: 0 }}
            animate={{ 
              x: 0, 
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              delay: i * 0.3,
              duration: 3,
              repeat: Infinity,
            }}
          >
            <div className="w-10 h-10 md:w-16 md:h-16 border-2 rounded-lg flex items-center justify-center"
              style={{ 
                borderColor: 'rgba(var(--color-theme-primary-rgb), 0.4)',
                backgroundColor: 'rgba(var(--color-theme-primary-rgb), 0.1)',
              }}
            >
              <Box className="w-5 h-5 md:w-8 md:h-8" style={{ color: 'var(--color-theme-primary)' }} />
            </div>
            {i < 4 && (
              <motion.div 
                className="w-0.5 h-2 md:h-4 mx-auto"
                style={{ backgroundColor: 'var(--color-theme-primary)' }}
                animate={{
                  opacity: [0.3, 1, 0.3],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.3,
                }}
              />
            )}
          </motion.div>
        ))}
      </div>

      {/* Animated transaction flow on right side */}
      <div className="absolute right-4 md:right-12 top-1/4 hidden sm:block">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={`tx-${i}`}
            className="mb-1 md:mb-2"
            initial={{ x: 100, opacity: 0 }}
            animate={{ 
              x: [100, 0, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              delay: i * 0.4,
              duration: 4,
              repeat: Infinity,
            }}
          >
            <div className="flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1 md:py-2 rounded-lg"
              style={{ 
                backgroundColor: 'rgba(var(--color-theme-primary-rgb), 0.1)',
                border: '1px solid rgba(var(--color-theme-primary-rgb), 0.3)',
              }}
            >
              <Database className="w-3 h-3 md:w-4 md:h-4" style={{ color: 'var(--color-theme-primary)' }} />
              <div className="w-12 md:w-20 h-1 rounded" style={{ backgroundColor: 'rgba(var(--color-theme-primary-rgb), 0.5)' }} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center px-8">
        
        {/* Top HUD bar */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="absolute top-4 md:top-8 left-0 right-0 flex items-center justify-center gap-3 md:gap-8"
        >
          <div className="flex items-center gap-3 md:gap-8">
            <div className="flex items-center gap-2">
              <motion.div
                className="w-2 h-2 md:w-3 md:h-3 rounded-full"
                style={{ backgroundColor: 'var(--color-theme-primary)' }}
                animate={{
                  opacity: [0.5, 1, 0.5],
                  boxShadow: [
                    `0 0 10px rgba(var(--color-theme-primary-rgb), 0.5)`,
                    `0 0 20px rgba(var(--color-theme-primary-rgb), 1)`,
                    `0 0 10px rgba(var(--color-theme-primary-rgb), 0.5)`,
                  ],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
              />
              <span className="text-xs md:text-sm font-black tracking-[0.2em] md:tracking-[0.3em] text-white">LIVE</span>
            </div>
            <div className="h-6 md:h-8 w-px bg-white/10" />
            <span className="text-xs md:text-sm font-black tracking-wider md:tracking-widest text-white/50">2026.WRAPPED</span>
          </div>
        </motion.div>

        {/* Color Toggle - Fixed Position */}
        <ColorToggle />

        {/* Network Toggle - Fixed Position */}
        <NetworkToggle />

        {/* Dramatic title with illustration */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, type: "spring", stiffness: 100 }}
          className="relative mb-4 md:mb-6"
        >
          {/* Background title layer (glitch effect) */}
          <motion.div
            className="absolute inset-0 hidden md:block"
            animate={{
              x: [0, -2, 2, -2, 0],
              opacity: [0, 0.3, 0, 0.3, 0],
            }}
            transition={{
              duration: 0.3,
              repeat: Infinity,
              repeatDelay: 5,
            }}
          >
            <h1 
              className="text-[200px] font-black leading-none tracking-tighter text-center"
              style={{ color: 'rgba(var(--color-theme-primary-rgb), 0.3)' }}
            >
              WRAPPED
            </h1>
          </motion.div>

          {/* Main title */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 100 }}
          >
            <h1 
              className="relative text-5xl sm:text-7xl md:text-[100px] lg:text-[140px] font-black leading-none tracking-tighter text-center"
              style={{
                background: `linear-gradient(180deg, #ffffff 0%, var(--color-theme-primary) 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: `drop-shadow(0 0 40px rgba(var(--color-theme-primary-rgb), 0.5))`,
              }}
            >
              WRAPPED
            </h1>
          </motion.div>

          {/* Foreground accent lines */}
          <motion.div
            className="absolute -left-16 md:-left-32 top-1/2 -translate-y-1/2 w-12 md:w-24 h-1 hidden sm:block"
            style={{ background: `linear-gradient(to right, transparent, var(--color-theme-primary))` }}
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ delay: 0.8 }}
          />
          <motion.div
            className="absolute -right-16 md:-right-32 top-1/2 -translate-y-1/2 w-12 md:w-24 h-1 hidden sm:block"
            style={{ background: `linear-gradient(to left, transparent, var(--color-theme-primary))` }}
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ delay: 0.8 }}
          />
        </motion.div>

        {/* Stellar badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.9 }}
          className="inline-block mb-4 md:mb-8"
        >
          <div className="relative">
            <motion.div
              className="absolute inset-0 blur-xl rounded-2xl"
              style={{ backgroundColor: 'rgba(var(--color-theme-primary-rgb), 0.4)' }}
              animate={{
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
              }}
            />
            <div className="relative backdrop-blur-sm px-6 py-3 md:px-12 md:py-6 rounded-xl md:rounded-2xl"
              style={{ 
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                borderColor: 'rgba(var(--color-theme-primary-rgb), 0.5)',
                borderWidth: '1px',
              }}
            >
              <h3 
                className="text-3xl sm:text-4xl md:text-5xl font-black"
                style={{
                  background: `linear-gradient(to right, #ffffff, var(--color-theme-primary))`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                STELLAR
              </h3>
            </div>
          </div>
        </motion.div>

        {/* Catchy tagline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className="max-w-3xl text-center mb-6 md:mb-12 px-4"
        >
          <p className="text-sm sm:text-lg md:text-xl font-bold text-white/80 mb-2 leading-relaxed">
            Your blockchain story told like never before.
          </p>
          <p className="text-xs sm:text-sm md:text-base font-bold text-white/50 leading-relaxed">
            Dive into an electrifying visualization of your on-chain activity, discover your crypto persona, and celebrate your journey through the Stellar network.
          </p>
        </motion.div>

        {/* Period selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3 }}
          className="mb-6 md:mb-10"
        >
          <div className="flex items-center gap-1 backdrop-blur-xl rounded-xl md:rounded-2xl p-1 md:p-2 border border-white/10"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          >
            {(['weekly', 'monthly', 'yearly'] as const).map((periodOption) => (
              <motion.button
                key={periodOption}
                onClick={() => setSelectedPeriod(periodOption)}
                className="relative px-4 py-2 sm:px-6 sm:py-3 md:px-8 md:py-4 rounded-lg md:rounded-xl font-black tracking-tight text-sm sm:text-base md:text-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                {selectedPeriod === periodOption && (
                  <motion.div
                    layoutId="period-bg"
                    className="absolute inset-0 rounded-lg md:rounded-xl"
                    style={{ backgroundColor: 'var(--color-theme-primary)' }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <span className={`relative z-10 uppercase ${
                  selectedPeriod === periodOption ? 'text-black' : 'text-white/50'
                }`}>
                  {periodOption}
                </span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5 }}
        >
          <motion.button
            onClick={handleStart}
            className="relative group"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Button glow effect */}
            <motion.div
              className="absolute -inset-2 md:-inset-4 rounded-xl md:rounded-2xl blur-xl md:blur-2xl"
              style={{ backgroundColor: 'rgba(var(--color-theme-primary-rgb), 0.4)' }}
              animate={{
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                }}
            />
            
            {/* Button border animation */}
            <div className="relative overflow-hidden rounded-xl md:rounded-2xl p-[2px]"
              style={{ background: 'var(--color-theme-primary)' }}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                animate={{
                  x: ['-200%', '200%'],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 1,
                }}
              />
              
              <div className="relative px-8 py-4 sm:px-12 sm:py-6 md:px-20 md:py-8 rounded-xl md:rounded-2xl bg-theme-background"
              >
                <div className="flex items-center gap-3 sm:gap-4 md:gap-6">
                  <div className="flex flex-col items-start">
                    <span className="text-[10px] sm:text-xs font-black tracking-[0.15em] sm:tracking-[0.2em] mb-1 text-white/50">INITIALIZE</span>
                    <span className="text-xl sm:text-3xl md:text-4xl font-black tracking-tight text-white">START WRAP</span>
                  </div>
                  <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <svg className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10" viewBox="0 0 40 40" fill="none">
                      <path d="M15 10L25 20L15 30" stroke="var(--color-theme-primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.button>
        </motion.div>
      </div>

      {/* Corner brackets (HUD elements) */ }
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ delay: 1 }}
        className="absolute top-0 left-0 w-20 h-20 md:w-32 md:h-32"
      >
        <div className="absolute top-4 left-4 md:top-8 md:left-8 w-10 md:w-16 h-0.5" style={{ background: `linear-gradient(to right, var(--color-theme-primary), transparent)` }} />
        <div className="absolute top-4 left-4 md:top-8 md:left-8 w-0.5 h-10 md:h-16" style={{ background: `linear-gradient(to bottom, var(--color-theme-primary), transparent)` }} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ delay: 1 }}
        className="absolute top-0 right-0 w-20 h-20 md:w-32 md:h-32"
      >
        <div className="absolute top-4 right-4 md:top-8 md:right-8 w-10 md:w-16 h-0.5" style={{ background: `linear-gradient(to left, var(--color-theme-primary), transparent)` }} />
        <div className="absolute top-4 right-4 md:top-8 md:right-8 w-0.5 h-10 md:h-16" style={{ background: `linear-gradient(to bottom, var(--color-theme-primary), transparent)` }} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ delay: 1 }}
        className="absolute bottom-0 left-0 w-20 h-20 md:w-32 md:h-32"
      >
        <div className="absolute bottom-4 left-4 md:bottom-8 md:left-8 w-10 md:w-16 h-0.5" style={{ background: `linear-gradient(to right, var(--color-theme-primary), transparent)` }} />
        <div className="absolute bottom-4 left-4 md:bottom-8 md:left-8 w-0.5 h-10 md:h-16" style={{ background: `linear-gradient(to top, var(--color-theme-primary), transparent)` }} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ delay: 1 }}
        className="absolute bottom-0 right-0 w-20 h-20 md:w-32 md:h-32"
      >
        <div className="absolute bottom-4 right-4 md:bottom-8 md:right-8 w-10 md:w-16 h-0.5" style={{ background: `linear-gradient(to left, var(--color-theme-primary), transparent)` }} />
        <div className="absolute bottom-4 right-4 md:bottom-8 md:right-8 w-0.5 h-10 md:h-16" style={{ background: `linear-gradient(to top, var(--color-theme-primary), transparent)` }} />
      </motion.div>
    </div>
  );
}
