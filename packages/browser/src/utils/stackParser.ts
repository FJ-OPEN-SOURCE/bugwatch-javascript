import { StackFrame } from "@/types/StackFrame";

export const parseStackTrace = (stack: string): StackFrame[] => {
  const stackLines = stack.split("\n").slice(1); // Skip the first line (error message)
  const regex = /at\s+(.*?)\s+\((.*?):(\d+):(\d+)\)/;

  return stackLines
    .map((line) => {
      const match = line.match(regex);
      if (match) {
        return {
          functionName: match[1],
          fileName: match[2],
          lineNumber: parseInt(match[3], 10),
          columnNumber: parseInt(match[4], 10),
        };
      }
      return null;
    })
    .filter(Boolean) as StackFrame[];
};
