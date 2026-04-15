import { clearAutoContinueTimer } from "@/Utils/AutoContinueTimer";
import { type EventMappingsPayload } from "@/types/events";
import $ from "jquery";
import protobuf from "protobufjs";
import { initScreenplayContext } from "./ScreenplayState";
import { ExpandStaffCutscene } from "./StaffCSLoader";

export async function loadEvents(): Promise<EventMappingsPayload> {
  try {
    const root = await protobuf.load("/assets/events/events.proto");
    const EventMappings = root.lookupType("events.EventMappings");
    const response = await fetch("/assets/events/events.pb");
    const arrayBuffer = await response.arrayBuffer();
    const decodedEvents = EventMappings.decode(new Uint8Array(arrayBuffer));
    const eventMappings = EventMappings.toObject(decodedEvents, {
      enums: String, // enums as string names
      defaults: true, // includes default values
    }) as EventMappingsPayload;

    console.log("Events loaded successfully!", eventMappings);
    const expandedEventMappings = ExpandStaffCutscene(eventMappings);

    // Initialize screenplay context with loaded data
    initScreenplayContext(expandedEventMappings.events || [], expandedEventMappings.textPool || []);

    $(document).on("RestoreSave", (e: any) => {
      const {
        currentBg,
        currentBgm,
        currentPortrait,
        currentBlockIndex,
        currentInstructionIndex,
        passedEvIds,
      } = e.detail;
      clearAutoContinueTimer();
      window.ScreenplayContext.currentBlockIndex = currentBlockIndex || 0;
      window.ScreenplayContext.currentEvId =
        window.ScreenplayContext.blocks[currentBlockIndex || 0]?.evId || 0;
      window.ScreenplayContext.currentInstructionIndex = currentInstructionIndex || 0;
      if (passedEvIds) {
        window.ScreenplayContext.passedEvIds = new Set(passedEvIds);
      }
      document.dispatchEvent(
        new CustomEvent("RestoreGraphics", {
          detail: { bg: currentBg, character: currentPortrait },
        })
      );
      document.dispatchEvent(
        new CustomEvent("PlayBgm", {
          detail: { stringParams: [currentBgm] },
        })
      );
    });

    document.dispatchEvent(new CustomEvent("EventsLoaded", { bubbles: true, cancelable: true }));

    return expandedEventMappings;
  } catch (error) {
    console.error("Error loading events:", error);
    throw error;
  }
}
