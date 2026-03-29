export interface BacklogEntry {
  characterName: string;
  dialogText: string;
  voiceInfo?: {
    voiceName: string;
    eventName: string;
    lineNumber: string;
  };
}
