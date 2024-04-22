const LICHESS_IMPORT_BUTTON = "__LICHESS_IMPORT_BUTTON__";

function getCurrentUrl() {
  return window.location.href.trim();
}

function isChessCom() {
  return getCurrentUrl().includes("chess.com");
}

function isInChessComGame() {
  const currentUrl = getCurrentUrl();
  return (
    isChessCom() &&
    (currentUrl.includes("chess.com/game/live") ||
      currentUrl.includes("chess.com/game/daily") ||
      currentUrl.includes("chess.com/live#g=") ||
      /chess\.com\/game\/.+/.test(currentUrl))
  );
}

function injectImportButton() {
  const wrapper = findReviewButtonsWrapper();
  if (wrapper && !wrapper[LICHESS_IMPORT_BUTTON]) {
    wrapper[LICHESS_IMPORT_BUTTON] = injectImportButtonImpl();
  }
}

function injectImportButtonImpl() {
  const importButton = document.createElement("button");

  const iconSpan = document.createElement("span");
  iconSpan.className = "ui_v5-button-icon icon-font-chess chess-board-search";

  importButton.appendChild(iconSpan);

  importButton.className =
    "ui_v5-button-component ui_v5-button-primary ui_v5-button-full";
  importButton.innerHTML += "<span>Lichess Review</span>";

  importButton.addEventListener("click", importGame);

  const wrapper = findReviewButtonsWrapper();

  wrapper && wrapper.appendChild(importButton);

  return importButton;
}

function checkIsChessCom() {
  if (!isChessCom()) {
    alert(
      "You are not on chess.com! Press me when you are viewing the game you'd like to analyze!",
    );
    throw new Error("Not on chess.com");
  }
}

function checkIsChessComGame() {
  if (!isInChessComGame()) {
    alert(
      "You are in a chess.com game! Press me when you are viewing the game you'd like to analyze!",
    );
    throw new Error("Not on chess.com");
  }
}

function isPGN_terminated(pgn) {
  return pgn.includes("[Termination");
}

function findReviewButtonsWrapper() {
  return findElementByClasses("game-review-buttons-component");
}

function findShareButton() {
  const shareButton = findElementByClasses(
    "icon-font-chess share daily-game-footer-icon",
    "icon-font-chess share live-game-buttons-button",
    "icon-font-chess share game-buttons-button", // in case of chess.com/live#g=
    "icon-font-chess share daily-game-footer-icon", // in case of chess.com/game/daily
    "icon-font-chess share daily-game-footer-button", // in case of chess.com/game/live
  );
  return shareButton || document.querySelector('button[aria-label="Share"]');
}

async function importGame() {
  checkIsChessCom();
  checkIsChessComGame();

  const pgn = await getGamePGN();

  if (!isPGN_terminated(pgn)) {
    alert("Can only import finished game");
    return;
  }

  importPGN_onLichess(pgn)
    .then((url) => {
      if (url) {
        window.open(`${url}?from_chesscom=true`);
      }
    })
    .catch(() => {
      alert("Could not import game");
    });
}

async function getGamePGN() {
  const shareButton = findShareButton();

  if (!shareButton) {
    alert(
      "I could not find the fen! The game is probably not finished. Try clicking me when the game is over.",
    );
    throw new Error(
      "I could not find the fen! The game is probably not finished. Try clicking me when the game is over.",
    );
  }

  shareButton.click();

  await wait(1000 * 2);

  const pgnTextarea = findElementByClasses("share-menu-tab-pgn-textarea");

  if (!pgnTextarea) {
    throw new Error("Could not get the pgn");
  }

  closeShareModal();

  const pgn = pgnTextarea.value;

  if (!pgn.trim()) {
    alert(
      "Not a valid PGN! Make sure you are on chess.com/games! If this is not correct please contact the creator.",
    );
    throw new Error(
      "Not a valid PGN! Make sure you are on chess.com/games! If this is not correct please contact the creator.",
    );
  }

  return pgn;
}

function closeShareModal() {
  const closeButton =
    findElementByClasses(
      "icon-font-chess x icon-font-secondary",
      "icon-font-chess x share-menu-close-icon",
    ) ||
    document.querySelector(
      "#share-modal .icon-font-chess.x.ui_outside-close-icon",
    );
  if (closeButton) closeButton.click();
}

function importPGN_onLichess(pgn) {
  const url = "https://lichess.org/api/import";
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      {
        data: { pgn: pgn },
        url: url,
      },
      resolve,
    );
  });
}

(function loop() {
  setTimeout(async () => {
    if (isInChessComGame()) {
      await waitUntil(() => {
        return findShareButton() != null;
      });
      injectImportButton();
    }
    loop();
  }, 1000 * 10);
})();

function wait(ms) {
  return new Promise((resolve) => {
    const id = setTimeout(() => {
      clearTimeout(id);
      resolve();
    }, ms);
  });
}

function waitUntil(predicate, backoffMs = 1000 * 10) {
  return new Promise(async function retry(resolve) {
    if (predicate()) {
      resolve();
      return;
    }
    await wait(backoffMs);
    return retry(resolve);
  });
}

/**
 * @param {string[]} classes
 */
function findElementByClasses(...classes) {
  for (const clazz of classes) {
    const el = document.getElementsByClassName(clazz)[0];
    if (el) return el;
  }
  return null;
}
