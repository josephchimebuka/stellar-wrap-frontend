import { Horizon } from 'stellar-sdk';

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp
  retryAfterSeconds?: number;
}

export type HorizonErrorType = 
  | 'RATE_LIMIT'
  | 'TIMEOUT'
  | 'NOT_FOUND'
  | 'SERVICE_UNAVAILABLE'
  | 'TRANSIENT_ERROR'
  | 'CLIENT_ERROR'
  | 'UNKNOWN';

export interface StructuredHorizonError {
  type: HorizonErrorType;
  status: number;
  message: string;
  rateLimit?: RateLimitInfo;
  isRetryable: boolean;
  originalError: any;
}

/**
 * Utility to parse Horizon API errors into structured objects
 */
export async function parseHorizonError(error: any): Promise<StructuredHorizonError> {
  const status = error.response?.status || 0;
  const message = error.response?.data?.title || error.message || 'Unknown Horizon Error';
  
  const rateLimit = extractRateLimitHeaders(error.response?.headers);
  
  let type: HorizonErrorType = 'UNKNOWN';
  let isRetryable = false;

  switch (status) {
    case 429:
      type = 'RATE_LIMIT';
      isRetryable = true;
      break;
    case 404:
      type = 'NOT_FOUND';
      isRetryable = false;
      break;
    case 504:
    case 408:
      type = 'TIMEOUT';
      isRetryable = true;
      break;
    case 503:
      type = 'SERVICE_UNAVAILABLE';
      isRetryable = true;
      break;
    case 500:
    case 502:
      type = 'TRANSIENT_ERROR';
      isRetryable = true;
      break;
    default:
      if (status >= 400 && status < 500) {
        type = 'CLIENT_ERROR';
        isRetryable = false;
      } else if (status >= 500) {
        type = 'TRANSIENT_ERROR';
        isRetryable = true;
      }
  }

  // Handle network connectivity issues as transient/retryable
  if (!status && (error.code === 'ECONNABORTED' || error.message?.includes('Network Error'))) {
    type = 'TIMEOUT';
    isRetryable = true;
  }

  return {
    type,
    status,
    message,
    rateLimit,
    isRetryable,
    originalError: error,
  };
}

/**
 * Extracts rate limit information from Horizon response headers
 */
function extractRateLimitHeaders(headers: any): RateLimitInfo | undefined {
  if (!headers) return undefined;

  const limit = parseInt(headers['x-ratelimit-limit'], 10);
  const remaining = parseInt(headers['x-ratelimit-remaining'], 10);
  const reset = parseInt(headers['x-ratelimit-reset'], 10);
  const retryAfter = headers['retry-after'] ? parseInt(headers['retry-after'], 10) : undefined;

  if (isNaN(limit) || isNaN(remaining) || isNaN(reset)) {
    return undefined;
  }

  return { limit, remaining, reset, retryAfterSeconds: retryAfter };
}
