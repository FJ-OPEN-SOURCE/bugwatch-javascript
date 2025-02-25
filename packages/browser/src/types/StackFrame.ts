export interface StackFrame {
  fileName: string;
  lineNumber: number;
  columnNumber: number;
  functionName?: string;
}