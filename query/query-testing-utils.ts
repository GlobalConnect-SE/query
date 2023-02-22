import {
  getErrorMutationLoadingState,
  getInitialMutationLoadingState,
  getLoadingMutationLoadingState,
  getSuccessMutationLoadingState,
} from './mutation-helpers';
import {
  getErrorQueryLoadingState,
  getInitialQueryLoadingState,
  getLoadingQueryLoadingState,
  getRefetchingQueryLoadingState,
  getSuccessQueryLoadingState,
} from './query-helpers';

export const createInitialQueryLoadingState = getInitialQueryLoadingState;
export const createLoadingQueryLoadingState = getLoadingQueryLoadingState;
export const createRefetchingQueryLoadingState = getRefetchingQueryLoadingState;
export const createSuccessQueryLoadingState = getSuccessQueryLoadingState;
export const createErrorQueryLoadingState = getErrorQueryLoadingState;

export const createInitialMutationLoadingState = getInitialMutationLoadingState;
export const createLoadingMutationLoadingState = getLoadingMutationLoadingState;
export const createSuccessMutationLoadingState = getSuccessMutationLoadingState;
export const createErrorMutationLoadingState = getErrorMutationLoadingState;
