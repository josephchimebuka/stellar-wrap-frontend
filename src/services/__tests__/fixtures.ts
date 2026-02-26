/**
 * Test data fixtures for service unit tests
 * 
 * These fixtures provide realistic test data scenarios for various edge cases
 */

import { IndexedTransaction } from '../indexer/types';
import {
  createMockIndexedTransaction,
  createMockOperation,
  createMockPaymentOperation,
  createMockContractOperation,
  createMockExtendFootprintOperation,
  createTransactionsInTimeframe,
  createTransactionsOutsideTimeframe,
} from './test-utils';

/**
 * Empty transaction array fixture
 */
export const EMPTY_TRANSACTIONS: IndexedTransaction[] = [];

/**
 * Single transaction fixture
 */
export const SINGLE_TRANSACTION: IndexedTransaction[] = [
  createMockIndexedTransaction(
    {},
    [createMockPaymentOperation('100.0', 'XLM')]
  ),
];

/**
 * Multiple transactions with native XLM payments
 */
export const XLM_PAYMENT_TRANSACTIONS: IndexedTransaction[] = [
  createMockIndexedTransaction(
    {},
    [createMockPaymentOperation('50.0', 'XLM')]
  ),
  createMockIndexedTransaction(
    {},
    [createMockPaymentOperation('100.0', 'XLM')]
  ),
  createMockIndexedTransaction(
    {},
    [createMockPaymentOperation('25.5', 'XLM')]
  ),
];

/**
 * Transactions with issued assets
 */
export const ISSUED_ASSET_TRANSACTIONS: IndexedTransaction[] = [
  createMockIndexedTransaction(
    {},
    [createMockPaymentOperation('100.0', 'USDC', 'GABCDEF123456789')]
  ),
  createMockIndexedTransaction(
    {},
    [createMockPaymentOperation('200.0', 'USDT', 'GZYXWV987654321')]
  ),
  createMockIndexedTransaction(
    {},
    [createMockPaymentOperation('50.0', 'XLM')]
  ),
];

/**
 * Transactions with contract calls
 */
export const CONTRACT_CALL_TRANSACTIONS: IndexedTransaction[] = [
  createMockIndexedTransaction(
    {},
    [createMockContractOperation('CONTRACT1', 'transfer')]
  ),
  createMockIndexedTransaction(
    {},
    [createMockContractOperation('CONTRACT1', 'approve')]
  ),
  createMockIndexedTransaction(
    {},
    [createMockExtendFootprintOperation('CONTRACT2')]
  ),
];

/**
 * Mixed transaction types
 */
export const MIXED_TRANSACTIONS: IndexedTransaction[] = [
  createMockIndexedTransaction(
    {},
    [createMockPaymentOperation('100.0', 'XLM')]
  ),
  createMockIndexedTransaction(
    {},
    [createMockContractOperation('CONTRACT1', 'transfer')]
  ),
  createMockIndexedTransaction(
    {},
    [createMockPaymentOperation('50.0', 'USDC', 'GABCDEF123456789')]
  ),
  createMockIndexedTransaction(
    {},
    [createMockExtendFootprintOperation('CONTRACT2')]
  ),
];

/**
 * Transactions within 1 week timeframe
 */
export const ONE_WEEK_TRANSACTIONS: IndexedTransaction[] = 
  createTransactionsInTimeframe(5, '1w');

/**
 * Transactions within 2 week timeframe
 */
export const TWO_WEEK_TRANSACTIONS: IndexedTransaction[] = 
  createTransactionsInTimeframe(10, '2w');

/**
 * Transactions within 1 month timeframe
 */
export const ONE_MONTH_TRANSACTIONS: IndexedTransaction[] = 
  createTransactionsInTimeframe(20, '1m');

/**
 * Transactions outside 1 week timeframe
 */
export const OUTSIDE_ONE_WEEK_TRANSACTIONS: IndexedTransaction[] = 
  createTransactionsOutsideTimeframe(3, '1w');

/**
 * Transactions with zero volume
 */
export const ZERO_VOLUME_TRANSACTIONS: IndexedTransaction[] = [
  createMockIndexedTransaction(
    {},
    [createMockOperation({ type: 'accountMerge', type_i: 8 })]
  ),
  createMockIndexedTransaction(
    {},
    [createMockOperation({ type: 'setOptions', type_i: 5 })]
  ),
];

/**
 * Transactions with missing data
 */
export const INCOMPLETE_TRANSACTIONS: IndexedTransaction[] = [
  createMockIndexedTransaction({
    hash: '',
    source_account: '',
  }),
  createMockIndexedTransaction({
    created_at: '',
  }),
];

/**
 * Large volume of transactions
 */
export const LARGE_TRANSACTION_SET: IndexedTransaction[] = 
  Array.from({ length: 100 }, () => 
    createMockIndexedTransaction(
      {},
      [createMockPaymentOperation('10.0', 'XLM')]
    )
  );

/**
 * Transactions with equal asset counts (for tie-breaking tests)
 */
export const EQUAL_ASSET_COUNT_TRANSACTIONS: IndexedTransaction[] = [
  createMockIndexedTransaction(
    {},
    [createMockPaymentOperation('100.0', 'USDC', 'GABCDEF123456789')]
  ),
  createMockIndexedTransaction(
    {},
    [createMockPaymentOperation('100.0', 'USDT', 'GZYXWV987654321')]
  ),
  createMockIndexedTransaction(
    {},
    [createMockPaymentOperation('100.0', 'USDC', 'GABCDEF123456789')]
  ),
  createMockIndexedTransaction(
    {},
    [createMockPaymentOperation('100.0', 'USDT', 'GZYXWV987654321')]
  ),
];
