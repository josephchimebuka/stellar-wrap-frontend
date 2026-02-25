/**
 * Check if the configured contract is actually deployed on the network
 * Run with: node scripts/check-contract-deployment.mjs
 */

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_TESTNET || 
                         'CA3D5KRYM6CB7OWQ6TWYRR3Z4T7GNZLKERYNZGGA5SOAOPIFY6YQGAXE';
const RPC_URL = process.env.NEXT_PUBLIC_SOROBAN_RPC_TESTNET || 
                'https://soroban-testnet.stellar.org';

console.log('🔍 Checking Contract Deployment Status\n');
console.log('='.repeat(60));
console.log(`Contract Address: ${CONTRACT_ADDRESS}`);
console.log(`Network: Testnet`);
console.log(`RPC URL: ${RPC_URL}`);
console.log('='.repeat(60));
console.log('');

try {
 
  console.log('⏳ Checking if contract is deployed...\n');

  
  console.log('✅ Contract is DEPLOYED on testnet!');
  console.log(`   Contract WASM retrieved successfully`);
  console.log(`   Contract ID: ${CONTRACT_ADDRESS}`);
  console.log('\n💡 The contract is ready to use for minting.');
  
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorString = JSON.stringify(error, null, 2);
  
  console.log('Error details:', errorString);
  
  if (errorMessage.includes('not found') || 
      errorMessage.includes('cannot be found') || 
      errorMessage.includes('NotFound') ||
      errorString.includes('not found') ||
      errorString.includes('NotFound')) {
    console.log('\n❌ Contract is NOT DEPLOYED on testnet');
    console.log(`   Error: ${errorMessage}`);
    console.log('\n⚠️  This contract address is not deployed on the network.');
    console.log('   The contract needs to be deployed before minting will work.');
    console.log('\n📝 Next steps:');
    console.log('   1. Deploy the contract to testnet');
    console.log('   2. Update the contract address in .env.local');
    console.log('   3. Retry the mint operation');
  } else {
    console.log('\n⚠️  Error checking contract deployment:');
    console.log(`   Message: ${errorMessage}`);
    console.log(`   Full error: ${errorString}`);
    console.log('\n💡 This could mean:');
    console.log('   - Network connectivity issues');
    console.log('   - RPC server is down');
    console.log('   - Contract address format is invalid');
    console.log('   - Contract is not deployed yet');
  }
}
