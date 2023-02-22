import { HttpErrorResponse } from '@angular/common/http';
import { isObservable, Observable, of } from 'rxjs';
import { hashQueryKey } from './hash-helpers';
import {
  CachedQueryLoadingState,
  CachedQueryLoadingStateMetadata,
  QueryLoadingState,
  QueryLoadingStateMetadataWithData,
  QueryPlaceholderState,
  QueryRefetchingState,
} from './query-loading-state';
import {
  DataUpdaterFunction,
  FetchOnMountOption,
  LoadingStateCalculationMetadata,
  QueryKey,
  StaticQueryKey,
  Updater,
} from './query-types';

export interface ShouldDoRequestParams {
  enabled: boolean;
  hasBeenFetched: boolean;
  fetchOnMount: FetchOnMountOption;
  isCacheStale: boolean;
}

export function getQueryKeyParts<Targ>(queryKey: QueryKey<Targ>) {
  return Array.isArray(queryKey)
    ? { key: queryKey[0], queryParam: asObservable(queryKey[1]) }
    : { key: queryKey, queryParam: undefined };
}

export function getStaticQueryKeyHash<Targ>(queryKey: StaticQueryKey<Targ>) {
  const { key, queryParam } = Array.isArray(queryKey)
    ? { key: queryKey[0], queryParam: queryKey[1] }
    : { key: queryKey, queryParam: undefined };
  return queryParam ? hashQueryKey(key, queryParam) : key;
}

export function shouldDoRequest({
  enabled,
  hasBeenFetched,
  fetchOnMount,
  isCacheStale,
}: ShouldDoRequestParams) {
  const forcedFetch = !hasBeenFetched || fetchOnMount === 'force';
  const staleFetch = fetchOnMount === true && isCacheStale;
  return enabled && (forcedFetch || staleFetch);
}

export function getInitialQueryLoadingState<
  Tdata,
  Terror = HttpErrorResponse
>(): QueryLoadingState<Tdata, Terror> {
  return {
    hasErrors: false,
    isLoading: false,
    isSuccess: false,
    isPreviousData: false,
    isPlaceholderData: false,
    isRefetching: false,
    data: undefined,
  };
}

export function getSuccessQueryLoadingState<Tdata, Terror = HttpErrorResponse>(
  data: Tdata
): QueryLoadingState<Tdata, Terror> {
  return {
    isLoading: false,
    isSuccess: true,
    hasErrors: false,
    isPreviousData: false,
    isPlaceholderData: false,
    isRefetching: false,
    data,
  };
}

export function getErrorQueryLoadingState<Tdata, Terror = HttpErrorResponse>(
  error: Terror
): QueryLoadingState<Tdata, Terror> {
  return {
    isLoading: false,
    isSuccess: false,
    isPlaceholderData: false,
    isPreviousData: false,
    isRefetching: false,
    hasErrors: true,
    error,
  };
}

export function getLoadingQueryLoadingState<
  Tdata,
  Terror = HttpErrorResponse,
  TplaceholderData = Tdata
>(
  metadata: Partial<
    QueryLoadingStateMetadataWithData<Tdata | TplaceholderData>
  > = {}
): QueryLoadingState<Tdata, Terror, TplaceholderData> {
  if (metadata.isPlaceholderData) {
    return {
      isLoading: !metadata.isRefetching,
      isSuccess: false,
      hasErrors: false,
      isPreviousData: false,
      isRefetching: !!metadata.isRefetching,
      isPlaceholderData: true,
      data: metadata.data,
    } as QueryPlaceholderState<Tdata, Terror, TplaceholderData>;
  }

  return {
    isLoading: !metadata.isRefetching,
    isSuccess: false,
    hasErrors: false,
    isPreviousData: !!metadata.isPreviousData,
    isRefetching: !!metadata.isRefetching,
    isPlaceholderData: false,
    data: metadata.data as Tdata,
  } as QueryLoadingState<Tdata, Terror, TplaceholderData>;
}

export function getRefetchingQueryLoadingState<
  Tdata,
  Terror = HttpErrorResponse,
  TplaceholderData = Tdata
