import { fetchSourceLines } from "./FetchSource";
import { parseStackTrace } from "@/utils/stackParser";

import {
  ErrorDetails,
  ErrorHandlerConfig,
  createErrorDetails,
  DEFAULT_CONFIG,
  isError,
} from "@bugwatch/core";

const MAX_BREADCRUMBS = 100;
const breadcrumbs: {
  type: "default";
  timestamp: string;
  level: "info" | "warning" | "error";
  message: string;
  category: string;
  data?: Record<string, any> | null;
  event_id?: string | null;
}[] = [];

const addBreadcrumb = (
  breadcrumb: Omit<(typeof breadcrumbs)[number], "timestamp">
) => {
  if (breadcrumbs.length >= MAX_BREADCRUMBS) {
    breadcrumbs.shift();
  }

  breadcrumbs.push({
    ...breadcrumb,
    timestamp: new Date().toISOString(),
  });
};

const originalConsoleLog = console.log;
console.log = (...args) => {
  addBreadcrumb({
    type: "default",
    level: "info",
    message: args.join(" "),
    category: "console",
    data: { arguments: args, logger: "console" },
    event_id: null,
  });
  originalConsoleLog.apply(console, args);
};

const originalConsoleError = console.error;
console.error = (...args) => {
  addBreadcrumb({
    type: "default",
    level: "error",
    message: args.join(" "),
    category: "console",
    data: { arguments: args, logger: "console" },
    event_id: null,
  });
  originalConsoleError.apply(console, args);
};

document.addEventListener("click", (event) => {
  const target = event.target as HTMLElement;
  if (!target) return;

  addBreadcrumb({
    type: "default",
    level: "info",
    message: target.tagName.toLowerCase(),
    category: "ui.click",
    data: null,
    event_id: null,
  });
});

const originalFetch = window.fetch;
window.fetch = async (...args) => {
  const [url, options] = args;
  const method = options?.method || "GET";
  const startTime = new Date().toISOString();

  try {
    const response = await originalFetch(...args);
    addBreadcrumb({
      type: "default",
      level: "info",
      message: `${method} ${url} - ${response.status}`,
      category: "http.request",
      data: { url, method, status: response.status },
      event_id: null,
    });
    return response;
  } catch (error) {
    addBreadcrumb({
      type: "default",
      level: "error",
      message: `${method} ${url} - FAILED`,
      category: "http.request",
      data: { url, method },
      event_id: null,
    });
    throw error;
  }
};

export default class BrowserErrorHandler {
  private config: ErrorHandlerConfig;

  constructor(config: Partial<ErrorHandlerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  private async handleError(error: Error | ErrorEvent) {
    let errorObj: Error =
      error instanceof ErrorEvent
        ? error.error || new Error(error.message)
        : error;

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

      const currentBreadcrumbs = [...breadcrumbs];

      const errorDetails = createErrorDetails(errorObj, {
        ...this.config.metadata,
        url: window.location.href,
        userAgent: navigator.userAgent,
        stackFrames,
        sourceLines,
        breadcrumbs: { values: currentBreadcrumbs },
      });

      this.config.onError?.(errorDetails);
      breadcrumbs.length = 0; // Now safe to clear
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
