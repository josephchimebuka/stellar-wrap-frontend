import { useState, useEffect } from 'react';
import { useRateLimitStore } from '../store/rateLimitStore';

/**
 * Hook to monitor rate limit status and provide countdown until reset
 */
export function useRateLimit() {
    const { isRateLimited, resetTime, retryAttempt, message } = useRateLimitStore();
    const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);

    useEffect(() => {
        if (!isRateLimited || !resetTime) {
            setSecondsRemaining(null);
            return;
        }

        const updateCountdown = () => {
            const remaining = Math.max(0, Math.ceil((resetTime - Date.now()) / 1000));
            setSecondsRemaining(remaining);
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);

        return () => clearInterval(interval);
    }, [isRateLimited, resetTime]);

    return {
        isRateLimited,
        secondsRemaining,
        retryAttempt,
        message
    };
}
