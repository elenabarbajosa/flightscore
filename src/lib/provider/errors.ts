export type ProviderErrorCode =
  | "PROVIDER_CONFIG_ERROR"
  | "PROVIDER_REQUEST_FAILED"
  | "PROVIDER_TIMEOUT"
  | "PROVIDER_QUOTA_EXCEEDED"
  | "PROVIDER_INVALID_RESPONSE";

export class ProviderError extends Error {
  readonly code: ProviderErrorCode;

  constructor(code: ProviderErrorCode, message: string) {
    super(message);
    this.name = "ProviderError";
    this.code = code;
  }
}
