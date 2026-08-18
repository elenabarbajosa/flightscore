export class DealValidationError extends Error {
  readonly field?: string;

  constructor(message: string, field?: string) {
    super(message);
    this.name = "DealValidationError";
    this.field = field;
  }
}

export class DealResolutionError extends Error {
  readonly code: "DEAL_UNAVAILABLE" | "DEAL_EXPIRED";

  constructor(code: "DEAL_UNAVAILABLE" | "DEAL_EXPIRED", message: string) {
    super(message);
    this.name = "DealResolutionError";
    this.code = code;
  }
}
