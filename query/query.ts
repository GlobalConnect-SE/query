import {
  BehaviorSubject,
  combineLatest,
  delay,
  filter,
  first,
  fromEvent,
  interval,
  map,
  Observable,
  of,
  pairwise,
  startWith,
  Subject,
  Subscription,
  switchMap,
  take,
  takeUntil,
  tap,
  withLatestFrom,
} from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { hashQueryKey } from './hash-helpers';
import { QueryCache } from './query-cache';
import {
  asObservable,
  cachedToLoadingState,
  calculateLoadingState,
  functionalUpdate,
  getCachedErrorLoadingState,
  getCachedQueryLoadingState,
  getCachedSuccessQueryLoadingState,
  shouldDoRequest,
} from './query-helpers';
import {
  CachedQueryLoadingState,
  QueryLoadingState,
  QueryLoadingStateMetadataWithData,
} from './query-loading-state';
import {
  FetchOnMountOption,
  PlaceholderData,
  QueryConfig,
  QueryFn,
  QueryOptions,
  RefetchOnWindowFocusOption,
} from './query-types';
import { getNow } from './utils/time';

export class Query<Tdata, Terror, Targ, TplaceholderData> {
  private queryFn: QueryFn<Tdata, Targ>;
  private onSuccess: ((data: Tdata) => void) | undefined;
  private onError: ((error: Terror) => void) | undefined;
  private state$: Observable<
    QueryLoadingState<Tdata, Terror, TplaceholderData>
  >;
  private initialData: Tdata | undefined;
  private placeholderData: PlaceholderData<Targ, TplaceholderData> | undefined;
  private staleTime: number;
  private refetchInterval: number | undefined;
  private refetchIntervalSub: Subscription | undefined;
  private keepPreviousData: boolean;
  private retry: boolean | number;
  private retryDelay: number;
  private retrySubscription: Subscription | undefined;
  private queryCache: QueryCache;
  private queryParam$: Observable<Targ>;
  private queryHash$ = new BehaviorSubject('');
  private cachedQuery$ = this.getCachedQuery$();
  private placeholderData$: Observable<TplaceholderData | undefined>;
  private cacheTime = 0;
  private cancelRequest$ = new Subject<void>();
  private lastValue:
    | QueryLoadingState<Tdata, Terror, TplaceholderData>
    | undefined;
  private enabled: Observable<boolean>;
  private fetchOnMount: FetchOnMountOption;
  private refetchOnWindowFocus: RefetchOnWindowFocusOption;
  private destroy$ = new Subject<void>();
  private options: QueryOptions<Tdata, Terror, Targ, TplaceholderData>;

  constructor(queryConfig: QueryConfig<Tdata, Terror, Targ, TplaceholderData>) {
    this.queryCache = queryConfig.cache;
    this.queryFn = queryConfig.queryFn;
    this.setOptions(queryConfig.options);
    this.queryHash$.next(this.buildQueryKey(queryConfig.queryKey));

    if (this.refetchOnWindowFocus) {
      this.setOnWindowsFocusRefetching();
    }

    this.queryParam$ = asObservable(
      queryConfig.queryParam as Targ | Observable<Targ>
    );

    this.state$ = this._getState$();
    this.placeholderData$ = this.getPlaceholderData$();
    this.setupDataFetching(queryConfig.queryKey);
    this.setupInvalidationRefetching();
  }

  private setOptions(
    options: QueryOptions<Tdata, Terror, Targ, TplaceholderData>
  ) {
    this.options = options;
    this.onSuccess = options.onSuccess;
    this.onError = options.onError;
    this.initialData = options.initialData;
    this.staleTime = options.staleTime;
    this.keepPreviousData = options.keepPreviousData;
    this.refetchInterval = options.refetchInterval;
    this.retry = options.retry;
    this.retryDelay = options.retryDelay;
    this.cacheTime = options.cacheTime;
    this.fetchOnMount = options.fetchOnMount;
    this.refetchOnWindowFocus = options.refetchOnWindowFocus;
    this.enabled = asObservable(options.enabled);
    this.placeholderData = options.placeholderData;
  }

