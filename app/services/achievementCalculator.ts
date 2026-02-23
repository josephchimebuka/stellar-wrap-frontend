/**
 * Achievement calculator
 * Processes transaction data to calculate user metrics and achievements
 */

import { IndexerResult, DappInfo, VibeTag } from "@/app/utils/indexer";

interface Transaction {
  created_at: string;
  memo?: string;
  operations?: Operation[];
}

interface Operation {
  type: string;
  amount?: string;
  asset_code?: string;
  memo?: string;
}

const DAPP_KEYWORDS = {
  "stellar.expert": { name: "Stellar Expert", icon: "📊" },
  soroban: { name: "Soroban", icon: "⚡" },
  swap: { name: "DEX", icon: "🔄" },
  lp: { name: "Liquidity Pool", icon: "💧" },
  bridge: { name: "Bridge", icon: "🌉" },
  payment: { name: "Payments", icon: "💳" },
};

export function calculateAchievements(
  transactions: Transaction[],
): IndexerResult {
  let totalVolume = 0;
  let contractCalls = 0;
  const gasSpent = 0;
  const assetMap = new Map<string, number>();
  const dappMap = new Map<string, DappInfo>();
  const vibeMap = new Map<string, number>();

  // Process transactions
  transactions.forEach((tx: Transaction) => {
    if (!tx.operations) return;

    tx.operations.forEach((op: Operation) => {
      // Count contract invocations (Soroban operations)
      if (op.type === "invoke_host_function") {
        contractCalls++;
        vibeMap.set("soroban-user", (vibeMap.get("soroban-user") || 0) + 1);
      }

      // Process payment operations
      if (op.type === "payment") {
        const amount = op.amount ? parseFloat(op.amount) : 0;
        totalVolume += amount;

        const asset = op.asset_code || "XLM";
        assetMap.set(asset, (assetMap.get(asset) || 0) + amount);

        // Detect dapps
        if (op.memo || tx.memo) {
          const memo = (op.memo || tx.memo || "").toLowerCase();
          Object.entries(DAPP_KEYWORDS).forEach(([keyword, dapp]) => {
            if (memo.includes(keyword)) {
              const key = dapp.name;
              const existing = dappMap.get(key) || {
                name: key,
                icon: dapp.icon,
                volume: 0,
                transactionCount: 0,
              };
              existing.volume += amount;
              existing.transactionCount += 1;
              dappMap.set(key, existing);
            }
          });
        }
      }

      // Process path payment operations
      if (
        op.type === "path_payment_strict_receive" ||
        op.type === "path_payment_strict_send"
      ) {
        const amount = op.amount ? parseFloat(op.amount) : 0;
        totalVolume += amount;

        const asset = op.asset_code || "XLM";
        assetMap.set(asset, (assetMap.get(asset) || 0) + amount);

        vibeMap.set("bridge-warrior", (vibeMap.get("bridge-warrior") || 0) + 1);
      }

      // Process trades
      if (op.type === "manage_buy_offer" || op.type === "manage_sell_offer") {
        vibeMap.set("defi-trader", (vibeMap.get("defi-trader") || 0) + 1);
        const amount = op.amount ? parseFloat(op.amount) : 0;
        totalVolume += amount;
      }
    });
  });

  // Determine vibes based on activity
  const vibes: VibeTag[] = [];

  if (totalVolume > 1000000) {
    vibes.push({ tag: "Whale", count: transactions.length });
  } else if (totalVolume > 100000) {
    vibes.push({ tag: "High Roller", count: transactions.length });
  }

  if (transactions.length > 100) {
    vibes.push({ tag: "Active", count: transactions.length });
  }

  if (contractCalls > 10) {
    vibes.push({ tag: "Soroban Explorer", count: contractCalls });
  }

  if (vibeMap.has("bridge-warrior")) {
    vibes.push({
      tag: "Bridge Master",
      count: vibeMap.get("bridge-warrior") || 0,
    });
  }

  if (transactions.length < 20 && transactions.length > 0) {
    vibes.push({ tag: "Selective", count: transactions.length });
  }

  // Get most active asset
  let mostActiveAsset = "XLM";
  let maxAmount = 0;
  assetMap.forEach((amount, asset) => {
    if (amount > maxAmount) {
      maxAmount = amount;
      mostActiveAsset = asset;
    }
  });

  return {
    accountId: "",
    totalTransactions: transactions.length,
    totalVolume,
    mostActiveAsset,
    contractCalls,
    gasSpent,
    dapps: Array.from(dappMap.values()),
    vibes,
  };
}
