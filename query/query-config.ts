import { defaultQueryOptions } from './query-defaults';
import { QueryOptions } from './query-types';

type GlobalQueryOptions = Omit<
  QueryOptions<unknown, unknown, unknown, unknown>,
  'initialData' | 'placeholderData' | 'onSuccess'
>;

let globalQueryOptions: Partial<GlobalQueryOptions> = {
  ...defaultQueryOptions,
};

export function setGlobalQueryOptions(options: Partial<GlobalQueryOptions>) {
  globalQueryOptions = { ...options };
}

export function getQueryOptions<Tdata, Terror, Targ, TplaceholderData>(
  specificOptions: Partial<QueryOptions<Tdata, Terror, Targ, TplaceholderData>>
) {
  return {
    ...defaultQueryOptions,
    ...globalQueryOptions,
    ...specificOptions,
  } as QueryOptions<Tdata, Terror, Targ, TplaceholderData>;
}
