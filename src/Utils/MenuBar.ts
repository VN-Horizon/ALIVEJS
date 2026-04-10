import { execUntilNextLine } from "../Core/Events";
import { applyGameState, loadGame, saveGame } from "@/Core/Save/GameSave";
import { destroyScene } from "@/Scene/SceneManagement";
import { loadBackgroundScene } from "@/Scripts/BACKGROUND";
import { pushDialogWindow } from "@/Scripts/WINDOW/WINDOW";

export function initMenuBar() {
  const menuItems = $(".menu-bar-item");
  if (menuItems.length === 0) return;

  let isMenuOpen = false;

  function closeAllMenus() {
    menuItems.each((_, item) => {
      $(item).removeClass("open");
      $(item).find("button")?.trigger("blur");
    });
  }

  const saveMenu = $("menu-save");
  const loadMenu = $("menu-load");

  saveMenu.on("click", async () => {
    if (saveMenu.attr("aria-disabled") === "true") return;
    const slotIndex = await window.openSaveLoadDialog("save");
    if (slotIndex !== null) {
      saveGame(slotIndex);
    }
  });

  loadMenu?.on("click", async () => {
    if (loadMenu.attr("aria-disabled") === "true") return;
    const slotIndex = await window.openSaveLoadDialog("load");
    if (slotIndex !== null) {
      const gameState = loadGame(slotIndex);
      if (gameState) {
        // Check if we are outside of dialogue.
        if (saveMenu?.attr("aria-disabled") === "true") {
          await loadBackgroundScene();
          await pushDialogWindow({ autoAdvance: false });
          saveMenu?.removeAttr("aria-disabled");
        }
        if (window.getEngine().getTopScene()?.name === "UI/SYSTEM") {
          destroyScene();
        }
        applyGameState(gameState);
        execUntilNextLine();
      }
    }
  });

  menuItems.each((_, item) => {
    const button = $(item).find("button");
    if (!button) return;

    button.on("click", (e) => {
      e.stopPropagation();
      if (item.classList.contains("open")) {
        closeAllMenus();
        isMenuOpen = false;
        button.trigger("blur"); // Remove focus so the button style doesn't stay pressed
      } else {
        closeAllMenus();
        item.classList.add("open");
        isMenuOpen = true;
      }
    });

    $(item).on("mouseenter", () => {
      if (isMenuOpen && !item.classList.contains("open")) {
        closeAllMenus();
        item.classList.add("open");
        button.trigger("focus");
      }
    });
  });

  $(".menu > li:not(.divider)").each((_, li) => {
    $(li).on("click", () => {
      closeAllMenus();
      isMenuOpen = false;
      (document.activeElement as HTMLElement).blur();
    });
  });

  $(document).on("click", () => {
    if (isMenuOpen) {
      closeAllMenus();
      isMenuOpen = false;
    }
  });
}
