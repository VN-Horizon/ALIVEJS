import { loadSettings } from "@/Core/Settings";
import type { SceneElementData } from "@/Scene/SceneData";
import $ from "jquery";
import { SceneElement } from "./SceneElement";

export interface TMP_TextData extends SceneElementData {
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  color?: string;
}

export class TMP_Text extends SceneElement {
  text: string = "";
  fontSize: number = 16;
  fontFamily: string = "";
  fontWeight: string = "normal";
  color: string = "#000000";

  constructor(data: TMP_TextData, parent = null, scene = null) {
    super(data, parent, scene);

    this.text = data.text || "";
    this.fontSize = data.fontSize || 16;
    this.fontFamily = data.fontFamily || "";
    this.fontWeight = data.fontWeight || "normal";
    this.color = data.color || "#000000";

    this.setText(this.text);
    this.updateTextStyle();
  }

  createDOMElement() {
    this.domElement = $("<span>")
      .attr("layer-name", this.sceneData.name || "")
      .text(this.text)
      .css(this.buildBaseStyle())[0];
    super.syncDom();
  }

  buildBaseStyle(extra = {}) {
    return super.buildBaseStyle({
      "font-size": `${this.fontSize}px`,
      color: this.color,
      display: this.visible ? "inline-block" : "none",
      "font-family": this.fontFamily,
      "font-weight": this.fontWeight,
      ...extra,
    });
  }

  setText(newText: string) {
    this.text = newText;
    if (this.domElement) {
      $(this.domElement).text(this.text);
    }
  }

  updateTextStyle() {
    if (!this.domElement) return;
    this.updateDOMStyle();
  }
}

export class TMP_TypeWriter extends TMP_Text {
  fullText: string = "";
  currentCharIndex: number = 0;
  isAnimating: boolean = false;
  charsPerSecond: number = 30;
  timeAccumulator: number = 0;

  constructor(data: TMP_TextData & { charsPerSecond?: number }, parent = null, scene = null) {
    super(data, parent, scene);

    this.fullText = this.text;
    this.currentCharIndex = 0;
    this.isAnimating = false;

    const textSpeedSetting = loadSettings().textSpeed;
    const defaultSpeed = textSpeedSetting === 10 ? 9999 : 10 + textSpeedSetting * 8; // 0->10, 5->50, 10->Instant

    this.charsPerSecond = data.charsPerSecond || defaultSpeed;
    this.timeAccumulator = 0;

    this.cancelAnimation();
    this.setText(this.text);
  }

  update(deltaTime: number) {
    super.update(deltaTime);

    if (!this.isAnimating || this.currentCharIndex >= this.fullText.length) {
      if (this.isAnimating) {
        this.isAnimating = false;
        this.setText(this.fullText);
      }
      return;
    }

    // Skip animation immediately if skipping is enabled
    if (window.skipping) {
      this.cancelAnimation();
      return;
    }

    this.timeAccumulator += deltaTime;
    const timePerChar = 1.0 / this.charsPerSecond;

    while (this.timeAccumulator >= timePerChar && this.currentCharIndex < this.fullText.length) {
      this.timeAccumulator -= timePerChar;
      this.currentCharIndex++;
      super.setText(this.fullText.substring(0, this.currentCharIndex));
    }
  }

  cancelAnimation() {
    this.isAnimating = false;
    this.currentCharIndex = this.fullText.length;
    super.setText(this.fullText);
    this.timeAccumulator = 0;
  }

  animateText(newText: string) {
    if (this.fullText == newText && this.isAnimating) {
      this.cancelAnimation();
      return;
    }
    this.fullText = newText;
    this.isAnimating = true;
    this.currentCharIndex = 0;
    this.timeAccumulator = 0;
    this.setText("");
  }
}
