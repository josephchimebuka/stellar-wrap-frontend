"use client";

import { useWrapStore } from "@/app/store/wrapStore";
import { useCallback } from "react";
import { Database, RefreshCw, Loader2 } from "lucide-react";
import { invalidateCache, getCachedDataKey } from "@/app/services/cacheService";

function formatCacheAge(timestamp: number): string {
  const ageMs = Date.now() - timestamp;
  const ageMin = Math.floor(ageMs / 60_000);
  const ageSec = Math.floor((ageMs % 60_000) / 1000);
  if (ageMin >= 60) {
    const h = Math.floor(ageMin / 60);
    return h === 1 ? "1 hour ago" : `${h} hours ago`;
  }
  if (ageMin > 0) return ageMin === 1 ? "1 min ago" : `${ageMin} min ago`;
  return ageSec <= 10 ? "just now" : `${ageSec}s ago`;
}

export function CacheStatusBadge() {
  const { cacheMeta, address, network, period } = useWrapStore();

  const handleRefresh = useCallback(async () => {
    if (!address) return;
    const key = getCachedDataKey(
      address,
      network as "mainnet" | "testnet",
      period as "weekly" | "biweekly" | "monthly" | "yearly",
    );
    await invalidateCache(key);
    window.location.reload();
  }, [address, network, period]);

  if (!cacheMeta?.fromCache) return null;

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 space-y-2">
      <div className="flex items-center gap-2 text-sm">
        <Database className="w-4 h-4 text-emerald-400 shrink-0" />
        <span className="font-medium text-white/90">Using cached data</span>
      </div>
      {cacheMeta.cacheTimestamp != null && (
        <p className="text-xs text-neutral-400">
          Cached {formatCacheAge(cacheMeta.cacheTimestamp)}
        </p>
      )}
      {cacheMeta.refreshingInBackground && (
        <div className="flex items-center gap-2 text-xs text-amber-400/90">
          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
          <span>Refreshing in background...</span>
        </div>
      )}
      <button
        type="button"
        onClick={handleRefresh}
        className="flex items-center gap-2 mt-2 px-3 py-1.5 rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white text-xs font-medium transition-colors"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        Refresh data
      </button>
    </div>
  );
}
