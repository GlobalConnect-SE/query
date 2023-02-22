import { DYNAMIC_HASH_PART_KEY, hashQueryKey } from './hash-helpers';

describe('HashHelpers', () => {
  describe('hashQueryKey', () => {
    it('should return a query hash when only a key is provided', () => {
      const queryHash = hashQueryKey('test_key');
      expect(queryHash).toBe('test_key');
    });

    it('should return a query hash when a key and query param is provided', () => {
      const queryHash = hashQueryKey('test_key', { test: 'test123' });
      expect(queryHash).toBe(
        `test_key${DYNAMIC_HASH_PART_KEY}{"test":"test123"}`
      );
    });

    it('should ignore order of fields in objects', () => {
      const queryHash1 = hashQueryKey('test_key', {
        test: 'test123',
        abc: '123',
      });
      const queryHash2 = hashQueryKey('test_key', {
        abc: '123',
        test: 'test123',
      });

      expect(queryHash1).toBe(queryHash2);
    });

    it('should s', () => {
      const queryHash1 = hashQueryKey('test_key', {
        test: 'test123',
        abc: '123',
      });
      const queryHash2 = hashQueryKey('test_key', {
        abc: '123',
        test: 'test123',
      });

      expect(queryHash1).toBe(queryHash2);
    });
  });
});
