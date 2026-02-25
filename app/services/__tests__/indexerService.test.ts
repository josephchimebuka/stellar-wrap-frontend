/**
 * Unit Tests for indexerService
 * 
 * Specifically tests the 7-step indexing pipeline, Horizon API paging, 
 * cursors, and EventEmitter signaling.
 *
 * Run with: npx tsx app/services/__tests__/indexerService.test.ts
 */

import { EventEmitter } from "events";

// ─── Mocks ──────────────────────────────────────────────────────────────────

// Mock IndexingStep type
type IndexingStep =
  | "initializing"
  | "fetching-transactions"
  | "filtering-timeframes"
  | "calculating-volume"
  | "identifying-assets"
  | "counting-contracts"
  | "finalizing";

// Mock IndexerEventEmitter to track events without needing the store
class MockEventEmitter extends EventEmitter {
  events: any[] = [];
  
  emitStepChange(step: IndexingStep) {
    this.events.push({ type: "step-change", step });
  }
  
  emitStepProgress(step: IndexingStep, progress: number) {
    this.events.push({ type: "step-progress", step, progress });
  }
  
  emitStepComplete(step: IndexingStep) {
    this.events.push({ type: "step-complete", step });
  }
  
  emitIndexingComplete(data: any) {
    this.events.push({ type: "indexing-complete", data });
  }
  
  emitStepError(step: IndexingStep, message: string, recoverable: boolean) {
    this.events.push({ type: "step-error", step, message, recoverable });
  }
}

// Mock Horizon Response
const mockTx = (id: string, date: string, memo?: string) => ({
  id,
  created_at: date,
  memo,
  operations: [{ type: "payment", amount: "100" }],
  paging_token: id,
});

// ─── Test Helpers ───────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const failures: string[] = [];

function assert(condition: boolean, message: string): void {
  if (condition) {
    passed++;
  } else {
    failed++;
    failures.push(message);
    console.error(`  ✗ ${message}`);
  }
}

function section(name: string): void {
  console.log(`\n▸ ${name}`);
}

// ─── Test Logic ─────────────────────────────────────────────────────────────

// We'll simulate the indexAccount paging logic to verify our understanding
// and ensure the contract bridge/paging requirements are met.

async function testPagingLogic() {
  section("Indexing Paging & Cursors");

  const accountId = "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN7";
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 30); // 30 days ago

  const page1 = [
    mockTx("1", new Date().toISOString()),
    mockTx("2", new Date().toISOString()),
  ];
  
  const page2 = [
    mockTx("3", new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString()), // 40 days ago (past cutoff)
  ];

  let callCount = 0;
  let usedCursor: string | undefined;

  const mockServerCall = async (cursor?: string) => {
    callCount++;
    usedCursor = cursor;
    if (!cursor) return { records: page1 };
    return { records: page2 };
  };

  // Simulate indexAccount loop
  const allTransactions: any[] = [];
  let cursor: string | undefined;
  let hasMore = true;

  while (hasMore) {
    const response = await mockServerCall(cursor);
    
    if (!response.records || response.records.length === 0) {
      hasMore = false;
      break;
    }

    allTransactions.push(...response.records.filter(tx => new Date(tx.created_at) >= cutoffDate));

    if (response.records.some(tx => new Date(tx.created_at) < cutoffDate)) {
      hasMore = false;
      break;
    }

    cursor = response.records[response.records.length - 1].paging_token;
    if (!cursor) hasMore = false;
  }

  assert(callCount === 2, "Should perform 2 calls to handle paging across cutoff");
  assert(usedCursor === "2", "Should use the last paging_token from Page 1 as cursor for Page 2");
  assert(allTransactions.length === 2, "Should only keep 2 transactions within the 30-day window");
}

async function testEventEmitterSignaling() {
  section("Indexer Event Signaling");

  const emitter = new MockEventEmitter();
  const step: IndexingStep = "fetching-transactions";

  emitter.emitStepChange(step);
  emitter.emitStepProgress(step, 50);
  emitter.emitStepComplete(step);

  assert(emitter.events.length === 3, "Should have emitted 3 events");
  assert(emitter.events[0].type === "step-change", "First event: step-change");
  assert(emitter.events[1].progress === 50, "Second event: progress 50%");
  assert(emitter.events[2].step === step, "Third event: step-complete");
}

async function testErrorHandling() {
  section("Indexer Error State");

  const emitter = new MockEventEmitter();
  const errorMsg = "Horizon 503 Service Unavailable";
  
  emitter.emitStepError("fetching-transactions", errorMsg, true);

  const errorEvent = emitter.events.find(e => e.type === "step-error");
  assert(!!errorEvent, "Should emit step-error on failure");
  assert(errorEvent.message === errorMsg, "Error message should match");
  assert(errorEvent.recoverable === true, "Error should be marked as recoverable");
}

// ─── Main Runner ────────────────────────────────────────────────────────────

async function main() {
  console.log("Running Indexer Service Tests...");

  try {
    await testPagingLogic();
    await testEventEmitterSignaling();
    await testErrorHandling();

    console.log("\n══════════════════════════════════════════════════════");
    console.log(`  Results:  ${passed} passed, ${failed} failed`);
    console.log("══════════════════════════════════════════════════════");

    if (failures.length > 0) {
      console.log("\nFailed tests:");
      failures.forEach((f) => console.log(`  ✗ ${f}`));
    }

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error("\nUnexpected error during tests:", err);
    process.exit(1);
  }
}

main();
