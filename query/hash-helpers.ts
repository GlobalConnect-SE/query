export const DYNAMIC_HASH_PART_KEY = '__dynamic_query_key__';

export function hashQueryKey(queryKey: string, queryParam?: any): string {
  return (
    queryKey +
    (queryParam ? DYNAMIC_HASH_PART_KEY + stableValueHash(queryParam) : '')
  );
}

function stableValueHash(value: any): string {
  return JSON.stringify(value, (_, val) =>
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    isPlainObject(val)
      ? Object.keys(val)
          .sort()
          .reduce((result, key) => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            result[key] = val[key];
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            return result;
          }, {} as any)
      : val
  );
}

function hasObjectPrototype(o: any): boolean {
  return Object.prototype.toString.call(o) === '[object Object]';
}

// eslint-disable-next-line @typescript-eslint/ban-types
function isPlainObject(o: any): o is Object {
  if (!hasObjectPrototype(o)) {
    return false;
  }

  return true;
}
