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
