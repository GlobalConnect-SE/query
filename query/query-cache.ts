import { BehaviorSubject, finalize, first, Observable, tap, timer } from 'rxjs';
import { DYNAMIC_HASH_PART_KEY } from './hash-helpers';
import { DEFAULT_CACHE_TIME } from './query-defaults';
import {
  functionalUpdate,
  getCachedInitialQueryLoadingState,
  getCachedSuccessQueryLoadingState,
} from './query-helpers';
import { CachedQueryLoadingState } from './query-loading-state';
import { Updater } from './query-types';
import { getNow } from './utils/time';

type CachedQuery<Tdata = unknown, Terror = unknown> = {
  updatedAt: number | undefined;
  queryHash: string;
  loadingState: CachedQueryLoadingState<Tdata, Terror>;
  hasBeenFetched: boolean;
  cacheTime: number;
  valid: boolean;
};

interface AddQueryConfig<Tdata = unknown, Terror = unknown> {
  queryHash: string;
  loadingState: CachedQueryLoadingState<Tdata, Terror>;
  isInitialData?: boolean;
  hasBeenFetched?: boolean;
  cacheTime?: number;
}

export class QueryCache {
  private cache: Record<string, BehaviorSubject<CachedQuery<any, any>>> = {};
  private invalidationQueue = new Set<string>();

  add({
    queryHash,
    loadingState,
    isInitialData = false,
    cacheTime = DEFAULT_CACHE_TIME,
  }: AddQueryConfig) {
    if (!this.cache[queryHash]) {
      this.cache[queryHash] = new BehaviorSubject<CachedQuery>({
        queryHash,
        loadingState: loadingState,
        hasBeenFetched: isInitialData,
        updatedAt: isInitialData ? getNow().getTime() : undefined,
        cacheTime,
        valid: true,
      });
    }
    return this.cache[queryHash];
  }

  setQuery<Tdata, Terror>(
    queryHash: string,
    loadingState: CachedQueryLoadingState<Tdata, Terror>,
    valid = true
  ) {
    if (this.cache[queryHash]) {
      const currentValue = this.cache[queryHash].value;
      const hasBeenFetched =
        currentValue.hasBeenFetched ||
        loadingState.isLoading ||
        loadingState.isSuccess ||
        loadingState.hasErrors;

      this.cache[queryHash].next({
        ...currentValue,
        updatedAt: getNow().getTime(),
        hasBeenFetched,
        queryHash,
        loadingState,
        valid,
      });
    } else {
      this.add({ queryHash, loadingState, isInitialData: false });
    }
  }

  updateData<Tinput, Toutput>(
    queryHash: string,
    updater: Updater<Tinput, Toutput>
  ) {
    const prevData = this.cache[queryHash]?.value.loadingState.data;
    const data = functionalUpdate(updater, prevData);
    const loadingState = getCachedSuccessQueryLoadingState(data);
    this.setQuery(queryHash, loadingState);
  }

  getOrAdd<Tdata = unknown, Terror = unknown>(
    queryHash: string,
    initialData?: Tdata,
    cacheTime?: number
  ): Observable<CachedQuery<Tdata, Terror>> {
    const cachedQuery =
      this.cache[queryHash] ??
      this.add({
        queryHash,
        loadingState: initialData
          ? getCachedSuccessQueryLoadingState(initialData)
          : getCachedInitialQueryLoadingState(),
        isInitialData: !!initialData,
        cacheTime,
      });

    if (cacheTime && cacheTime > cachedQuery.value.cacheTime) {
      this.updateCacheTime(queryHash, cacheTime);
    }

    return cachedQuery.pipe(
      finalize(() => {
        if (!cachedQuery.observed) {
          this.queueGarbageCollection(queryHash, cachedQuery.value.cacheTime);
        }
      })
    );
  }

  getOnce<Tdata = unknown, Terror = unknown>(
    queryHash: string
  ): CachedQuery<Tdata, Terror> | undefined {
    return this.cache[queryHash]?.value;
  }

  getUpdatedAt(queryHash: string): number | undefined {
    return this.cache[queryHash]?.value.updatedAt;
  }

  getValidity(queryHash: string): boolean | undefined {
    return this.cache[queryHash]?.value.valid;
  }

  getHasBeenFetched(queryHash: string): boolean | undefined {
    return this.cache[queryHash]?.value.hasBeenFetched;
  }

  remove(queryHash: string) {
    if (this.cache[queryHash]) {
      this.cache[queryHash].complete();
      delete this.cache[queryHash];
    }
  }

  consumeInvalidation(queryHash: string) {
    const shouldBeInvalidated = this.invalidationQueue.has(queryHash);
    this.invalidationQueue.delete(queryHash);

    return shouldBeInvalidated;
  }

  private invalidateQuery<Tdata = unknown, Terror = unknown>(
    queryHash: string
  ) {
    const cachedQuery: BehaviorSubject<CachedQuery<Tdata, Terror>> | undefined =
      this.cache[queryHash];

    if (cachedQuery) {
      this.markHashForInvalidation(queryHash);
      this.setQuery(queryHash, { ...cachedQuery.value.loadingState }, false);
    }
  }

  private markHashForInvalidation(queryHash: string) {
    this.invalidationQueue.add(queryHash);
  }

  invalidateQueries = (queryHash: string) => {
    const affectedKeys = this.getHashesByStaticKey(queryHash);
    affectedKeys.forEach((affectedKey) => this.invalidateQuery(affectedKey));
  };

  clear() {
    Object.keys(this.cache).forEach((cacheKey) => this.remove(cacheKey));
  }

  private getHashesByStaticKey(queryHash: string) {
    const cacheKeys = Object.keys(this.cache);
    return cacheKeys.filter(
      (cacheKey) => cacheKey.split(DYNAMIC_HASH_PART_KEY)[0] === queryHash
    );
  }

  private updateCacheTime(queryHash: string, cacheTime: number) {
    const cachedQuery = this.cache[queryHash];
    cachedQuery.next({ ...cachedQuery.value, cacheTime });
  }

  private queueGarbageCollection(queryHash: string, cacheTime: number) {
    const cachedQuery = this.cache[queryHash];

    timer(cacheTime * 1000)
      .pipe(
        first(),
        tap(() => {
          if (!cachedQuery || cachedQuery.observed) {
            return;
          }

          cachedQuery.complete();
          delete this.cache[queryHash];
        })
      )
      .subscribe();
  }
}

const queryCacheSingleton = new QueryCache();
export const getQueryCache = () => queryCacheSingleton;
