/**
 * Asset metadata constants and known assets
 */

import { AssetMetadata } from "@/app/types/asset";

/**
 * Native XLM asset
 */
export const NATIVE_ASSET: AssetMetadata = {
  code: "XLM",
  name: "Stellar Lumens",
  isNative: true,
  logo: "https://assets.coingecko.com/coins/images/12816/small/stellar_lumens_logo.png",
  domain: "stellar.org",
  description: "Native currency of the Stellar network",
};

/**
 * Known popular assets with metadata
 * These are cached to avoid API calls for common assets
 */
export const KNOWN_ASSETS: Record<string, AssetMetadata> = {
  XLM: NATIVE_ASSET,
  native: NATIVE_ASSET,

  // Popular stablecoins
  USDC: {
    code: "USDC",
    name: "USD Coin",
    issuer: "GBBD47UZQ5O5K7PGQWUBZPC34EYWXVJ7UNVIOVG53FDKQ57ESVENSKWM",
    logo: "https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png",
    domain: "centre.io",
    isNative: false,
  },
  USDT: {
    code: "USDT",
    name: "Tether USD",
    issuer: "GBUQWP3BOUZX34ULNQG23RQ6F4BVWCIIY2IANU6S2HXE3MGWSup42YA",
    logo: "https://assets.coingecko.com/coins/images/325/small/Tether-logo.png",
    domain: "tether.to",
    isNative: false,
  },

  // Popular cryptos
  BTC: {
    code: "BTC",
    name: "Bitcoin",
    issuer: "GATEMHCCKCY67ZUCKTROYN24ZYT5GK4EQZ65JJLDHKHRUZI3EUEKMTCH",
    logo: "https://assets.coingecko.com/coins/images/1/small/bitcoin.png",
    domain: "stellar.org",
    isNative: false,
  },
  ETH: {
    code: "ETH",
    name: "Ethereum",
    issuer: "GBDESL6MT7SXE4NqkoJUKw6k3t3z5NB6LGYXPARHY3FZRWUF6XBZOJIE",
    logo: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
    domain: "stellar.org",
    isNative: false,
  },

  // Other common assets
  EUR: {
    code: "EUR",
    name: "Euro",
    issuer: "GAZN3PPIDQCSP5RK7F5FVWWGYLRPLTW7GYXJJWQLWTSL76UZA5HM5OFJ",
    logo: "https://assets.coingecko.com/coins/images/10039/small/euro.png",
    domain: "stellar.org",
    isNative: false,
  },
  GBP: {
    code: "GBP",
    name: "British Pound",
    issuer: "GAKYA33PCZWN2LHVHC3GXBK7DVSEKGKWQG5HHQXZ2MGSB5PZAGX5D7",
    logo: "https://assets.coingecko.com/coins/images/11393/small/gbp.png",
    domain: "stellar.org",
    isNative: false,
  },

  // Stellar-native tokens
  SRT: {
    code: "SRT",
    name: "Stellar Rewards Token",
    issuer: "GBUQWP3BOUZX34ULNQG23RQ6F4BVWCIIY2IANU6S2HXE3MGWSUP42YA",
    logo: "https://assets.coingecko.com/coins/images/20834/small/SRT.png",
    domain: "stellar.org",
    isNative: false,
  },
};

/**
 * Default logo for unknown assets
 */
export const DEFAULT_ASSET_LOGO =
  "https://assets.coingecko.com/coins/images/1/small/generic-token.png";

/**
 * Asset cache TTL (24 hours)
 */
export const ASSET_CACHE_TTL = 24 * 60 * 60 * 1000;

/**
 * Asset directory API endpoints
 */
export const ASSET_DIRECTORY_URLS = {
  // Stellar Expert asset directory
  stellarExpert: "https://api.stellar.expert/explorer/public/asset",

  // Alternative: Stellar Community Fund assets
  scf: "https://assets.scf.technology",

  // Direct Stellar Horizon API
  horizon: "https://horizon.stellar.org/assets",
};

/**
 * Create a cache key for an asset
 */
export function createAssetCacheKey(code: string, issuer?: string): string {
  if (!issuer || code === "XLM" || code === "native") {
    return code.toUpperCase();
  }
  return `${code.toUpperCase()}_${issuer}`;
}

/**
 * Parse asset code from string (handles both 'CODE' and 'CODE:ISSUER' formats)
 */
export function parseAssetCode(assetString: string): {
  code: string;
  issuer?: string;
} {
  if (!assetString) {
    return { code: "XLM" };
  }

  const parts = assetString.split(":");
  return {
    code: parts[0].toUpperCase(),
    issuer: parts[1],
  };
}
