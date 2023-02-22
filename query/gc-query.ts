import { HttpErrorResponse } from '@angular/common/http';
import { map } from 'rxjs';

import { Mutation } from './mutation';
import { MutationFn, MutationOptions } from './mutation-types';
import { Query } from './query';
import { getQueryCache } from './query-cache';
import { getQueryOptions } from './query-config';
import { getQueryKeyParts, getStaticQueryKeyHash } from './query-helpers';
import {
  QueryFn,
  QueryKey,
  QueryOptions,
  StaticQueryKey,
  Updater,
} from './query-types';

const queryCache = getQueryCache();

/**
 *
 * @param queryKey Unique key representing the query
 * @param queryFn Function for fetching the query data that returns an observable
 * @param queryOptions Options for configuring the query
 * @returns Query object with state
 */
export function useQuery<
  Tdata,
  Targ,
  Terror = HttpErrorResponse,
  TplaceholderData = Tdata
>(
  queryKey: QueryKey<Targ>,
  queryFn: QueryFn<Tdata, Targ>,
  queryOptions: Partial<
    QueryOptions<Tdata, Terror, Targ, TplaceholderData>
  > = {}
): Query<Tdata, Terror, Targ, TplaceholderData> {
  const { key, queryParam } = getQueryKeyParts(queryKey);

  const optionsWithDefaults = getQueryOptions<
    Tdata,
    Terror,
    Targ,
    TplaceholderData
  >(queryOptions);

  return new Query<Tdata, Terror, Targ, TplaceholderData>({
    queryKey: key,
    queryFn,
    queryParam,
    options: optionsWithDefaults,
    cache: queryCache,
  });
}

export function useMutation<
  Tdata,
  Targ extends unknown[],
  Terror = HttpErrorResponse,
  Tcontext = Tdata
>(
  mutationFn: MutationFn<Tdata, Targ>,
  mutationOptions: MutationOptions<Tdata, Terror, Targ, Tcontext> = {}
): Mutation<Tdata, Targ, Terror, Tcontext> {
  return new Mutation<Tdata, Targ, Terror, Tcontext>({
    mutationFn,
    options: mutationOptions,
  });
}

/**
 *
 * @param queryKey key representing the query
 * @returns Observable of the query loading state represented by the key
 */
export function getQueryData$<Tdata, Targ = unknown>(
  queryKey: StaticQueryKey<Targ>
) {
  const queryHash = getStaticQueryKeyHash(queryKey);

  return queryCache
    .getOrAdd<Tdata>(queryHash)
    .pipe(map((cachedQuery) => cachedQuery.loadingState));
}

/**
 *
 * @param queryKey key representing the query
 * @returns Snapshot of current query data
 */
export function getQueryData<Tdata, Targ = unknown>(
  queryKey: StaticQueryKey<Targ>
) {
  const queryHash = getStaticQueryKeyHash(queryKey);
  return queryCache.getOnce<Tdata>(queryHash)?.loadingState?.data;
}

export function setQueryData<Tinput, Toutput = Tinput, Targ = unknown>(
  queryKey: StaticQueryKey<Targ>,
  updater: Updater<Tinput, Toutput>
) {
  const queryHash = getStaticQueryKeyHash(queryKey);
  queryCache.updateData(queryHash, updater);
}

export function clearQueryCache() {
  queryCache.clear();
}

/**
 * Invalidates all cached queries with the provided static query key
 * @param queryKey Static query key
 */
export function invalidateQueries(queryKey: string | string[]) {
  if (Array.isArray(queryKey)) {
    queryKey.forEach((key) => queryCache.invalidateQueries(key));
  } else {
    queryCache.invalidateQueries(queryKey);
  }
}
