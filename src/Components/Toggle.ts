import type { IScene } from "@/Scene/Scene";
import $ from "jquery";
import { Button, type ButtonData, type ToButtonOptions } from "./Button";
import { preserveLayerIndex, type SceneElement } from "./SceneElement";

export interface ToggleData extends ButtonData {
  initialOn?: boolean;
  onToggleChange?: (on: boolean) => void;
}

export interface ToToggleOptions extends ToButtonOptions {
  initialOn?: boolean;
  onToggleChange?: (on: boolean) => void;
}

export class Toggle extends Button {
  isOn: boolean;
  private onToggleChangeHandler: ((on: boolean) => void) | null = null;

  constructor(data: ToggleData, parent: SceneElement | null = null, scene: IScene | null = null) {
    data.isButton = true;

    super(data, parent, scene);

    this.isOn = data.initialOn ?? false;
    this.onToggleChangeHandler = data.onToggleChange ?? null;

    this.buttonId = `toggle-${Math.random().toString(36).substring(2, 11)}`;
    this.isButton = true;
    this.transform.z = data.z || 0;
    this.cursor = data.cursor || "pointer";

    this.recreateDOMAsToggle();
    this.injectCSSRules();
    this.updateFocusability();
    if (data.callback) this.onClick(data.callback);
    this.setupClickListener();
  }

  recreateDOMAsToggle() {
    super.recreateDOMAsButton();
    const $el = $(this.domElement!);
    $el.addClass("vn-toggle");
    $el.attr("role", "switch");
    this.applyToggleDomVisual();
  }

  injectCSSRules() {
    super.injectCSSRules();
  }

  private applyToggleDomVisual() {
    if (!this.domElement) return;
    const $el = $(this.domElement);
    if (this.isOn) {
      $el.addClass("is-on");
    } else {
      $el.removeClass("is-on");
    }
    $el.attr("aria-checked", this.isOn ? "true" : "false");
  }

  /** Sets the toggle position. When `fire` is true, invokes `onToggleChange` if the value changed. */
  setOn(value: boolean, fire = true) {
    const prev = this.isOn;
    this.isOn = value;
    this.applyToggleDomVisual();
    if (fire && prev !== value && this.onToggleChangeHandler) {
      this.onToggleChangeHandler(value);
    }
  }

  onToggleChange(callback: (on: boolean) => void) {
    this.onToggleChangeHandler = callback;
  }

  setupClickListener() {
    if (!this.domElement) return;

    const $el = $(this.domElement);
    $el.off("click.vn-toggle");
    $el.on("click.vn-toggle", (e) => {
      const sceneEnabled = this.scene ? this.scene.isFocusable : true;
      const effectiveEnabled =
        this.manualEnabled === true ? true : this.manualEnabled === false ? false : sceneEnabled;
      if (!effectiveEnabled) {
        e.preventDefault();
        return;
      }
      this.setOn(!this.isOn);
      if (this.onClickHandler) this.onClickHandler();
    });
  }

  onClick(callback: () => void) {
    this.onClickHandler = callback;
    this.setupClickListener();
  }

  updateDOMStyle() {
    if (!this.domElement) return;
    $(this.domElement).css(
      this.buildBaseStyle({
        cursor: this.cursor,
        background: "transparent",
      })
    );
  }
}

export function toToggle(group: SceneElement | null, options: Partial<ToToggleOptions> = {}) {
  if (!group) {
    console.error("toToggle called with null group");
    return null;
  }
  const {
    stateIndexes = [0, 1, 2, 3],
    defaultTransform = [null, null, null, null],
    z = 0,
    cursor = "pointer",
    callback = null,
    focusable = true,
    visible = true,
    flags = [],
    disabled = false,
    initialOn = false,
    onToggleChange,
  } = options;
  if (!Array.isArray(group.children) || group.children.length === 0) {
    console.error("Group must have children to elevate to Toggle");
    return null;
  }

  const transforms: Array<[number, number, number, number]> = [];
  const images: string[] = [];

  stateIndexes.forEach((stateIndex) => {
    const layer = stateIndex >= 0 ? group.children[stateIndex] : null;

    transforms.push([
      layer?.x || defaultTransform[0] || 0,
      layer?.y || defaultTransform[1] || 0,
      layer?.width || defaultTransform[2] || 10,
      layer?.height || defaultTransform[3] || 10,
    ]);
    images.push(
      layer ? (layer.domElement as HTMLImageElement)?.src || layer.sceneData.path || "" : ""
    );
  });

  const toggleData = {
    ...group.sceneData,
    transforms,
    images,
    zIndex: group.zIndex,
    z,
    cursor,
    callback,
    focusable,
    visible,
    flags,
    disabled,
    initialOn,
    onToggleChange,
  } as ToggleData;

  const toggle = new Toggle(toggleData, group.parent, group.scene);
  window.getEngine().getTopScene().addObject(toggle);

  group.children.forEach((child) => child.destroy());

  preserveLayerIndex(group, toggle);

  return toggle;
}
