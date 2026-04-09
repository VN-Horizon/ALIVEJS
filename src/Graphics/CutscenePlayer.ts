import { SceneElement } from "@/Graphics/SceneElement";
import type { IScene } from "@/Scene/Scene";
import type { SceneElementData } from "@/Scene/SceneData";
import $ from "jquery";

export class CutscenePlayer extends SceneElement {
    videoElement: HTMLVideoElement | null = null;

    constructor(data: SceneElementData, parent: SceneElement | null = null, scene: IScene | null = null) {
        super(data, parent, scene);
        this.recreateDOMAsVideo();
    }

    private recreateDOMAsVideo() {
        if (this.domElement) {
            $(this.domElement).remove();
        }

        this.videoElement = document.createElement("video");
        
        // Apply initial styles
        this.videoElement.style.position = "absolute";
        this.videoElement.style.left = "0px";
        this.videoElement.style.top = "0px";
        this.videoElement.style.width = "640px";
        this.videoElement.style.height = "480px";    
        this.videoElement.style.pointerEvents = "none";
        this.videoElement.style.zIndex = "-1";
        this.videoElement.style.opacity = "0";

        this.domElement = this.videoElement;
        
        $(this.domElement).attr("layer-name", this.sceneData.name || "CutscenePlayer");
        $(this.domElement).css(this.buildBaseStyle());

        this.syncDom();
    }
}
