import { HttpErrorResponse } from '@angular/common/http';

interface BaseState<T, U = HttpErrorResponse> {
  hasErrors: boolean;
  isLoading: boolean;
  isSuccess: boolean;
  data?: T;
  error?: U;
}

interface LoadingState<T, U = HttpErrorResponse> extends BaseState<T, U> {
  hasErrors: false;
  isLoading: true;
  isSuccess: false;
  data: undefined;
}

interface ErrorState<T, U = HttpErrorResponse> extends BaseState<T, U> {
  hasErrors: true;
  isLoading: false;
  isSuccess: false;
  data: undefined;
  error: U;
}

interface SuccessState<T, U = HttpErrorResponse> extends BaseState<T, U> {
  hasErrors: false;
  isLoading: false;
  isSuccess: true;
  data: T;
}

interface UnTouchedState<T, U = HttpErrorResponse> extends BaseState<T, U> {
  hasErrors: false;
  isLoading: false;
  isSuccess: false;
  data: undefined;
}

export declare type MutationLoadingState<T, U = HttpErrorResponse> =
  | LoadingState<T, U>
  | ErrorState<T, U>
  | SuccessState<T, U>
  | UnTouchedState<T, U>;
