(function showLocalFileGuard() {
  if (window.location.protocol !== "file:") {
    return;
  }

  const gameRoot = document.querySelector("#game-root");
  const overlay = document.querySelector("#game-overlay");
  const kicker = document.querySelector("#overlay-kicker");
  const title = document.querySelector("#overlay-title");
  const copy = document.querySelector("#overlay-copy");
  const controls = document.querySelector(".overlay-controls");
  const action = document.querySelector("#overlay-action");
  const restartAction = document.querySelector(
    "#overlay-restart-action"
  );
  const menuAction = document.querySelector("#overlay-menu-action");
  const note = document.querySelector(".overlay-note");

  if (
    !gameRoot ||
    !overlay ||
    !kicker ||
    !title ||
    !copy ||
    !controls ||
    !action ||
    !restartAction ||
    !menuAction ||
    !note
  ) {
    return;
  }

  gameRoot.dataset.gameState = "LOCAL_FILE_BLOCKED";
  gameRoot.dataset.gameInitialized = "false";
  gameRoot.dataset.entryProtocol = "file";
  overlay.hidden = false;
  overlay.dataset.mode = "ERROR";
  kicker.textContent = "啟動方式需要調整";
  title.textContent = "請使用本機伺服器";
  copy.textContent =
    "瀏覽器會阻擋 ES Modules 由本機檔案直接執行。請從 Classroom Lab 專案根目錄啟動靜態伺服器，再開啟 rbcrr/rbcrr.html。";
  controls.hidden = true;
  action.hidden = false;
  action.disabled = true;
  action.textContent = "無法由 file:// 直接啟動";
  restartAction.hidden = true;
  menuAction.hidden = true;
  note.textContent =
    "本工具不需安裝前端套件，但必須透過 http:// 或 https:// 開啟。";
})();
