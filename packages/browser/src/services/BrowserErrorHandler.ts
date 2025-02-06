import { fetchSourceLines } from "./FetchSource";
import { parseStackTrace } from "@/utils/stackParser";

import {
  ErrorDetails,
  ErrorHandlerConfig,
  createErrorDetails,
  DEFAULT_CONFIG,
  isError,
} from "@bugwatch/core";

export default class BrowserErrorHandler {
  private config: ErrorHandlerConfig;

  constructor(config: Partial<ErrorHandlerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  private async handleError(error: Error | ErrorEvent) {
    let errorObj: Error;

    if (error instanceof ErrorEvent) {
      errorObj = error.error || new Error(error.message);
    } else {
      errorObj = error;
    }

    if (!isError(errorObj)) {
      errorObj = new Error(String(errorObj));
    }

    if (this.config.shouldCapture?.(errorObj)) {
      const stackFrames = parseStackTrace(errorObj.stack || "");
      const topFrame = stackFrames[0];

      let sourceLines: string[] = [];
      if (topFrame) {
        sourceLines = await fetchSourceLines(
          topFrame.fileName,
          topFrame.lineNumber
        );
      }

      const errorDetails = createErrorDetails(errorObj, {
        ...this.config.metadata,
        url: window.location.href,
        userAgent: navigator.userAgent,
        stackFrames,
        sourceLines,
      });

      this.config.onError?.(errorDetails);
    }
  }

  private handleUnhandledRejection = (event: PromiseRejectionEvent): void => {
    const error =
      event.reason instanceof Error
        ? event.reason
        : new Error(String(event.reason));
    this.handleError(error);
  };

  private boundHandleError = (event: ErrorEvent) => this.handleError(event);
  private boundHandleUnhandledRejection = (event: PromiseRejectionEvent) =>
    this.handleUnhandledRejection(event);

  public init(): void {
    window.addEventListener("error", this.boundHandleError);
    window.addEventListener(
      "unhandledrejection",
      this.boundHandleUnhandledRejection
    );
  }

  public destroy(): void {
    window.removeEventListener("error", this.boundHandleError);
    window.removeEventListener(
      "unhandledrejection",
      this.boundHandleUnhandledRejection
    );
  }

  public captureException(error: Error): void {
    this.handleError(error);
  }
}
