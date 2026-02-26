/**
 * Unit tests for the Achievement Calculator
 * 
 * Tests the calculateAchievements function with various scenarios:
 * - Volume calculation
 * - Asset identification
 * - Contract call counting
 * - Edge cases
 */

import { calculateAchievements } from '../achievementCalculator';

describe('AchievementCalculator - calculateAchievements', () => {
  describe('Volume Calculation', () => {
    it('should calculate zero volume for empty transactions', () => {
      const result = calculateAchievements([]);
      
      expect(result.totalVolume).toBe(0);
      expect(result.totalTransactions).toBe(0);
    });

    it('should calculate volume for single payment transaction', () => {
      const transactions = [
        {
          created_at: new Date().toISOString(),
          operations: [
            { type: 'payment', amount: '100.5', asset_code: 'XLM' }
          ]
        }
      ];

      const result = calculateAchievements(transactions);
      
      expect(result.totalVolume).toBe(100.5);
      expect(result.totalTransactions).toBe(1);
    });

    it('should calculate volume for multiple payment transactions', () => {
      const transactions = [
        {
          created_at: new Date().toISOString(),
          operations: [
            { type: 'payment', amount: '50.0', asset_code: 'XLM' }
          ]
        },
        {
          created_at: new Date().toISOString(),
          operations: [
            { type: 'payment', amount: '100.0', asset_code: 'XLM' }
          ]
        },
        {
          created_at: new Date().toISOString(),
          operations: [
            { type: 'payment', amount: '25.5', asset_code: 'XLM' }
          ]
        }
      ];

      const result = calculateAchievements(transactions);
      
      expect(result.totalVolume).toBe(175.5);
      expect(result.totalTransactions).toBe(3);
    });

    it('should handle different assets in volume calculation', () => {
      const transactions = [
        {
          created_at: new Date().toISOString(),
          operations: [
            { type: 'payment', amount: '100.0', asset_code: 'XLM' }
          ]
        },
        {
          created_at: new Date().toISOString(),
          operations: [
            { type: 'payment', amount: '50.0', asset_code: 'USDC' }
          ]
        }
      ];

      const result = calculateAchievements(transactions);
      
      expect(result.totalVolume).toBe(150.0);
    });

    it('should handle zero volume transactions', () => {
      const transactions = [
        {
          created_at: new Date().toISOString(),
          operations: [
            { type: 'accountMerge' }
          ]
        }
      ];

      const result = calculateAchievements(transactions);
      
      expect(result.totalVolume).toBe(0);
    });

    it('should handle missing amount in payment operations', () => {
      const transactions = [
        {
          created_at: new Date().toISOString(),
          operations: [
            { type: 'payment', asset_code: 'XLM' }
          ]
        }
      ];

      const result = calculateAchievements(transactions);
      
      expect(result.totalVolume).toBe(0);
    });

    it('should handle path payment operations', () => {
      const transactions = [
        {
          created_at: new Date().toISOString(),
          operations: [
            { type: 'path_payment_strict_receive', amount: '200.0', asset_code: 'XLM' }
          ]
        }
      ];

      const result = calculateAchievements(transactions);
      
      expect(result.totalVolume).toBe(200.0);
    });

    it('should handle path payment strict send operations', () => {
      const transactions = [
        {
          created_at: new Date().toISOString(),
          operations: [
            { type: 'path_payment_strict_send', amount: '150.0', asset_code: 'XLM' }
          ]
        }
      ];

      const result = calculateAchievements(transactions);
      
      expect(result.totalVolume).toBe(150.0);
    });

    it('should handle manage offer operations', () => {
      const transactions = [
        {
          created_at: new Date().toISOString(),
          operations: [
            { type: 'manage_buy_offer', amount: '75.0' }
          ]
        }
      ];

      const result = calculateAchievements(transactions);
      
      expect(result.totalVolume).toBe(75.0);
    });
  });

  describe('Asset Identification', () => {
    it('should identify XLM as most active asset by default', () => {
      const transactions = [
        {
          created_at: new Date().toISOString(),
          operations: [
            { type: 'payment', amount: '100.0', asset_code: 'XLM' }
          ]
        }
      ];

      const result = calculateAchievements(transactions);
      
      expect(result.mostActiveAsset).toBe('XLM');
    });

    it('should identify most active asset from multiple assets', () => {
      const transactions = [
        {
          created_at: new Date().toISOString(),
          operations: [
            { type: 'payment', amount: '50.0', asset_code: 'XLM' }
          ]
        },
        {
          created_at: new Date().toISOString(),
          operations: [
            { type: 'payment', amount: '200.0', asset_code: 'USDC' }
          ]
        },
        {
          created_at: new Date().toISOString(),
          operations: [
            { type: 'payment', amount: '100.0', asset_code: 'XLM' }
          ]
        }
      ];

      const result = calculateAchievements(transactions);
      
      expect(result.mostActiveAsset).toBe('USDC');
    });

    it('should handle missing asset_code (defaults to XLM)', () => {
      const transactions = [
        {
          created_at: new Date().toISOString(),
          operations: [
            { type: 'payment', amount: '100.0' }
          ]
        }
      ];

      const result = calculateAchievements(transactions);
      
      expect(result.mostActiveAsset).toBe('XLM');
    });

    it('should handle equal asset counts (first one wins)', () => {
      const transactions = [
        {
          created_at: new Date().toISOString(),
          operations: [
            { type: 'payment', amount: '100.0', asset_code: 'XLM' }
          ]
        },
        {
          created_at: new Date().toISOString(),
          operations: [
            { type: 'payment', amount: '100.0', asset_code: 'USDC' }
          ]
        }
      ];

      const result = calculateAchievements(transactions);
      
      // Should default to XLM when amounts are equal
      expect(result.mostActiveAsset).toBe('XLM');
    });
  });

  describe('Contract Call Counting', () => {
    it('should count zero contract calls for empty transactions', () => {
      const result = calculateAchievements([]);
      
      expect(result.contractCalls).toBe(0);
    });

    it('should count invokeHostFunction operations as contract calls', () => {
      const transactions = [
        {
          created_at: new Date().toISOString(),
          operations: [
            { type: 'invoke_host_function' }
          ]
        }
      ];

      const result = calculateAchievements(transactions);
      
      expect(result.contractCalls).toBe(1);
    });

    it('should count multiple contract calls', () => {
      const transactions = [
        {
          created_at: new Date().toISOString(),
          operations: [
            { type: 'invoke_host_function' }
          ]
        },
        {
          created_at: new Date().toISOString(),
          operations: [
            { type: 'invoke_host_function' }
          ]
        },
        {
          created_at: new Date().toISOString(),
          operations: [
            { type: 'invoke_host_function' }
          ]
        }
      ];

      const result = calculateAchievements(transactions);
      
      expect(result.contractCalls).toBe(3);
    });

    it('should not count non-contract operations as contract calls', () => {
      const transactions = [
        {
          created_at: new Date().toISOString(),
          operations: [
            { type: 'payment', amount: '100.0', asset_code: 'XLM' }
          ]
        }
      ];

      const result = calculateAchievements(transactions);
      
      expect(result.contractCalls).toBe(0);
    });

    it('should not count extendFootprintTtl operations as contract calls', () => {
      const transactions = [
        {
          created_at: new Date().toISOString(),
          operations: [
            { type: 'extendFootprintTtl' }
          ]
        }
      ];

      const result = calculateAchievements(transactions);
      
      // extendFootprintTtl is not counted as a contract call in the current implementation
      expect(result.contractCalls).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle transactions with no operations', () => {
      const transactions = [
        {
          created_at: new Date().toISOString()
        }
      ];

      const result = calculateAchievements(transactions);
      
      expect(result.totalVolume).toBe(0);
      expect(result.totalTransactions).toBe(1);
    });

    it('should handle transactions with missing operations array', () => {
      const transactions = [
        {
          created_at: new Date().toISOString(),
          operations: undefined
        }
      ];

      const result = calculateAchievements(transactions);
      
      expect(result.totalVolume).toBe(0);
      expect(result.totalTransactions).toBe(1);
    });

    it('should handle invalid amount strings (returns NaN)', () => {
      const transactions = [
        {
          created_at: new Date().toISOString(),
          operations: [
            { type: 'payment', amount: 'invalid', asset_code: 'XLM' }
          ]
        }
      ];

      const result = calculateAchievements(transactions);
      
      // parseFloat('invalid') returns NaN, which gets added to totalVolume
      expect(isNaN(result.totalVolume)).toBe(true);
    });

    it('should handle empty operations array', () => {
      const transactions = [
        {
          created_at: new Date().toISOString(),
          operations: []
        }
      ];

      const result = calculateAchievements(transactions);
      
      expect(result.totalVolume).toBe(0);
      expect(result.totalTransactions).toBe(1);
    });

    it('should handle large transaction sets', () => {
      const transactions = Array.from({ length: 1000 }, () => ({
        created_at: new Date().toISOString(),
        operations: [
          { type: 'payment', amount: '1.0', asset_code: 'XLM' }
        ]
      }));

      const result = calculateAchievements(transactions);
      
      expect(result.totalVolume).toBe(1000.0);
      expect(result.totalTransactions).toBe(1000);
    });
  });

  describe('Vibes Calculation', () => {
    it('should assign Whale vibe for high volume', () => {
      const transactions = Array.from({ length: 10 }, () => ({
        created_at: new Date().toISOString(),
        operations: [
          { type: 'payment', amount: '200000.0', asset_code: 'XLM' }
        ]
      }));

      const result = calculateAchievements(transactions);
      
      const whaleVibe = result.vibes.find(v => v.tag === 'Whale');
      expect(whaleVibe).toBeDefined();
    });

    it('should assign High Roller vibe for medium volume', () => {
      const transactions = Array.from({ length: 5 }, () => ({
        created_at: new Date().toISOString(),
        operations: [
          { type: 'payment', amount: '30000.0', asset_code: 'XLM' }
        ]
      }));

      const result = calculateAchievements(transactions);
      
      const highRollerVibe = result.vibes.find(v => v.tag === 'High Roller');
      expect(highRollerVibe).toBeDefined();
    });

    it('should assign Active vibe for many transactions', () => {
      const transactions = Array.from({ length: 150 }, () => ({
        created_at: new Date().toISOString(),
        operations: [
          { type: 'payment', amount: '10.0', asset_code: 'XLM' }
        ]
      }));

      const result = calculateAchievements(transactions);
      
      const activeVibe = result.vibes.find(v => v.tag === 'Active');
      expect(activeVibe).toBeDefined();
    });

    it('should assign Soroban Explorer vibe for many contract calls', () => {
      const transactions = Array.from({ length: 15 }, () => ({
        created_at: new Date().toISOString(),
        operations: [
          { type: 'invoke_host_function' }
        ]
      }));

      const result = calculateAchievements(transactions);
      
      const sorobanVibe = result.vibes.find(v => v.tag === 'Soroban Explorer');
      expect(sorobanVibe).toBeDefined();
    });

    it('should assign Bridge Master vibe for path payments', () => {
      const transactions = [
        {
          created_at: new Date().toISOString(),
          operations: [
            { type: 'path_payment_strict_receive', amount: '100.0', asset_code: 'XLM' }
          ]
        }
      ];

      const result = calculateAchievements(transactions);
      
      const bridgeVibe = result.vibes.find(v => v.tag === 'Bridge Master');
      expect(bridgeVibe).toBeDefined();
    });

    it('should assign Selective vibe for few transactions', () => {
      const transactions = Array.from({ length: 10 }, () => ({
        created_at: new Date().toISOString(),
        operations: [
          { type: 'payment', amount: '100.0', asset_code: 'XLM' }
        ]
      }));

      const result = calculateAchievements(transactions);
      
      const selectiveVibe = result.vibes.find(v => v.tag === 'Selective');
      expect(selectiveVibe).toBeDefined();
    });
  });

  describe('Dapp Detection', () => {
    it('should detect dapps from memo fields', () => {
      const transactions = [
        {
          created_at: new Date().toISOString(),
          memo: 'stellar.expert transaction',
          operations: [
            { type: 'payment', amount: '100.0', asset_code: 'XLM' }
          ]
        }
      ];

      const result = calculateAchievements(transactions);
      
      expect(result.dapps.length).toBeGreaterThan(0);
      const stellarExpert = result.dapps.find(d => d.name === 'Stellar Expert');
      expect(stellarExpert).toBeDefined();
    });

    it('should detect dapps from operation memo', () => {
      const transactions = [
        {
          created_at: new Date().toISOString(),
          operations: [
            { type: 'payment', amount: '100.0', asset_code: 'XLM', memo: 'soroban swap' }
          ]
        }
      ];

      const result = calculateAchievements(transactions);
      
      expect(result.dapps.length).toBeGreaterThan(0);
    });

    it('should not detect dapps when memo is missing', () => {
      const transactions = [
        {
          created_at: new Date().toISOString(),
          operations: [
            { type: 'payment', amount: '100.0', asset_code: 'XLM' }
          ]
        }
      ];

      const result = calculateAchievements(transactions);
      
      expect(result.dapps.length).toBe(0);
    });
  });
});
