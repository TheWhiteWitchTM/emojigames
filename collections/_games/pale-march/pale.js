// Pale March. The map is the 2D engine. The field is the 3D engine. Escape belongs to the desk.
(function (root) {
  "use strict";

  const E2 = root.EmojiEngine;
  const E3 = root.EmojiEngine3D;
  const W = root.PaleWorld;
  const C = root.PaleCampaign;
  const host = document.getElementById("game");
  if (!host || !E2 || !E3 || !W || !C || !root.PaleField || !root.PaleMap) return;

  const SAVE = "emojigames.pale-march";
  const KEYS = [
    ["W S", "Walk, or the up and down arrows"],
    ["A D", "Turn, or the left and right arrows"],
    ["Q E", "Step aside"],
    ["Space", "Cast the spell in hand. Hold it for Frost"],
    ["1 2 3", "First Frost, White Wake, Quill's Mark"],
    ["Shift", "A short step through them"],
    ["P", "Pause"],
    ["M", "Mute"],
    ["Arrows", "On the map, move through the list. Enter walks"]
  ];

  const style = document.createElement("style");
  style.textContent = [
    "#game .pale { position: relative; width: 100%; height: 100%; outline: none; background: #10141c; }",
    "#game .pale .ee-wrap { position: relative; width: 100% !important; height: 100% !important; background: #10141c !important; }",
    "#game .pale .ee-wrap canvas { position: absolute; inset: 0; width: 100% !important; height: 100% !important; display: block; }",
    "#game .pale-ui { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; pointer-events: none; padding: 12px; box-sizing: border-box; }",
    "#game .pale-ui.mid { justify-content: center; }",
    "#game .card { pointer-events: auto; width: min(640px, 100%); max-height: 100%; overflow: auto; color: #e7e2d8;",
    "  background: rgba(12, 14, 20, 0.96); border: 1px solid rgba(232, 226, 214, 0.35); border-radius: 12px;",
    "  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.45); font: 14px/1.45 ui-monospace, monospace; padding: 16px 16px 12px; }",
    "#game .card.slim { width: min(760px, 100%); padding: 10px 12px; }",
    "#game .kicker { margin: 0; letter-spacing: 0.22em; text-transform: uppercase; color: #d5deea; font-size: 12px; }",
    "#game .card h1 { margin: 4px 0 8px; font-size: 34px; letter-spacing: 0.18em; font-weight: 700; }",
    "#game .card h2 { margin: 0 0 8px; font-size: 20px; letter-spacing: 0.08em; }",
    "#game .card p { margin: 8px 0; color: #c9c2b6; }",
    "#game .card label { display: block; margin: 10px 0; color: #b7c0cc; }",
    "#game .card input { display: block; width: 100%; margin-top: 6px; box-sizing: border-box; text-align: center;",
    "  letter-spacing: 0.16em; text-transform: uppercase; font: 18px ui-monospace, monospace; padding: 8px;",
    "  color: #f4f1ea; background: #141820; border: 1px solid rgba(232, 226, 214, 0.4); border-radius: 8px; }",
    "#game .row { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; }",
    "#game .pale button { font: 13px ui-monospace, monospace; color: #e7e2d8; background: #1a1e28;",
    "  border: 1px solid rgba(232, 226, 214, 0.35); border-radius: 7px; padding: 7px 10px; cursor: pointer; }",
    "#game .pale button.on, #game .pale button.go { color: #16140f; background: #f4f1ea; border-color: #f4f1ea; }",
    "#game .menu { display: flex; flex-direction: column; gap: 6px; margin: 10px 0; }",
    "#game .menu button { text-align: left; }",
    "#game .hint { color: #9aa6b8; font-size: 12px; min-height: 1.2em; }",
    "#game .logline { color: #f0d7a0; min-height: 1.3em; margin: 4px 0 0; }",
    "#game .meter { color: #d5deea; }",
    "#game .keys { display: grid; grid-template-columns: 7.5em 1fr; gap: 4px 10px; margin: 8px 0 12px; }",
    "#game .keys b { color: #f4f1ea; font-weight: 600; }",
    "#game .choice { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }",
    "#game .choice button { min-height: 88px; white-space: normal; text-align: left; }",
    "#game .choice small { display: block; color: #d9d0c4; margin-top: 6px; }",
    "#game .choice button.on small, #game .pale button.on small { color: #4a4036; }",
    "#game #pm-pause { position: absolute; left: 50%; top: 46%; transform: translate(-50%, -50%); width: min(520px, calc(100% - 24px)); z-index: 2; }",
    "#game .pads { display: none; }",
    "@media (pointer: coarse) { #game .pads { display: flex; position: absolute; left: 0; right: 0; bottom: 0; height: 42%; pointer-events: none; gap: 10px; padding: 10px; box-sizing: border-box; } }",
    "#game .pads .pad, #game .pads .cast { pointer-events: auto; touch-action: none; border: 1px dashed rgba(244, 241, 234, 0.35); border-radius: 16px; }",
    "#game .pads .pad { flex: 1; }",
    "#game .pads .cast { width: 28%; display: flex; align-items: center; justify-content: center; color: #f4f1ea; font: 13px ui-monospace, monospace; }"
  ].join("\n");
  document.head.appendChild(style);

  let engine3;
  let engine2;
  let field;
  let map;
  try {
    engine3 = new E3.Engine({
      width: 960,
      height: 540,
      clear: "#10141c",
      pixelRatio: Math.min(2, root.devicePixelRatio || 1)
    });
    engine2 = new E2.Engine({
      canvas: new E2.Canvas({ width: 960, height: 540 })
    });
    field = root.PaleField.create(engine3);
    map = root.PaleMap.create(engine2);
  } catch (err) {
    host.textContent = "Pale March needs WebGL2.";
    return;
  }

  const shell = E3.Utilities.wrap(engine3.canvas, { header: false, footer: false });
  shell.wrap.appendChild(engine2.canvas.element);
  const pale = document.createElement("div");
  pale.className = "pale";
  pale.tabIndex = 0;
  const ui = document.createElement("div");
  ui.className = "pale-ui mid";
  pale.appendChild(shell.wrap);
  pale.appendChild(ui);
  host.appendChild(pale);

  engine2.canvas.element.style.background = "#10141c";
  let mode = "title";
  let panel = null;
  let st = null;
  let menu = [];
  let cursor = 0;
  let muted = false;
  let running = false;
  let raf = 0;
  let last = 0;
  let resolving = false;
  let wait = 0;
  let outcome = "";
  let note = "";
  let heading = "hold";
  const held = {};
  const pad = { x: 0, y: 0, cast: false, id: null };
  let castWas = false;
  let dodgeWas = false;

  field.onBeep = function (freq, ms) {
    if (!muted) engine3.beep(freq, ms);
  };

  function esc(text) {
    return String(text).replace(/[&<>"]/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[ch];
    });
  }
  function resumeAudio() {
    const audio = engine3.audio;
    if (audio && audio.state === "suspended") audio.resume();
  }
  function readSave() {
    try { return JSON.parse(localStorage.getItem(SAVE) || "null"); } catch (err) { return null; }
  }
  function save() {
    if (!st || st.ending) return;
    try { localStorage.setItem(SAVE, JSON.stringify(C.snapshot(st))); } catch (err) { /* private mode */ }
  }
  function saveEnding() {
    if (!st || !st.ending) return;
    try { localStorage.setItem(SAVE, JSON.stringify(C.snapshot(st))); } catch (err) { /* private mode */ }
  }
  function nameValue() {
    const input = ui.querySelector("#pale-name");
    return C.cleanName(input ? input.value : "WINTER");
  }
  function useMap() {
    engine2.canvas.element.style.visibility = "visible";
    engine3.canvas.element.style.visibility = "hidden";
  }
  function useField() {
    engine2.canvas.element.style.visibility = "hidden";
    engine3.canvas.element.style.visibility = "visible";
  }
  function fit() {
    const w = Math.max(320, host.clientWidth || 960);
    const h = Math.max(200, host.clientHeight || Math.round(w * 9 / 16));
    engine3.canvas.resize(w, h);
    const flat = engine2.canvas.element;
    flat.width = w;
    flat.height = h;
    flat.style.width = w + "px";
    flat.style.height = h + "px";
  }
  function keysHtml() {
    return "<div class=\"keys\">" + KEYS.map(function (row) {
      return "<b>" + esc(row[0]) + "</b><span>" + esc(row[1]) + "</span>";
    }).join("") + "</div>";
  }
  function button(id, label, on, extra) {
    return "<button type=\"button\" data-act=\"" + esc(id) + "\" class=\"" + (on ? "on" : "") + "\"" + (extra || "") + ">" + label + "</button>";
  }

  function showTitle() {
    ui.className = "pale-ui mid";
    const saved = C.restore(readSave());
    const cont = saved ? "<button type=\"button\" data-act=\"continue\">Continue</button>" : "";
    ui.innerHTML = "<div class=\"card\"><p class=\"kicker\">Pale March</p><h1>WHITE WITCH</h1><p>Four seals. One gate. The host does not get your name.</p><label>True name<input id=\"pale-name\" maxlength=\"12\" value=\"" + esc(saved ? saved.name : "WINTER") + "\" autocomplete=\"off\"></label><div class=\"row\"><button type=\"button\" class=\"go\" data-act=\"begin\">Begin</button>" + cont + "</div><p class=\"hint\">Enter begins. R, after the end, starts another march and skips this card.</p></div>";
    const input = ui.querySelector("#pale-name");
    if (input) input.focus();
  }
  function showMap() {
    ui.className = "pale-ui";
    if (panel === "chronicle") {
      const lines = st.chronicle.map(function (line) { return "<p>" + esc(line) + "</p>"; }).join("");
      ui.innerHTML = "<div class=\"card\"><p class=\"kicker\">Chronicle</p>" + lines + "<div class=\"row\">" + button("back", "Back", false, "") + "</div></div>";
      return;
    }
    if (panel === "keys") {
      ui.innerHTML = "<div class=\"card\"><p class=\"kicker\">The keys</p>" + keysHtml() + "<div class=\"row\">" + button("back", "Back", false, "") + "</div></div>";
      return;
    }
    const item = menu[cursor];
    const list = menu.map(function (entry, i) {
      return button(entry.id, esc(entry.label), i === cursor);
    }).join("");
    ui.innerHTML = "<div class=\"card slim\"><p class=\"kicker\">Pale Hold · " + esc(st.name) + "</p><p>" + esc(C.holdLine(st)) + "</p><p class=\"meter\">" + esc(C.summary(st)) + "</p><div class=\"menu\">" + list + "</div><p class=\"hint\">" + esc(note || (item ? item.hint : "")) + "</p></div>";
  }
  function showTravel() {
    ui.className = "pale-ui";
    const place = W.site(heading);
    ui.innerHTML = "<div class=\"card slim\"><p class=\"kicker\">The road</p><p>Walking toward " + esc(place ? place.name : "the march") + ".</p></div>";
  }
  function showBattle() {
    ui.className = "pale-ui";
    const place = W.site(st.site);
    ui.innerHTML = "<div class=\"card slim\"><p class=\"kicker\">" + esc(place ? place.name : "The field") + "</p><p class=\"meter\" id=\"pm-meter\"></p><p class=\"logline\" id=\"pm-log\"></p><p class=\"hint\" id=\"pm-obj\"></p></div><div class=\"card\" id=\"pm-pause\" hidden><p class=\"kicker\">Paused</p>" + keysHtml() + "<div class=\"row\">" + button("resume", "Return to the field", true, "") + "</div></div><div class=\"pads\"><div class=\"pad\" data-pad=\"move\"></div><div class=\"cast\" data-pad=\"cast\">Cast</div></div>";
  }
  function showChoice() {
    ui.className = "pale-ui mid";
    const choice = W.CHOICES[st.pending];
    const place = W.site(st.pending);
    ui.innerHTML = "<div class=\"card\"><p class=\"kicker\">" + esc(place ? place.name : "A seal") + "</p><h2>The seal is open</h2><p>" + esc(choice.prompt) + "</p><div class=\"choice\">" + button("pick:" + choice.a.id, esc(choice.a.label) + "<small>" + esc(choice.a.detail) + "</small>", cursor === 0) + button("pick:" + choice.b.id, esc(choice.b.label) + "<small>" + esc(choice.b.detail) + "</small>", cursor === 1) + "</div><p class=\"hint\">Left and right, then Enter. This stays in the chronicle.</p></div>";
  }
  function showEnding() {
    ui.className = "pale-ui mid";
    const end = W.ENDINGS[st.ending] || W.ENDINGS.road;
    ui.innerHTML = "<div class=\"card\"><p class=\"kicker\">Pale March</p><h2>" + esc(end.title) + "</h2><p>" + esc(end.text) + "</p><p class=\"meter\">" + esc(st.name) + " · " + C.sealsClosed(st) + " seals · " + st.pages + " letters taken</p><div class=\"row\">" + button("again", "Walk out again", true, "") + "</div><p class=\"hint\">R starts another march and skips the title.</p></div>";
  }
  function show() {
    if (mode === "title") showTitle();
    else if (mode === "map") showMap();
    else if (mode === "travel") showTravel();
    else if (mode === "battle") showBattle();
    else if (mode === "choice") showChoice();
    else if (mode === "ending") showEnding();
  }
  function enterMarch(next, skipIntro) {
    st = next;
    panel = null;
    note = "";
    resolving = false;
    if (skipIntro) st.introduced = true;
    useMap();
    if (st.ending) {
      mode = "ending";
      map.placeAt("hold");
      map.layout(st, null);
    } else if (st.pending) {
      mode = "choice";
      cursor = 0;
      map.placeAt(st.pending);
      map.layout(st, st.pending);
    } else if (C.needsBattle(st)) {
      map.placeAt(st.site);
      map.layout(st, st.site);
      startBattle();
      return;
    } else {
      mode = "map";
      map.placeAt(st.site || "hold");
      buildMenu();
    }
    save();
    show();
    pale.focus();
  }
  function buildMenu(keep) {
    menu = C.menu(st);
    const stay = menu.findIndex(function (item) { return item.id === keep; });
    if (stay >= 0) cursor = stay;
    else {
      const road = menu.findIndex(function (item) { return item.id.indexOf("road:") === 0; });
      cursor = road >= 0 ? road : 0;
    }
    highlight();
  }
  function highlight() {
    const item = menu[cursor];
    const dest = item && item.id.indexOf("road:") === 0 ? item.id.slice(5) : null;
    map.layout(st, dest);
  }
  function startBattle() {
    mode = "battle";
    panel = null;
    resolving = false;
    field.paused = false;
    useField();
    field.begin(st.site, C.mods(st));
    save();
    show();
    syncBattle();
    pale.focus();
  }
  function travel(id) {
    if (!C.canTravel(st, id) || map.busy()) {
      if (id === "gate") note = "Four seals. Then the gate.";
      show();
      return;
    }
    note = "";
    heading = id;
    st.introduced = true;
    mode = "travel";
    panel = null;
    show();
    map.go(id, function () {
      C.arrive(st, id);
      map.layout(st, id);
      save();
      if (C.needsBattle(st)) startBattle();
      else {
        mode = "map";
        buildMenu();
        show();
      }
    });
  }
  function act(id) {
    if (id === "begin") {
      enterMarch(C.fresh(nameValue()), false);
      return;
    }
    if (id === "continue") {
      const data = C.restore(readSave());
      if (data) enterMarch(data);
      return;
    }
    if (id === "again") {
      try { localStorage.removeItem(SAVE); } catch (err) { /* ignore */ }
      enterMarch(C.fresh(st ? st.name : "WINTER"), true);
      return;
    }
    if (id === "back" || id === "resume") {
      panel = null;
      if (field) field.paused = false;
      show();
      return;
    }
    if (!st) return;
    if (id === "rest") {
      C.rest(st);
      note = "The fire takes the cold out of your hands.";
      save();
      buildMenu("rest");
      show();
      return;
    }
    if (id.indexOf("road:") === 0) {
      travel(id.slice(5));
      return;
    }
    if (id.indexOf("with:") === 0) {
      C.equip(st, "with", id.slice(5));
      note = W.COMPANIONS[st.with] ? W.COMPANIONS[st.with].name + " walks with you." : "";
      save();
      buildMenu(id);
      show();
      return;
    }
    if (id.indexOf("relic:") === 0) {
      C.equip(st, "relic", id.slice(6));
      note = W.RELICS[st.relic] ? "You carry " + W.RELICS[st.relic].name + "." : "";
      save();
      buildMenu(id);
      show();
      return;
    }
    if (id === "chronicle" || id === "keys") {
      panel = id;
      show();
      return;
    }
    if (id.indexOf("pick:") === 0) {
      const which = id.slice(5);
      if (!C.applyChoice(st, which)) return;
      mode = "map";
      note = st.chronicle[st.chronicle.length - 1];
      map.placeAt("hold");
      buildMenu();
      save();
      show();
    }
  }
  function syncBattle() {
    const status = field.status();
    const meter = ui.querySelector("#pm-meter");
    const log = ui.querySelector("#pm-log");
    const obj = ui.querySelector("#pm-obj");
    const pause = ui.querySelector("#pm-pause");
    if (meter) meter.textContent = status.meter;
    if (log) log.textContent = status.log;
    if (obj) obj.textContent = status.objectiveLine;
    if (pause) pause.hidden = !field.paused;
  }
  function resolve() {
    const status = field.status();
    const vitae = status.vitae;
    field.shutdown();
    useMap();
    resolving = false;
    if (outcome === "win") {
      const result = C.onClear(st, vitae);
      if (result === "ending") {
        mode = "ending";
        map.placeAt("hold");
        map.layout(st, null);
        saveEnding();
      } else {
        mode = "choice";
        cursor = 0;
        map.placeAt(st.pending);
        map.layout(st, st.pending);
        save();
      }
    } else {
      const result = C.onDefeat(st);
      map.placeAt("hold");
      map.layout(st, null);
      if (result === "lost") {
        mode = "ending";
        saveEnding();
      } else {
        mode = "map";
        note = st.chronicle[st.chronicle.length - 1];
        buildMenu();
        save();
      }
    }
    show();
    pale.focus();
  }
  function readInput() {
    const cast = !!(held[" "] || held.j || held.J || pad.cast);
    const dodge = !!held.Shift;
    const edge = cast && !castWas;
    const dodgeEdge = dodge && !dodgeWas;
    castWas = cast;
    dodgeWas = dodge;
    return {
      forward: !!(held.w || held.W || held.ArrowUp || pad.y < -0.28),
      back: !!(held.s || held.S || held.ArrowDown || pad.y > 0.28),
      left: !!(held.a || held.A || held.ArrowLeft || pad.x < -0.28),
      right: !!(held.d || held.D || held.ArrowRight || pad.x > 0.28),
      strafeLeft: !!(held.q || held.Q),
      strafeRight: !!(held.e || held.E),
      cast: cast,
      castEdge: edge,
      dodge: dodgeEdge
    };
  }
  function frame(now) {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    if (!root.GameDesk || !root.GameDesk.live()) return;
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
    last = now;
    try {
      if (mode === "battle") {
        if (!resolving) field.step(dt, readInput());
        else wait -= dt;
        engine3.canvas.draw();
        const status = field.status();
        syncBattle();
        if (!resolving && (status.won || status.lost)) {
          resolving = true;
          wait = 0.7;
          outcome = status.won ? "win" : "lose";
        }
        if (resolving && wait <= 0) resolve();
      } else {
        map.step(dt);
        engine2.canvas.draw();
      }
    } catch (err) {
      running = false;
      console.error(err);
    }
  }
  function startLoop() {
    if (running) return;
    running = true;
    last = 0;
    raf = requestAnimationFrame(frame);
  }
  function stopLoop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
  }

  ui.addEventListener("click", function (e) {
    const btn = e.target.closest("[data-act]");
    if (!btn) return;
    resumeAudio();
    act(btn.getAttribute("data-act"));
  });
  engine2.canvas.element.addEventListener("click", function (e) {
    if (mode !== "map" || panel || !st || map.busy()) return;
    const point = map.worldAt(engine2.canvas.element, e.clientX, e.clientY);
    const id = map.hitSite(point.x, point.y);
    if (!id || id === st.site) return;
    travel(id);
  });
  ui.addEventListener("pointerdown", function (e) {
    const padEl = e.target.closest("[data-pad]");
    if (!padEl) return;
    padEl.setPointerCapture(e.pointerId);
    pad.id = e.pointerId;
    pad.cast = padEl.getAttribute("data-pad") === "cast";
    movePad(padEl, e);
  });
  ui.addEventListener("pointermove", function (e) {
    const padEl = e.target.closest("[data-pad]");
    if (!padEl || pad.id !== e.pointerId || padEl.getAttribute("data-pad") !== "move") return;
    movePad(padEl, e);
  });
  function endPad(e) {
    if (pad.id !== e.pointerId) return;
    pad.id = null;
    pad.x = 0;
    pad.y = 0;
    pad.cast = false;
  }
  ui.addEventListener("pointerup", endPad);
  ui.addEventListener("pointercancel", endPad);
  function movePad(padEl, e) {
    if (padEl.getAttribute("data-pad") !== "move") return;
    const rect = padEl.getBoundingClientRect();
    pad.x = Math.max(-1, Math.min(1, (e.clientX - rect.left) / rect.width * 2 - 1));
    pad.y = Math.max(-1, Math.min(1, (e.clientY - rect.top) / rect.height * 2 - 1));
  }

  window.addEventListener("keydown", function (e) {
    if (!root.GameDesk || !root.GameDesk.live()) return;
    if (e.key === "Escape") return;
    resumeAudio();
    const typing = e.target && e.target.closest && e.target.closest("input, textarea");
    if (typing) {
      if (e.key === "Enter") {
        e.preventDefault();
        const saved = C.restore(readSave());
      act(saved && nameValue() === saved.name ? "continue" : "begin");
      }
      return;
    }
    if (e.key === " " || e.key.indexOf("Arrow") === 0) e.preventDefault();
    held[e.key] = true;
    if (e.repeat) return;
    const key = e.key;
    if (mode === "title") {
      if (key === "Enter") act(readSave() ? "continue" : "begin");
      return;
    }
    if (mode === "ending") {
      if (key === "r" || key === "R" || key === "Enter") act("again");
      return;
    }
    if (key === "m" || key === "M") {
      muted = !muted;
      note = muted ? "Quill keeps quiet." : "Quill is listening again.";
      if (mode === "map") show();
      return;
    }
    if (mode === "choice") {
      if (key === "ArrowLeft" || key === "a" || key === "A") cursor = 0;
      else if (key === "ArrowRight" || key === "d" || key === "D") cursor = 1;
      else if (key === "Enter" || key === " ") {
        const choice = W.CHOICES[st.pending];
        act("pick:" + (cursor === 0 ? choice.a.id : choice.b.id));
        return;
      } else return;
      show();
      return;
    }
    if (mode === "battle") {
      if (key === "p" || key === "P") {
        field.paused = !field.paused;
        syncBattle();
        return;
      }
      if (field.paused) return;
      if (key === "1") field.spell = 0;
      else if (key === "2") field.spell = 1;
      else if (key === "3") field.spell = 2;
      else if (key === "k" || key === "K") {
        field.paused = true;
        syncBattle();
      }
      return;
    }
    if (mode !== "map" || panel) {
      if ((key === "Backspace" || key === "Enter") && panel) act("back");
      return;
    }
    if (key === "ArrowUp" || key === "w" || key === "W") cursor = (cursor + menu.length - 1) % menu.length;
    else if (key === "ArrowDown" || key === "s" || key === "S") cursor = (cursor + 1) % menu.length;
    else if (key === "Enter" || key === " ") {
      if (menu[cursor]) act(menu[cursor].id);
      return;
    } else return;
    note = "";
    highlight();
    show();
  });
  window.addEventListener("keyup", function (e) {
    held[e.key] = false;
  });
  window.addEventListener("resize", fit);
  window.addEventListener("blur", function () {
    Object.keys(held).forEach(function (key) { held[key] = false; });
    pad.x = 0;
    pad.y = 0;
    pad.cast = false;
  });

  const desk = root.GameDesk || {};
  const prevOpen = desk.onOpen;
  const prevClose = desk.onClose;
  desk.onOpen = function () {
    if (prevOpen) prevOpen();
    last = 0;
    fit();
    startLoop();
    requestAnimationFrame(fit);
    pale.focus();
  };
  desk.onClose = function () {
    stopLoop();
    last = 0;
    if (st && mode !== "title") {
      if (st.ending) saveEnding();
      else save();
    }
    if (prevClose) prevClose();
  };
  root.GameDesk = desk;

  useMap();
  map.placeAt("hold");
  show();
  fit();

  root.PaleMarch = {
    campaign: C,
    world: W,
    field: field,
    get mode() { return mode; },
    get state() { return st; },
    begin: function (name) {
      const input = ui.querySelector("#pale-name");
      if (input && name) input.value = name;
      act("begin");
    },
    act: act,
    fit: fit
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
