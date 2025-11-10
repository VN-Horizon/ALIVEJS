async function pushPauseScreen() {
    const pauseScene = await loadScene("UI/SYSTEM", { singleInstance: true });
    if (!pauseScene) return;
    toButton(pauseScene.getObjectByName("SAVE"));
    toButton(pauseScene.getObjectByName("LOAD"));
    toButton(pauseScene.getObjectByName("CONFIG"));
    toButton(pauseScene.getObjectByName("EXIT"));
    const feather = pauseScene.getObjectByName("羽セット");
    toBackground(feather.findChildByName("光玉(奥)"), { scrollSpeedY: -100 });
    const bg2 = toBackground(feather.findChildByName("光玉(中)"), { scrollSpeedY: -200});
    const bg3 = toBackground(feather.findChildByName("光玉(前)"), { scrollSpeedY: -300});
    bg2.y = 0;
    bg3.y = 0;
    setExitListener(() => { destroyScene(); });
    window.setOverrideRightKeys(false);
}
