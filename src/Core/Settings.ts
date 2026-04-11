export interface GameSettings {
  textSpeed: number; // 0 to 10
  screenEffectsSpeed: number; // 0 to 10
  screenEffectsEnabled: boolean;
  fontFamily: string;
  dropShadow: boolean;
  fontAntiAliasing: number; // 0 to 3

  saveConfirm: boolean;
  saveDblclick: boolean;
  saveAutoSelect: boolean;
  saveSkipAuto: boolean;

  loadDblclick: boolean;
  loadAutoSelect: boolean;
  loadSkipAuto: boolean;

  autoSaveEnabled: boolean;
  autoSaveSlot: number;
  autoSaveComment: string;

  bgmVolume: number; // 0 to 100
  bgmUseSystem: boolean;
  bgmFade: boolean;

  voiceVolume: number; // 0 to 100
  voiceUseSystem: boolean;
  voiceFade: boolean;

  seVolume: number; // 0 to 100
  seUseSystem: boolean;
  seFade: boolean;
}

export const DEFAULT_SETTINGS: GameSettings = {
  textSpeed: 5,
  screenEffectsSpeed: 5,
  screenEffectsEnabled: true,
  fontFamily: "MS Gothic",
  dropShadow: true,
  fontAntiAliasing: 3,

  saveConfirm: true,
  saveDblclick: true,
  saveAutoSelect: true,
  saveSkipAuto: true,

  loadDblclick: true,
  loadAutoSelect: true,
  loadSkipAuto: true,

  autoSaveEnabled: true,
  autoSaveSlot: 20,
  autoSaveComment: "Auto Save",

  bgmVolume: 25,
  bgmUseSystem: true,
  bgmFade: true,

  voiceVolume: 49,
  voiceUseSystem: true,
  voiceFade: true,

  seVolume: 49,
  seUseSystem: true,
  seFade: true,
};

export function loadSettings(): GameSettings {
  try {
    const stored = localStorage.getItem("alive_settings");
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error("Failed to load settings:", e);
  }
  return { ...DEFAULT_SETTINGS };
}

export function saveSettings(settings: GameSettings) {
  localStorage.setItem("alive_settings", JSON.stringify(settings));
}

export const SCENE_STACK_TRANSITION_BASE_MS = 300;

export function getScreenEffectsTransitionDurationMs(
  baseDurationMs: number = SCENE_STACK_TRANSITION_BASE_MS
): number {
  const settings = loadSettings();
  const effectSpeed = settings.screenEffectsSpeed;
  const effectEnabled = settings.screenEffectsEnabled;
  const durationMultiplier = !effectEnabled || effectSpeed === 10 ? 0 : 2.0 - effectSpeed * 0.2;
  return Math.round(baseDurationMs * durationMultiplier);
}
