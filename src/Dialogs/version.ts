import "98.css";
import { closeCurrentWindow, setupWindowBehavior } from "../Utils/WindowManager";

setupWindowBehavior();

declare global {
  interface Window {
    closeWindow: () => Promise<void>;
  }
}

window.closeWindow = closeCurrentWindow;
