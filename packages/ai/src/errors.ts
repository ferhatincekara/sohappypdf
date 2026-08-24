import { APP_ERROR_CODES, AppError } from "@repo/core";

export class AiProviderError extends AppError {
  constructor(message = "AI provider request failed") {
    super({
      code: APP_ERROR_CODES.INTERNAL_ERROR,
      message,
    });
    this.name = "AiProviderError";
  }
}

export class AiNotConfiguredError extends AppError {
  constructor(message = "AI provider is not configured") {
    super({
      code: APP_ERROR_CODES.CONFIGURATION_ERROR,
      message,
    });
    this.name = "AiNotConfiguredError";
  }
}

export class AiDocumentTooLargeError extends AppError {
  constructor(message = "Document exceeds AI processing limits") {
    super({
      code: APP_ERROR_CODES.VALIDATION_ERROR,
      message,
    });
    this.name = "AiDocumentTooLargeError";
  }
}
