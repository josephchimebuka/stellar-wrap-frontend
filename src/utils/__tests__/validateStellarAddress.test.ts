/**
 * Unit Tests for validateStellarAddress
 *
 * Run with: npx tsx src/utils/__tests__/validateStellarAddress.test.ts
 *
 * @module validateStellarAddress.test
 */

import { validateStellarAddress, type ValidationResult } from '../validateStellarAddress';

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

// ─── Valid Address Constants ────────────────────────────────────────────────

const validGAddr = 'GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN7';

// ─── Empty / Whitespace Tests ───────────────────────────────────────────────

section('Empty and whitespace inputs');
{
    const r1 = validateStellarAddress('', 'mainnet');
    assert(!r1.isValid, 'empty string is invalid');
    assert(r1.state === 'idle', 'empty string state is idle');

    const r2 = validateStellarAddress('   ', 'mainnet');
    assert(!r2.isValid, 'whitespace-only is invalid');
    assert(r2.state === 'idle', 'whitespace-only state is idle');
}

// ─── Invalid Prefix Tests ───────────────────────────────────────────────────

section('Invalid prefix checks');
{
    const r1 = validateStellarAddress('SABC123', 'mainnet');
    assert(!r1.isValid, 'S-prefix (secret key) is invalid');
    assert(r1.state === 'invalid', 'S-prefix state is invalid');
    assert(r1.error !== undefined, 'S-prefix has error message');

    const r2 = validateStellarAddress('not-an-address', 'mainnet');
    assert(!r2.isValid, 'random string is invalid');

    const r3 = validateStellarAddress('12345', 'mainnet');
    assert(!r3.isValid, 'numeric string is invalid');
}

// ─── Valid G-Address Tests ──────────────────────────────────────────────────

section('Valid G-address format');
{
    const r1 = validateStellarAddress(validGAddr, 'mainnet');
    assert(r1.isValid, 'valid G-address passes format check');
    assert(r1.state === 'validating', 'valid G-address state is validating (ready for network check)');
    assert(r1.error === undefined, 'valid G-address has no error');
}

// ─── Invalid G-Address Format Tests ─────────────────────────────────────────

section('Invalid G-address format (wrong length/checksum)');
{
    const r1 = validateStellarAddress('GABC', 'mainnet');
    assert(!r1.isValid, 'short G-address is invalid');
    assert(r1.state === 'invalid', 'short G-address state is invalid');

    const r2 = validateStellarAddress('G' + 'A'.repeat(55), 'mainnet');
    assert(!r2.isValid, 'wrong checksum G-address is invalid');
}

// ─── M-Address (Muxed) Tests ────────────────────────────────────────────────

section('M-address (muxed) checks');
{
    const r1 = validateStellarAddress('MABC', 'mainnet');
    assert(!r1.isValid, 'short M-address is invalid');
    assert(r1.state === 'invalid', 'short M-address state is invalid');
}

// ─── Network Parameter Tests ────────────────────────────────────────────────

section('Network parameter handling');
{
    const r1 = validateStellarAddress(validGAddr, 'testnet');
    assert(r1.isValid, 'valid address passes on testnet');

    const r2 = validateStellarAddress(validGAddr, 'mainnet');
    assert(r2.isValid, 'valid address passes on mainnet');
}

// ─── Edge Cases ─────────────────────────────────────────────────────────────

section('Edge cases');
{
    // Address with leading/trailing spaces (trimmed internally)
    const r1 = validateStellarAddress(`  ${validGAddr}  `, 'mainnet');
    assert(r1.isValid, 'address with surrounding spaces is valid after trim');

    // Single character
    const r2 = validateStellarAddress('G', 'mainnet');
    assert(!r2.isValid, 'single G is invalid');

    const r3 = validateStellarAddress('M', 'mainnet');
    assert(!r3.isValid, 'single M is invalid');
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
