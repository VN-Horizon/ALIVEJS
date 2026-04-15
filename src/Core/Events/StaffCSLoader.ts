import type { EventInstruction, EventMapping, EventMappingsPayload } from "@/types/events";

export const ExpandStaffCutscene = (eventMappings: EventMappingsPayload): EventMappingsPayload => {
  eventMappings.events.map((event: EventMapping) => {
    if (event.instructions) {
      const newInstructions: any[] = [];
      event.instructions.forEach((instr: EventInstruction) => {
        if (instr.type === "ShowStaffA") {
          for (let i = 1; i <= 19; i++) {
            const id = i.toString().padStart(2, "0");
            newInstructions.push({ type: "ShowStaffImage", stringParams: ["STAFF2", id] });
            newInstructions.push({ type: "AutoContinue", params: [2000] });
          }
        } else if (instr.type === "ShowStaffB") {
          for (let i = 1; i <= 19; i++) {
            const id = i.toString().padStart(2, "0");
            newInstructions.push({ type: "ShowStaffImage", stringParams: ["STAFF1", id] });
            newInstructions.push({ type: "AutoContinue", params: [2000] });
          }
        } else {
          newInstructions.push(instr);
        }
      });
      event.instructions = newInstructions;
    }
    return event;
  });
  return eventMappings;
};
