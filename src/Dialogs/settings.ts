import "98.css";
import { loadSettings, saveSettings } from "@/Core/Settings";
import { closeCurrentWindow, setupWindowBehavior } from "@/Utils/WindowManager";

await setupWindowBehavior();

declare global {
  interface Window {
    closeWindow: () => Promise<void>;
  }
}

window.closeWindow = closeCurrentWindow;

document.addEventListener("DOMContentLoaded", () => {
  const currentSettings = loadSettings();

  // Populate basic
  (document.getElementById("text-speed") as HTMLInputElement).value = String(
    currentSettings.textSpeed
  );
  (document.getElementById("screen-effects-speed") as HTMLInputElement).value = String(
    currentSettings.screenEffectsSpeed
  );
  (document.getElementById("screen-effects") as HTMLInputElement).checked =
    currentSettings.screenEffectsEnabled;
  (document.getElementById("font-family") as HTMLInputElement).value = currentSettings.fontFamily;
  (document.getElementById("drop-shadow") as HTMLInputElement).checked = currentSettings.dropShadow;
  (document.getElementById("font-aa") as HTMLInputElement).value = String(
    currentSettings.fontAntiAliasing
  );

  // Populate save/load
  (document.getElementById("save-confirm") as HTMLInputElement).checked =
    currentSettings.saveConfirm;
  (document.getElementById("save-dblclick") as HTMLInputElement).checked =
    currentSettings.saveDblclick;
  (document.getElementById("save-auto-select") as HTMLInputElement).checked =
    currentSettings.saveAutoSelect;
  (document.getElementById("save-skip-auto") as HTMLInputElement).checked =
    currentSettings.saveSkipAuto;

  (document.getElementById("load-dblclick") as HTMLInputElement).checked =
    currentSettings.loadDblclick;
  (document.getElementById("load-auto-select") as HTMLInputElement).checked =
    currentSettings.loadAutoSelect;
  (document.getElementById("load-skip-auto") as HTMLInputElement).checked =
    currentSettings.loadSkipAuto;

  (document.getElementById("auto-save") as HTMLInputElement).checked =
    currentSettings.autoSaveEnabled;
  (document.getElementById("auto-save-slot") as HTMLInputElement).value = String(
    currentSettings.autoSaveSlot
  );
  (document.getElementById("auto-save-comment") as HTMLInputElement).value =
    currentSettings.autoSaveComment;

  // Populate sound
  (document.getElementById("bgm-vol") as HTMLInputElement).value = String(
    currentSettings.bgmVolume
  );
  (document.getElementById("bgm-sys") as HTMLInputElement).checked = currentSettings.bgmUseSystem;
  (document.getElementById("bgm-fade") as HTMLInputElement).checked = currentSettings.bgmFade;

  (document.getElementById("voice-vol") as HTMLInputElement).value = String(
    currentSettings.voiceVolume
  );
  (document.getElementById("voice-sys") as HTMLInputElement).checked =
    currentSettings.voiceUseSystem;
  (document.getElementById("voice-fade") as HTMLInputElement).checked = currentSettings.voiceFade;

  (document.getElementById("se-vol") as HTMLInputElement).value = String(currentSettings.seVolume);
  (document.getElementById("se-sys") as HTMLInputElement).checked = currentSettings.seUseSystem;
  (document.getElementById("se-fade") as HTMLInputElement).checked = currentSettings.seFade;

  const getUpdatedSettings = () => {
    const s = { ...currentSettings };
    s.textSpeed = parseInt((document.getElementById("text-speed") as HTMLInputElement).value, 10);
    s.screenEffectsSpeed = parseInt(
      (document.getElementById("screen-effects-speed") as HTMLInputElement).value,
      10
    );
    s.screenEffectsEnabled = (
      document.getElementById("screen-effects") as HTMLInputElement
    ).checked;
    s.fontFamily = (document.getElementById("font-family") as HTMLInputElement).value;
    s.dropShadow = (document.getElementById("drop-shadow") as HTMLInputElement).checked;
    s.fontAntiAliasing = parseInt(
      (document.getElementById("font-aa") as HTMLInputElement).value,
      10
    );

    s.saveConfirm = (document.getElementById("save-confirm") as HTMLInputElement).checked;
    s.saveDblclick = (document.getElementById("save-dblclick") as HTMLInputElement).checked;
    s.saveAutoSelect = (document.getElementById("save-auto-select") as HTMLInputElement).checked;
    s.saveSkipAuto = (document.getElementById("save-skip-auto") as HTMLInputElement).checked;

    s.loadDblclick = (document.getElementById("load-dblclick") as HTMLInputElement).checked;
    s.loadAutoSelect = (document.getElementById("load-auto-select") as HTMLInputElement).checked;
    s.loadSkipAuto = (document.getElementById("load-skip-auto") as HTMLInputElement).checked;

    s.autoSaveEnabled = (document.getElementById("auto-save") as HTMLInputElement).checked;
    s.autoSaveSlot = parseInt(
      (document.getElementById("auto-save-slot") as HTMLInputElement).value,
      10
    );
    s.autoSaveComment = (document.getElementById("auto-save-comment") as HTMLInputElement).value;

    s.bgmVolume = parseInt((document.getElementById("bgm-vol") as HTMLInputElement).value, 10);
    s.bgmUseSystem = (document.getElementById("bgm-sys") as HTMLInputElement).checked;
    s.bgmFade = (document.getElementById("bgm-fade") as HTMLInputElement).checked;

    s.voiceVolume = parseInt((document.getElementById("voice-vol") as HTMLInputElement).value, 10);
    s.voiceUseSystem = (document.getElementById("voice-sys") as HTMLInputElement).checked;
    s.voiceFade = (document.getElementById("voice-fade") as HTMLInputElement).checked;

    s.seVolume = parseInt((document.getElementById("se-vol") as HTMLInputElement).value, 10);
    s.seUseSystem = (document.getElementById("se-sys") as HTMLInputElement).checked;
    s.seFade = (document.getElementById("se-fade") as HTMLInputElement).checked;

    return s;
  };

  const applyBtn = document.getElementById("apply-btn");
  const okBtn = document.getElementById("ok-btn");

  const notifyMain = () => {
    // Write an event marker so storage event triggers on same URL or other windows
    localStorage.setItem("alive_settings_updated", String(Date.now()));
  };

  applyBtn?.addEventListener("click", () => {
    saveSettings(getUpdatedSettings());
    notifyMain();
  });

  okBtn?.addEventListener("click", async () => {
    saveSettings(getUpdatedSettings());
    notifyMain();
    await window.closeWindow();
  });
});
