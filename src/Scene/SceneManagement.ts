import { AnimatedSceneElement } from "@/Graphics/AnimatedSceneElement";
import { SceneElement } from "@/Graphics/SceneElement";
import $ from "jquery";
import { Scene } from "./Scene";
import type { SceneElementData } from "./SceneData";

const currentExclusionList: string[] = [];
const loadingScenes = new Set();

export interface LoadSceneOptions {
  override?: boolean;
  singleInstance?: boolean;
  exclusionList?: string[];
  skipEntranceFade?: boolean;
}

export async function loadScene(
  path: string,
  options: LoadSceneOptions = {
    override: false,
    singleInstance: true,
    exclusionList: [],
  }
): Promise<Scene | null> {
  console.log(`Loading scene: ${path}`);
  const {
    override = false,
    singleInstance = true,
    exclusionList = [],
    skipEntranceFade = false,
  } = options;
  const engine = window.getEngine();
  if (singleInstance) {
    if (engine.isMountedScene(path)) {
      console.warn(`Scene ${path} already mounted. Skipping.`);
      return null;
    }
    if (loadingScenes.has(path)) {
      console.warn(`Scene ${path} is currently loading. Skipping.`);
      return null;
    }
  }
  loadingScenes.add(path);
  currentExclusionList.length = 0;
  currentExclusionList.push(...exclusionList);
  if (override) destroyScene();

  try {
    const sceneData = await $.getJSON(`/assets/scenes/${path}/${path.split("/").pop()}.json`);
    const engine = window.getEngine();
    if (!engine) {
      console.error("Engine not initialized");
      return null;
    }
    // Each newly loaded scene gets a increasing base z offset.
    const scene = new Scene(path, engine); // large gap to avoid overlap
    const loadPromises: Promise<any>[] = [];
    if (sceneData.children) {
      createSceneObjects(sceneData.children, null, scene, loadPromises);
    }
    await Promise.all(loadPromises);
    engine.pushScene(scene);
    if (skipEntranceFade) {
      $(scene.rootElement).stop(true).css("opacity", "1");
    } else {
      scene.fadeInEntrance();
    }
    console.log("Scene loaded successfully:", path);
    return scene;
  } catch (error) {
    console.error(`Error loading scene ${path}:`, error);
    return null;
  } finally {
    loadingScenes.delete(path);
  }
}

function createSceneObjects(
  children: SceneElementData[],
  parent: SceneElement | null,
  scene: Scene | null,
  loadPromises: Promise<any>[]
) {
  if (!children || !Array.isArray(children)) return;
  children.forEach((childData) => {
    if (currentExclusionList.includes(childData.name ?? "")) return;
    // Use AnimatedSceneElement for elements marked as animated
    const ElementClass = childData.animated ? AnimatedSceneElement : SceneElement;
    const obj = new ElementClass(childData, parent, scene);

    if (obj.imageLoadPromise) {
      loadPromises.push(obj.imageLoadPromise);
    }

    // Track root objects for cleanup
    if (!parent) {
      // Add to scene
      if (!scene) {
        console.error("Scene is not defined for root object addition");
        return;
      }
      scene.addObject(obj);
    }

    // Recursively create children
    if (childData.children && childData.children.length) {
      createSceneObjects(childData.children, obj, scene, loadPromises);
    }

    // Initialize animation frames if this is an AnimatedSceneElement
    // noinspection SuspiciousTypeOfGuard
    if (obj instanceof AnimatedSceneElement) {
      obj.initializeFrames();
    }
  });
}

export function createBlankScene(name = "Blank") {
  const engine = window.getEngine();
  if (!engine) {
    console.error("Engine not initialized");
    return null;
  }
  const scene = new Scene(name, engine);
  engine.pushScene(scene);
  scene.fadeInEntrance();
  return scene;
}

export function destroyScene() {
  const engine = window.getEngine();
  if (engine) {
    // Pop the top scene from the engine
    engine.popScene();
  }
}

export function destroySceneByName(name: string) {
  const engine = window.getEngine();
  if (engine) {
    engine.removeSceneByName(name);
  }
}
