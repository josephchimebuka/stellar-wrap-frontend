import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { DevTool } from "./components/DevTool";
import { Toaster } from "sonner";
import { SoundManager } from "./components/SoundManager";
import { RateLimitBanner } from "./components/RateLimitBanner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Stellar Wrap | Reveal Your On-Chain Persona",
  description: "Your Stellar Year in Review",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <Providers>
          {children}
          <SoundManager />
          <RateLimitBanner />
        </Providers>
        <DevTool />
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
