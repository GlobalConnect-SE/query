import { HttpErrorResponse } from '@angular/common/http';
import {
  getErrorMutationLoadingState,
  getInitialMutationLoadingState,
  getLoadingMutationLoadingState,
  getSuccessMutationLoadingState,
} from './mutation-helpers';

describe('MutationHelpers', () => {
  describe('getInitialMutationLoadingState', () => {
    it('should return an initial loading state', () => {
      expect(getInitialMutationLoadingState()).toStrictEqual({
        data: undefined,
        isLoading: false,
        isSuccess: false,
        hasErrors: false,
        error: undefined,
      });
    });
  });

  describe('getLoadingMutationLoadingState', () => {
    it('should return a loading mutation loading state', () => {
      expect(getLoadingMutationLoadingState()).toStrictEqual({
        data: undefined,
        isLoading: true,
        isSuccess: false,
        hasErrors: false,
        error: undefined,
      });
    });
  });

  describe('getSuccessMutationLoadingState', () => {
    it('should return an initial loading state', () => {
      const data = 123;
      expect(getSuccessMutationLoadingState(data)).toStrictEqual({
        data,
        isLoading: false,
        isSuccess: true,
        hasErrors: false,
        error: undefined,
      });
    });
  });

  describe('getErrorMutationLoadingState', () => {
    it('should return an initial loading state', () => {
      const error = new HttpErrorResponse({ status: 500 });

      expect(getErrorMutationLoadingState(error)).toStrictEqual({
        data: undefined,
        isLoading: false,
        isSuccess: false,
        hasErrors: true,
        error,
      });
    });
  });
});
