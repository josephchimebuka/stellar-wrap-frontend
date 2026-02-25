/**
 * Helper script to check contract address configuration
 * Run with: node scripts/check-contract-config.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env.local or .env
const envFiles = ['.env.local', '.env'];
const envVars = {};

envFiles.forEach((file) => {
  const envPath = path.join(process.cwd(), file);
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach((line) => {
      const match = line.match(/^([^=:#]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, '');
        envVars[key] = value;
      }
    });
  }
});

// Environment variables take precedence
const allEnv = { ...envVars, ...process.env };

console.log('🔍 Contract Address Configuration Check\n');
console.log('='.repeat(60));

const contractAddressMainnet =
  allEnv.NEXT_PUBLIC_CONTRACT_ADDRESS_MAINNET ??
  allEnv.NEXT_PUBLIC_CONTRACT_ADDRESS ??
  'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

const contractAddressTestnet =
  allEnv.NEXT_PUBLIC_CONTRACT_ADDRESS_TESTNET ??
  allEnv.NEXT_PUBLIC_CONTRACT_ADDRESS ??
  'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

console.log('\n📋 Mainnet Configuration:');
console.log(`   Contract Address: ${contractAddressMainnet}`);
if (contractAddressMainnet.startsWith('CAAAAAAAA')) {
  console.log('   ⚠️  WARNING: Using placeholder address!');
  console.log('   Set NEXT_PUBLIC_CONTRACT_ADDRESS_MAINNET to use a real contract');
} else {
  console.log('   ✅ Using configured contract address');
}

console.log('\n📋 Testnet Configuration:');
console.log(`   Contract Address: ${contractAddressTestnet}`);
if (contractAddressTestnet.startsWith('CAAAAAAAA')) {
  console.log('   ⚠️  WARNING: Using placeholder address!');
  console.log('   Set NEXT_PUBLIC_CONTRACT_ADDRESS_TESTNET to use a real contract');
} else {
  console.log('   ✅ Using configured contract address');
}

const sorobanRpcMainnet =
  allEnv.NEXT_PUBLIC_SOROBAN_RPC_URL_MAINNET ?? 'https://soroban-rpc.mainnet.stellar.org';
const sorobanRpcTestnet =
  allEnv.NEXT_PUBLIC_SOROBAN_RPC_URL_TESTNET ?? 'https://soroban-rpc.testnet.stellar.org';

console.log('\n🌐 Soroban RPC Endpoints:');
console.log(`   Mainnet: ${sorobanRpcMainnet}`);
console.log(`   Testnet: ${sorobanRpcTestnet}`);

const contractVars = [
  'NEXT_PUBLIC_CONTRACT_ADDRESS',
  'NEXT_PUBLIC_CONTRACT_ADDRESS_MAINNET',
  'NEXT_PUBLIC_CONTRACT_ADDRESS_TESTNET',
  'NEXT_PUBLIC_SOROBAN_RPC_URL_MAINNET',
  'NEXT_PUBLIC_SOROBAN_RPC_URL_TESTNET',
];

console.log('\n📝 Environment Variables Found:');
contractVars.forEach((varName) => {
  const value = allEnv[varName];
  if (value) {
    console.log(
      `   ✅ ${varName} = ${value.substring(0, 50)}${value.length > 50 ? '...' : ''}`,
    );
  } else {
    console.log(`   ❌ ${varName} (not set)`);
  }
});

console.log('\n' + '='.repeat(60));
console.log('\n💡 To set contract addresses, create a .env.local file:');
console.log('\n   NEXT_PUBLIC_CONTRACT_ADDRESS_TESTNET=YOUR_TESTNET_CONTRACT_ADDRESS');
console.log('   NEXT_PUBLIC_CONTRACT_ADDRESS_MAINNET=YOUR_MAINNET_CONTRACT_ADDRESS');
console.log('\n   Or set them as environment variables before running the app.\n');
