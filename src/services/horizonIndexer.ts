import { Horizon, Server } from 'stellar-sdk';
import { Network, RPC_ENDPOINTS } from '../config';
import { horizonQueue } from '../utils/horizonRequestQueue';

/**
 * Simple cache for API responses
 */
class ResponseCache {
    private cache = new Map<string, { data: any; timestamp: number }>();
    private ttl = 5 * 60 * 1000; // 5 minutes

    set(key: string, data: any) {
        this.cache.set(key, { data, timestamp: Date.now() });
    }

    get(key: string) {
        const entry = this.cache.get(key);
        if (!entry) return null;
        if (Date.now() - entry.timestamp > this.ttl) {
            this.cache.delete(key);
            return null;
        }
        return entry.data;
    }

    clear() {
        this.cache.clear();
    }
}

const cache = new ResponseCache();

/**
 * Service to fetch data from Stellar Horizon with rate limiting and caching
 */
export class HorizonIndexerService {
    private servers: Record<string, Server> = {};

    private getServer(network: Network): Server {
        if (!this.servers[network]) {
            this.servers[network] = new Server(RPC_ENDPOINTS[network]);
        }
        return this.servers[network];
    }

    /**
     * Fetches account details
     */
    async getAccount(address: string, network: Network): Promise<Horizon.AccountResponse> {
        const cacheKey = `account:${network}:${address}`;
        const cached = cache.get(cacheKey);
        if (cached) return cached;

        const server = this.getServer(network);
        const result = await horizonQueue.enqueue(() => server.loadAccount(address));

        cache.set(cacheKey, result);
        return result;
    }

    /**
     * Fetches payments for an account
     */
    async getPayments(address: string, network: Network, limit = 100): Promise<Horizon.ServerApi.PaymentOperationResponse[]> {
        const cacheKey = `payments:${network}:${address}:${limit}`;
        const cached = cache.get(cacheKey);
        if (cached) return cached;

        const server = this.getServer(network);
        const result = await horizonQueue.enqueue(async () => {
            const response = await server.payments().forAccount(address).limit(limit).order('desc').call();
            return response.records;
        });

        cache.set(cacheKey, result);
        return result;
    }

    /**
     * Fetches transactions for an account
     */
    async getTransactions(address: string, network: Network, limit = 100): Promise<Horizon.ServerApi.TransactionResponse[]> {
        const cacheKey = `transactions:${network}:${address}:${limit}`;
        const cached = cache.get(cacheKey);
        if (cached) return cached;

        const server = this.getServer(network);
        const result = await horizonQueue.enqueue(async () => {
            const response = await server.transactions().forAccount(address).limit(limit).order('desc').call();
            return response.records;
        });

        cache.set(cacheKey, result);
        return result;
    }

    /**
     * Clear the indexer cache
     */
    clearCache() {
        cache.clear();
    }
}

// Export singleton instance
export const horizonIndexer = new HorizonIndexerService();
