import { execUntilNextLine } from "../Core/Events";
import { applyGameState, loadGame, saveGame } from "../Core/GameSave";
import { destroyScene } from "../Scene/SceneManagement";
import { loadBackgroundScene } from "../Scripts/BACKGROUND";
import { pushDialogWindow } from "../Scripts/WINDOW/WINDOW";

export function initMenuBar() {
  const menuItems = document.querySelectorAll(".menu-bar-item");
  if (menuItems.length === 0) return;
  
  let isMenuOpen = false;

  function closeAllMenus() {
    menuItems.forEach((item) => {
      item.classList.remove("open");
      item.querySelector("button")?.blur();
    });
  }

  const saveMenu = document.getElementById("menu-save");
  const loadMenu = document.getElementById("menu-load");

  saveMenu?.addEventListener("click", async () => {
    if (saveMenu.getAttribute("aria-disabled") === "true") return;
    const slotIndex = await window.openSaveLoadDialog("save");
    if (slotIndex !== null) {
        saveGame(slotIndex);
    }
  });

  loadMenu?.addEventListener("click", async () => {
    if (loadMenu.getAttribute("aria-disabled") === "true") return;
    const slotIndex = await window.openSaveLoadDialog("load");
    if (slotIndex !== null) {
        const gameState = loadGame(slotIndex);
        if (gameState) {
            // First destroy current scene if needed, or push UI
            applyGameState(gameState);
            
            // Check if we are outside of dialogue.
            if (saveMenu?.getAttribute("aria-disabled") === "true") {
                await loadBackgroundScene();
                await pushDialogWindow();
                saveMenu?.removeAttribute("aria-disabled");
            } else {
                destroyScene();
            }
            execUntilNextLine();
        }
    }
  });

  menuItems.forEach((item) => {
    const button = item.querySelector("button");
    if (!button) return;

    button.addEventListener("click", (e) => {
      e.stopPropagation();
      if (item.classList.contains("open")) {
        closeAllMenus();
        isMenuOpen = false;
        button.blur(); // Remove focus so the button style doesn't stay pressed
      } else {
        closeAllMenus();
        item.classList.add("open");
        isMenuOpen = true;
      }
    });

    item.addEventListener("mouseenter", () => {
      if (isMenuOpen && !item.classList.contains("open")) {
        closeAllMenus();
        item.classList.add("open");
        button.focus();
      }
    });
  });

  document.querySelectorAll(".menu > li:not(.divider)").forEach((li) => {
    li.addEventListener("click", () => {
      closeAllMenus();
      isMenuOpen = false;
      (document.activeElement as HTMLElement).blur();
    });
  });

  document.addEventListener("click", () => {
    if (isMenuOpen) {
      closeAllMenus();
      isMenuOpen = false;
    }
  });
}
