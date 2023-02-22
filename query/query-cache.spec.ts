jest.mock('./utils/time', () => ({
  getNow: jest.fn(() => new Date('2023-02-16')),
}));

import { fakeAsync, tick } from '@angular/core/testing';
import { of, Subject, takeUntil } from 'rxjs';
import { hashQueryKey } from './hash-helpers';
import { getQueryCache, QueryCache } from './query-cache';
import {
  getCachedSuccessQueryLoadingState,
  getInitialQueryLoadingState,
  getSuccessQueryLoadingState,
} from './query-helpers';

describe('QueryCache', () => {
  const cache = new QueryCache();
  afterEach(() => cache.clear());

  it('should garbage collect when cache entry has no subscribers', fakeAsync(() => {
    const destroy$ = new Subject<void>();
    const loadingState = getInitialQueryLoadingState();

    cache.add({ queryHash: 'test_key', loadingState, cacheTime: 5 });
    const cachedQuery$ = cache
      .getOrAdd('test_key')
      .pipe(takeUntil(destroy$))
      .subscribe();
    expect(cache.getOnce('test_key')?.loadingState).toBe(loadingState);

    cachedQuery$.unsubscribe();
    tick(10000);
    expect(cache.getOnce('test_key')).toBeUndefined();
  }));

  it('should cancel garbage collect when cache entry get new observers', fakeAsync(() => {
    const destroy$ = new Subject<void>();
    const loadingState = getSuccessQueryLoadingState('data');

    cache.add({ queryHash: 'test_key', loadingState, cacheTime: 5 });
    const cachedQuery$ = cache.getOrAdd('test_key');
    cachedQuery$.pipe(takeUntil(destroy$)).subscribe();

    expect(cache.getOnce('test_key')?.loadingState).toBe(loadingState);

    destroy$.next();
    tick(4000);

    cachedQuery$.pipe(takeUntil(destroy$)).subscribe();
    tick(6000);
    expect(cache.getOnce('test_key')?.loadingState?.data).toBe('data');
  }));

  it('should update the cacheTime if a longer than current is provided', () => {
    cache.getOrAdd('test_key', undefined, 5);
    cache.getOrAdd('test_key', undefined, 15);
    cache.getOrAdd('test_key', undefined, 10);

    expect(cache.getOnce('test_key')?.cacheTime).toBe(15);
  });

  describe('invalidateQueries', () => {
    it('should invalidate all queries with the same static key as the provided key', () => {
      const staticKey = 'static_key_part';
      const queryKeys = [1, 2, 3].map((val) =>
        hashQueryKey(staticKey, of(val))
      );
      queryKeys.map((queryKey, i) => cache.getOrAdd(queryKey, i));
      cache.getOrAdd('some_other_query', 5);

      cache.invalidateQueries(staticKey);

      const queryDataArr = queryKeys.map((queryKey) => cache.getOnce(queryKey));

      expect(
        queryDataArr.every((cachedQuery) => cachedQuery?.valid === false)
      ).toBe(true);
      expect(cache.getOnce('some_other_query')?.valid).toBe(true);
    });
  });

  describe('getOnce', () => {
    it('should return the current cached value when the cached query exists', () => {
      cache.getOrAdd('test_key', 'my data');

      expect(cache.getOnce('test_key')?.loadingState).toStrictEqual(
        getCachedSuccessQueryLoadingState('my data')
      );
    });

    it('should return undefined when the the cached query does not exist', () => {
      expect(cache.getOnce('test_key')?.loadingState).toBeUndefined();
    });
  });

  describe('getUpdatedAt', () => {
    it('should return the current updatedAt value when the cached query exists', () => {
      cache.getOrAdd('test_key', 'my data');

      expect(cache.getUpdatedAt('test_key')).toBe(
        new Date('2023-02-16').getTime()
      );
    });

    it('should return undefined when the the cached query does not exist', () => {
      expect(cache.getUpdatedAt('test_key')).toBeUndefined();
    });
  });

  describe('getValidity', () => {
    it('should return the current validity of a cached query when the cached query exists', () => {
      cache.getOrAdd('test_key', 'my data');

      expect(cache.getValidity('test_key')).toBe(true);
    });

    it('should return undefined when the cached query does not exists', () => {
      expect(cache.getValidity('test_key')).toBeUndefined();
    });
  });

  describe('getHasBeenFetched', () => {
    it('should return the current fetched status of a cached query when the cached query exists', () => {
      cache.getOrAdd('test_key', 'my data');

      expect(cache.getHasBeenFetched('test_key')).toBe(true);
    });

    it('should return undefined when the cached query does not exists', () => {
      expect(cache.getHasBeenFetched('test_key')).toBeUndefined();
    });
  });

  describe('getQueryCache', () => {
    it('should return the singleton query cache', () => {
      expect(getQueryCache()).toBeDefined();
      expect(getQueryCache()).toBe(getQueryCache());
    });
  });
});
