import { HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, first } from 'rxjs';
import {
  getErrorMutationLoadingState,
  getInitialMutationLoadingState,
  getLoadingMutationLoadingState,
  getSuccessMutationLoadingState,
} from './mutation-helpers';
import { MutationLoadingState } from './mutation-loading-state';
import { MutationConfig, MutationFn } from './mutation-types';

export class Mutation<
  Tdata,
  Targs extends unknown[],
  Terror = HttpErrorResponse,
  Tcontext = unknown
> {
  private onMutate: ((...args: Targs) => Tcontext) | undefined;
  private onSuccess: ((data: Tdata) => void) | undefined;
  private onError: ((error: Terror, context?: Tcontext) => void) | undefined;
  private mutationFn: MutationFn<Tdata, Targs>;
  private state: BehaviorSubject<MutationLoadingState<Tdata, Terror>>;

  constructor(mutationConfig: MutationConfig<Tdata, Targs, Terror, Tcontext>) {
    const { onMutate, onSuccess, onError } = mutationConfig.options;

    this.onMutate = onMutate;
    this.onSuccess = onSuccess;
    this.onError = onError;
    this.mutationFn = mutationConfig.mutationFn;
    this.state = new BehaviorSubject(
      getInitialMutationLoadingState<Tdata, Terror>()
    );
  }

  mutate(...mutationArgs: Targs) {
    this.setMutationLoadingState();

    const context = this.onMutate?.(...mutationArgs);
    this.mutationFn(...mutationArgs)
      .pipe(first())
      .subscribe({
        next: (response) => {
          this.handleMutationSuccessResponse(response);
          this.onSuccess?.(response);
        },
        error: (error: Terror) => {
          this.handleMutationErrorResponse(error);
          this.onError?.(error, context);
        },
      });
  }

  getState$() {
    return this.state.asObservable();
  }

  getStateOnce() {
    return this.state.value;
  }

  private setMutationLoadingState() {
    this.state.next(getLoadingMutationLoadingState());
  }

  private handleMutationSuccessResponse(response: Tdata) {
    this.state.next(getSuccessMutationLoadingState(response));
  }

  private handleMutationErrorResponse(error: Terror) {
    this.state.next(getErrorMutationLoadingState(error));
  }
}
