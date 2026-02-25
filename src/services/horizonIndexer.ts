import { Horizon } from 'stellar-sdk';
import { Network, RPC_ENDPOINTS } from '../config';
import { horizonQueue } from '../utils/horizonRequestQueue';


type HorizonServer = InstanceType<typeof Horizon.Server>;

interface CacheEntry {
    data: unknown;
    timestamp: number;
}

class ResponseCache {
    private cache = new Map<string, CacheEntry>();
    private ttl = 5 * 60 * 1000; // 5 minutes

    set(key: string, data: unknown) {
        this.cache.set(key, { data, timestamp: Date.now() });
    }

    get(key: string): unknown | null {
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



export class HorizonIndexerService {
    private servers: Partial<Record<Network, HorizonServer>> = {};

    private getServer(network: Network): HorizonServer {
        if (!this.servers[network]) {
            this.servers[network] = new Horizon.Server(RPC_ENDPOINTS[network]);
        }
        return this.servers[network]!;
    }

    async getAccount(address: string, network: Network): Promise<Horizon.AccountResponse> {
        const cacheKey = `account:${network}:${address}`;
        const cached = cache.get(cacheKey);
        if (cached) return cached as Horizon.AccountResponse;

        const server = this.getServer(network);
        const result = await horizonQueue.enqueue(() => server.loadAccount(address));

        cache.set(cacheKey, result);
        return result;
    }

    async getPayments(
        address: string,
        network: Network,
        limit = 100,
    ): Promise<Horizon.ServerApi.PaymentOperationRecord[]> {
        const cacheKey = `payments:${network}:${address}:${limit}`;
        const cached = cache.get(cacheKey);
        if (cached) return cached as Horizon.ServerApi.PaymentOperationRecord[];

        const server = this.getServer(network);
        const result = await horizonQueue.enqueue(async () => {
            const response = await server
                .payments()
                .forAccount(address)
                .limit(limit)
                .order('desc')
                .call();
            return response.records as Horizon.ServerApi.PaymentOperationRecord[];
        });

        cache.set(cacheKey, result);
        return result;
    }

    async getTransactions(
        address: string,
        network: Network,
        limit = 100,
    ): Promise<Horizon.ServerApi.TransactionRecord[]> {
        const cacheKey = `transactions:${network}:${address}:${limit}`;
        const cached = cache.get(cacheKey);
        if (cached) return cached as Horizon.ServerApi.TransactionRecord[];

        const server = this.getServer(network);
        const result = await horizonQueue.enqueue(async () => {
            const response = await server
                .transactions()
                .forAccount(address)
                .limit(limit)
                .order('desc')
                .call();
            return response.records;
        });

        cache.set(cacheKey, result);
        return result;
    }

    clearCache() {
        cache.clear();
    }
}

export const horizonIndexer = new HorizonIndexerService();