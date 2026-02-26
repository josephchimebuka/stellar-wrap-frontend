# Unit Tests

Tests for the indexer and achievement calculator services.

## Running Tests

```bash
# Run all tests
npm test

# Run specific test files
npm test -- app/services/__tests__/achievementCalculator.unit.test.ts
npm test -- app/services/__tests__/indexerService.unit.test.ts

# Run with coverage
npm test -- --coverage
```

## Test Files

The actual test files are in `app/services/__tests__/`:

- `achievementCalculator.unit.test.ts` - Tests for the achievement calculator (31 tests)
- `indexerService.unit.test.ts` - Tests for the indexer service (12 tests)

There are also some older test files in `src/services/` that were written before implementation, but the working tests are in `app/services/__tests__/`.

## Test Structure

Tests are organized by what they're testing:

**Achievement Calculator:**
- Volume calculation (single payments, multiple payments, different assets)
- Asset identification (XLM, issued assets, most active asset)
- Contract call counting (invokeHostFunction operations)
- Edge cases (empty transactions, missing data, invalid amounts)
- Vibes calculation (Whale, High Roller, Active, Soroban Explorer, etc.)
- Dapp detection (from memo fields)

**Indexer Service:**
- Transaction fetching (valid accounts, pagination)
- Error handling (404, 429, 500, timeouts, unknown errors)
- Cache handling (returning cached results, fetching fresh data)
- Network support (mainnet, testnet)
- Period support (weekly, monthly, yearly)

## Test Data

We use mocks for most test data. The indexer service tests mock the Horizon API responses, and the achievement calculator tests use simple transaction objects.

Example test data:
```typescript
const transactions = [
  {
    created_at: new Date().toISOString(),
    operations: [
      { type: 'payment', amount: '100.0', asset_code: 'XLM' }
    ]
  }
];
```

For the indexer service, we mock the Horizon server builder chain:
```typescript
mockServer.transactions().forAccount().limit().call.mockResolvedValue({ records: [] });
```

## Coverage

We aim for 80%+ coverage. Current status:

- **Achievement Calculator**: 100% statements, 90% branches
- **Indexer Service**: Tests passing (coverage not measured separately)

Coverage thresholds are set in `jest.config.js`:
- Branches: 80%
- Functions: 80%
- Lines: 80%
- Statements: 80%

## Writing New Tests

When adding tests:

1. Put them in `app/services/__tests__/` with a `.unit.test.ts` suffix
2. Mock external dependencies (Horizon API, cache, etc.)
3. Test both success and error cases
4. Keep tests isolated - each test should work independently
5. Use descriptive test names like `should handle 404 account not found error`

## Common Issues

**Tests timing out**: Some indexer service tests need longer timeouts (15-30 seconds) because they involve async operations and timers. We've set `testTimeout` in those tests.

**Mocking Horizon API**: The builder pattern (`transactions().forAccount().limit().call()`) needs to be mocked carefully. See `indexerService.unit.test.ts` for the pattern we use.

**Cache tests**: Make sure to mock both `getCacheEntry` and the `isCacheValid` function from the indexer utils when testing cache behavior.
