import { toButton } from '../../Graphics/Graphics.Button.js';
import { TMP_Text } from '../../Graphics/Graphics.TextMessPoor.js';
import { AnimatedSceneElement } from '../../Graphics/Graphics.AnimatedSceneElement.js';
import { SceneElement } from '../../Graphics/Graphics.SceneElement.js';

export function initSelectionsBox(dialogWindow) {
    let isSelectionsBoxVisible = false;
    let animationInProgress = false;
    const selectionButtons = [null, null, null];

    for (let i = 1; i <= 3; i++) {
        selectionButtons[i - 1] = toButton(dialogWindow.getObjectByName(`選択肢${['１','２','３'][i-1]}`), {
            z: 10,
            stateIndexes: [-1,0,1,-1],
            defaultTransform: [64, 238 + (i-1) * 29, 514, 28],
            callback: async () => {
                console.log(`選択肢${i}が選ばれました`);
                dialogWindow.getObjectByName("DialogText").animateText(`你选择了选项${i}。你说得对，但是原神是一款由米哈游自主研发的开放世界冒险游戏。`);
            }
        });
        selectionButtons[i - 1].hide();
    }
    const selectionsText = dialogWindow.addObject(new TMP_Text({
        name: "SelectionsText",
        text: "你说得对，但是原神是一款由米哈游自主研发的开放世界冒险游戏。\n你说得对，但是原神是一款由米哈游自主研发的开放世界冒险游戏。\n你说得对，但是原神是一款由米哈游自主研发的开放世界冒险游戏。",
        fontSize: 16,
        color: "#FFFFFF",
        fontWeight: "medium",
        zIndex: 11,
        transform: { x: 70, y: 238, width: 502, height: 86 },
    }));
    $(selectionsText.domElement).css({'white-space': 'pre-line', 'line-height': '29px', 'pointer-events': 'none', 'text-shadow': '1px 1px 0px #000000'});
    selectionsText.hide();

    // Load the frame animation data from the scene JSON
    const loadFrameAnimation = async () => {
        const sceneData = await $.getJSON('/assets/scenes/UI/WINDOW/WINDOW.json');
        const frameAnimNode = sceneData.children.find(child => child.name === "枠アニメ");
        
        if (!frameAnimNode) {
            console.error('枠アニメ not found in WINDOW.json');
            return null;
        }
        
        const frameAnimData = {
            ...frameAnimNode,
            fps: 60,
            loop: false,
            autoPlay: false
        };
        
        const frameAnim = dialogWindow.addObject(new AnimatedSceneElement(frameAnimData, null, dialogWindow));
        
        // Create frame children from the JSON data
        frameAnimNode.children.forEach((childData, index) => {
            const child = new SceneElement(childData, frameAnim, dialogWindow);
            if (index !== 0) {
                child.visible = false;
                child.updateDOMStyle();
            }
        });
        
        frameAnim.initializeFrames();
        frameAnim.hide();
        
        return frameAnim;
    };
    
    // Initialize frame animation asynchronously
    loadFrameAnimation().then(frameAnim => {
        dialogWindow._frameAnimation = frameAnim;
    });

    // Get references to UI elements
    const selectingDialogBox = dialogWindow.getObjectByName("選択中");
    const normalDialogBox = dialogWindow.getObjectByName("通常");
    const sayDialogBox = dialogWindow.getObjectByName("吹き出し");

    // Toggle function for selections box
    const toggleSelectionsBox = () => {
        if (animationInProgress) return;
        
        const frameAnim = dialogWindow._frameAnimation;
        if (!frameAnim) return;

        animationInProgress = true;
        isSelectionsBoxVisible = !isSelectionsBoxVisible;

        if (isSelectionsBoxVisible) {
            // Show animation (forward: frames 0-9)
            selectingDialogBox?.show();
            normalDialogBox?.hide();
            sayDialogBox?.hide();
            dialogWindow.getObjectByName("NextLineButton")?.hide();
            
            frameAnim.show();
            frameAnim.setFrame(0);
            frameAnim.onComplete = () => {
                animationInProgress = false;
                selectionsText.show();
                selectionButtons.forEach(btn => btn.show());
            };
            frameAnim.play();
        } else {
            // Hide animation (reverse: frames 9-0)
            frameAnim.setFrame(9);
            frameAnim.fps = -60; // Negative fps for reverse playback
            selectionsText.hide();
            selectionButtons.forEach(btn => btn.hide());
            frameAnim.onComplete = () => {
                frameAnim.hide();
                frameAnim.fps = 60; // Reset fps
                selectingDialogBox?.hide();
                dialogWindow.getObjectByName("NextLineButton")?.show();
                dialogWindow.getObjectByName("NextLineButton")?.setFocus();
                
                // Restore previous dialog box state
                const nameText = dialogWindow.getObjectByName("NameText");
                if (nameText && nameText.text && nameText.text !== '祐二') {
                    sayDialogBox?.show();
                } else {
                    normalDialogBox?.show();
                }
                
                animationInProgress = false;
            };
            frameAnim.play();
        }
    };

    // V key listener for toggling
    const vKeyHandler = (e) => {
        if (e.key === 'v' || e.key === 'V') {
            toggleSelectionsBox();
        }
    };

    document.addEventListener('keydown', vKeyHandler);
    
    // Clean up on destroy
    dialogWindow.onDestroyCallbacks.push(() => {
        document.removeEventListener('keydown', vKeyHandler);
    });
}
