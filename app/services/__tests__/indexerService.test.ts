/**Run with: npx tsx app/services/__tests__/indexerService.test.ts*/

import { EventEmitter } from "events";

type IndexingStep =
    | "initializing"
    | "fetching-transactions"
    | "filtering-timeframes"
    | "calculating-volume"
    | "identifying-assets"
    | "counting-contracts"
    | "finalizing";

interface MockTransaction {
    id: string;
    created_at: string;
    memo?: string;
    operations: { type: string; amount: string }[];
    paging_token: string;
}

interface MockPageResponse {
    records: MockTransaction[];
}

interface StepChangeEvent { type: "step-change"; step: IndexingStep }
interface StepProgressEvent { type: "step-progress"; step: IndexingStep; progress: number }
interface StepCompleteEvent { type: "step-complete"; step: IndexingStep }
interface IndexingCompleteEvent { type: "indexing-complete"; data: unknown }
interface StepErrorEvent { type: "step-error"; step: IndexingStep; message: string; recoverable: boolean }

type EmittedEvent =
    | StepChangeEvent
    | StepProgressEvent
    | StepCompleteEvent
    | IndexingCompleteEvent
    | StepErrorEvent;


class MockEventEmitter extends EventEmitter {
    events: EmittedEvent[] = [];

    emitStepChange(step: IndexingStep) {
        this.events.push({ type: "step-change", step });
    }

    emitStepProgress(step: IndexingStep, progress: number) {
        this.events.push({ type: "step-progress", step, progress });
    }

    emitStepComplete(step: IndexingStep) {
        this.events.push({ type: "step-complete", step });
    }

    emitIndexingComplete(data: unknown) {
        this.events.push({ type: "indexing-complete", data });
    }

    emitStepError(step: IndexingStep, message: string, recoverable: boolean) {
        this.events.push({ type: "step-error", step, message, recoverable });
    }
}

const mockTx = (id: string, date: string, memo?: string): MockTransaction => ({
    id,
    created_at: date,
    memo,
    operations: [{ type: "payment", amount: "100" }],
    paging_token: id,
});


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


async function testPagingLogic() {
    section("Indexing Paging & Cursors");

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);

    const page1: MockTransaction[] = [
        mockTx("1", new Date().toISOString()),
        mockTx("2", new Date().toISOString()),
    ];

    const page2: MockTransaction[] = [
        mockTx("3", new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString()),
    ];

    let callCount = 0;
    let usedCursor: string | undefined;

    const mockServerCall = async (cursor?: string): Promise<MockPageResponse> => {
        callCount++;
        usedCursor = cursor;
        if (!cursor) return { records: page1 };
        return { records: page2 };
    };

    const allTransactions: MockTransaction[] = [];
    let cursor: string | undefined;
    let hasMore = true;

    while (hasMore) {
        const response = await mockServerCall(cursor);

        if (!response.records || response.records.length === 0) {
            hasMore = false;
            break;
        }

        allTransactions.push(
            ...response.records.filter(
                (tx) => new Date(tx.created_at) >= cutoffDate,
            ),
        );

        if (response.records.some((tx) => new Date(tx.created_at) < cutoffDate)) {
            hasMore = false;
            break;
        }

        const lastToken = response.records[response.records.length - 1].paging_token;
        cursor = response.records.length === 200 && lastToken ? lastToken : undefined;
        if (!cursor) hasMore = false;
    }

    assert(callCount === 2, "Should perform 2 calls to handle paging across cutoff");
    assert(usedCursor === "2", "Should use last paging_token from Page 1 as cursor");
    assert(
        allTransactions.length === 2,
        "Should only keep 2 transactions within the 30-day window",
    );
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

    const progressEvent = emitter.events[1] as StepProgressEvent;
    assert(progressEvent.progress === 50, "Second event: progress 50%");
    assert((emitter.events[2] as StepCompleteEvent).step === step, "Third event: step-complete");
}

async function testErrorHandling() {
    section("Indexer Error State");

    const emitter = new MockEventEmitter();
    const errorMsg = "Horizon 503 Service Unavailable";

    emitter.emitStepError("fetching-transactions", errorMsg, true);

    const errorEvent = emitter.events.find(
        (e): e is StepErrorEvent => e.type === "step-error",
    );
    assert(!!errorEvent, "Should emit step-error on failure");
    assert(errorEvent?.message === errorMsg, "Error message should match");
    assert(errorEvent?.recoverable === true, "Error should be marked as recoverable");
}

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