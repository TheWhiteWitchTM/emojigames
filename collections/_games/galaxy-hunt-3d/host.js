// Loads the Magic mission once Play opens the stage.
useEffect(() => {
  const root = document.getElementById("game");
  if (!root || !window.EmojiBridge || !window.EmojiMagic) return;

  const mount = document.createElement("div");
  mount.className = "hunt3d";
  mount.tabIndex = 0;
  root.appendChild(mount);

  const session = window.EmojiBridge.mount(mount);
  let stopped = false;
  let started = false;

  function fail(err) {
    if (stopped || (err && err.magicStop)) return;
    const box = document.createElement("p");
    box.className = "hunt3d-error";
    const line = err && err.line ? " (line " + err.line + ")" : "";
    box.textContent = ((err && err.message) || "The mission stopped.") + line;
    mount.appendChild(box);
  }

  function boot() {
    if (started) {
      session.resize();
      return;
    }
    started = true;
    session.resize();
    let base = root.getAttribute("data-base") || "";
    if (base && base.charAt(base.length - 1) !== "/") base += "/";
    mount.focus();
    fetch(base + "galaxy-hunt-3d.magic")
      .then((res) => {
        if (!res.ok) throw new Error("The mission file did not load.");
        return res.text();
      })
      .then((source) => {
        if (stopped) return;
        mount.focus();
        return window.EmojiMagic.run(source, {
          print: function () {},
          stopped: function () { return stopped; },
          engines: session.api,
          attach: function (lookup) { session.lookup = lookup; }
        });
      })
      .catch(fail);
  }

  window.addEventListener("resize", onResize);
  function onResize() { session.resize(); }

  const desk = window.GameDesk;
  if (desk) {
    const previous = desk.onOpen;
    desk.onOpen = function () {
      if (typeof previous === "function") previous();
      boot();
    };
  } else {
    boot();
  }

  return function () {
    stopped = true;
    window.removeEventListener("resize", onResize);
    session.destroy();
  };
});
