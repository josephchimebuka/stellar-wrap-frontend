import { create } from 'zustand';
import { WrappedData } from '../types';
import { GOLDEN_USER } from '../data/mockData';
import { buildApiUrl } from '../utils/networkUtils';
import { Network } from '../config';

interface WrapperStore {
    data: WrappedData | null;
    isLoading: boolean;
    isMock: boolean;
    error: string | null;
    fetchData: (address: string, network: Network) => Promise<void>;
    toggleMockMode: () => void;
    setLoading: (isLoading: boolean) => void;
    setData: (data: WrappedData | null) => void;
    setError: (error: string | null) => void;
}

export const useWrapperStore = create<WrapperStore>((set, get) => ({
    data: null,
    isLoading: false,
    isMock: false,
    error: null,

    setLoading: (isLoading) => set({ isLoading }),

    setData: (data) => set({ data }),

    setError: (error) => set({ error }),

    toggleMockMode: () => {
        const nextMockValue = !get().isMock;
        set({ isMock: nextMockValue });

        if (nextMockValue) {
            set({ data: GOLDEN_USER, error: null });
        } else {
            set({ data: null });
        }
    },

    fetchData: async (address: string, network: Network) => {
        set({ isLoading: true, error: null });

        try {
            if (get().isMock) {
                // Simulate network delay
                await new Promise((resolve) => setTimeout(resolve, 1000));
                set({ data: GOLDEN_USER, isLoading: false });
            } else {
                // Build API URL with network parameter
                const apiUrl = buildApiUrl(`/api/wrapped/${address}`, network);
                const response = await fetch(apiUrl);
                
                if (!response.ok) {
                    throw new Error(`API request failed: ${response.statusText}`);
                }
                
                const result = await response.json();
                set({ data: result, isLoading: false });
            }
        } catch (err) {
            set({
                error: err instanceof Error ? err.message : 'Failed to fetch data',
                isLoading: false
            });
        }
    },
}));

