jest.mock('uuid', () => ({
  v4: jest.fn(() => 'random_uuid_123'),
}));

import { HttpErrorResponse } from '@angular/common/http';
import { discardPeriodicTasks, fakeAsync, tick } from '@angular/core/testing';
import {
  BehaviorSubject,
  delay,
  first,
  firstValueFrom,
  of,
  Subject,
  take,
  throwError,
} from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import {
  clearQueryCache,
  getQueryData,
  getQueryData$,
  invalidateQueries,
  setQueryData,
  useMutation,
  useQuery,
} from './gc-query';
import { DYNAMIC_HASH_PART_KEY } from './hash-helpers';
import { getQueryCache } from './query-cache';
import {
  createErrorMutationLoadingState,
  createInitialMutationLoadingState,
  createInitialQueryLoadingState,
  createLoadingMutationLoadingState,
  createLoadingQueryLoadingState,
  createRefetchingQueryLoadingState,
  createSuccessMutationLoadingState,
  createSuccessQueryLoadingState,
} from './query-testing-utils';

const _uuidv4: any = uuidv4;

describe('GcQuery', () => {
  afterEach(() => clearQueryCache());

  describe('useQuery', () => {
    it('should call the query function when a query is created', () => {
      const fetchData = jest.fn(() => of(1));
      useQuery('test_key', fetchData);

      expect(fetchData).toHaveBeenCalledTimes(1);
    });

    it('should call the query function when a query is created with a dynamic key', () => {
      const fetchData = jest.fn((value: number) => of(value));
      useQuery(['test_key', of(1)], fetchData);

      expect(fetchData).toHaveBeenCalledTimes(1);
      expect(fetchData).toHaveBeenCalledWith(1);
    });

    it('should call the query function when a query is created with a dynamic key without an inital value when the dynamic key source emits', () => {
      const fetchData = jest.fn((value: number) => of(value));
      const dynamicKeySource = new Subject<number>();
      useQuery(['test_key', dynamicKeySource], fetchData);
      dynamicKeySource.next(1);

      expect(fetchData).toHaveBeenCalledTimes(1);
      expect(fetchData).toHaveBeenCalledWith(1);
    });

    it('should call the query function once when multiple queries with the same key are created', () => {
      const fetchData = jest.fn(() => of(1));
      useQuery('test_key', fetchData);
      useQuery('test_key', fetchData);

      expect(fetchData).toHaveBeenCalledTimes(1);
    });

    it('should call the query function twice when multiple queries with the same key are created but the second when the data is stale', fakeAsync(() => {
      const fetchData = jest.fn(() => of(1));
      useQuery('test_key', fetchData, { staleTime: 0.001 });
      tick(100);
      useQuery('test_key', fetchData, { staleTime: 0.001 });

      expect(fetchData).toHaveBeenCalledTimes(2);
    }));

    it('should return a loading state and then a refetching loading state when two queries with the same key are created but the second when the data is stale', fakeAsync(() => {
      const fetchData = jest.fn(() => of(1).pipe(delay(50)));
      const query1 = useQuery('test_key', fetchData, { staleTime: 0.001 });

      expect(query1.getStateOnce()).toStrictEqual(
        createLoadingQueryLoadingState()
      );

      tick(100);

      const query2 = useQuery('test_key', fetchData, { staleTime: 0.001 });
      expect(query2.getStateOnce()).toStrictEqual(
        createRefetchingQueryLoadingState(1)
      );

      discardPeriodicTasks();
    }));

    it('should call the query function once when multiple queries with the same key are created but the second when the data is fresh', fakeAsync(() => {
      const fetchData = jest.fn(() => of(1));
      useQuery('test_key', fetchData, { staleTime: 60 });
      tick(100);
      useQuery('test_key', fetchData, { staleTime: 60 });

      expect(fetchData).toHaveBeenCalledTimes(1);
    }));

    it('should fetch data even if not stale when fetchOnMount = force is provided', fakeAsync(() => {
      const fetchData = jest.fn(() => of(1));
      useQuery('test_key', fetchData, { staleTime: 60 });
      tick(100);
      useQuery('test_key', fetchData, { staleTime: 60, fetchOnMount: 'force' });

      expect(fetchData).toHaveBeenCalledTimes(2);
    }));

    it('should not fetch data even if stale when fetchOnMount = false is provided', fakeAsync(() => {
      const fetchData = jest.fn(() => of(1));
      useQuery('test_key', fetchData, { staleTime: 60 });
      tick(100);
      useQuery('test_key', fetchData, { staleTime: 60, fetchOnMount: false });

      expect(fetchData).toHaveBeenCalledTimes(1);
    }));

    it('should not fetch data when enabled = false is provided', () => {
      const fetchData = jest.fn(() => of(1));
      useQuery('test_key', fetchData, { staleTime: 60 });
      useQuery('test_key', fetchData, { staleTime: 60, enabled: false });

      expect(fetchData).toHaveBeenCalledTimes(1);
    });

    it('should fetch data when enabled is set to true after init and the data is stale', fakeAsync(() => {
      const enabled$ = new BehaviorSubject(false);
      const fetchData = jest.fn(() => of(1));

      useQuery('test_key', fetchData, { staleTime: 0 });
      tick(1);
      useQuery('test_key', fetchData, {
        staleTime: 0,
        enabled: enabled$.asObservable(),
      });

      expect(fetchData).toHaveBeenCalledTimes(1);

      enabled$.next(true);

      expect(fetchData).toHaveBeenCalledTimes(2);
    }));

    it('should return the initial loading state when creating a disabled query with no previous data', () => {
      const fetchData = jest.fn(() => of(1));
      const query = useQuery('test_key', fetchData, {
        enabled: false,
      });

      query.getState$().subscribe();

      expect(fetchData).not.toHaveBeenCalled();
      expect(query.getStateOnce()).toStrictEqual(
        createInitialQueryLoadingState()
      );
      query.destroy();
    });

    it('should return the placeholder data during the initial load when provided', fakeAsync(() => {
      const fetchData = jest.fn((arg: number) =>
        of({ title: 'real data', data: arg }).pipe(delay(500))
      );

      const query = useQuery(['test_key', 1], fetchData, {
        placeholderData: (arg) => ({ title: 'placeholder data', data: arg }),
      });
      query.getState$().pipe(take(3)).subscribe();

      expect(query.getStateOnce()).toStrictEqual(
        createLoadingQueryLoadingState({
          data: { title: 'placeholder data', data: 1 },
          isPlaceholderData: true,
        })
      );

      tick(1000);

      expect(query.getStateOnce()).toStrictEqual(
        createSuccessQueryLoadingState({ title: 'real data', data: 1 })
      );

      discardPeriodicTasks();
    }));

    it('should emit to all observers when query is updated', () => {
      const source = new BehaviorSubject(1);
      const fetchData = jest.fn(() => source.asObservable());

      const query1 = useQuery('test_key', fetchData, { staleTime: 0 });
      query1.getState$().subscribe();

      source.next(2);
      query1.refetch();

      const query2 = useQuery('test_key', fetchData, { staleTime: 0 });
      query2.getState$().subscribe();

      const expectedState = createSuccessQueryLoadingState(2);

      expect(query1.getStateOnce()).toStrictEqual(expectedState);
      expect(query2.getStateOnce()).toStrictEqual(expectedState);
    });

    it('should return a state with isRefetching = true and previous data when refetch() is called', fakeAsync(() => {
      const source = new BehaviorSubject(1);
      const fetchData = jest.fn(() => source.asObservable().pipe(delay(1000)));

      const query = useQuery('test_key', fetchData, { staleTime: 0 });
      tick(1000);
      query.getState$().subscribe();

      source.next(2);
      query.refetch();

      expect(query.getStateOnce()).toStrictEqual(
        createLoadingQueryLoadingState({ data: 1, isRefetching: true })
      );

      discardPeriodicTasks();
    }));

    it('should call the query function each time the dynamic observable input emits with the value of the dynamic input', () => {
      const dependent$ = new BehaviorSubject('some important value 1');
      const fetchData = jest.fn(() => of('some value'));

      useQuery(['test_key', dependent$], fetchData, { staleTime: 0 });

      dependent$.next('some important value 2');

      expect(fetchData).toHaveBeenCalledTimes(2);
      expect(fetchData).toHaveBeenNthCalledWith(1, 'some important value 1');
      expect(fetchData).toHaveBeenNthCalledWith(2, 'some important value 2');
    });

    it('should return an object with methods for getting, updating and manipulating the state of the query', async () => {
      const fetchData = jest.fn(() => of('some value'));

      const query = useQuery('test_key', fetchData, { staleTime: 0 });
      const state = await firstValueFrom(query.getState$().pipe(first()));

      expect(query).toHaveProperty('getState$', expect.any(Function));
      expect(query).toHaveProperty('getStateOnce', expect.any(Function));
      expect(query).toHaveProperty('refetch', expect.any(Function));
      expect(query).toHaveProperty('setData', expect.any(Function));
      expect(state).toStrictEqual(createSuccessQueryLoadingState('some value'));
    });

    it('should retry fetching the data once when the retry option is true', fakeAsync(() => {
      const fetchData = jest.fn(() =>
        throwError(() => new HttpErrorResponse({ status: 500 }))
      );
      useQuery('test_key', fetchData, { retry: true, retryDelay: 5 });
      tick(50);
      expect(fetchData).toHaveBeenCalledTimes(1);

      tick(5000);

      expect(fetchData).toHaveBeenCalledTimes(2);
    }));

    it('should retry fetching the data n times when the retry option is n', fakeAsync(() => {
      const fetchData = jest.fn(() =>
        throwError(() => new HttpErrorResponse({ status: 500 }))
      );
      useQuery('test_key', fetchData, { retry: 3, retryDelay: 5 });
      tick(50);
      expect(fetchData).toHaveBeenCalledTimes(1);

      tick(15000);

      expect(fetchData).toHaveBeenCalledTimes(4);
    }));

    it('should stop retrying fetching the data when the query key changes', fakeAsync(() => {
      const dependent$ = new BehaviorSubject('value 1');
      const fetchData = jest.fn((value: string) => {
        if (value === 'value 1') {
          return throwError(
            () => new HttpErrorResponse({ status: 500, error: value })
          );
        }

        return of('success');
      });

      const query = useQuery(['test_key', dependent$], fetchData, {
        retry: 3,
        retryDelay: 5,
      });
      query.getState$().subscribe();

      tick(6000);
      expect(fetchData).toHaveBeenCalledTimes(2);

      dependent$.next('value 2');

      tick(5000);

      expect(fetchData).toHaveBeenCalledTimes(3);
      expect(fetchData).toHaveBeenNthCalledWith(1, 'value 1');
      expect(fetchData).toHaveBeenNthCalledWith(2, 'value 1');
      expect(fetchData).toHaveBeenNthCalledWith(3, 'value 2');

      discardPeriodicTasks();
    }));

    it('should refetch the data periodically when the refetchInterval option is set', fakeAsync(() => {
      const fetchData = jest.fn(() => of('some value'));
      useQuery('test_key', fetchData, { refetchInterval: 5 });

      tick(5000);
      expect(fetchData).toHaveBeenCalledTimes(2);
      tick(5000);
      expect(fetchData).toHaveBeenCalledTimes(3);

      discardPeriodicTasks();
    }));

    it('should refetch the data when stale when refetchOnWindowFocus is true and window gets focus event', fakeAsync(() => {
      const fetchData = jest.fn(() => of('some value'));
      const query = useQuery('test', fetchData, {
        refetchOnWindowFocus: true,
        staleTime: 5,
      });
      query.getState$().subscribe();

      global.dispatchEvent(new Event('focus'));
      global.dispatchEvent(new Event('focus'));

      expect(fetchData).toHaveBeenCalledTimes(1);
      tick(10000);

      global.dispatchEvent(new Event('focus'));
      tick(100);

      expect(fetchData).toHaveBeenCalledTimes(2);
      discardPeriodicTasks();
    }));

    it('should not refetch the data when stale when refetchOnWindowFocus is false', () => {
      const fetchData = jest.fn(() => of('some value'));
      useQuery('test_key', fetchData, {
        refetchOnWindowFocus: false,
      });

      global.dispatchEvent(new Event('focus'));
      global.dispatchEvent(new Event('focus'));

      expect(fetchData).toHaveBeenCalledTimes(1);
    });

    it('should refetch the data when not stale when refetchOnWindowFocus is force', () => {
      const fetchData = jest.fn(() => of('some value'));
      useQuery('test_key', fetchData, {
        refetchOnWindowFocus: 'force',
      });

      global.dispatchEvent(new Event('focus'));
      global.dispatchEvent(new Event('focus'));

      expect(fetchData).toHaveBeenCalledTimes(3);
    });

    it('should update the cached data when the setData method on the query object is called with a value', () => {
      const fetchData = jest.fn(() => of('some value'));
      const query = useQuery('test_key', fetchData);
      query.setData('some other data');
      expect(query.getStateOnce()?.data).toBe('some other data');
    });

    it('should update the cached data when the setData method on the query object is called with an updater function', () => {
      const fetchData = jest.fn(() => of(1));
      const query = useQuery('test_key', fetchData);
      query.setData((previousData) => previousData * 5);
      expect(query.getStateOnce()?.data).toBe(5);
    });

    it('should get the current state of the query when the getStateOnce method on the query object is called', () => {
      const fetchData = jest.fn(() => of(1));
      const query = useQuery('test_key', fetchData);
      expect(query.getStateOnce()).toStrictEqual(
        createSuccessQueryLoadingState(1)
      );
    });

    it('should return the data of the previous query when the dynamic query key is updated and the query is loading when the keepPreviousData option is true', fakeAsync(() => {
      const dependent$ = new BehaviorSubject(1);
      const source1 = of('source value 1');
      const source2 = of('source value 2');
      const fetchData = jest.fn((param) =>
        param === 1 ? source1 : source2.pipe(delay(1000))
      );

      const query = useQuery(['test_key', dependent$], fetchData, {
        keepPreviousData: true,
      });
      const state = query.getState$();
      state.subscribe();
      dependent$.next(2);

      tick(100);
      expect(query.getStateOnce()).toStrictEqual(
        createLoadingQueryLoadingState({
          data: 'source value 1',
          isPreviousData: true,
        })
      );

      tick(1001);
      expect(query.getStateOnce()).toStrictEqual(
        createSuccessQueryLoadingState('source value 2')
      );

      discardPeriodicTasks();
    }));

    it('should call onSuccess callback function when querying', () => {
      const queryFn = jest.fn(() => of('some value'));
      const onSuccessFn = jest.fn();

      useQuery('test_key', queryFn, { staleTime: 0, onSuccess: onSuccessFn });

      expect(onSuccessFn).toHaveBeenCalledWith('some value');
    });

    it('should call onError callback function when querying', () => {
      const error = new HttpErrorResponse({ status: 500 });
      const queryFn = jest.fn(() => throwError(() => error));
      const onErrorFn = jest.fn();

      useQuery('test_key', queryFn, {
        onError: onErrorFn,
      });

      expect(onErrorFn).toHaveBeenCalledWith(error);
    });

    it('should invalidate the cache when the query function returns an error', () => {
      const queryFn = jest.fn(() =>
        throwError(() => new HttpErrorResponse({ status: 500 }))
      );

      useQuery('test_key', queryFn, {
        retry: false,
      });

      useQuery('test_key', queryFn, {
        retry: false,
      });

      expect(queryFn).toHaveBeenCalledTimes(2);
    });

    it('should return the current query hash when getQueryKeyOnce is called', () => {
      const fetchData = jest.fn(() => of(1));
      const query = useQuery(['test_key', of({ field: 'value' })], fetchData);
      expect(query.getQueryKeyOnce()).toStrictEqual(
        `test_key${DYNAMIC_HASH_PART_KEY}{"field":"value"}`
      );
    });

    describe('initialData', () => {
      it('should not call the query function when initial data is provided', () => {
        const fetchData = jest.fn(() => of(1));
        useQuery('test_key', fetchData, { initialData: 5 });

        expect(fetchData).toHaveBeenCalledTimes(0);
      });

      it('should return the provided inital data as state when provided in query options', async () => {
        const fetchData = jest.fn(() => of(1));
        const query = useQuery('test_key', fetchData, { initialData: 5 });

        const loadingState = await firstValueFrom(query.getState$());
        expect(loadingState).toStrictEqual(createSuccessQueryLoadingState(5));
      });
    });

    describe('uniqueKey', () => {
      it('should add a uuid string to the query key when the uniqueKey query option is true', () => {
        _uuidv4.mockReturnValue('uuid_123');
        const fetchData = jest.fn(() => of(1));
        const query = useQuery('test_key', fetchData, { uniqueKeys: true });

        expect(query.getQueryKeyOnce()).toBe('test_keyuuid_123');
      });
    });
  });

  describe('setQueryData', () => {
    it('should set the query data of an existing query when a value is provided', () => {
      const query = useQuery('test_key', () => of(1), { staleTime: 0 });
      setQueryData('test_key', 2);

      expect(query.getStateOnce()?.data).toBe(2);
    });

    it('should set the query data of an existing query when an updater function is provided', () => {
      const query = useQuery('test_key', () => of(1), { staleTime: 0 });
      setQueryData<number>('test_key', (previousData) => previousData * 5);
      expect(query.getStateOnce()?.data).toBe(5);
    });

    it('should create a query cache entry with succesful data if the key does not exist', () => {
      setQueryData<number>('test_key', 10);
      expect(getQueryData('test_key')).toBe(10);
    });
  });

  describe('getQueryData', () => {
    it('should return the query data when the queryData is available', () => {
      useQuery('test_key', () => of(1), { staleTime: 0 });
      expect(getQueryData('test_key')).toBe(1);
    });

    it('should return the query data when the queryData is available and a dynamic query key is provided', () => {
      useQuery(['test_key', 1], () => of(1), { staleTime: 0 });
      expect(getQueryData(['test_key', 1])).toBe(1);
    });

    it('should return undefined when the queryData is not available', () => {
      expect(getQueryData('test_key')).toBeUndefined();
    });
  });

  describe('getQueryData$', () => {
    it('should return an observable of the cached query data', async () => {
      useQuery('test_key', () => of(1), {
        staleTime: 0,
      });
      const cachedQueryData$ = getQueryData$('test_key');

      expect((await firstValueFrom(cachedQueryData$)).data).toBe(1);
    });

    it('should return an observable of the cached query data when a dynamic query key is provided', async () => {
      useQuery(['test_key', 1], () => of(1), {
        staleTime: 0,
      });
      const cachedQueryData$ = getQueryData$(['test_key', 1]);

      expect((await firstValueFrom(cachedQueryData$)).data).toBe(1);
    });

    it('should emit updated values when the cache is updated', async () => {
      const cachedQueryData$ = getQueryData$('test_key');
      useQuery('test_key', () => of(1), {
        staleTime: 0,
      });

      expect((await firstValueFrom(cachedQueryData$)).data).toBe(1);
    });
  });

  describe('invalidateQueries', () => {
    it('should invalidate the query when the queryKey is a string', () => {
      const cache = getQueryCache();
      jest.spyOn(cache, 'invalidateQueries');

      invalidateQueries('test_key');
      expect(cache.invalidateQueries).toHaveBeenCalledWith('test_key');

      jest.clearAllMocks();
    });

    it('should refetch active queries with matching keys', fakeAsync(() => {
      const queryFn = jest.fn(() => of('data'));
      const queryFn2 = jest.fn(() => of('data'));

      useQuery('test_key', queryFn).getState$().subscribe();
      useQuery(['test_key', 1], queryFn).getState$().subscribe();
      useQuery('another_key', queryFn2).getState$().subscribe();

      invalidateQueries('test_key');

      tick(150);

      expect(queryFn).toHaveBeenCalledTimes(4);
      expect(queryFn2).toHaveBeenCalledTimes(1);

      jest.clearAllMocks();
    }));

    it('should not refetch disabled queries with matching keys', fakeAsync(() => {
      const queryFn = jest.fn(() => of('data'));

      useQuery('test_key', queryFn, { enabled: false }).getState$().subscribe();

      invalidateQueries('test_key');

      tick(150);

      expect(queryFn).not.toHaveBeenCalled();

      jest.clearAllMocks();
    }));

    it('should invalidate multiple queries when the queryKey is a string array', () => {
      const cache = getQueryCache();
      jest.spyOn(cache, 'invalidateQueries');

      invalidateQueries(['test_key', 'test_key_2']);
      expect(cache.invalidateQueries).toHaveBeenNthCalledWith(1, 'test_key');
      expect(cache.invalidateQueries).toHaveBeenNthCalledWith(2, 'test_key_2');

      jest.clearAllMocks();
    });
  });

  describe('clearQueryCache', () => {
    it('should clear the query cache when called', () => {
      const query1 = useQuery('test_key', () => of(1));
      const query2 = useQuery('test_key2', () => of(2));
      const query3 = useQuery('test_key3', () => of(3));

      clearQueryCache();

      expect(query1.getStateOnce()).toBeUndefined();
      expect(query2.getStateOnce()).toBeUndefined();
      expect(query3.getStateOnce()).toBeUndefined();
    });
  });

  describe('useMutation', () => {
    it('should return a mutation object with getState and mutate methods', () => {
      const mutationFn = jest.fn((arg) => of(arg));
      const mutation = useMutation(mutationFn);

      expect(mutation).toHaveProperty('getState$', expect.any(Function));
      expect(mutation).toHaveProperty('mutate', expect.any(Function));
    });

    it('should call the mutation function when mutate is called', () => {
      const mutationFn = jest.fn((arg: number) => of(arg));
      const mutation = useMutation(mutationFn);

      mutation.mutate(1);
      expect(mutationFn).toHaveBeenCalledWith(1);
    });

    it('should return the state and handle loading states', fakeAsync(() => {
      const mutationFn = jest.fn((arg: number) => of(arg).pipe(delay(100)));
      const mutation = useMutation(mutationFn);
      mutation.getState$().pipe(take(3)).subscribe();

      expect(mutation.getStateOnce()).toStrictEqual(
        createInitialMutationLoadingState()
      );

      mutation.mutate(1);

      expect(mutation.getStateOnce()).toStrictEqual(
        createLoadingMutationLoadingState()
      );

      tick(100);

      expect(mutation.getStateOnce()).toStrictEqual(
        createSuccessMutationLoadingState(1)
      );
    }));

    it('should handle errors', () => {
      const error = new HttpErrorResponse({ status: 500 });
      const mutationFn = jest.fn((_arg: number) =>
        throwError(() => error).pipe(delay(100))
      );

      const mutation = useMutation(mutationFn);
      mutation.getState$().pipe(take(3)).subscribe();

      expect(mutation.getStateOnce()).toStrictEqual(
        createInitialMutationLoadingState()
      );

      mutation.mutate(1);

      expect(mutation.getStateOnce()).toStrictEqual(
        createErrorMutationLoadingState(error)
      );
    });
  });

  it('should call onMutate callback function when mutating', () => {
    const mutationFn = jest.fn((arg: number) => of(arg));
    const onMutateFn = jest.fn();
    const mutation = useMutation(mutationFn, {
      onMutate: onMutateFn,
    });

    const mockRequest = 1;
    mutation.mutate(mockRequest);
    expect(onMutateFn).toHaveBeenCalledWith([mockRequest]);
  });

  it('should call onSuccess callback function when mutating', () => {
    const mutationFn = jest.fn((arg: number) => of(arg));
    const onSuccessFn = jest.fn();
    const mutation = useMutation(mutationFn, {
      onSuccess: onSuccessFn,
    });

    const mockRequest = 1;
    mutation.mutate(mockRequest);
    expect(onSuccessFn).toHaveBeenCalledWith(1, [mockRequest], undefined);
  });

  it('should call onSuccess callback function with multiple args', () => {
    const mutationFn = jest.fn((arg: number, arg2: string) => of(arg));
    const onSuccessFn = jest.fn();
    const mutation = useMutation(mutationFn, {
      onSuccess: onSuccessFn,
    });

    const request: Parameters<typeof mutationFn> = [1, '2'];

    mutation.mutate(...request);
    expect(onSuccessFn).toHaveBeenCalledWith(1, request, undefined);
  });

  it('should call onError callback function when mutating', () => {
    const error = new HttpErrorResponse({ status: 500 });
    const mutationFn = jest.fn((_arg: number) => throwError(() => error));
    const onErrorFn = jest.fn();

    const mutation = useMutation(mutationFn, {
      onError: onErrorFn,
    });

    const mockRequest = 1;
    mutation.mutate(mockRequest);
    expect(onErrorFn).toHaveBeenCalledWith(error, [mockRequest], undefined);
  });

  it('should call onError callback function with context when available and when mutating ', () => {
    const error = new HttpErrorResponse({ status: 500 });
    const mutationFn = jest.fn((_arg: number) => throwError(() => error));
    const onErrorFn = jest.fn();

    const mutation = useMutation(mutationFn, {
      onError: onErrorFn,
      onMutate: () => 'context',
    });

    const mockRequest = 1;
    mutation.mutate(mockRequest);
    expect(onErrorFn).toHaveBeenCalledWith(error, [mockRequest], 'context');
  });
});