>(data?: Tdata): QueryLoadingState<Tdata, Terror, TplaceholderData> {
  return {
    isLoading: false,
    isSuccess: false,
    hasErrors: false,
    isPreviousData: false,
    isRefetching: true,
    isPlaceholderData: false,
    data: data as Tdata,
  } as QueryRefetchingState<Tdata, Terror>;
}

export function getCachedInitialQueryLoadingState<
  Tdata,
  Terror = HttpErrorResponse
>(): CachedQueryLoadingState<Tdata, Terror> {
  return {
    hasErrors: false,
    isLoading: false,
    isSuccess: false,
    isRefetching: false,
    data: undefined,
  };
}

export function getCachedSuccessQueryLoadingState<
  Tdata,
  Terror = HttpErrorResponse
>(data: Tdata): CachedQueryLoadingState<Tdata, Terror> {
  return {
    isLoading: false,
    isSuccess: true,
    hasErrors: false,
    isRefetching: false,
    data,
  };
}

export function getCachedQueryLoadingState<Tdata, Terror = HttpErrorResponse>(
  metadata: Partial<CachedQueryLoadingStateMetadata<Tdata>>
): CachedQueryLoadingState<Tdata, Terror> {
  const metadataWithDefaults: CachedQueryLoadingStateMetadata<Tdata> = {
    isRefetching: false,
    data: undefined,
    ...metadata,
  };
  return {
    ...metadataWithDefaults,
    isLoading: !metadataWithDefaults.isRefetching,
    isRefetching: !!metadataWithDefaults.isRefetching,
    isSuccess: false,
    hasErrors: false,
  } as CachedQueryLoadingState<Tdata, Terror>;
}

export function getCachedErrorLoadingState<Terror = HttpErrorResponse>(
  error: Terror
): CachedQueryLoadingState<unknown, Terror> {
  return {
    isLoading: false,
    isSuccess: false,
    hasErrors: true,
    isRefetching: false,
    error,
  };
}

export function cachedToLoadingState<
  Tdata,
  Terror = HttpErrorResponse,
  TplaceholderData = Tdata
>(
  cachedLoadingState: CachedQueryLoadingState<Tdata, Terror>,
  metadata: Partial<
    QueryLoadingStateMetadataWithData<Tdata | TplaceholderData>
  > = {}
): QueryLoadingState<Tdata, Terror, TplaceholderData> {
  return {
    isPlaceholderData: false,
    isPreviousData: false,
    ...cachedLoadingState,
    ...metadata,
  } as QueryLoadingState<Tdata, Terror, TplaceholderData>;
}

export function functionalUpdate<Tinput, Toutput>(
  updater: Updater<Tinput, Toutput>,
  input: Tinput
): Toutput {
  return typeof updater === 'function'
    ? (updater as DataUpdaterFunction<Tinput, Toutput>)(input)
    : updater;
}

export function asObservable<Targ>(arg: Targ | Observable<Targ>) {
  return isObservable(arg) ? arg : of(arg);
}

export function calculateLoadingState<
  Tdata = unknown,
  Terror = HttpErrorResponse,
  TplaceholderData = Tdata
>(
  metadata: LoadingStateCalculationMetadata<Tdata, Terror, TplaceholderData>
): QueryLoadingState<Tdata, Terror, TplaceholderData> {
  const { loadingState, previousData, keepPreviousData, placeholderData } =
    metadata;
  const { isLoading, isRefetching } = loadingState;

  if (isLoading && keepPreviousData && previousData) {
    return getLoadingQueryLoadingState<Tdata, Terror, TplaceholderData>({
      data: previousData,
      isPreviousData: true,
    });
  }

  if (isLoading && !isRefetching && placeholderData !== undefined) {
    return getLoadingQueryLoadingState<Tdata, Terror, TplaceholderData>({
      isPlaceholderData: true,
      data: placeholderData,
    });
  }

  return cachedToLoadingState<Tdata, Terror, TplaceholderData>(loadingState);
}
