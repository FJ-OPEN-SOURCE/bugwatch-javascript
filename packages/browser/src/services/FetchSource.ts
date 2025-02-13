export const fetchSourceLines = async (
  fileUrl: string,
  lineNumber: number,
  contextLines: number = 3
): Promise<string[]> => {
  try {
    const response = await fetch(fileUrl);
    if (!response.ok) throw new Error("Failed to fetch source file");

    const sourceText = await response.text();
    const lines = sourceText.split("\n");

    const start = Math.max(0, lineNumber - contextLines - 1);
    const end = Math.min(lines.length, lineNumber + contextLines);

    return lines.slice(start, end);
  } catch (err) {
    console.warn("Could not fetch source code:", err);
    return [];
  }
};
