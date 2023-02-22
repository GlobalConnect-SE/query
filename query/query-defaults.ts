import { QueryOptions } from './query-types';

export const DEFAULT_CACHE_TIME = 5 * 60;

export const defaultQueryOptions: QueryOptions<any, any, any, any> = {
  initialData: undefined,
  placeholderData: undefined,
  keepPreviousData: false,
  staleTime: 60,
  cacheTime: DEFAULT_CACHE_TIME,
  retry: false,
  retryDelay: 5,
  fetchOnMount: true,
  refetchOnWindowFocus: false,
  enabled: true,
  uniqueKeys: false,
};
