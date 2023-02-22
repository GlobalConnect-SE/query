import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom, isObservable, Observable, of } from 'rxjs';
import {
  asObservable,
  functionalUpdate,
  getErrorQueryLoadingState,
  getInitialQueryLoadingState,
  getLoadingQueryLoadingState,
  getQueryKeyParts,
  getSuccessQueryLoadingState,
  shouldDoRequest,
  ShouldDoRequestParams,
} from './query-helpers';

describe('QueryHelpers', () => {
  describe('getQueryKeyParts', () => {
    it('should return the key and an undefined queryParam when key input is not an array', () => {
      expect(getQueryKeyParts('query_key')).toStrictEqual({
        key: 'query_key',
        queryParam: undefined,
      });
    });

    it('should return the queryParam as an observable when the input is not an observable', async () => {
      const queryParam = getQueryKeyParts(['query_key', 1])
        .queryParam as Observable<number>;

      expect(isObservable(queryParam)).toBe(true);
      expect(await firstValueFrom(queryParam)).toBe(1);
    });

    it('should return the queryParam as an observable when the input is an observable', async () => {
      const queryParam = getQueryKeyParts(['query_key', of(1)])
        .queryParam as Observable<number>;

      expect(isObservable(queryParam)).toBe(true);
      expect(await firstValueFrom(queryParam)).toBe(1);
    });
  });

  describe('shouldDoRequest', () => {
    it.each<ShouldDoRequestParams>([
      {
        enabled: false,
        hasBeenFetched: true,
        fetchOnMount: 'force',
        isCacheStale: true,
      },
      {
        enabled: false,
        hasBeenFetched: false,
        fetchOnMount: 'force',
        isCacheStale: true,
      },
      {
        enabled: false,
        hasBeenFetched: true,
        fetchOnMount: true,
        isCacheStale: true,
      },
      {
        enabled: false,
        hasBeenFetched: true,
        fetchOnMount: false,
        isCacheStale: true,
      },
      {
        enabled: false,
        hasBeenFetched: true,
        fetchOnMount: 'force',
        isCacheStale: false,
      },
      {
        enabled: false,
        hasBeenFetched: false,
        fetchOnMount: false,
        isCacheStale: false,
      },
      {
        enabled: false,
        hasBeenFetched: true,
        fetchOnMount: 'force',
        isCacheStale: false,
      },
    ])('should return false when enabled = false', (params) => {
      expect(shouldDoRequest(params)).toBe(false);
    });

    it.each<ShouldDoRequestParams>([
      {
        enabled: true,
        hasBeenFetched: false,
        fetchOnMount: 'force',
        isCacheStale: false,
      },
      {
        enabled: true,
        hasBeenFetched: false,
        fetchOnMount: 'force',
        isCacheStale: true,
      },
      {
        enabled: true,
        hasBeenFetched: false,
        fetchOnMount: true,
        isCacheStale: false,
      },
      {
        enabled: true,
        hasBeenFetched: false,
        fetchOnMount: true,
        isCacheStale: true,
      },
      {
        enabled: true,
        hasBeenFetched: false,
        fetchOnMount: false,
        isCacheStale: false,
      },
      {
        enabled: true,
        hasBeenFetched: false,
        fetchOnMount: false,
        isCacheStale: true,
      },
      {
        enabled: true,
        hasBeenFetched: false,
        fetchOnMount: 'force',
        isCacheStale: false,
      },
    ])('should return true', (params) => {
      expect(shouldDoRequest(params)).toBe(true);
    });

    it('should return false when the query has been fetched, the cache is not stale and fetchOnMount is true', () => {
      expect(
        shouldDoRequest({
          enabled: true,
          hasBeenFetched: true,
          fetchOnMount: true,
          isCacheStale: false,
        })
      ).toBe(false);
    });
  });

  describe('getInitialQueryLoadingState', () => {
    it('should return an initial loading state', () => {
      expect(getInitialQueryLoadingState()).toStrictEqual({
        hasErrors: false,
        isLoading: false,
        isSuccess: false,
        isPreviousData: false,
        isPlaceholderData: false,
        isRefetching: false,
        data: undefined,
      });
    });
  });

  describe('getSuccessQueryLoadingState', () => {
    it('should return a success loading state with data', () => {
      expect(getSuccessQueryLoadingState({ data: 123 })).toStrictEqual({
        isLoading: false,
        isSuccess: true,
        hasErrors: false,
        isPreviousData: false,
        isPlaceholderData: false,
        isRefetching: false,
        data: { data: 123 },
      });
    });
  });

  describe('getErrorQueryLoadingState', () => {
    it('should return an error loading state', () => {
      const error = new HttpErrorResponse({ status: 500 });

      expect(getErrorQueryLoadingState(error)).toStrictEqual({
        isLoading: false,
        isSuccess: false,
        isPlaceholderData: false,
        isPreviousData: false,
        isRefetching: false,
        hasErrors: true,
        error,
      });
    });
  });

  describe('getLoadingQueryLoadingState', () => {
    it('should return a loading query loading state', () => {
      expect(
        getLoadingQueryLoadingState({ data: 1, isPlaceholderData: true })
      ).toStrictEqual({
        isLoading: true,
        isSuccess: false,
        hasErrors: false,
        isPreviousData: false,
        isRefetching: false,
        isPlaceholderData: true,
        data: 1,
      });
    });

    it('should return a loading query loading state with default metadata', () => {
      expect(getLoadingQueryLoadingState()).toStrictEqual({
        isLoading: true,
        isSuccess: false,
        hasErrors: false,
        isPreviousData: false,
        isRefetching: false,
        isPlaceholderData: false,
        data: undefined,
      });
    });
  });

  describe('functionalUpdate', () => {
    it('should return the updater input when input is not a function', () => {
      expect(functionalUpdate(123, 1)).toBe(123);
    });

    it('should return the result of the updater function called with the input', () => {
      expect(functionalUpdate((x: number) => x * 5, 5)).toBe(25);
    });
  });

  describe('asObservable', () => {
    it('should return the input as an observable if it is not', async () => {
      const result = asObservable(1);

      expect(isObservable(result)).toBe(true);
      expect(await firstValueFrom(result)).toBe(1);
    });

    it('should return the input if it is an observable', async () => {
      const result = asObservable(of(1));

      expect(isObservable(result)).toBe(true);
      expect(await firstValueFrom(result)).toBe(1);
    });
  });
});
