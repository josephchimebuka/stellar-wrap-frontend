"use client"

import { motion } from 'framer-motion';
import { Network as NetworkIcon } from 'lucide-react';
import { useWrapStore } from '../store/wrapStore';
import { NETWORKS, Network } from '../../src/config';
import { getNetworkDisplayName } from '../../src/utils/networkUtils';

export function NetworkToggle() {
  const { network, setNetwork } = useWrapStore();

  const toggleNetwork = () => {
    const newNetwork: Network = network === NETWORKS.MAINNET ? NETWORKS.TESTNET : NETWORKS.MAINNET;
    setNetwork(newNetwork);
  };

  const isMainnet = network === NETWORKS.MAINNET;

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 }}
      className="fixed top-4 right-4 md:top-8 md:right-24 z-50"
    >
      <motion.button
        onClick={toggleNetwork}
        className="group relative flex items-center gap-2 md:gap-3 px-3 py-2 md:px-4 md:py-3 rounded-xl backdrop-blur-xl border transition-all"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          borderColor: isMainnet 
            ? 'rgba(var(--color-theme-primary-rgb), 0.3)' 
            : 'rgba(255, 165, 0, 0.3)',
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Glow effect */}
        <motion.div
          className="absolute -inset-1 rounded-xl blur-lg opacity-0 group-hover:opacity-50 transition-opacity"
          style={{
            backgroundColor: isMainnet 
              ? 'rgba(var(--color-theme-primary-rgb), 0.3)' 
              : 'rgba(255, 165, 0, 0.3)',
          }}
        />

        {/* Network icon */}
        <div className="relative">
          <NetworkIcon 
            className="w-4 h-4 md:w-5 md:h-5" 
            style={{ 
              color: isMainnet 
                ? 'var(--color-theme-primary)' 
                : '#FFA500' 
            }} 
          />
        </div>

        {/* Network label */}
        <div className="relative flex flex-col items-start">
          <span className="text-[8px] md:text-[10px] font-black tracking-wider text-white/50 uppercase">
            Network
          </span>
          <span 
            className="text-xs md:text-sm font-black tracking-tight"
            style={{ 
              color: isMainnet 
                ? 'var(--color-theme-primary)' 
                : '#FFA500' 
            }}
          >
            {getNetworkDisplayName(network)}
          </span>
        </div>

        {/* Status indicator */}
        <motion.div
          className="relative w-2 h-2 rounded-full"
          style={{
            backgroundColor: isMainnet 
              ? 'var(--color-theme-primary)' 
              : '#FFA500',
          }}
          animate={{
            opacity: [0.5, 1, 0.5],
            boxShadow: [
              `0 0 5px ${isMainnet ? 'rgba(var(--color-theme-primary-rgb), 0.5)' : 'rgba(255, 165, 0, 0.5)'}`,
              `0 0 10px ${isMainnet ? 'rgba(var(--color-theme-primary-rgb), 1)' : 'rgba(255, 165, 0, 1)'}`,
              `0 0 5px ${isMainnet ? 'rgba(var(--color-theme-primary-rgb), 0.5)' : 'rgba(255, 165, 0, 0.5)'}`,
            ],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
        />
      </motion.button>
    </motion.div>
  );
}
