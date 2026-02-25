import { parseHorizonError, StructuredHorizonError } from './horizonErrorHandler';
import { useRateLimitStore } from '../store/rateLimitStore';

type RequestFn<T> = () => Promise<T>;

interface QueueItem<T> {
    request: RequestFn<T>;
    resolve: (value: T | PromiseLike<T>) => void;
    reject: (reason?: any) => void;
    attempts: number;
}

/**
 * Manages requests to the Horizon API with rate limiting and exponential backoff
 */
export class HorizonRequestQueue {
    private queue: QueueItem<any>[] = [];
    private processing = false;
    private maxAttemps = 5;
    private initialBackoff = 1000; // 1s
    private rateLimitReset: number | null = null;
    private isRateLimited = false;

    constructor(private maxConcurrency: number = 2) { }

    /**
     * Add a request to the queue and return a promise for its result
     */
    async enqueue<T>(request: RequestFn<T>): Promise<T> {
        return new Promise((resolve, reject) => {
            this.queue.push({ request, resolve, reject, attempts: 0 });
            this.processQueue();
        });
    }

    private async processQueue() {
        if (this.processing || this.queue.length === 0) return;

        // Check if we are currently globally rate limited
        if (this.isRateLimited && this.rateLimitReset) {
            const now = Date.now();
            if (now < this.rateLimitReset) {
                const waitTime = this.rateLimitReset - now;
                useRateLimitStore.getState().setRateLimited(true, this.rateLimitReset);
                setTimeout(() => this.processQueue(), waitTime + 100);
                return;
            } else {
                this.isRateLimited = false;
                this.rateLimitReset = null;
                useRateLimitStore.getState().setRateLimited(false, null);
            }
        }

        this.processing = true;

        // Process up to maxConcurrency items
        const batchSize = Math.min(this.queue.length, this.maxConcurrency);
        const batch = this.queue.splice(0, batchSize);

        await Promise.all(batch.map(item => this.executeRequest(item)));

        this.processing = false;

        // If there are more items, continue processing
        if (this.queue.length > 0) {
            this.processQueue();
        }
    }

    private async executeRequest(item: QueueItem<any>) {
        try {
            const result = await item.request();
            item.resolve(result);
        } catch (error) {
            const structuredError = await parseHorizonError(error);

            if (structuredError.isRetryable && item.attempts < this.maxAttemps) {
                item.attempts++;

                // Handle global rate limit if detected
                if (structuredError.type === 'RATE_LIMIT' && structuredError.rateLimit) {
                    this.handleRateLimit(structuredError);
                }

                const delay = this.calculateBackoff(item.attempts, structuredError);
                useRateLimitStore.getState().setRetryAttempt(item.attempts);
                useRateLimitStore.getState().setMessage(`Retrying in ${Math.ceil(delay / 1000)}s...`);

                console.warn(`Retrying Horizon request (attempt ${item.attempts}) in ${delay}ms: ${structuredError.message}`);

                setTimeout(() => {
                    this.queue.push(item);
                    this.processQueue();
                }, delay);
            } else {
                useRateLimitStore.getState().setMessage(null);
                item.reject(structuredError);
            }
        }
    }

    private handleRateLimit(error: StructuredHorizonError) {
        if (error.rateLimit) {
            // Horizon reset is in seconds since epoch
            this.rateLimitReset = error.rateLimit.reset * 1000;
            this.isRateLimited = true;

            const waitTime = Math.max(0, this.rateLimitReset - Date.now());
            console.error(`Horizon rate limit reached. Waiting ${Math.ceil(waitTime / 1000)}s until reset.`);
        }
    }

    private calculateBackoff(attempts: number, error: StructuredHorizonError): number {
        // If the error provides a retry-after, use it
        if (error.rateLimit?.retryAfterSeconds) {
            return error.rateLimit.retryAfterSeconds * 1000;
        }

        // Otherwise use exponential backoff: 2^attempt * 1000ms
        return Math.pow(2, attempts - 1) * this.initialBackoff;
    }

    /**
     * Clears the queue and resets state
     */
    clear() {
        this.queue.forEach(item => item.reject(new Error('Queue cleared')));
        this.queue = [];
        this.isRateLimited = false;
        this.rateLimitReset = null;
    }
}

// Export a singleton instance for shared use
export const horizonQueue = new HorizonRequestQueue(2);
