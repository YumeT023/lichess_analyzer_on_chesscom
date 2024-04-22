function getCurrentUrl() {
  return window.location.href.trim();
}

function isLichess() {
  return getCurrentUrl().includes("lichess.org");
}

function isFromChessCom() {
  return getCurrentUrl().includes("?from_chesscom=true");
}

if (isLichess() && isFromChessCom()) {
  const analysisButtonWrapper = document.getElementsByClassName(
    "future-game-analysis",
  )[0];
  if (analysisButtonWrapper) {
    analysisButtonWrapper.getElementsByTagName("button")[0].click();
  }
}
