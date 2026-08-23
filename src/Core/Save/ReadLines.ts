const STORAGE_KEY = "read-lines";

export const READ_LINE_COLOR = "#F8E8A8";

let cachedLines: Set<string> | null = null;

function getLines(): Set<string> {
  if (cachedLines) return cachedLines;
  const raw = localStorage.getItem(STORAGE_KEY);
  cachedLines = raw ? new Set(JSON.parse(raw)) : new Set();
  return cachedLines;
}

export function isLineRead(blockIndex: number, instructionIndex: number): boolean {
  return getLines().has(`${blockIndex}:${instructionIndex}`);
}

export function markLineRead(blockIndex: number, instructionIndex: number): void {
  const lines = getLines();
  const key = `${blockIndex}:${instructionIndex}`;
  if (lines.has(key)) return;
  lines.add(key);
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...lines]));
}
