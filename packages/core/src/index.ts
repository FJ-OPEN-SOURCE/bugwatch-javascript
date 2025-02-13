export { logError } from "./logger.js";

export interface ErrorDetails {
  message: string;
  timestamp: number;
  stack?: string;
  type: string;
  metadata?: Record<string, unknown>;
}

export interface ErrorHandlerConfig {
  shouldCapture?: (error: Error) => boolean;
  metadata?: Record<string, unknown>;
  onError?: (errorDetails: ErrorDetails) => void;
}

export function createErrorDetails(
  error: Error,
  metadata?: Record<string, unknown>
): ErrorDetails {
  return {
    message: error.message,
    timestamp: Date.now(),
    stack: error.stack,
    type: error.name || "Error",
    metadata,
  };
}

export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

export const DEFAULT_CONFIG: ErrorHandlerConfig = {
  shouldCapture: () => true,
  metadata: {},
  onError: console.error,
};
