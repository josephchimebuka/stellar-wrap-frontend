/**
 * API route for wrapped data
 * Handles fetching indexed transaction data with caching
 */

import { NextRequest, NextResponse } from "next/server";
import { indexAccount } from "@/app/services/indexerService";
import {
  WrapPeriod,
  getCacheKey,
  isCacheValid,
  PERIODS,
} from "@/app/utils/indexer";
import { getCacheStore } from "@/app/store/wrapStore";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const accountId = searchParams.get("accountId");
    const network =
      (searchParams.get("network") as "mainnet" | "testnet") || "mainnet";
    const period = (searchParams.get("period") as WrapPeriod) || "monthly";

    // Validate inputs
    if (!accountId) {
      return NextResponse.json(
        { error: "Missing accountId parameter" },
        { status: 400 },
      );
    }

    if (!accountId.startsWith("G") || accountId.length !== 56) {
      return NextResponse.json(
        { error: "Invalid account ID format" },
        { status: 400 },
      );
    }

    if (!["mainnet", "testnet"].includes(network)) {
      return NextResponse.json({ error: "Invalid network" }, { status: 400 });
    }

    if (!PERIODS[period]) {
      return NextResponse.json({ error: "Invalid period" }, { status: 400 });
    }

    // Check cache
    const cacheKey = getCacheKey(accountId, network, period);
    const cache = getCacheStore();
    const cachedEntry = cache[cacheKey];

    if (cachedEntry && isCacheValid(cachedEntry)) {
      return NextResponse.json({
        ...cachedEntry.result,
        cached: true,
      });
    }

    // Fetch fresh data
    const result = await indexAccount(accountId, network, period);

    // Cache the result
    cache[cacheKey] = {
      result,
      timestamp: Date.now(),
    };

    return NextResponse.json({
      ...result,
      cached: false,
    });
  } catch (error: unknown) {
    console.error("Error in /api/wrapped:", error);

    // Handle specific error cases
    const err = error as Record<string, unknown>;
    const message = (err?.message as string) || "";
    const statusCode = err?.statusCode as number | undefined;

    // Check for NotFoundError (account doesn't exist on this network)
    if (
      message.includes("Not Found") ||
      message.includes("not found") ||
      statusCode === 404
    ) {
      return NextResponse.json(
        {
          error: "Account not found on this network",
          details:
            "Make sure you selected the correct network (mainnet/testnet) where the account exists",
        },
        { status: 404 },
      );
    }

    // Check for rate limiting
    if (statusCode === 429) {
      return NextResponse.json(
        { error: "Rate limited. Please try again later." },
        { status: 429 },
      );
    }

    // Check for Horizon server errors
    if (statusCode === 500) {
      return NextResponse.json(
        { error: "Horizon server error" },
        { status: 500 },
      );
    }

    // Check for Bad Request (pagination or other API issues)
    if (message.includes("Bad Request") || statusCode === 400) {
      return NextResponse.json(
        { error: "Bad Request to Horizon API" },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error: "Failed to fetch wrapped data",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
