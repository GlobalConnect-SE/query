# GlobalConnect Query
hej
Angular library inspired by [Tanstack/query](https://github.com/tanstack/query).

Utils for automatic caching, state handling and mutation of data. Easy to use and configurable for common use cases and automatic garbage collection.

# Features

- Automatic caching, refetching and garbage collection
- Mutations
- Paginated queries
- Retries
- Polling
- Invalidation of queries
- Optimistic updates of cache with rollback

<hr />

## Release workflow

1. Make a PR with you changes
2. Get it reviewed and then merge it
3. Create a new release using the web interface
4. When creating a new release you can specify the new release tag
5. This will run the tag-action which will publish the package to npm

## Table of Contents

- [Features](#features)
- [Table of Contents](#table-of-contents)
- [Installation](#installation)
- [Quickstart](#quickstart)
  - [useQuery](#usequery)
  - [queryOptions](#query-options)
  - [useMutation](#usemutation)
  - [mutationOptions](#mutation-options)
- [Utils](#utils)
  - [Query invalidation](#query-invalidation)
  - [Global default query options](#global-default-query-options)
- [Examples](#examples)
  - [Optimistic updates](#optimistic-updates)
  - [Placeholder data](#placeholder-data)
  - [Window focus refetching](#window-focus-refetching)

# Installation

```
npm i @globalconnect/query
yarn add @globalconnect/query
```

# Quickstart

## useQuery

A query is a dependency to an asynchronous source of data that is tied to a unique key. A query can be used with any function that returns an observable, often for fetching data. To subscribe to a query you can use the useQuery function. You need to provide:

- A unique key for the query
- A function that returns an observable with the data

```Typescript
const myQuery = useQuery('my-key', fetchMyData)
```

The useQuery function returns a Query object which includes methods for getting the state and interacting with the query.

```Typescript
{
  getState$: () => Observable<QueryLoadingState<Tdata, Terror>>
  getStateOnce: () => QueryLoadingState<Tdata, Terror> | undefined
  setData: (updater: Tdata | ((oldData: Tdata) => Tdata)) => void
}
```

## Query keys

A query key represents a unique entry in the cache. A query key can either be a static string or a tuple of a static string and a value. The second value can be anything including an observable. If the second value is an observable, the key will be updated dynamically when the observable emits.

```Typescript
const myQuery = useQuery('my-key', fetchMyData)
const myQuery = useQuery(['my-key', 123], fetchMyData)
const myQuery = useQuery(['my-key', myKey$], fetchMyData)
```

## Query options

You can also optionally provide a number of options to modify the query behaviour.

- `initialData: Tdata`
  - If set, this value will be used as the initial data for the query cache
- `placeholderData: PlaceholderData<Tdata, Targ>`
  - If set, the resolved value will be used as data during the initial load.
- `keepPreviousData: boolean`
  - If set, any previous data will be kept when fetching new data because the query key changed
- `staleTime: number`
  - The time in seconds after data is considered stale
    A stale query will be refetched on the next access
- `cacheTime: number`
  - The time in seconds that unused/inactive cache data remains in memory
- `refetchInterval?: number`
  - The time in seconds for periodic refetching
- `refetchOnWindowFocus: boolean | 'force'`
  - default true
  - if true refetch if stale on window focus
  - if false do not refetch on window focus
  - if force always refetch on window focus even if not stale
- `retry: boolean | number`
  - If true the failed query will retry once. If number the failed query will retry that amount of times
- `retryDelay: number`
  - The delay between retries in seconds
- `enabled: boolean | Observable<boolean>`
  - default true
  - Set this to false to disable this query from automatically running
- `fetchOnMount: boolean | 'force'`
  - default true
  - if true fetch if stale
  - if false do not fetch
  - if force always fetch even if not stale
- `uniqueKeys: boolean`
  - default false
  - if true add uuid to query keys to ensure zero cache hits
  - if false does nothing
- `onSuccess: ((data: Tdata) => void) | undefined`
  - Called with the response data when the query function has returned successfully
- `onError: ((error: Terror) => void) | undefined`
  - Called with the response error when the query function has returned an error

<hr />

## useMutation

Mutations are used for creating, updating or deleting data. To be able to create mutation you can use the useMutation function. You need to provide:

- A function that handles the creation, updating or deletion of the entity and that returns an observable.

```Typescript
createMyEntityMutation = useMutation(createMyEntity, {
  onSuccess(entity) => {},
  onSuccess(entity) => {},
  onError(error, context) => {}
})

createMyEntityMutation.mutate(myEntityData)
```

In order to actually mutate the data you need to call the mutate method on the Mutation object returned by the useMutation function. The mutate method has the same parameters as the function passed to the useMutation function. This means that you can reuse a mutation for multiple updates by calling the mutate method with the relevant data.

## Mutation options

By providing callback functions to the mutation you can handle side effects at various states of the mutation process. The available callbacks are:

- `onMutate: ((...args: Targs) => Tcontext) | undefined`
  - Called when the mutate function is called
  - Returns a context object which is a user defined object that will be passed to the onError callback
- `onSuccess: ((data: Tdata) => void) | undefined`
  - Called when the mutation function has returned successfully
- `onError: ((error: Terror, context?: Tcontext) => void) | undefined`
  - Called when the mutation function has returned an error
  - The context is a user defined object created in the onMutate callback and can be useful for rolling back optimistic updates

<hr />

## Utils

### Query invalidation

Queries can be invalidated by calling the `invalidateQueries()` method. The method takes either a single static query key or an array of static query keys. All queries with a matching static query key will be invalidated. Active queries will be refetched automatically in the background.

```Typescript
invalidateQueries('my-key')
invalidateQueries(['my-key', 'my-key-2'])
```

### Global default query options

Default query options can be set globally with the `setGlobalQueryOptions()` util. The options provided here will be the default options for all queries. Options set in a useQuery call will override the default global query options.

```Typescript
setGlobalQueryOptions({ retry: 3, cacheTime: 60, staleTime: 60 })
```

<hr />

## Testing

When writing unit tests you often want to ensure that tests are isolated. Since useQuery utilizes a shared cache, we need to either clear the cache between tests or by having unique keys to avoid cache hits and cached data from previous tests.

Example with jest

```Typescript
// test-setup.ts
setGlobalQueryOptions({ retry: 3, cacheTime: 60, staleTime: 60 })

// OR

//component.spec.ts
beforeEach(() => {
  clearQueryCache()
})
```

## Examples

### Optimistic updates

Optimistic updates can be used when you do not want to wait for the server to respond before updating the UI with the expected data.

```Typescript
type Person = { id: number; name: string; age: number };

const updatePersonName = (id: number, name: string) => of({ id, name });

const updatePersonNameMutation = useMutation(this.updatePersonName, {
  onMutate: (id, name) => {
    // Find cached person
    const cachedPerson = getQueryData<Person>(['person', id]);

    if (cachedPerson) {
      // Update cached person with new name
      setQueryData('person', { ...cachedPerson, name });
    }

    // Return cached person for potential rollback
    return cachedPerson;
  },
  onError: (error, originalPerson) => {
    // Rollback cached data on error
    if (originalPerson) {
      setQueryData(['person', originalPerson.id], originalPerson);
    }
  },
});
```

### Placeholder data

You can use placeholder data to show non-persisted data during the initial load. In the example below we are using sparse data to be able to show partial information about the person while loading.

```Typescript
const personQuery = useQuery(['person', this.selectedPersonId$], this.fetchPerson, {
    placeholderData: (selectedPersonId): Partial<Person> =>
      getQueryData<SparsePerson[]>('sparsePersons')?.find(
        (sparsePerson) => sparsePerson.id === selectedPersonId
      ) ?? { id: selectedPersonId }
   }
);
```

### Window focus refetching

Windows focus refetching can be used to refetch some important data in the background when the user focuses the window. In the example below we are refetching a status when the cached status data is stale (3s) and the user focuses the window.

```Typescript
const statusQuery = useQuery('status', this.fetchStatus, {
  staleTime: 3,
  refetchOnWindowFocus: true,
});
```

### Pagination

Paginated requests can be easily handled with a dynamic query key and the keepPreviousData query option. The keepPreviousData option enables us to keep displaying the number of pages while fetching the some other page.

```Typescript
const paginationVariables = of({page: 0, pageSize: 10});
const paginatedDataQuery = useQuery(['paginatedData', paginationVariables$], this.fetchPaginatedData, {
  keepPreviousData: true
});
```
