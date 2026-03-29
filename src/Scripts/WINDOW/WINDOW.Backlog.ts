import { getCurrentPlayingVoiceId } from "@/Audio/Voice";
import { AllowedVoiceNames } from "@/Constants";
import { GetVoiceEventName } from "@/Utils/DialogHelper";
import { $translate } from "@/Utils/Translator";
import $ from "jquery";
import type { DialogWindowScene } from "./WINDOW";
import { addBacklogEntry } from "./WINDOW.Backlog.State";
import { backlogContainer, backlogContent, createBacklogUI, updateBacklogDisplay } from "./WINDOW.Backlog.UI";

let uiUpdateInterval: number | null = null;

export const openBacklog = () => {
  if (window.isBacklogOpen) return;
  window.isBacklogOpen = true;
  backlogContainer.fadeIn(200);
  updateBacklogDisplay();
  setTimeout(() => backlogContent.scrollTop(backlogContent[0].scrollHeight), 0);

  uiUpdateInterval = window.setInterval(() => {
    const currentVoiceId = getCurrentPlayingVoiceId();
    $("[data-voice-btn-key]").each(function() {
      const btnKey = $(this).attr("data-voice-btn-key");
      if (btnKey && btnKey === currentVoiceId) {
        $(this).html("□&nbsp;&nbsp;");
      } else {
        $(this).html("▷&nbsp;");
      }
    });
  }, 100);
};

export const closeBacklog = () => {
  if (!window.isBacklogOpen) return;
  window.isBacklogOpen = false;
  backlogContainer.fadeOut(200);
  if (uiUpdateInterval !== null) {
    window.clearInterval(uiUpdateInterval);
    uiUpdateInterval = null;
  }
};

export const toggleBacklog = () => {
  if (window.isBacklogOpen) closeBacklog();
  else openBacklog();
};

export function onPlayDialog(e: CustomEvent) {
  const { stringParams, params } = e.detail;
  const [characterName, dialogContent] = stringParams;
  
  let voiceInfo;
  if (params && params.length >= 3 && stringParams[0] && AllowedVoiceNames.includes(stringParams[0])) {
    const blockIndex = params[1];
    const lineCount = params[2];
    const eventName = GetVoiceEventName(blockIndex + 1);
    if (eventName && lineCount != null) {
      voiceInfo = {
        voiceName: stringParams[0],
        eventName,
        lineNumber: lineCount.toString().padStart(3, "0")
      };
    }
  }

  addBacklogEntry({
    characterName: $translate(characterName) || "",
    dialogText: dialogContent || "",
    voiceInfo
  });
}

export function initBacklog(dialogWindow: DialogWindowScene | null) {
  if (!dialogWindow) return;

  window.isBacklogOpen = false;
  createBacklogUI();

  const toggleHandler = () => toggleBacklog();
  document.addEventListener("toggleBacklog", toggleHandler);

  const dialogHandler = (e: Event) => onPlayDialog(e as CustomEvent);
  document.addEventListener("PlayDialogInternal", dialogHandler);

  dialogWindow.onDestroyCallbacks.push(() => {
    if (uiUpdateInterval !== null) {
      window.clearInterval(uiUpdateInterval);
      uiUpdateInterval = null;
    }
    backlogContainer.remove();
    document.removeEventListener("toggleBacklog", toggleHandler);
    document.removeEventListener("PlayDialogInternal", dialogHandler);
  });
}
