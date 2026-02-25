/**
 * Unit Tests for useWrapperStore (Zustand)
 *
 * Run with: npx tsx src/utils/__tests__/store.test.ts
 *
 * @module store.test
 */

import { useWrapperStore } from '../../store/useWrapperStore';
import { GOLDEN_USER } from '../../data/mockData';

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

async function main() {

// ─── Initial State Tests ────────────────────────────────────────────────────

section('Initial state');
{
    const state = useWrapperStore.getState();
    assert(state.data === null, 'data starts as null');
    assert(state.isLoading === false, 'isLoading starts as false');
    assert(state.isMock === false, 'isMock starts as false');
    assert(state.error === null, 'error starts as null');
}

// ─── setLoading Tests ───────────────────────────────────────────────────────

section('setLoading');
{
    useWrapperStore.getState().setLoading(true);
    assert(useWrapperStore.getState().isLoading === true, 'setLoading(true) sets loading');

    useWrapperStore.getState().setLoading(false);
    assert(useWrapperStore.getState().isLoading === false, 'setLoading(false) clears loading');
}

// ─── setData Tests ──────────────────────────────────────────────────────────

section('setData');
{
    useWrapperStore.getState().setData(GOLDEN_USER);
    const state = useWrapperStore.getState();
    assert(state.data !== null, 'setData sets data');
    assert(state.data?.username === 'stellar_legend', 'data username matches GOLDEN_USER');
    assert(state.data?.stats.totalTransactions === 1250, 'data stats match GOLDEN_USER');
    assert(state.data?.topDapps.length === 3, 'data topDapps length matches');

    useWrapperStore.getState().setData(null);
    assert(useWrapperStore.getState().data === null, 'setData(null) clears data');
}

// ─── setError Tests ─────────────────────────────────────────────────────────

section('setError');
{
    useWrapperStore.getState().setError('Test error message');
    assert(useWrapperStore.getState().error === 'Test error message', 'setError sets error string');

    useWrapperStore.getState().setError(null);
    assert(useWrapperStore.getState().error === null, 'setError(null) clears error');
}

// ─── toggleMockMode Tests ───────────────────────────────────────────────────

section('toggleMockMode');
{
    useWrapperStore.getState().setData(null);
    useWrapperStore.getState().setError(null);

    useWrapperStore.getState().toggleMockMode();
    let state = useWrapperStore.getState();
    assert(state.isMock === true, 'toggleMockMode: isMock is true');
    assert(state.data !== null, 'toggleMockMode: data is populated');
    assert(state.data?.username === GOLDEN_USER.username, 'toggleMockMode: data is GOLDEN_USER');
    assert(state.error === null, 'toggleMockMode: error is cleared');

    useWrapperStore.getState().toggleMockMode();
    state = useWrapperStore.getState();
    assert(state.isMock === false, 'toggleMockMode off: isMock is false');
    assert(state.data === null, 'toggleMockMode off: data is cleared');
}

// ─── fetchData Tests ────────────────────────────────────────────────────────

section('fetchData in mock mode');
{
    useWrapperStore.getState().toggleMockMode();

    await useWrapperStore.getState().fetchData('GTEST...', 'mainnet');
    const state = useWrapperStore.getState();
    assert(state.isLoading === false, 'fetchData mock: isLoading is false after completion');
    assert(state.data !== null, 'fetchData mock: data is populated');
    assert(state.data?.username === GOLDEN_USER.username, 'fetchData mock: data is GOLDEN_USER');

    useWrapperStore.getState().toggleMockMode();
}

// ─── State Cleanup Tests ────────────────────────────────────────────────────

section('State cleanup after operations');
{
    useWrapperStore.getState().setData(GOLDEN_USER);
    useWrapperStore.getState().setError('some error');
    useWrapperStore.getState().setLoading(true);

    useWrapperStore.getState().setData(null);
    useWrapperStore.getState().setError(null);
    useWrapperStore.getState().setLoading(false);

    const state = useWrapperStore.getState();
    assert(state.data === null, 'cleanup: data is null');
    assert(state.error === null, 'cleanup: error is null');
    assert(state.isLoading === false, 'cleanup: isLoading is false');
}

// ─── Report ─────────────────────────────────────────────────────────────────

console.log('\n══════════════════════════════════════════════════════');
console.log(`  Results:  ${passed} passed, ${failed} failed`);
console.log('══════════════════════════════════════════════════════');

if (failures.length > 0) {
    console.log('\nFailed tests:');
    failures.forEach((f) => console.log(`  ✗ ${f}`));
}

process.exit(failed > 0 ? 1 : 0);

} // end main

main().catch((err) => {
    console.error('Test runner failed:', err);
    process.exit(1);
});

