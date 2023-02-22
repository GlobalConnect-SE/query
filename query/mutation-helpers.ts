import { HttpErrorResponse } from '@angular/common/http';
import { MutationLoadingState } from './mutation-loading-state';

export function getInitialMutationLoadingState<
  Tdata,
  Terror
>(): MutationLoadingState<Tdata, Terror> {
  return {
    data: undefined,
    isLoading: false,
    isSuccess: false,
    hasErrors: false,
    error: undefined,
  };
}

export function getLoadingMutationLoadingState<
  Tdata,
  Terror = HttpErrorResponse
>(): MutationLoadingState<Tdata, Terror> {
  return {
    data: undefined,
    isLoading: true,
    isSuccess: false,
    hasErrors: false,
    error: undefined,
  };
}

export function getSuccessMutationLoadingState<
  Tdata,
  Terror = HttpErrorResponse
>(data: Tdata): MutationLoadingState<Tdata, Terror> {
  return {
    data,
    isLoading: false,
    isSuccess: true,
    hasErrors: false,
    error: undefined,
  };
}

export function getErrorMutationLoadingState<Tdata, Terror = HttpErrorResponse>(
  error: Terror
): MutationLoadingState<Tdata, Terror> {
  return {
    data: undefined,
    isLoading: false,
    isSuccess: false,
    hasErrors: true,
    error,
  };
}
