export class WebMcpContractError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "WebMcpContractError";
    this.code = code;
  }
}

export class BindingValidationError extends WebMcpContractError {
  constructor(message: string) {
    super("binding_invalid", message);
    this.name = "BindingValidationError";
  }
}

export class InputValidationError extends WebMcpContractError {
  constructor(message: string) {
    super("input_invalid", message);
    this.name = "InputValidationError";
  }
}

export class EpochMismatchError extends WebMcpContractError {
  constructor(expected: number, actual: number) {
    super(
      "epoch_mismatch",
      `Navigation epoch mismatch: expected ${expected}, current ${actual}`,
    );
    this.name = "EpochMismatchError";
  }
}

export class RegistrationError extends WebMcpContractError {
  constructor(message: string) {
    super("registration_error", message);
    this.name = "RegistrationError";
  }
}

export class AbortedError extends WebMcpContractError {
  constructor(message = "Operation aborted") {
    super("aborted", message);
    this.name = "AbortedError";
  }
}
