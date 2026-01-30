"use client";

import { ThemeProvider } from "./context/ThemeContext";
import { useEffect } from "react";
import { initWalletKit } from "./utils/walletKit";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize wallet kit on client side
    if (typeof window !== "undefined") {
      initWalletKit();
    }
  }, []);

  return <ThemeProvider>{children}</ThemeProvider>;
}
