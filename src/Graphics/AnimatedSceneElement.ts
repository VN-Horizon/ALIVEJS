import type { SceneElementData } from "@/Scene/SceneData";
import { SceneElement } from "./SceneElement";

export interface AnimatedSceneElementData extends SceneElementData {
    fps?: number;
    loop?: boolean;
    autoPlay?: boolean;
    onComplete?: () => void;
}

export class AnimatedSceneElement extends SceneElement {
    fps: number;
    loop: boolean;
    autoPlay: boolean;
    currentFrame: number = 0;
    isPlaying: boolean = false;
    frameTime: number;
    elapsedTime: number = 0;
    onComplete: (() => void) | null;
    constructor(data: AnimatedSceneElementData, parent = null, scene = null) {
        super(data, parent, scene);

        // Animation properties
        this.fps = data.fps || 12;
        this.loop = data.loop !== false;
        this.autoPlay = data.autoPlay !== false;

        // Animation state
        this.frameTime = 1 / this.fps;
        this.onComplete = data.onComplete || null;
    }

    initializeFrames() {
        // Hide all frames initially except the first one
        this.children.forEach((child, index) => {
            if (index !== 0) {
                child.visible = false;
                child.updateDOMStyle();
            }
        });

        if (this.autoPlay && this.children.length > 0) {
            this.play();
        }
    }

    play() {
        if (this.children.length === 0) return;
        this.isPlaying = true;
        this.elapsedTime = 0;
    }

    stop() {
        this.isPlaying = false;
        this.setFrame(0);
    }

    setFrame(frameIndex: number) {
        if (this.children.length === 0) return;

        // Clamp frame index
        frameIndex = Math.max(0, Math.min(frameIndex, this.children.length - 1));

        // Hide current frame
        if (this.children[this.currentFrame]) {
            this.children[this.currentFrame].visible = false;
            this.children[this.currentFrame].updateDOMStyle();
        }

        // Show new frame
        this.currentFrame = frameIndex;
        if (this.children[this.currentFrame]) {
            this.children[this.currentFrame].visible = true;
            this.children[this.currentFrame].updateDOMStyle();
        }
    }

    nextFrame() {
        if (this.children.length === 0) return;

        const direction = this.fps >= 0 ? 1 : -1;
        let nextIndex = this.currentFrame + direction;

        // Handle forward playback
        if (direction > 0) {
            if (nextIndex >= this.children.length) {
                if (this.loop) {
                    nextIndex = 0;
                } else {
                    this.isPlaying = false;
                    if (this.onComplete) {
                        this.onComplete();
                    }
                    return;
                }
            }
        }
        // Handle reverse playback
        else {
            if (nextIndex < 0) {
                if (this.loop) {
                    nextIndex = this.children.length - 1;
                } else {
                    this.isPlaying = false;
                    if (this.onComplete) {
                        this.onComplete();
                    }
                    return;
                }
            }
        }

        this.setFrame(nextIndex);
    }

    previousFrame() {
        if (this.children.length === 0) return;

        let prevIndex = this.currentFrame - 1;

        if (prevIndex < 0) {
            if (this.loop) {
                prevIndex = this.children.length - 1;
            } else {
                prevIndex = 0;
            }
        }

        this.setFrame(prevIndex);
    }

    update(deltaTime: number) {
        super.update(deltaTime);

        if (!this.isPlaying || this.children.length === 0) return;

        this.elapsedTime += deltaTime;

        // Calculate frame time based on absolute fps value
        const absFrameTime = 1 / Math.abs(this.fps);

        // Check if it's time to advance to the next frame
        if (this.elapsedTime >= absFrameTime) {
            // Calculate how many frames to advance (in case of lag)
            const framesToAdvance = Math.floor(this.elapsedTime / absFrameTime);
            this.elapsedTime %= absFrameTime;

            for (let i = 0; i < framesToAdvance; i++) {
                this.nextFrame();
                if (!this.isPlaying) break; // Stop if animation ended
            }
        }
    }

    show(fromParent = false) {
        if (fromParent) {
            this.visible = this.originallyVisible;
        } else {
            this.visible = true;
        }
        this.updateDOMStyle();

        // Only show the current frame, keep others hidden
        this.children.forEach((child, index) => {
            if (index === this.currentFrame) {
                child.show(true);
            } else {
                child.visible = false;
                child.updateDOMStyle();
            }
        });
    }

    hide(fromParent = false) {
        if (fromParent) {
            this.originallyVisible = this.visible;
        }
        this.visible = false;
        this.updateDOMStyle();
        this.children.forEach(child => child.hide(true));
    }
}
