export function logError(
  message: string,
  file?: string,
  line?: number,
  column?: number
): void {
  const isNode = typeof process !== "undefined" && process.versions?.node;

  const formattedMessage =
    file && line !== undefined && column !== undefined
      ? `[Bugwatch] Error: ${message} at ${file}:${line}:${column}`
      : `[Bugwatch] Error: ${message}`;

  if (isNode) {
    // Node.js environment
    console.error(formattedMessage);
  } else {
    // Browser environment
    console.error(`%c${formattedMessage}`, "color: red; font-weight: bold;");
  }
}
