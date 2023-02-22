import { getQueryOptions, setGlobalQueryOptions } from './query-config';
import { defaultQueryOptions } from './query-defaults';

describe('QueryConfig', () => {
  describe('setGlobalQueryOptions', () => {
    it('should update the global query options when called with partial data', () => {
      setGlobalQueryOptions({ staleTime: 0 });
      const queryOptions = getQueryOptions({ cacheTime: 30 });

      expect(queryOptions).toStrictEqual({
        ...defaultQueryOptions,
        staleTime: 0,
        cacheTime: 30,
      });
    });
  });

  describe('getQueryOptions', () => {
    it('should return a combination of default query options, global query options and specific query options with specific having precedence', () => {
      setGlobalQueryOptions({});
      const queryOptions = getQueryOptions({});

      expect(queryOptions).toStrictEqual({ ...defaultQueryOptions });
    });

    it('should return a combination of default query options, global query options and specific query options with specific having precedence', () => {
      setGlobalQueryOptions({ cacheTime: 0 });
      const queryOptions = getQueryOptions({ cacheTime: 30 });

      expect(queryOptions).toStrictEqual({
        ...defaultQueryOptions,
        cacheTime: 30,
      });
    });
  });
});
