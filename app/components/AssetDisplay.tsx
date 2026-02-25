"use client";

/**
 * AssetDisplay Component
 * Displays resolved asset with logo, name, and code
 */

import React, { useEffect, useState } from "react";
import { AssetMetadata } from "@/app/types/asset";
import {
  resolveAsset,
  getAssetDisplayName,
  getAssetShortName,
} from "@/app/services/assetResolver";
import Image from "next/image";

interface AssetDisplayProps {
  code: string;
  issuer?: string;
  showLogo?: boolean;
  showCode?: boolean;
  showFullName?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  logoClassName?: string;
}

/**
 * Size configurations for different display sizes
 */
const SIZE_CONFIGS = {
  sm: { logo: 16, text: "text-xs" },
  md: { logo: 24, text: "text-sm" },
  lg: { logo: 32, text: "text-base" },
};

/**
 * AssetDisplay component
 * Resolves and displays asset metadata with logo and name
 */
export const AssetDisplay: React.FC<AssetDisplayProps> = ({
  code,
  issuer,
  showLogo = true,
  showCode = true,
  showFullName = true,
  size = "md",
  className = "",
  logoClassName = "",
}) => {
  const [metadata, setMetadata] = useState<AssetMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sizeConfig = SIZE_CONFIGS[size];

  useEffect(() => {
    let mounted = true;

    const fetchAsset = async () => {
      try {
        setLoading(true);
        setError(null);
        const resolved = await resolveAsset(code, issuer);
        if (mounted) {
          setMetadata(resolved);
        }
      } catch (err) {
        if (mounted) {
          setError(
            err instanceof Error ? err.message : "Failed to resolve asset",
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchAsset();

    return () => {
      mounted = false;
    };
  }, [code, issuer]);

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div
          className="animate-pulse rounded-full bg-gray-200 dark:bg-gray-700"
          style={{
            width: `${sizeConfig.logo}px`,
            height: `${sizeConfig.logo}px`,
          }}
        />
        {showCode && (
          <span className={`${sizeConfig.text} text-gray-400`}>Loading...</span>
        )}
      </div>
    );
  }

  if (error || !metadata) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {showCode && (
          <span
            className={`${sizeConfig.text} text-gray-600 dark:text-gray-400`}
          >
            {code}
          </span>
        )}
      </div>
    );
  }

  const displayName = showFullName
    ? getAssetDisplayName(metadata)
    : getAssetShortName(metadata);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showLogo && metadata.logo && (
        <div className={`relative ${logoClassName}`}>
          <Image
            src={metadata.logo}
            alt={metadata.code}
            width={sizeConfig.logo}
            height={sizeConfig.logo}
            className="rounded-full"
            onError={(e) => {
              // Fallback if image fails to load
              const img = e.target as HTMLImageElement;
              img.style.display = "none";
            }}
          />
        </div>
      )}
      <span
        className={`${sizeConfig.text} font-medium text-gray-900 dark:text-gray-100`}
      >
        {displayName}
      </span>
    </div>
  );
};

/**
 * Compact asset display (code only with optional logo)
 */
export const AssetBadge: React.FC<Omit<AssetDisplayProps, "showFullName">> = (
  props,
) => {
  return (
    <AssetDisplay {...props} showFullName={false} size={props.size || "sm"} />
  );
};

/**
 * Asset display with full metadata
 */
export const AssetCard: React.FC<
  AssetDisplayProps & { showIssuer?: boolean }
> = ({ showIssuer = false, ...props }) => {
  const [metadata, setMetadata] = useState<AssetMetadata | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchAsset = async () => {
      try {
        setLoading(true);
        const resolved = await resolveAsset(props.code, props.issuer);
        if (mounted) {
          setMetadata(resolved);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchAsset();

    return () => {
      mounted = false;
    };
  }, [props.code, props.issuer]);

  if (loading) {
    return (
      <div className="flex items-center gap-3 rounded-lg bg-gray-100 p-3 dark:bg-gray-800">
        <div className="h-8 w-8 animate-pulse rounded-full bg-gray-300 dark:bg-gray-600" />
        <div className="space-y-1">
          <div className="h-4 w-24 animate-pulse rounded bg-gray-300 dark:bg-gray-600" />
          <div className="h-3 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>
    );
  }

  if (!metadata) {
    return (
      <div className="flex items-center gap-3 rounded-lg bg-gray-100 p-3 dark:bg-gray-800">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {props.code}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-lg bg-gray-100 p-3 dark:bg-gray-800">
      {props.showLogo && metadata.logo && (
        <Image
          src={metadata.logo}
          alt={metadata.code}
          width={32}
          height={32}
          className="rounded-full"
        />
      )}
      <div className="flex-1">
        <div className="font-medium text-gray-900 dark:text-gray-100">
          {metadata.name}
        </div>
        <div className="text-xs text-gray-600 dark:text-gray-400">
          {metadata.code}
          {showIssuer && metadata.issuer && (
            <span className="ml-2">({metadata.issuer.slice(0, 8)}...)</span>
          )}
        </div>
        {metadata.description && (
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-500">
            {metadata.description}
          </div>
        )}
      </div>
    </div>
  );
};

export default AssetDisplay;
