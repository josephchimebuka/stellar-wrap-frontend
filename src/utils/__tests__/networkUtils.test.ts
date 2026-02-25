/**
 * Unit Tests for networkUtils
 *
 * Run with: npx tsx src/utils/__tests__/networkUtils.test.ts
 *
 * @module networkUtils.test
 */

import { getRpcEndpoint, parseNetworkParam, getNetworkDisplayName } from '../networkUtils';
import { RPC_ENDPOINTS, DEFAULT_NETWORK } from '../../config';

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

// ─── getRpcEndpoint Tests ───────────────────────────────────────────────────

section('getRpcEndpoint');
{
    const mainnetUrl = getRpcEndpoint('mainnet');
    assert(mainnetUrl === RPC_ENDPOINTS.mainnet, 'mainnet returns correct Horizon URL');
    assert(mainnetUrl.includes('horizon.stellar.org'), 'mainnet URL contains horizon.stellar.org');

    const testnetUrl = getRpcEndpoint('testnet');
    assert(testnetUrl === RPC_ENDPOINTS.testnet, 'testnet returns correct Horizon URL');
    assert(testnetUrl.includes('horizon-testnet'), 'testnet URL contains horizon-testnet');
}

// ─── parseNetworkParam Tests ────────────────────────────────────────────────

section('parseNetworkParam');
{
    assert(parseNetworkParam('mainnet') === 'mainnet', 'parses mainnet correctly');
    assert(parseNetworkParam('testnet') === 'testnet', 'parses testnet correctly');
    assert(parseNetworkParam(null) === DEFAULT_NETWORK, 'null returns default network');
    assert(parseNetworkParam('') === DEFAULT_NETWORK, 'empty string returns default');
    assert(parseNetworkParam('invalid') === DEFAULT_NETWORK, 'invalid string returns default');
    assert(parseNetworkParam('MAINNET') === DEFAULT_NETWORK, 'uppercase is not valid (case sensitive)');
}

// ─── getNetworkDisplayName Tests ────────────────────────────────────────────

section('getNetworkDisplayName');
{
    assert(getNetworkDisplayName('mainnet') === 'Mainnet', 'mainnet display name is Mainnet');
    assert(getNetworkDisplayName('testnet') === 'Testnet', 'testnet display name is Testnet');
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
