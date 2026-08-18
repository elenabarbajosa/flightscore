export interface DealRequest {
  dealReference: string;
}

export interface DealResponse {
  redirectUrl: string;
  sellerName: string;
}

export type DealErrorCode =
  | "INVALID_INPUT"
  | "DEAL_UNAVAILABLE"
  | "DEAL_EXPIRED"
  | "QUOTA_EXCEEDED"
  | "PROVIDER_ERROR"
  | "TIMEOUT"
  | "INTERNAL_ERROR";

export interface DealErrorResponse {
  error: DealErrorCode;
  field?: string;
}
