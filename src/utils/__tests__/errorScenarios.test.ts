/**
 * Error Scenario Tests
 *
 * Run with: npx tsx src/utils/__tests__/errorScenarios.test.ts
 *
 * @module errorScenarios.test
 */

import { validateStellarAddress } from '../validateStellarAddress';
import { validateIndexedStats, buildContractArgs} from '../contractArgsBuilder';
import {  numberToScValU32, numberToScValU64, stringToScVal, stringToScValSymbol, addressToScVal, U32_MAX, U64_MAX} from '../sorobanConverter';
import { parseNetworkParam } from '../networkUtils';
import { useWrapperStore } from '../../store/useWrapperStore';

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

const validGAddr = 'GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN7';

// ─── Address Validation Errors ──────────────────────────────────────────────

section('Address validation errors');
{
    // Empty
    const r1 = validateStellarAddress('', 'mainnet');
    assert(!r1.isValid, 'empty address is rejected');

    // Secret key prefix
    const r2 = validateStellarAddress('SCKFBEIYTKP2NM3BZXBIQXSJBEM3NTWGCAPXFQBHGTHZOO12345678', 'mainnet');
    assert(!r2.isValid, 'secret key prefix is rejected');
    assert(r2.error !== undefined, 'secret key rejection has error message');

    // Random string
    const r3 = validateStellarAddress('hello-world', 'mainnet');
    assert(!r3.isValid, 'random string is rejected');

    // Too short
    const r4 = validateStellarAddress('GABC', 'mainnet');
    assert(!r4.isValid, 'too-short address is rejected');

    // Wrong checksum
    const r5 = validateStellarAddress('G' + 'Z'.repeat(55), 'mainnet');
    assert(!r5.isValid, 'wrong-checksum address is rejected');
}

// ─── Stats Validation Errors ────────────────────────────────────────────────

section('Stats validation errors');
{
    // Negative volume
    const e1 = validateIndexedStats({ totalVolume: -100, mostActiveAsset: 'XLM', contractCalls: 10 });
    assert(e1.length > 0, 'negative volume produces errors');

    // Empty asset
    const e2 = validateIndexedStats({ totalVolume: 100, mostActiveAsset: '', contractCalls: 10 });
    assert(e2.length > 0, 'empty asset produces errors');

    // Float calls
    const e3 = validateIndexedStats({ totalVolume: 100, mostActiveAsset: 'XLM', contractCalls: 1.5 });
    assert(e3.length > 0, 'float contractCalls produces errors');

    // Infinity volume
    const e4 = validateIndexedStats({ totalVolume: Infinity, mostActiveAsset: 'XLM', contractCalls: 10 });
    assert(e4.length > 0, 'Infinity volume produces errors');

    // NaN volume
    const e5 = validateIndexedStats({ totalVolume: NaN, mostActiveAsset: 'XLM', contractCalls: 10 });
    assert(e5.length > 0, 'NaN volume produces errors');

    // Negative calls
    const e6 = validateIndexedStats({ totalVolume: 100, mostActiveAsset: 'XLM', contractCalls: -5 });
    assert(e6.length > 0, 'negative contractCalls produces errors');
}

// ─── Contract Args Builder Errors ───────────────────────────────────────────

section('Contract args builder errors');
{
    // Invalid address
    const r1 = buildContractArgs(
        { totalVolume: 100, mostActiveAsset: 'XLM', contractCalls: 10 },
        'invalid-address',
    );
    assert(!r1.success, 'buildContractArgs with invalid address fails');

    // Invalid stats
    const r2 = buildContractArgs(
        { totalVolume: -1, mostActiveAsset: 'XLM', contractCalls: 10 },
        validGAddr,
    );
    assert(!r2.success, 'buildContractArgs with negative volume fails');

    // Empty asset
    const r3 = buildContractArgs(
        { totalVolume: 100, mostActiveAsset: '', contractCalls: 10 },
        validGAddr,
    );
    assert(!r3.success, 'buildContractArgs with empty asset fails');
}

// ─── ScVal Conversion Errors ────────────────────────────────────────────────

section('ScVal conversion boundary errors');
{
    // u32 overflow
    const r1 = numberToScValU32(U32_MAX + 1);
    assert(!r1.success, 'u32 overflow is rejected');

    // u32 negative
    const r2 = numberToScValU32(-1);
    assert(!r2.success, 'u32 negative is rejected');

    // u32 float
    const r3 = numberToScValU32(1.5);
    assert(!r3.success, 'u32 float is rejected');

    // u32 NaN
    const r4 = numberToScValU32(NaN);
    assert(!r4.success, 'u32 NaN is rejected');

    // u64 negative
    const r5 = numberToScValU64(BigInt(-1));
    assert(!r5.success, 'u64 negative bigint is rejected');

    // u64 overflow
    const r6 = numberToScValU64(U64_MAX + BigInt(1));
    assert(!r6.success, 'u64 overflow is rejected');

    // Invalid string type
    const r7 = stringToScVal(42 as unknown as string);
    assert(!r7.success, 'non-string to stringToScVal is rejected');

    // Invalid symbol
    const r8 = stringToScValSymbol('');
    assert(!r8.success, 'empty symbol is rejected');

    const r9 = stringToScValSymbol('foo-bar');
    assert(!r9.success, 'symbol with dash is rejected');

    const r10 = stringToScValSymbol('a'.repeat(33));
    assert(!r10.success, 'symbol exceeding 32 chars is rejected');

    // Invalid address
    const r11 = addressToScVal('');
    assert(!r11.success, 'empty address to ScVal is rejected');

    const r12 = addressToScVal('not-an-address');
    assert(!r12.success, 'invalid address to ScVal is rejected');
}

// ─── Network Parsing Errors ─────────────────────────────────────────────────

section('Network parsing errors');
{
    assert(parseNetworkParam('invalid') === 'mainnet', 'invalid network falls back to default');
    assert(parseNetworkParam(null) === 'mainnet', 'null network falls back to default');
    assert(parseNetworkParam('') === 'mainnet', 'empty network falls back to default');
    assert(parseNetworkParam('TESTNET') === 'mainnet', 'uppercase TESTNET is not valid');
}

// ─── Store Error State Handling ─────────────────────────────────────────────

section('Store error state handling');
{
    // Set error
    useWrapperStore.getState().setError('API request failed: 500');
    assert(useWrapperStore.getState().error === 'API request failed: 500', 'store captures error message');

    // Error persists until cleared
    useWrapperStore.getState().setLoading(false);
    assert(useWrapperStore.getState().error === 'API request failed: 500', 'error persists after setLoading');

    // Clear error
    useWrapperStore.getState().setError(null);
    assert(useWrapperStore.getState().error === null, 'error is cleared');

    // Clean up
    useWrapperStore.getState().setData(null);
    useWrapperStore.getState().setLoading(false);
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
