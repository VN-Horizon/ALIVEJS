
async function pushDialogWindow() {
    const dialogWindow = await loadScene("UI/WINDOW", {
        exclusionList: ["通常クリック範囲", "メッセージ文字", "選択肢文字", "名前ウィンドウ", "名前文字"]
    });
    
    toButton(dialogWindow.getObjectByName("選択肢１"), {
        stateIndexes: [-1,0,1,-1],
        defaultTransform: [64, 238, 514, 28],
        callback: async () => {
            console.log("選択肢１が選ばれました");
        }
    });
    toButton(dialogWindow.getObjectByName("選択肢２"), {
        stateIndexes: [-1,0,1,-1],
        defaultTransform: [64, 267, 514, 28],
        callback: async () => {
            console.log("選択肢2が選ばれました");
        }
    });
    toButton(dialogWindow.getObjectByName("選択肢３"), {
        stateIndexes: [-1,0,1,-1],
        defaultTransform: [64, 296, 514, 28],
        callback: async () => {
            console.log("選択肢3が選ばれました");
        }
    });
    toButton(dialogWindow.getObjectByName("システムボタン"), {
        stateIndexes: [0,1,1,0],
        callback: async () => {
            $(document).off('contextmenu', _hideDialogWindow);
            await pushPauseScreen();
        }
    });
    setExitListener(() => pushPauseScreen());
    dialogWindow.onAfterFocusCallbacks.push(() => {
        window.setOverrideRightKeys(true);
        showDialogWindow();
        setExitListener(() => pushPauseScreen());
        $(document).on('contextmenu', _hideDialogWindow);
    });
    window.setOverrideRightKeys(true);
    $(document).on('contextmenu', _hideDialogWindow);
    dialogWindow.onDestroyCallbacks.push(() => {
        window.setOverrideRightKeys(false);
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
    $(document).off('contextmenu', _hideDialogWindow);
    $(document).on('contextmenu', _showDialogWindow);
    $(document).off('click', onNextLineRequest);
    $(document).on('click', _showDialogWindow);
    e.preventDefault();
}
function _showDialogWindow(e) {
    showDialogWindow();
    $(document).off('contextmenu', _showDialogWindow);
    $(document).on('contextmenu', _hideDialogWindow);
    $(document).off('click', _showDialogWindow);
    $(document).on('click', onNextLineRequest);
    e.preventDefault();
}

function onNextLineRequest() {
    const dialogWindow = window.getEngine().getSceneByName("UI/WINDOW");
}
