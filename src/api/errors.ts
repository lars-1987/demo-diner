export type ApiErrorCode =
  | 'NETWORK_ERROR'
  | 'NOT_FOUND'
  | 'OFFER_EXPIRED'
  | 'ALREADY_REDEEMED';

/**
 * Every failure from the API layer is an ApiError, so the UI can branch on
 * `code` instead of parsing messages. `retryable` separates "try again might
 * work" (network) from "trying again will never work" (business rules).
 */
export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly retryable: boolean;

  constructor(code: ApiErrorCode, message: string, retryable = false) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.retryable = retryable;
  }
}

export const networkError = () =>
  new ApiError('NETWORK_ERROR', 'The request timed out. Check your connection and try again.', true);

export function isRetryable(error: unknown): boolean {
  // Unknown errors are treated as transient: retrying is the safer default for reads.
  return error instanceof ApiError ? error.retryable : true;
}

export function errorCode(error: unknown): ApiErrorCode | undefined {
  return error instanceof ApiError ? error.code : undefined;
}