  private get isCacheStale() {
    const queryHash = this.queryHash$.value;
    const cacheIsValid = this.queryCache.getValidity(queryHash);
    const cacheUpdatedAt = this.queryCache.getUpdatedAt(queryHash);

    if (!cacheUpdatedAt || !cacheIsValid) {
      return true;
    }

    return getNow().getTime() - cacheUpdatedAt > this.staleTime * 1000;
  }

  getState$(): Observable<QueryLoadingState<Tdata, Terror, TplaceholderData>> {
    return this.state$;
  }

  getStateOnce():
    | QueryLoadingState<Tdata, Terror, TplaceholderData>
    | undefined {
    if (this.lastValue) {
      return this.lastValue;
    }

    const cachedQueryLoadingState = this.queryCache.getOnce<Tdata, Terror>(
      this.queryHash$.value
    )?.loadingState;

    return (
      cachedQueryLoadingState && cachedToLoadingState(cachedQueryLoadingState)
    );
  }

  getQueryKeyOnce() {
    return this.queryHash$.value;
  }

  setData(updater: Tdata | ((oldData: Tdata) => Tdata)) {
    const prevData = this.queryCache.getOnce<Tdata>(this.queryHash$.value)
      ?.loadingState.data as Tdata;
    const data = functionalUpdate(updater, prevData);
    const loadingState: CachedQueryLoadingState<Tdata, any> =
      getCachedSuccessQueryLoadingState(data);

    this.lastValue = cachedToLoadingState(loadingState);
    this.queryCache.setQuery(this.queryHash$.value, loadingState);
  }

  refetch() {
    this.cancelRequest$.next();
    this.queryParam$.pipe(first()).subscribe((queryParam) =>
      this.doQueryRequest(queryParam, {
        data: this.lastValue?.data,
        isRefetching: true,
      })
    );
  }

  destroy() {
    this.destroy$.next();
  }

  private buildQueryKey(queryKey: string, queryParam?: Targ) {
    const uniqueSuffix = this.options.uniqueKeys ? uuidv4() : '';
    return hashQueryKey(queryKey + uniqueSuffix, queryParam);
  }

  private _getState$() {
    return this.queryHash$.pipe(
      startWith(''),
      pairwise(),
      tap(([previousQueryHash, queryHash]) => {
        if (previousQueryHash !== '' && previousQueryHash !== queryHash) {
          this.retrySubscription?.unsubscribe();
        }
      }),
      switchMap(([previousQueryHash]) =>
        combineLatest([
          this.getPreviousCachedQuery$(previousQueryHash),
          this.cachedQuery$,
          this.placeholderData$,
        ])
      ),
      map(([previousCachedQuery, cachedQuery, placeholderData]) => {
        const loadingState = calculateLoadingState({
          loadingState: cachedQuery.loadingState,
          keepPreviousData: this.keepPreviousData,
          previousData: previousCachedQuery?.loadingState.data,
          placeholderData,
        }) as QueryLoadingState<Tdata, Terror, TplaceholderData>;

        this.lastValue = loadingState;
        return loadingState;
      }),
      takeUntil(this.destroy$)
    );
  }

