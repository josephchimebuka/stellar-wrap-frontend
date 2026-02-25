/**
 * Asset type definitions for Stellar wrap
 */

/**
 * Represents resolved asset metadata
 */
export interface AssetMetadata {
  code: string;
  issuer?: string;
  name: string;
  logo?: string;
  domain?: string;
  description?: string;
  isNative: boolean;
}

/**
 * Asset cache entry with expiration
 */
export interface AssetCacheEntry {
  metadata: AssetMetadata;
  timestamp: number;
  ttl: number; // in milliseconds
}

/**
 * Asset cache store
 */
export interface AssetCache {
  [key: string]: AssetCacheEntry;
}

/**
 * Stellar asset without metadata
 */
export interface RawAsset {
  code: string;
  issuer?: string;
}

/**
 * Result of asset resolution
 */
export interface AssetResolutionResult {
  success: boolean;
  metadata?: AssetMetadata;
  error?: string;
}
