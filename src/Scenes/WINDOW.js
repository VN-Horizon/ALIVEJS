
async function pushDialogWindow() {
    const dialogWindow = await loadScene("UI/WINDOW", {
        exclusionList: [
            "通常クリック範囲",
            "メッセージ文字",
            "選択肢文字",
            "名前ウィンドウ",
            "名前文字",
            ...Array.from({length: 10}, (_, i) => `真鍮枠(${i})`)
        ]
    });
    
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

    toButton(dialogWindow.getObjectByName("システムボタン"), {
        stateIndexes: [0,1,1,0],
        callback: async () => {
            $(document).off('contextmenu', _hideDialogWindow);
            await pushPauseScreen();
        }
    });
    const dialogText = dialogWindow.addObject(new TMP_TypeWriter({
        name: "DialogText",
        text: "你说得对，但是原神是一款由米哈游自主研发的开放世界冒险游戏。你说得对，但是原神是一款由米哈游自主研发的开放世界冒险游戏。",
        fontSize: 23,
        color: "#FFFFFF",
        fontWeight: "medium",
        transform: { x: 80, y: 346, width: 480, height: 112 }
    }));
    $(dialogText.domElement).css({'white-space': 'pre-line', 'line-height': '29px', 'pointer-events': 'none', 'text-shadow': '1px 1px 0px #000000'});

    const nameText = dialogWindow.addObject(new TMP_Text({
        name: "NameText",
        text: "电棍",
        fontSize: 20,
        color: "#FFFFFF",
        fontWeight: "medium",
        transform: { x: 40, y: 288, width: 146, height: 32 }
    }));
    $(nameText.domElement).css({'white-space': 'pre-line', 'pointer-events': 'none', 'text-shadow': '1px 1px 0px #000000', 'text-align': 'center'});

    const selectingDialogBox = dialogWindow.getObjectByName("選択中");
    const normalDialogBox = dialogWindow.getObjectByName("通常");
    const sayDialogBox = dialogWindow.getObjectByName("吹き出し");
    const nameWindow = dialogWindow.getObjectByName("名前枠");
    selectingDialogBox.hide();
    sayDialogBox.hide();

    // Hook PlayDialogInternal event to animate next line
    const playDialogHandler = (e) => {
        const { stringParams, params } = e.detail;
        const [characterName, dialogContent] = stringParams;
        if(params[0] == 'Hidden' || !characterName) {
            nameWindow.hide();
            nameText.setText('');
        } else if(params[0] == 'Special') {

        } else {
            nameWindow.show();
            nameText.setText(characterName);
        }

        if(characterName && characterName !== '祐二') {
            sayDialogBox.show();
            normalDialogBox.hide();
        } else {
            sayDialogBox.hide();
            normalDialogBox.show();
        }

        // Animate the dialog text
        dialogText.animateText(dialogContent);
    };
    document.addEventListener('PlayDialogInternal', playDialogHandler);
    dialogWindow.onDestroyCallbacks.push(() => {
        document.removeEventListener('PlayDialogInternal', playDialogHandler);
    });

    setExitListener(() => pushPauseScreen());
    dialogWindow.onAfterFocusCallbacks.push(() => {
        window.setOverrideRightKeys(true);
        showDialogWindow();
        setExitListener(() => pushPauseScreen());
        setConfirmListener(onNextLineRequest);
        $(document).on('contextmenu', _hideDialogWindow);
    });
    window.setOverrideRightKeys(true);
    setConfirmListener(onNextLineRequest);
    $(document).on('contextmenu', _hideDialogWindow);
    dialogWindow.onDestroyCallbacks.push(() => {
        window.setOverrideRightKeys(false);
        setConfirmListener(null);
        $(document).off('contextmenu', _hideDialogWindow);
    });
}

function hideDialogWindow() {
    const dialogWindow = window.getEngine().getSceneByName("UI/WINDOW");
    console.log("Hiding dialog window", dialogWindow);
    dialogWindow?.hide();
    setExitListener(() => showDialogWindow());
}

function showDialogWindow() {
    const dialogWindow = window.getEngine().getSceneByName("UI/WINDOW");
    console.log("Showing dialog window", dialogWindow);
    dialogWindow?.show();
    setExitListener(() => pushPauseScreen());
}

function _hideDialogWindow(e) {
    hideDialogWindow(); 
    setConfirmListener(null);
    $(document).off('contextmenu', _hideDialogWindow);
    $(document).on('contextmenu', _showDialogWindow);
    $(document).off('click', onNextLineRequest);
    $(document).on('click', _showDialogWindow);
    e.preventDefault();
}
function _showDialogWindow(e) {
    showDialogWindow();
    setConfirmListener(onNextLineRequest);
    $(document).off('contextmenu', _showDialogWindow);
    $(document).on('contextmenu', _hideDialogWindow);
    $(document).off('click', _showDialogWindow);
    $(document).on('click', onNextLineRequest);
    e.preventDefault();
}

function onNextLineRequest() {
    const dialogWindow = window.getEngine().getSceneByName("UI/WINDOW");
    if (!dialogWindow) return;
    
    const dialogText = dialogWindow.getObjectByName("DialogText");
    if (!dialogText) return;
    
    if (dialogText.isAnimating) {
        dialogText.cancelAnimation();
        return;
    }
    
    execUntilNextLine();
}
