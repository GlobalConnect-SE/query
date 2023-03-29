import { Observable } from 'rxjs';

export type OnMutateFn<Targs extends unknown[], Tcontext> = (
  args: Targs
) => Tcontext;

export type OnSuccessFn<Tdata, Targs extends unknown[], Tcontext> = (
  data: Tdata,
  args: Targs,
  context?: Tcontext
) => void;

export type OnErrorFn<Terror, Targs extends unknown[], Tcontext> = (
  error: Terror,
  args: Targs,
  context?: Tcontext
) => void;

export interface MutationOptions<
  Tdata,
  Terror,
  Targs extends unknown[],
  Tcontext
> {
  onMutate?: OnMutateFn<Targs, Tcontext>;
  onSuccess?: OnSuccessFn<Tdata, Targs, Tcontext>;
  onError?: OnErrorFn<Terror, Targs, Tcontext>;
}

export type MutationFn<Tdata, Targs extends unknown[]> = (
  ...args: Targs
) => Observable<Tdata>;

export type MutationConfig<
  Tdata,
  Targs extends unknown[],
  Terror,
  Tcontext = unknown
> = {
  options: MutationOptions<Tdata, Terror, Targs, Tcontext>;
  mutationFn: MutationFn<Tdata, Targs>;
};
