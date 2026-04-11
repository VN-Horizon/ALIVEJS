import type { GameEngine } from "@/Core/NotUnityEngine";
import type { ScreenplayContextState } from "@/types/events";
import type { Window as TWindow } from "@tauri-apps/api/window";

declare global {
  interface Window {
    openVersionInfo: () => void;
    openCodecVersionInfo: () => void;
    openSettings: () => void;
    toggleBacklog: () => void;
    toggleDialogWindowVisibility: () => void;
    openSaveLoadDialog: (mode: "save" | "load") => Promise<number | null>;
    getEngine: () => GameEngine;
    exit: () => void;
    minimize: () => void;
    toggleMaximize: () => void;
    isSelecting: boolean;
    translationPlainMap?: Record<string, string>;
    isBacklogOpen: boolean;
    skipping: boolean;
    ScreenplayContext: ScreenplayContextState;
    tWindow: TWindow | undefined;
  }
}

export { };