  private setupDataFetching(queryKey: string) {
    combineLatest([this.queryParam$, this.enabled])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([queryParam, enabled]) => {
        const queryHash = this.buildQueryKey(queryKey, queryParam);
        this.queryHash$.next(queryHash);
        this.getOrAddCachedQuery(queryHash);

        const hasBeenFetched =
          this.queryCache.getHasBeenFetched(this.queryHash$.value) ?? false;

        if (
          shouldDoRequest({
            enabled,
            hasBeenFetched,
            fetchOnMount: this.fetchOnMount,
            isCacheStale: this.isCacheStale,
          })
        ) {
          this.doQueryRequest(queryParam, {
            isRefetching: hasBeenFetched,
            data: this.getStateOnce()?.data,
          });
        }
      });
  }

  private doQueryRequest(
    arg: Targ,
    metaData: Partial<
      QueryLoadingStateMetadataWithData<Tdata | TplaceholderData>
    > = {}
  ) {
    const currentQueryHash = this.queryHash$.value;
    this.setLoadingState(currentQueryHash, metaData);
    this.setRefetchTimer();

    this.queryFn(arg)
      .pipe(first())
      .subscribe({
        next: (response) => {
          this.handleSuccessResponse(response, currentQueryHash);
        },
        error: (error: Terror) => {
          this.handleErrorResponse(error, currentQueryHash);
        },
      });
  }

  private setRefetchTimer() {
    if (!this.refetchInterval) {
      return;
    }

    this.refetchIntervalSub?.unsubscribe();
    this.refetchIntervalSub = interval(this.refetchInterval * 1000)
      .pipe(
        takeUntil(this.destroy$),
        withLatestFrom(this.queryParam$),
        tap(([, queryParam]) =>
          this.doQueryRequest(queryParam, { isRefetching: true })
        )
      )
      .subscribe();
  }

  private setRetryTimer() {
    if (!this.retry || !this.retryDelay || this.retrySubscription) {
      return;
    }

    const numberOfRetries = typeof this.retry === 'number' ? this.retry : 1;

    this.retrySubscription = interval(this.retryDelay * 1000)
      .pipe(
        take(numberOfRetries),
        takeUntil(this.destroy$),
        withLatestFrom(this.queryParam$),
        tap(([, queryParam]) => this.doQueryRequest(queryParam))
      )
      .subscribe();
  }

  private setOnWindowsFocusRefetching() {
    fromEvent<FocusEvent>(window, 'focus')
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.onFocusRefetch());
  }

  private onFocusRefetch = () => {
    if (this.refetchOnWindowFocus === 'force' || this.isCacheStale) {
      this.refetch();
    }
  };

  private setupInvalidationRefetching() {
    const INVALIDATION_REFETCH_DELAY = 100;

    combineLatest([this.cachedQuery$, this.enabled])
      .pipe(
        takeUntil(this.destroy$),
        filter(([cachedQuery, enabled]) => {
          const { hasErrors } = cachedQuery.loadingState;
          return !cachedQuery.valid && !hasErrors && enabled;
        }),
        delay(INVALIDATION_REFETCH_DELAY)
      )
      .subscribe(([cachedQuery]) => {
        if (this.queryCache.consumeInvalidation(cachedQuery.queryHash)) {
          this.refetch();
        }
      });
  }

  private getPreviousCachedQuery$(queryHash: string) {
    return queryHash
      ? this.queryCache
          .getOrAdd<Tdata, Terror>(queryHash, undefined, this.cacheTime)
          .pipe(takeUntil(this.destroy$))
      : of(null);
  }

  private getCachedQuery$() {
    return this.queryHash$.pipe(
      switchMap((queryHash) => this.getOrAddCachedQuery(queryHash))
    );
  }

  private getOrAddCachedQuery = (queryHash: string) => {
    return this.queryCache
      .getOrAdd<Tdata, Terror>(queryHash, this.initialData, this.cacheTime)
      .pipe(takeUntil(this.destroy$));
  };

  private getPlaceholderData$() {
    return this.queryParam$.pipe(
      startWith(undefined),
      switchMap((queryParam) => {
        if (!this.placeholderData || queryParam === undefined) {
          return of(undefined);
        }

        return asObservable(this.placeholderData(queryParam));
      }),
      takeUntil(this.destroy$)
    );
  }

  private setLoadingState(
    queryHash: string,
    metadata: Partial<QueryLoadingStateMetadataWithData>
  ) {
    this.queryCache.setQuery(queryHash, getCachedQueryLoadingState(metadata));
  }

  private handleSuccessResponse(response: Tdata, queryHash: string) {
    this.onSuccess?.(response);
    this.queryCache.setQuery(
      queryHash,
      getCachedSuccessQueryLoadingState(response)
    );
  }

  private handleErrorResponse(error: Terror, queryHash: string) {
    this.onError?.(error);
    this.setRetryTimer();

    this.queryCache.setQuery(
      queryHash,
      getCachedErrorLoadingState(error),
      false
    );
  }
}
