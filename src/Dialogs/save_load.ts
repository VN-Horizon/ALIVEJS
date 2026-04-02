import "98.css";
import $ from "jquery";
import { closeCurrentWindow, setupWindowBehavior } from "../Utils/WindowManager";

setupWindowBehavior();

declare global {
  interface Window {
    closeWindow: () => Promise<void>;
  }
}

window.closeWindow = async () => {
  if ('__TAURI_INTERNALS__' in window) {
    const { emit } = await import("@tauri-apps/api/event");
    await emit("save-load-closed");
  } else if (window.opener) {
    window.opener.postMessage({ type: "save-load-closed" }, "*");
  }
  await closeCurrentWindow();
};

$(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const initialMode = urlParams.get("mode") as "save" | "load" || "load";

  const closeBtn = $("#closeBtn");
  const cancelBtn = $("#cancelBtn");
  const okBtn = $("#okBtn");
  const applyBtn = $("#applyBtn");

  const tabSave = $("#tab-save");
  const tabLoad = $("#tab-load");
  const saveTbody = $("#saveTbody");
  const commentInput = $("#commentInput");
  const contentEl = $("#content");

  let currentMode: "save" | "load" = initialMode;
  let selectedSlotIndex: number = -1;

  const SAVE_KEY_PREFIX = "alive_save_";
  const MAX_SAVE_SLOTS = 20;

  function setMode(mode: "save" | "load") {
    currentMode = mode;
    if (mode === "save") {
      tabSave.attr("aria-selected", "true");
      tabLoad.attr("aria-selected", "false");
      commentInput.removeAttr("readonly");
    } else {
      tabSave.attr("aria-selected", "false");
      tabLoad.attr("aria-selected", "true");
      commentInput.attr("readonly", "readonly");
    }
    renderTable();
    updateButtons();
  }

  tabSave.on("click", () => setMode("save"));
  tabLoad.on("click", () => setMode("load"));

  function formatDate(isoStr?: string) {
    if (!isoStr) return "----/--/-- --:--:--";
    const d = new Date(isoStr);
    return `${d.getFullYear()}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getDate().toString().padStart(2,'0')} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}:${d.getSeconds().toString().padStart(2,'0')}`;
  }

  function renderTable() {
    saveTbody.empty();
    for (let i = 0; i < MAX_SAVE_SLOTS; i++) {
      const saveKey = SAVE_KEY_PREFIX + i;
      const saveData = localStorage.getItem(saveKey);
      let dateText = "-------------------";
      let locationText = "-------------------";
      let commentText = "-------------------";

      if (saveData) {
        try {
          const st = JSON.parse(saveData);
          dateText = formatDate(st.timestamp);
          locationText = (st.eventName || "??").toString();
          commentText = st.comment || "";
        } catch (e) {}
      }

      const tr = $("<tr>");
      if (selectedSlotIndex === i) {
        tr.addClass("selected");
        commentInput.val(commentText);
      }

      tr.append($("<td>").text(`${(i + 1).toString().padStart(2, '0')}.`));
      tr.append($("<td>").text(dateText));
      tr.append($("<td>").text(commentText));

      tr.on("mousedown", () => {
        selectedSlotIndex = i;
        renderTable();
        updateButtons();
      });
      tr.on("dblclick", () => {
        selectedSlotIndex = i;
        renderTable();
        applyAction();
      });

      saveTbody.append(tr);
    }

    if (selectedSlotIndex === -1) {
      commentInput.val("");
    }
  }

  function updateButtons() {
    const hasSelection = selectedSlotIndex !== -1;
    // For load, cannot apply if empty slot
    if (currentMode === "load" && hasSelection) {
       const saveKey = SAVE_KEY_PREFIX + selectedSlotIndex;
       const saveData = localStorage.getItem(saveKey);
       if (!saveData) {
         okBtn.prop("disabled", true);
         applyBtn.prop("disabled", true);
         return;
       }
    }
    
    okBtn.prop("disabled", !hasSelection);
    applyBtn.prop("disabled", !hasSelection);
  }

  async function applyAction() {
    if (selectedSlotIndex === -1) return;

    if (currentMode === "save") {
      try {
        if ('__TAURI_INTERNALS__' in window) {
           const { emit } = await import("@tauri-apps/api/event");
           await emit("save-load-action", { slotIndex: selectedSlotIndex, comment: commentInput.val(), mode: currentMode });
        } else if (window.opener) {
           window.opener.postMessage({ type: "save-load-action", slotIndex: selectedSlotIndex, comment: commentInput.val(), mode: currentMode }, "*");
        }
        await closeCurrentWindow();
      } catch (e) {
        console.error(e);
      }
    } else {
      try {
        if ('__TAURI_INTERNALS__' in window) {
           const { emit } = await import("@tauri-apps/api/event");
           await emit("save-load-action", { slotIndex: selectedSlotIndex, mode: currentMode });
        } else if (window.opener) {
           window.opener.postMessage({ type: "save-load-action", slotIndex: selectedSlotIndex, mode: currentMode }, "*");
        }
        await closeCurrentWindow();
      } catch (e) {
        console.error(e);
      }
    }
  }

  okBtn.on("click", applyAction);
  applyBtn.on("click", applyAction);

  cancelBtn.on("click", () => {
    window.closeWindow();
  });
  closeBtn.on("click", () => {
    window.closeWindow();
  });

  setMode(initialMode);
});
