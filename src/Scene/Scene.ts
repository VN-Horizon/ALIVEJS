import type { GameEngine } from "@/Core/NotUnityEngine";
import { FocusableElement } from "@/Graphics/FocusableElement";
import { type ISceneElement, SceneElement } from "@/Graphics/SceneElement";
import $ from "jquery";

export interface IScene {
  name: string;
  engine: any;
  /** Root DOM node for this scene; all root-level elements are mounted here. */
  rootElement: HTMLElement;
  sceneObjects: ISceneElement[];
  isFocusable: boolean;
  lastFocusedElement: HTMLElement | JQuery.PlainObject | null;
  onDestroyCallbacks: Array<() => void>;
  onBeforeFocusCallbacks: Array<() => void>;
  onBeforeUnfocusCallbacks: Array<() => void>;
  onAfterFocusCallbacks: Array<() => void>;

  addObject<T extends ISceneElement>(obj: T): T | undefined;

  removeObject(obj: ISceneElement): void;

  getObjectByName<T extends ISceneElement = SceneElement>(
    name: string,
    type?: { new (...args: any[]): T }
  ): T | null;

  getAllObjects(): ISceneElement[];

  setFocusable(focusable: boolean): void;

  destroy(): void;

  update(deltaTime: number): void;

  hide(): void;

  show(): void;
}

export class Scene implements IScene {
  name: string;
  engine: GameEngine;
  rootElement: HTMLElement;
  sceneObjects: ISceneElement[] = [];
  isFocusable = false;
  lastFocusedElement: HTMLElement | JQuery.PlainObject | null = null;
  onDestroyCallbacks: Array<() => void> = [];
  onBeforeFocusCallbacks: Array<() => void> = [];
  onBeforeUnfocusCallbacks: Array<() => void> = [];
  onAfterFocusCallbacks: Array<() => void> = [];
  onAfterUnfocusCallbacks: Array<() => void> = [];

  constructor(name: string, engine: GameEngine) {
    this.name = name;
    this.engine = engine;
    this.rootElement = document.createElement("div");
    this.rootElement.dataset.sceneRoot = name;
    Object.assign(this.rootElement.style, {
      isolation: "isolate",
      left: "0",
      top: "0",
      width: "100%",
      height: "100%",
      overflow: "visible",
    });
    engine.container.appendChild(this.rootElement);
  }

  addObject<T extends ISceneElement>(obj: T): T | undefined {
    if (!this.sceneObjects.includes(obj)) {
      this.sceneObjects.push(obj);
      obj.scene = this;
      obj.update?.(1);
      obj.syncDom?.();
      return obj;
    }
  }

  removeObject(obj: ISceneElement) {
    const index = this.sceneObjects.indexOf(obj);
    if (index > -1) {
      this.sceneObjects.splice(index, 1);
      // Remove from DOM
      $(obj.domElement)?.remove();
    }
  }

  getObjectByName<T extends ISceneElement = SceneElement>(
    name: string,
    type?: { new (...args: any[]): T }
  ): T | null {
    let found: ISceneElement | null = null;
    // Search recursively through objects and their children
    for (const obj of this.sceneObjects) {
      if (obj.sceneData && obj.sceneData.name === name) {
        found = obj;
        break;
      }
      // Search in children recursively
      const childFound = this.findInChildren(obj, name);
      if (childFound) {
        found = childFound;
        break;
      }
    }
    if (found) {
      if (type && !(found instanceof type)) {
        console.error(
          `Object '${name}' found but is type '${found.constructor.name}', expected '${type.name}'`
        );
        return null;
      }
      return found as unknown as T;
    }
    return null;
  }

  findInChildren(obj: ISceneElement, name: string): ISceneElement | null {
    if (!obj.children || obj.children.length === 0) return null;

    for (const child of obj.children) {
      if (child.sceneData && child.sceneData.name === name) {
        return child;
      }
      const found = this.findInChildren(child, name);
      if (found) return found;
    }
    return null;
  }

  getAllObjects(): ISceneElement[] {
    return this.sceneObjects;
  }

  setFocusable(focusable: boolean) {
    this.isFocusable = focusable;
    if (focusable) this.onBeforeFocusCallbacks.forEach((cb) => cb());
    else this.onBeforeUnfocusCallbacks.forEach((cb) => cb());

    this.sceneObjects.forEach((obj) => {
      if (
        typeof FocusableElement !== "undefined" &&
        typeof FocusableElement.updateFocusabilityRecursive === "function"
      ) {
        FocusableElement.updateFocusabilityRecursive(obj as FocusableElement);
      } else if (typeof obj.updateFocusability === "function") {
        obj.updateFocusability();
      }
    });

    if (!this.lastFocusedElement) return;
    const $last = $(this.lastFocusedElement);
    if ($last.length && $last.is(":visible")) {
      $last.trigger("focus");
    }

    if (focusable) this.onAfterFocusCallbacks.forEach((cb) => cb());
    else this.onAfterUnfocusCallbacks.forEach((cb) => cb());
  }

  destroy() {
    this.onDestroyCallbacks.forEach((callback) => callback());
    this.sceneObjects.forEach((obj) => obj.destroy?.());
    this.sceneObjects = [];
    this.rootElement.remove();
  }

  update(deltaTime: number) {
    this.sceneObjects.forEach((obj) => obj.update?.(deltaTime));
  }

  hide() {
    this.rootElement.style.display = "none";
  }

  show() {
    this.rootElement.style.display = "";
  }
}
