import { HttpErrorResponse } from '@angular/common/http';

export type QueryLoadingStateMetadata = {
  isPreviousData: boolean;
  isRefetching: boolean;
  isPlaceholderData: boolean;
};

export type CachedQueryLoadingStateMetadata<Tdata = unknown> = {
  isRefetching: boolean;
  data?: Tdata;
};

export interface QueryLoadingStateMetadataWithData<Tdata = unknown>
  extends QueryLoadingStateMetadata {
  data?: Tdata;
}

interface CachedQueryBaseState<Tdata, Terror = HttpErrorResponse> {
  hasErrors: boolean;
  isLoading: boolean;
  isSuccess: boolean;
  isRefetching: boolean;
  data?: Tdata;
  error?: Terror;
}

export interface CachedQueryDataLoadingState<Tdata, Terror = HttpErrorResponse>
  extends CachedQueryBaseState<Tdata, Terror> {
  hasErrors: false;
  isLoading: true;
  isRefetching: false;
  isSuccess: false;
}

export interface CachedQueryRefetchingState<Tdata, Terror = HttpErrorResponse>
  extends CachedQueryBaseState<Tdata, Terror> {
  hasErrors: false;
  isLoading: false;
  isSuccess: false;
  isRefetching: true;
}

export interface CachedQueryErrorState<Tdata, Terror = HttpErrorResponse>
  extends CachedQueryBaseState<Tdata, Terror> {
  hasErrors: true;
  isLoading: false;
  isRefetching: false;
  isSuccess: false;
  error: Terror;
}

export interface CachedQuerySuccessState<Tdata, Terror = HttpErrorResponse>
  extends CachedQueryBaseState<Tdata, Terror> {
  hasErrors: false;
  isLoading: false;
  isRefetching: false;
  isSuccess: true;
  data: Tdata;
}

export interface CachedUnTouchedState<Tdata, Terror = HttpErrorResponse>
  extends CachedQueryBaseState<Tdata, Terror> {
  hasErrors: false;
  isLoading: false;
  isRefetching: false;
  isSuccess: false;
  data?: Tdata;
}

export interface QueryDataLoadingState<Tdata, Terror = HttpErrorResponse>
  extends CachedQueryDataLoadingState<Tdata, Terror>,
    QueryLoadingStateMetadata {
  isPlaceholderData: false;
  isRefetching: false;
}

export interface QueryRefetchingState<Tdata, Terror = HttpErrorResponse>
  extends CachedQueryRefetchingState<Tdata, Terror>,
    QueryLoadingStateMetadata {
  isPlaceholderData: false;
  isInitialData: false;
  isRefetching: true;
}

export interface QueryPlaceholderState<
  Tdata,
  Terror = HttpErrorResponse,
  TplaceholderData = Tdata
> extends CachedQueryDataLoadingState<TplaceholderData, Terror>,
    QueryLoadingStateMetadata {
  isPlaceholderData: true;
  isInitialData: false;
  isRefetching: false;
  data: TplaceholderData;
}

export interface QueryErrorState<Tdata, Terror = HttpErrorResponse>
  extends CachedQueryErrorState<Tdata, Terror>,
    QueryLoadingStateMetadata {
  isPreviousData: boolean;
  isRefetching: false;
  isPlaceholderData: false;
}

export interface QuerySuccessState<Tdata, Terror = HttpErrorResponse>
  extends CachedQuerySuccessState<Tdata, Terror>,
    QueryLoadingStateMetadata {
  isPreviousData: false;
  isRefetching: false;
  isPlaceholderData: false;
}

export interface UnTouchedState<Tdata, Terror = HttpErrorResponse>
  extends CachedUnTouchedState<Tdata, Terror>,
    QueryLoadingStateMetadata {
  isPreviousData: false;
  isRefetching: false;
  isPlaceholderData: false;
}

export declare type CachedQueryLoadingState<
  Tdata,
  Terror = HttpErrorResponse
> =
  | CachedQueryDataLoadingState<Tdata, Terror>
  | CachedQueryRefetchingState<Tdata, Terror>
  | CachedQueryErrorState<Tdata, Terror>
  | CachedQuerySuccessState<Tdata, Terror>
  | CachedUnTouchedState<Tdata, Terror>;

export declare type QueryLoadingState<
  Tdata,
  Terror = HttpErrorResponse,
  TplaceholderData = Tdata
> =
  | QueryDataLoadingState<Tdata, Terror>
  | QueryRefetchingState<Tdata, Terror>
  | QueryPlaceholderState<Tdata, Terror, TplaceholderData>
  | QueryErrorState<Tdata, Terror>
  | QuerySuccessState<Tdata, Terror>
  | UnTouchedState<Tdata, Terror>;
