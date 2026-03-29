import { BacklogEntry } from "./WINDOW.Backlog.Types";

const entries: BacklogEntry[] = [];
export const MAX_ENTRIES = 128;

export function getBacklogEntries(): BacklogEntry[] {
  return entries;
}

export function addBacklogEntry(entry: BacklogEntry) {
  entries.push(entry);
  if (entries.length > MAX_ENTRIES) entries.shift();
}
