import { Background } from "@/Components/Background";
import { Button } from "@/Components/Button";
import { confirmListener, setConfirmListener, setExitListener } from "@/InputSystem/InputSystem.Keyboard";
import { createBlankScene } from "@/Scene/SceneManagement";

export async function pushCgPlayerScene(cgIds: string[]) {
    const ids = cgIds.map((id) => id.trim()).filter(Boolean);
    if (ids.length === 0) return;
  
    const engine = window.getEngine();
    if (!engine) return;
  
    const sceneName = `CG_PLAYER_${Date.now()}`;
    const scene = createBlankScene(sceneName);
    if (!scene) return;
  
    const black = scene.addObject(
      new Background({
        name: "BlackBackground",
        transform: { x: 0, y: 0, width: 640, height: 480 },
        zIndex: 0,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      })
    );
    black?.updateBackgroundImage(`/assets/scenes/CG/BLACK/BLACK.avif`);
  
    const background = scene.addObject(
      new Background({
        name: "CGBackground",
        transform: { x: 0, y: 0, width: 640, height: 480 },
        zIndex: 0,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        transition: "opacity 0.5s ease-in-out",
      })
    );
  
    let index = 0;
    background?.updateBackgroundImage(`/assets/scenes/CG/${ids[0]}/${ids[0]}.avif`);
  
    const advance = () => {
      if (!background) return;
      if (index >= ids.length - 1) {
        if (engine.getTopScene()?.name === sceneName) {
          engine.popScene();
        }
        return;
      }
      index += 1;
      background.updateBackgroundImage(`/assets/scenes/CG/${ids[index]}/${ids[index]}.avif`);
    };
  
    const previousConfirm = confirmListener;
    setConfirmListener((_e, _focused) => {
      advance();
    });
    setExitListener(() => {
      if (engine.getTopScene()?.name === sceneName) {
        engine.popScene();
      }
    });
  
    scene.onDestroyCallbacks.push(() => {
      setConfirmListener(previousConfirm);
      setExitListener(() => {
        engine.popScene();
      });
    });
  
    const nextLineBtn = scene.addObject(
      new Button({
        name: "NextLineButton",
        cursor: "default",
        stateIndexes: [-1, -1, -1, -1],
        transforms: [
          [0, 0, 640, 480],
          [0, 0, 640, 480],
          [0, 0, 640, 480],
          [0, 0, 640, 480],
        ],
        images: ["", "", "", ""],
        zIndex: 10,
        disabled: false,
        callback: () => {
          advance();
        },
      })
    );
  
    nextLineBtn?.setFocus();
  }
  