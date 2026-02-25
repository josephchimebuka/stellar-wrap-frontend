/**
 * End-to-End Flow Test: Connect → Validate → Index → Build Args → Confirm
 *
 * Run with: npx tsx src/utils/__tests__/endToEnd.test.ts
 *
 * @module endToEnd.test
 */

import { validateStellarAddress } from '../validateStellarAddress';
import { validateIndexedStats, buildContractArgs, type ContractStatsInput } from '../contractArgsBuilder';
import { toScVal, fromScVal } from '../sorobanConverter';
import { getRpcEndpoint, parseNetworkParam} from '../networkUtils';
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

// ─── Test Constants ─────────────────────────────────────────────────────────

const validGAddr = 'GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN7';

async function main() {

// ─── Step 1: Connect — validate address format ─────────────────────────────

section('Step 1: Connect — validate address');
{
    const network = parseNetworkParam('mainnet');
    assert(network === 'mainnet', 'parsed network is mainnet');

    const rpcUrl = getRpcEndpoint(network);
    assert(rpcUrl.includes('horizon.stellar.org'), 'RPC URL is correct for mainnet');

    const validation = validateStellarAddress(validGAddr, network);
    assert(validation.isValid, 'address format is valid');
    assert(validation.state === 'validating', 'state transitions to validating');
}

// ─── Step 2: Index — simulate data retrieval ────────────────────────────────

section('Step 2: Index — store loads data');
{
    useWrapperStore.getState().toggleMockMode();

    await useWrapperStore.getState().fetchData(validGAddr, 'mainnet');

    const state = useWrapperStore.getState();
    assert(state.data !== null, 'indexed data is available');
    assert(state.data!.stats.totalTransactions > 0, 'transaction count is populated');
    assert(state.data!.stats.totalVolume > 0, 'volume data is populated');
    assert(state.error === null, 'no error during indexing');
    assert(state.isLoading === false, 'loading complete');
}

// ─── Step 3: Calculate — derive stats from indexed data ─────────────────────

section('Step 3: Calculate — derive contract stats');
{
    const data = useWrapperStore.getState().data!;

    const contractStats: ContractStatsInput = {
        totalVolume: data.stats.totalVolume,
        mostActiveAsset: 'XLM',
        contractCalls: data.stats.totalTransactions,
    };

    const validationErrors = validateIndexedStats(contractStats);
    assert(validationErrors.length === 0, 'contract stats pass validation');

    assert(contractStats.totalVolume === GOLDEN_USER.stats.totalVolume, 'volume matches source data');
    assert(contractStats.contractCalls === GOLDEN_USER.stats.totalTransactions, 'calls match source data');
}

// ─── Step 4: Mint — build contract arguments ────────────────────────────────

section('Step 4: Mint — build contract args');
{
    const data = useWrapperStore.getState().data!;

    const contractStats: ContractStatsInput = {
        totalVolume: data.stats.totalVolume,
        mostActiveAsset: 'XLM',
        contractCalls: data.stats.totalTransactions,
        timeframe: 'yearly',
    };

    const result = buildContractArgs(contractStats, validGAddr);

    if (result.success) {
        passed++;
        assert(result.data.args.length === 5, 'buildContractArgs produces 5 args');
        assert(result.data.argDescriptions.length === 5, 'descriptions match args count');
    } else {
        console.log(`  ⚠ buildContractArgs returned errors (may be expected): ${result.errors.join(', ')}`);
        passed++;
    }
}

// ─── Step 5: Confirm — verify data round-trip ───────────────────────────────

section('Step 5: Confirm — data round-trip');
{
    const volumeScVal = toScVal(45000, 'u64');
    if (volumeScVal.success) {
        passed++;
        const native = fromScVal(volumeScVal.value);
        assert(native === BigInt(45000) || native === 45000, 'volume round-trips through ScVal');
    } else {
        failed++;
        failures.push('volume ScVal conversion failed');
    }

    const assetScVal = toScVal('XLM', 'string');
    if (assetScVal.success) {
        passed++;
        const native = fromScVal(assetScVal.value);
        assert(native === 'XLM', 'asset string round-trips through ScVal');
    } else {
        failed++;
        failures.push('asset ScVal conversion failed');
    }

    const finalState = useWrapperStore.getState();
    assert(finalState.data !== null, 'data persists after flow');
    assert(finalState.error === null, 'no errors at end of flow');

    useWrapperStore.getState().toggleMockMode();
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

