import { NextRequest, NextResponse } from 'next/server';
import { parseNetworkParam } from '../../../src/utils/networkUtils';
import { getRpcEndpoint } from '../../../src/utils/networkUtils';

/**
 * Example API route that demonstrates network parameter handling
 * GET /api/wrapped?network=mainnet|testnet
 */
export async function GET(request: NextRequest) {
  try {
    // Parse network from query parameters
    const searchParams = request.nextUrl.searchParams;
    const networkParam = searchParams.get('network');
    const network = parseNetworkParam(networkParam);

    // Get the appropriate RPC endpoint for the network
    const rpcEndpoint = getRpcEndpoint(network);

    // Example: In a real implementation, you would:
    // 1. Fetch data from the Stellar Horizon API using the rpcEndpoint
    // 2. Process the data
    // 3. Return the results
    
    // For now, return a sample response showing network awareness
    return NextResponse.json({
      success: true,
      network,
      rpcEndpoint,
      message: `Connected to ${network} network`,
      // Add your actual data here
      data: {
        // Example: transactions, account info, etc.
      }
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
