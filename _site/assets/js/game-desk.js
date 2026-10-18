// Desk page for a game. Play fills the screen. Escape returns to the page.
(function () {
  "use strict";

  var stage = document.getElementById("game-stage");
  var play = document.getElementById("game-play");
  if (!stage || !play) return;

  var desk = window.GameDesk || {};
  desk.open = false;
  desk.inFull = false;
  desk.live = function () {
    return !!desk.open;
  };
  desk.close = closeStage;
  window.GameDesk = desk;
  document.body.classList.add("game-desk");

  function focusGame() {
    var node = stage.querySelector(".ee-wrap, .terminal-outer, [tabindex]");
    if (node && typeof node.focus === "function") node.focus();
  }

  function closeStage() {
    if (!desk.open) return;
    desk.open = false;
    stage.classList.remove("game-open");
    stage.hidden = true;
    document.body.classList.remove("game-glass-on");
    if (document.fullscreenElement) {
      Promise.resolve(document.exitFullscreen()).catch(function () {}).then(function () {
        play.focus();
      });
    }
    play.focus();
  }

  function openStage() {
    desk.open = true;
    stage.hidden = false;
    stage.classList.add("game-open");
    document.body.classList.add("game-glass-on");
    var pending = stage.requestFullscreen ? stage.requestFullscreen() : Promise.reject();
    Promise.resolve(pending).catch(function () {});
    focusGame();
  }

  play.addEventListener("click", openStage);

  document.addEventListener("fullscreenchange", function () {
    if (document.fullscreenElement) {
      desk.inFull = true;
      return;
    }
    if (!desk.inFull) return;
    desk.inFull = false;
    if (!desk.open) return;
    closeStage();
  });

  window.addEventListener("keydown", function (event) {
    if (event.key !== "Escape" || !desk.open) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    closeStage();
  }, true);
})();
