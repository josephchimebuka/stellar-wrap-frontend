import { create } from 'zustand';

interface RateLimitState {
    isRateLimited: boolean;
    resetTime: number | null; // Unix timestamp in ms
    retryAttempt: number;
    message: string | null;

    // Setters
    setRateLimited: (isRateLimited: boolean, resetTime: number | null) => void;
    setRetryAttempt: (attempt: number) => void;
    setMessage: (message: string | null) => void;
    reset: () => void;
}

export const useRateLimitStore = create<RateLimitState>((set: (partial: Partial<RateLimitState> | ((state: RateLimitState) => Partial<RateLimitState>), replace?: boolean) => void) => ({
    isRateLimited: false,
    resetTime: null,
    retryAttempt: 0,
    message: null,

    setRateLimited: (isRateLimited: boolean, resetTime: number | null) => set({ isRateLimited, resetTime }),
    setRetryAttempt: (attempt: number) => set({ retryAttempt: attempt }),
    setMessage: (message: string | null) => set({ message }),
    reset: () => set({
        isRateLimited: false,
        resetTime: null,
        retryAttempt: 0,
        message: null
    }),
}));
