import { getCurrentPlayingVoiceId, getVoiceKey, playCharacterVoice, stopCurrentVoice } from "@/Audio/Voice";
import $ from "jquery";
import { getBacklogEntries } from "./WINDOW.Backlog.State";
import type { BacklogEntry } from "./WINDOW.Backlog.Types";

export let backlogContainer: JQuery<HTMLElement>;
export let backlogContent: JQuery<HTMLElement>;

export function createBacklogUI() {
  const gameWidth = 640;
  const gameHeight = 480;

  backlogContainer = $("<div>")
    .attr("id", "backlog-container")
    .css({
      width: `${gameWidth}px`,
      height: `${gameHeight}px`,
    });

  backlogContent = $("<div>").attr("id", "backlog-content")
  backlogContainer.append(backlogContent);
  $("#gameContainer").append(backlogContainer);
}

export function renderEntry(entry: BacklogEntry, prevIsCharacter: boolean): JQuery<HTMLElement> {
  const hasCharacterName = Boolean(entry.characterName);
  const entryDiv = $("<div>").attr("class", "backlog-entry").css({
    "margin-top": prevIsCharacter !== hasCharacterName ? "24px" : "0",
  });

  if (hasCharacterName) {
    const nameSpan = $("<span>").text(entry.characterName).attr("class", "backlog-character-name")
    entryDiv.append(nameSpan);
  }

  if (entry.voiceInfo) {
    const { voiceName, eventName, lineNumber } = entry.voiceInfo;
    const voiceKey = getVoiceKey(voiceName, eventName, lineNumber);

    const voiceBtn = $("<span>").html("▷&nbsp;")
    .attr("class", "backlog-voice-btn")
    .attr("data-voice-btn-key", voiceKey || "");
    entryDiv.append(voiceBtn);

    entryDiv.css({ cursor: "pointer" });
    entryDiv.hover(
      () => voiceBtn.css("color", "#00CC00"),
      () => voiceBtn.css("color", "#00FF00")
    );

    entryDiv.on("click", async () => {
      if (getCurrentPlayingVoiceId() === voiceKey) {
        stopCurrentVoice();
      } else {
        void playCharacterVoice(voiceName, eventName, lineNumber);
      }
    });
  }

  const textSpan = $("<span>").text(entry.dialogText);
  entryDiv.append(textSpan);

  return entryDiv;
}

export function updateBacklogDisplay() {
  backlogContent.empty();
  let prevIsCharacter = true;
  
  getBacklogEntries().forEach(entry => {
    const entryDiv = renderEntry(entry, prevIsCharacter);
    prevIsCharacter = Boolean(entry.characterName);
    backlogContent.append(entryDiv);
  });

  const spacer = $("<div>").css({ height: "120px", width: "100%" });
  backlogContent.append(spacer);
}
