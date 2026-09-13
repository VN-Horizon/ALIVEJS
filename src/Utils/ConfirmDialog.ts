import $ from "jquery";
import { clearAutoContinueTimer } from "@/Utils/AutoContinueTimer";
import { attachDraggablePanel } from "@/Utils/WebEmbeddedDialog";

window.confirmOpen = false;

export function showConfirmDialog(options: {
  title?: string;
  message: string;
}): Promise<boolean> {
  if (window.confirmOpen) return Promise.resolve(false);

  const { title = "确认", message } = options;
  window.confirmOpen = true;

  if (window.skipping) {
    window.skipping = false;
    document.dispatchEvent(new CustomEvent("SkipModeEnded", { bubbles: true }));
  }
  clearAutoContinueTimer();

  return new Promise<boolean>((resolve) => {
    const overlay = $("<div>").addClass("alive-confirm-overlay");
    const dialog = $("<div>").addClass("window alive-confirm-window");
    const titleBar = $("<div>").addClass("title-bar");
    const titleText = $("<div>").addClass("title-bar-text").text(title);
    const controls = $("<div>").addClass("title-bar-controls");
    const closeBtn = $("<button>").attr("aria-label", "Close");
    const body = $("<div>").addClass("window-body alive-confirm-body");
    const messageEl = $("<div>").addClass("alive-confirm-message").text(message);
    const footer = $("<div>").addClass("alive-confirm-footer");
    const okBtn = $("<button>").text("确定");
    const cancelBtn = $("<button>").text("取消");

    const finish = (value: boolean) => {
      $(document).off("keydown.alive-confirm");
      overlay.remove();
      window.confirmOpen = false;
      resolve(value);
    };

    $(document).on("keydown.alive-confirm", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        finish(true);
      } else if (e.key === "Escape") {
        e.preventDefault();
        finish(false);
      }
    });
    okBtn.on("click", () => finish(true));
    cancelBtn.on("click", () => finish(false));
    closeBtn.on("click", () => finish(false));

    footer.append(okBtn, cancelBtn);
    body.append(messageEl, footer);
    controls.append(closeBtn);
    titleBar.append(titleText, controls);
    dialog.append(titleBar, body);
    overlay.append(dialog);
    $("body").append(overlay);

    attachDraggablePanel(titleBar[0], dialog[0], controls[0]);

    okBtn.trigger("focus");
  });
}
