import { Observable } from 'rxjs';

export interface MutationOptions<
  Tdata,
  Terror,
  Targs extends unknown[],
  Tcontext
> {
  onMutate?: (...args: Targs) => Tcontext;
  onSuccess?: (data: Tdata) => void;
  onError?: (error: Terror, context?: Tcontext) => void;
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
