import { toButton } from '../../Graphics/Graphics.Button.js';
import { TMP_Text } from '../../Graphics/Graphics.TextMessPoor.js';

export function initSelectionsBox(dialogWindow) {
    for (let i = 1; i <= 3; i++) {
        const selectionBtn = toButton(dialogWindow.getObjectByName(`選択肢${['１','２','３'][i-1]}`), {
            stateIndexes: [-1,0,1,-1],
            defaultTransform: [64, 238 + (i-1) * 29, 514, 28],
            callback: async () => {
                console.log(`選択肢${i}が選ばれました`);
                dialogWindow.getObjectByName("DialogText").animateText(`你选择了选项${i}。你说得对，但是原神是一款由米哈游自主研发的开放世界冒险游戏。`);
            }
        });
        selectionBtn.hide();
    }
    const selectionsText = dialogWindow.addObject(new TMP_Text({
        name: "SelectionsText",
        text: "你说得对，但是原神是一款由米哈游自主研发的开放世界冒险游戏。\n你说得对，但是原神是一款由米哈游自主研发的开放世界冒险游戏。\n你说得对，但是原神是一款由米哈游自主研发的开放世界冒险游戏。",
        fontSize: 16,
        color: "#FFFFFF",
        fontWeight: "medium",
        transform: { x: 70, y: 238, width: 502, height: 86 },
    }));
    $(selectionsText.domElement).css({'white-space': 'pre-line', 'line-height': '29px', 'pointer-events': 'none', 'text-shadow': '1px 1px 0px #000000'});
    selectionsText.hide();
}
