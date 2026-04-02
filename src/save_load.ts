import "98.css";
import $ from "jquery";
import { closeCurrentWindow, setupWindowBehavior } from "./Utils/WindowManager";

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

  const closeBtn = document.getElementById("closeBtn") as HTMLButtonElement;
  const cancelBtn = document.getElementById("cancelBtn") as HTMLButtonElement;
  const okBtn = document.getElementById("okBtn") as HTMLButtonElement;
  const applyBtn = document.getElementById("applyBtn") as HTMLButtonElement;

  const tabSave = document.getElementById("tab-save") as HTMLElement;
  const tabLoad = document.getElementById("tab-load") as HTMLElement;
  const saveTbody = document.getElementById("saveTbody") as HTMLElement;
  const commentInput = document.getElementById("commentInput") as HTMLInputElement;
  const contentEl = document.getElementById("content") as HTMLElement;

  let currentMode: "save" | "load" = initialMode;
  let selectedSlotIndex: number = -1;

  const SAVE_KEY_PREFIX = "alive_save_";
  const MAX_SAVE_SLOTS = 20;

  function setMode(mode: "save" | "load") {
    currentMode = mode;
    if (mode === "save") {
      tabSave.setAttribute("aria-selected", "true");
      tabLoad.setAttribute("aria-selected", "false");
      commentInput.removeAttribute("readonly");
    } else {
      tabSave.setAttribute("aria-selected", "false");
      tabLoad.setAttribute("aria-selected", "true");
      commentInput.setAttribute("readonly", "readonly");
    }
    renderTable();
    updateButtons();
  }

  tabSave.addEventListener("click", () => setMode("save"));
  tabLoad.addEventListener("click", () => setMode("load"));

  function formatDate(isoStr?: string) {
    if (!isoStr) return "----/--/-- --:--:--";
    const d = new Date(isoStr);
    return `${d.getFullYear()}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getDate().toString().padStart(2,'0')} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}:${d.getSeconds().toString().padStart(2,'0')}`;
  }

  function renderTable() {
    saveTbody.innerHTML = "";
    for (let i = 0; i < MAX_SAVE_SLOTS; i++) {
      const saveKey = SAVE_KEY_PREFIX + i;
      const saveData = localStorage.getItem(saveKey);
      let dateText = "-------------------";
      let locationText = "-------------------";
      let commentText = "";

      if (saveData) {
        try {
          const st = JSON.parse(saveData);
          dateText = formatDate(st.timestamp);
          locationText = (st.eventName || "??").toString();
          commentText = st.comment || "";
        } catch (e) {}
      }

      const tr = document.createElement("tr");
      if (selectedSlotIndex === i) {
        tr.classList.add("selected");
        commentInput.value = commentText;
      }
      
      const numCell = document.createElement("td");
      numCell.textContent = `${(i + 1).toString().padStart(2, '0')}.`;
      const dateCell = document.createElement("td");
      dateCell.textContent = dateText;
      const locCell = document.createElement("td");
      locCell.textContent = locationText;

      tr.appendChild(numCell);
      tr.appendChild(dateCell);
      tr.appendChild(locCell);

      tr.addEventListener("mousedown", () => {
        selectedSlotIndex = i;
        renderTable();
        updateButtons();
      });
      tr.addEventListener("dblclick", () => {
        selectedSlotIndex = i;
        renderTable();
        applyAction();
      });

      saveTbody.appendChild(tr);
    }

    if (selectedSlotIndex === -1) {
      commentInput.value = "";
    }
  }

  function updateButtons() {
    const hasSelection = selectedSlotIndex !== -1;
    // For load, cannot apply if empty slot
    if (currentMode === "load" && hasSelection) {
       const saveKey = SAVE_KEY_PREFIX + selectedSlotIndex;
       const saveData = localStorage.getItem(saveKey);
       if (!saveData) {
         okBtn.disabled = true;
         applyBtn.disabled = true;
         return;
       }
    }
    
    okBtn.disabled = !hasSelection;
    applyBtn.disabled = !hasSelection;
  }

  async function applyAction() {
    if (selectedSlotIndex === -1) return;

    if (currentMode === "save") {
      try {
        if ('__TAURI_INTERNALS__' in window) {
           const { emit } = await import("@tauri-apps/api/event");
           await emit("save-load-action", { slotIndex: selectedSlotIndex, comment: commentInput.value, mode: currentMode });
        } else if (window.opener) {
           window.opener.postMessage({ type: "save-load-action", slotIndex: selectedSlotIndex, comment: commentInput.value, mode: currentMode }, "*");
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

  okBtn.addEventListener("click", applyAction);
  applyBtn.addEventListener("click", applyAction);

  cancelBtn.addEventListener("click", () => {
    window.closeWindow();
  });
  closeBtn.addEventListener("click", () => {
    window.closeWindow();
  });

  setMode(initialMode);
});
