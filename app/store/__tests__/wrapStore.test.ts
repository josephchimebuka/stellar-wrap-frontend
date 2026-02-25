/**
 * Unit Tests for wrapStore (Zustand)
 *
 * Run with: npx tsx app/store/__tests__/wrapStore.test.ts
 *
 * @module wrapStore.test
 */

import { create } from 'zustand';

// ─── Inline types and store (avoids @/ alias issues with npx tsx) ───────────

type WrapPeriod = 'weekly' | 'monthly' | 'yearly';
type Network = 'mainnet' | 'testnet';
type WrapStatus = 'idle' | 'loading' | 'ready' | 'error';

interface DappData { name: string; interactions: number; }
interface VibeSlice { type: string; percentage: number; color: string; label: string; }
interface WrapResult {
    username: string; totalTransactions: number; percentile: number;
    dapps: DappData[]; vibes: VibeSlice[]; persona: string; personaDescription: string;
}

interface WrapStoreState {
    address: string | null; period: WrapPeriod; network: Network;
    status: WrapStatus; error: string | null; result: WrapResult | null;
    setAddress: (address: string | null) => void;
    setPeriod: (period: WrapPeriod) => void;
    setNetwork: (network: Network) => void;
    setStatus: (status: WrapStatus) => void;
    setError: (error: string | null) => void;
    setResult: (result: WrapResult | null) => void;
    reset: () => void;
}

const useWrapStore = create<WrapStoreState>((set) => ({
    address: null, period: 'yearly', network: 'mainnet' as Network,
    status: 'idle', error: null, result: null,
    setAddress: (address) => set({ address }),
    setPeriod: (period) => set({ period }),
    setNetwork: (network) => set({ network }),
    setStatus: (status) => set({ status }),
    setError: (error) => set({ error }),
    setResult: (result) => set({ result }),
    reset: () => set({ address: null, period: 'yearly', network: 'mainnet' as Network, status: 'idle', error: null, result: null }),
}));

// ─── Test Helpers ───────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const failures: string[] = [];

function assert(condition: boolean, message: string): void {
    if (condition) { passed++; } else { failed++; failures.push(message); console.error(`  ✗ ${message}`); }
}

function section(name: string): void {
    console.log(`\n▸ ${name}`);
}

// ─── Fixtures ───────────────────────────────────────────────────────────────

const mockResult: WrapResult = {
    username: 'test_user', totalTransactions: 500, percentile: 95,
    dapps: [{ name: 'DEX', interactions: 100 }],
    vibes: [{ type: 'defi', percentage: 80, color: '#FF0000', label: 'DeFi Lord' }],
    persona: 'The Trader', personaDescription: 'You live for the swap.',
};

// ─── Initial State ──────────────────────────────────────────────────────────

section('Initial state');
{
    const state = useWrapStore.getState();
    assert(state.address === null, 'address starts null');
    assert(state.period === 'yearly', 'period defaults to yearly');
    assert(state.network === 'mainnet', 'network defaults to mainnet');
    assert(state.status === 'idle', 'status starts idle');
    assert(state.error === null, 'error starts null');
    assert(state.result === null, 'result starts null');
}

// ─── setAddress ─────────────────────────────────────────────────────────────

section('setAddress');
{
    useWrapStore.getState().setAddress('GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN7');
    assert(useWrapStore.getState().address === 'GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN7', 'setAddress works');

    useWrapStore.getState().setAddress(null);
    assert(useWrapStore.getState().address === null, 'setAddress(null) clears');
}

// ─── setPeriod ──────────────────────────────────────────────────────────────

section('setPeriod');
{
    useWrapStore.getState().setPeriod('weekly');
    assert(useWrapStore.getState().period === 'weekly', 'setPeriod to weekly');

    useWrapStore.getState().setPeriod('monthly');
    assert(useWrapStore.getState().period === 'monthly', 'setPeriod to monthly');

    useWrapStore.getState().setPeriod('yearly');
    assert(useWrapStore.getState().period === 'yearly', 'setPeriod back to yearly');
}

// ─── setNetwork ─────────────────────────────────────────────────────────────

section('setNetwork');
{
    useWrapStore.getState().setNetwork('testnet');
    assert(useWrapStore.getState().network === 'testnet', 'setNetwork to testnet');

    useWrapStore.getState().setNetwork('mainnet');
    assert(useWrapStore.getState().network === 'mainnet', 'setNetwork back to mainnet');
}

// ─── setStatus ──────────────────────────────────────────────────────────────

section('setStatus transitions');
{
    useWrapStore.getState().setStatus('loading');
    assert(useWrapStore.getState().status === 'loading', 'status: loading');

    useWrapStore.getState().setStatus('ready');
    assert(useWrapStore.getState().status === 'ready', 'status: ready');

    useWrapStore.getState().setStatus('error');
    assert(useWrapStore.getState().status === 'error', 'status: error');

    useWrapStore.getState().setStatus('idle');
    assert(useWrapStore.getState().status === 'idle', 'status: back to idle');
}

// ─── setResult ──────────────────────────────────────────────────────────────

section('setResult');
{
    useWrapStore.getState().setResult(mockResult);
    const state = useWrapStore.getState();
    assert(state.result !== null, 'result is set');
    assert(state.result?.username === 'test_user', 'result username matches');
    assert(state.result?.totalTransactions === 500, 'result totalTransactions matches');
    assert(state.result?.dapps.length === 1, 'result dapps length matches');

    useWrapStore.getState().setResult(null);
    assert(useWrapStore.getState().result === null, 'setResult(null) clears');
}

// ─── setError ───────────────────────────────────────────────────────────────

section('setError');
{
    useWrapStore.getState().setError('Network timeout');
    assert(useWrapStore.getState().error === 'Network timeout', 'error set');

    useWrapStore.getState().setError(null);
    assert(useWrapStore.getState().error === null, 'error cleared');
}

// ─── reset ──────────────────────────────────────────────────────────────────

section('reset');
{
    // Set various state
    useWrapStore.getState().setAddress('GTEST...');
    useWrapStore.getState().setPeriod('weekly');
    useWrapStore.getState().setNetwork('testnet');
    useWrapStore.getState().setStatus('ready');
    useWrapStore.getState().setResult(mockResult);
    useWrapStore.getState().setError('some error');

    // Reset
    useWrapStore.getState().reset();
    const state = useWrapStore.getState();
    assert(state.address === null, 'reset: address null');
    assert(state.period === 'yearly', 'reset: period yearly');
    assert(state.network === 'mainnet', 'reset: network mainnet');
    assert(state.status === 'idle', 'reset: status idle');
    assert(state.result === null, 'reset: result null');
    assert(state.error === null, 'reset: error null');
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
