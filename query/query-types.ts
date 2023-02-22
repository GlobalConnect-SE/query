import { Observable } from 'rxjs';
import { QueryCache } from './query-cache';
import { CachedQueryLoadingState } from './query-loading-state';

export type QueryParam<Targ> = Targ | Observable<Targ>;
export type DynamicQueryKey<Targ> = [queryKey: string, arg: QueryParam<Targ>];
export type StaticQueryKey<Targ> = string | [queryKey: string, arg: Targ];
export type QueryKey<Targ> = string | DynamicQueryKey<Targ>;
export type EnableOrForce = boolean | 'force';
export type FetchOnMountOption = EnableOrForce;
export type RefetchOnWindowFocusOption = EnableOrForce;
export type PlaceholderData<Targ, TplaceholderData> = (
  arg: Targ
) => TplaceholderData;

export interface QueryOptions<Tdata, Terror, Targ, TplaceholderData> {
  /** If set, this value will be used as the initial data for the query cache */
  initialData: Tdata;
  /** If set, this value will be used as the placeholder data for the query */
  placeholderData?: PlaceholderData<Targ, TplaceholderData>;
  /** If set, any previous data will be kept when fetching new data because the query key changed */
  keepPreviousData: boolean;
  /** The time in seconds after data is considered stale */
  staleTime: number;
  /** The time in seconds that unused/inactive cache data remains in memory */
  cacheTime: number;
  /** The time in seconds for periodic refetching */
  refetchInterval?: number;
  /** If true refetch on windows focus if stale, if false do not refetech, if force always refetch */
  refetchOnWindowFocus: RefetchOnWindowFocusOption;
  /** If true the failed query will retry once. If number the failed query will retry that amount of times */
  retry: boolean | number;
  /** The delay between retries in seconds */
  retryDelay: number;
  /** If the query should execute or not */
  enabled: boolean | Observable<boolean>;
  /** If true fetch if stale, if false do not fetch, if force always fetch */
  fetchOnMount: FetchOnMountOption;
  /** If true adds uuid to query keys to ensure unique keys and no cache hits */
  uniqueKeys: boolean;
  /** Callback function called with data response on successful query  */
  onSuccess?: (data: Tdata) => void;
  /** Callback function called with error response on unsuccessful query  */
  onError?: (error: Terror) => void;
}

export interface QueryConfig<Tdata, Terror, Targ, TplaceholderData> {
  cache: QueryCache;
  queryKey: string;
  queryParam?: Observable<Targ>;
  queryFn: QueryFn<Tdata, Targ>;
  options: QueryOptions<Tdata, Terror, Targ, TplaceholderData>;
}

export type QueryFn<Tdata, Targ> = (args: Targ) => Observable<Tdata>;

export type DataUpdaterFunction<Tinput, Toutput> = (input: Tinput) => Toutput;
export type Updater<Tinput, Toutput> =
  | Toutput
  | DataUpdaterFunction<Tinput, Toutput>;

export interface LoadingStateCalculationMetadata<
  Tdata,
  Terror,
  TplaceholderData
> {
  loadingState: CachedQueryLoadingState<Tdata, Terror>;
  keepPreviousData: boolean;
  previousData: Tdata | undefined;
  placeholderData: TplaceholderData;
}
