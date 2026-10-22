// Carriers. Loading, the battle list, the map, and the debrief.
useEffect(() => {
  const root = document.getElementById("game");
  const E = globalThis.EmojiEngine;
  const Rules = globalThis.CarrierRules;
  if (!root || !E || !Rules) return;

  const W = 1024;
  const H = 576;
  const canvas = new E.Canvas({ width: W, height: H });
  const engine = new E.Engine({ canvas });
  const ui = E.Utilities.wrap(engine, { title: "⚓ Carriers", footer: true });
  ui.wrap.classList.add("ee-game");
  ui.wrap.tabIndex = 0;
  ui.wrap.style.outline = "none";
  root.appendChild(ui.wrap);

  const el = canvas.element;
  const ctx = canvas.ctx;
  el.style.width = "100%";
  el.style.height = "auto";
  el.style.display = "block";
  el.style.background = "#071525";

  const MAP = { x: 18, y: 18, cell: 42 };
  const INK = "#1c140c";
  const PAPER = "#e7d3a4";
  const PAPER2 = "#c9b27a";
  const GOLD = "#e2b84a";
  const NAVY = "#071525";

  let mode = "idle";
  let loadT = 0;
  let running = false;
  let raf = 0;
  let state = null;
  let selected = null;
  let hot = [];
  let battleId = "midway";
  let side = "us";
  let hint = "Click Battles.";

  function setHint(text) {
    hint = text;
    if (ui.footer) ui.footer.textContent = text;
  }

  function wrapText(text, x, y, width, lineHeight, maxLines) {
    const words = String(text || "").split(/\s+/);
    let line = "";
    let drawn = 0;
    for (let i = 0; i < words.length; i++) {
      const trial = line ? line + " " + words[i] : words[i];
      if (ctx.measureText(trial).width > width && line) {
        ctx.fillText(line, x, y);
        y += lineHeight;
        drawn += 1;
        line = words[i];
        if (maxLines && drawn >= maxLines - 1) {
          ctx.fillText(line, x, y);
          return y + lineHeight;
        }
      } else {
        line = trial;
      }
    }
    if (line) ctx.fillText(line, x, y);
    return y + lineHeight;
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function button(x, y, w, h, label, id, enabled, picked) {
    if (enabled == null) enabled = true;
    hot.push({ x: x, y: y, w: w, h: h, id: id, enabled: enabled });
    ctx.fillStyle = !enabled ? "#b7a888" : picked ? GOLD : "#f3e2b8";
    roundRect(x, y, w, h, 4);
    ctx.fill();
    ctx.strokeStyle = picked ? "#3d2a08" : enabled ? "#6d5424" : "#8a7a58";
    ctx.lineWidth = picked ? 3 : 2;
    ctx.stroke();
    ctx.fillStyle = enabled ? INK : "#5c5140";
    ctx.font = "bold 16px Georgia, Palatino, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, x + w / 2, y + h / 2 + 1);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
  }

  function frame() {
    ctx.fillStyle = NAVY;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 8;
    ctx.strokeRect(6, 6, W - 12, H - 12);
    ctx.strokeStyle = "#8a6a28";
    ctx.lineWidth = 2;
    ctx.strokeRect(14, 14, W - 28, H - 28);
  }

  function paintCarrier(x, y, scale, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, -70);
    ctx.lineTo(18, -20);
    ctx.lineTo(16, 60);
    ctx.lineTo(-16, 60);
    ctx.lineTo(-18, -20);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#c4a36a";
    ctx.fillRect(-28, -10, 56, 18);
    ctx.fillStyle = "#d8d2c4";
    ctx.fillRect(8, -30, 10, 28);
    ctx.restore();
  }

  function drawLoad() {
    frame();
    paintCarrier(512, 250, 1.4, "#d7deE6");
    ctx.fillStyle = GOLD;
    ctx.font = "bold 64px Georgia, Palatino, serif";
    ctx.textAlign = "center";
    ctx.fillText("CARRIERS", 512, 400);
    ctx.font = "18px Georgia, Palatino, serif";
    ctx.fillStyle = PAPER;
    ctx.fillText("A task force game", 512, 432);
    const w = 360;
    ctx.fillStyle = "#0b1c30";
    ctx.fillRect(512 - w / 2, 470, w, 14);
    ctx.fillStyle = GOLD;
    ctx.fillRect(512 - w / 2, 470, Math.max(0, Math.min(1, loadT)) * w, 14);
    ctx.strokeStyle = GOLD;
    ctx.strokeRect(512 - w / 2, 470, w, 14);
    ctx.textAlign = "left";
    if (loadT >= 1) {
      mode = "title";
      enterHint();
    } else {
      loadT += 0.012;
    }
  }

  function enterHint() {
    if (mode === "load") setHint("A task force game.");
    else if (mode === "title") setHint("Battles opens the list. Escape leaves the desk.");
    else if (mode === "pick") setHint("Pick a battle. The briefing comes next.");
    else if (mode === "brief") setHint(side === "us" ? "You have the American side." : "You have the Japanese side.");
    else if (mode === "battle") setHint("Click your ship. Click an enemy to arm a strike. Click a gold dot to move. Commit.");
    else if (mode === "debrief") setHint("Another battle returns to the list.");
  }

  function drawTitle() {
    frame();
    paintCarrier(250, 300, 1.6, "#c5d0dc");
    paintCarrier(760, 250, 1.1, "#e6d0d4");
    ctx.fillStyle = GOLD;
    ctx.textAlign = "center";
    ctx.font = "bold 72px Georgia, Palatino, serif";
    ctx.fillText("CARRIERS", 512, 200);
    ctx.fillStyle = PAPER;
    ctx.font = "22px Georgia, Palatino, serif";
    ctx.fillText("Seven battles. Search, strike, move.", 512, 246);
    button(386, 300, 252, 48, "Battles", "battles");
    ctx.fillStyle = "#9bb0c4";
    ctx.font = "16px Georgia, Palatino, serif";
    ctx.textAlign = "center";
    ctx.fillText("Coral Sea through Cape Engaño, and Pearl Harbor.", 512, 390);
    ctx.textAlign = "left";
  }

  function drawPick() {
    frame();
    ctx.fillStyle = GOLD;
    ctx.font = "bold 36px Georgia, Palatino, serif";
    ctx.fillText("Choose a battle", 48, 70);
    const list = Rules.list();
    list.forEach(function (battle, i) {
      const y = 96 + i * 58;
      hot.push({ x: 48, y: y, w: 928, h: 50, id: "battle:" + battle.id, enabled: true });
      ctx.fillStyle = battle.id === battleId ? "#f3e2b8" : "#d9c48e";
      roundRect(48, y, 928, 50, 4);
      ctx.fill();
      ctx.strokeStyle = "#6d5424";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = INK;
      ctx.font = "bold 22px Georgia, Palatino, serif";
      ctx.fillText(battle.name, 68, y + 32);
      ctx.font = "18px Georgia, Palatino, serif";
      ctx.fillText(battle.date, 760, y + 32);
    });
  }

  function drawBrief() {
    frame();
    const book = Rules.book()[battleId];
    if (!book) {
      mode = "pick";
      return;
    }
    ctx.fillStyle = PAPER;
    roundRect(48, 48, 928, 470, 8);
    ctx.fill();
    ctx.strokeStyle = "#6d5424";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = INK;
    ctx.font = "bold 34px Georgia, Palatino, serif";
    ctx.fillText(book.name, 72, 100);
    ctx.font = "18px Georgia, Palatino, serif";
    ctx.fillText(book.date, 72, 128);
    ctx.font = "20px Georgia, Palatino, serif";
    const text = book.briefs[side];
    wrapText(text, 72, 175, 860, 28, 6);
    ctx.font = "italic 18px Georgia, Palatino, serif";
    ctx.fillStyle = "#3d3426";
    wrapText(book.note, 72, 340, 860, 24, 3);
    button(72, 450, 200, 44, "United States", "side:us", true, side === "us");
    button(288, 450, 160, 44, "Japan", "side:jp", true, side === "jp");
    button(620, 450, 140, 44, "Back", "back");
    button(776, 450, 160, 44, "Begin", "begin");
  }

  function cellCenter(x, y) {
    return {
      x: MAP.x + x * MAP.cell + MAP.cell / 2,
      y: MAP.y + y * MAP.cell + MAP.cell / 2
    };
  }

  function drawMap() {
    const sea = ctx.createLinearGradient(0, MAP.y, 0, MAP.y + Rules.ROWS * MAP.cell);
    sea.addColorStop(0, "#0a2744");
    sea.addColorStop(1, "#12486f");
    ctx.fillStyle = sea;
    ctx.fillRect(MAP.x, MAP.y, Rules.COLS * MAP.cell, Rules.ROWS * MAP.cell);
    let y;
    let x;
    for (y = 0; y < Rules.ROWS; y++) {
      for (x = 0; x < Rules.COLS; x++) {
        const px = MAP.x + x * MAP.cell;
        const py = MAP.y + y * MAP.cell;
        if (state.land.has(x + "," + y)) {
          ctx.fillStyle = "#6e6a3c";
          ctx.fillRect(px + 1, py + 1, MAP.cell - 2, MAP.cell - 2);
          ctx.fillStyle = "#8a844c";
          ctx.fillRect(px + 4, py + 4, MAP.cell - 14, 6);
        }
        ctx.strokeStyle = "rgba(226,184,74,0.18)";
        ctx.strokeRect(px, py, MAP.cell, MAP.cell);
      }
    }
    const selectedShip = selected && Rules.byId(state, selected);
    if (selectedShip && !selectedShip.sunk && selectedShip.speed > 0) {
      for (y = 0; y < Rules.ROWS; y++) {
        for (x = 0; x < Rules.COLS; x++) {
          if (state.land.has(x + "," + y)) continue;
          if (Rules.cheb(selectedShip, { x: x, y: y }) > selectedShip.speed) continue;
          const c = cellCenter(x, y);
          ctx.fillStyle = "rgba(226,184,74,0.35)";
          ctx.beginPath();
          ctx.arc(c.x, c.y, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    state.ships.forEach(drawShip);
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 2;
    ctx.strokeRect(MAP.x, MAP.y, Rules.COLS * MAP.cell, Rules.ROWS * MAP.cell);
    ctx.fillStyle = GOLD;
    ctx.font = "bold 14px Georgia, Palatino, serif";
    ctx.fillText("N", MAP.x + 8, MAP.y + 16);
  }

  function shownAt(s) {
    if (s.waiting) return null;
    if (s.kind === "beach") return { x: s.x, y: s.y };
    const show = s.side === state.player || s.visible;
    const ghost = !show && s.lastX != null && s.sunk === false;
    if (!show && !s.sunk && !ghost) return null;
    if (s.sunk && s.side !== state.player && !s.visible && s.lastX == null) return null;
    return show || s.sunk ? { x: s.x, y: s.y } : { x: s.lastX, y: s.lastY };
  }

  function stackShift(s, at) {
    const mates = [];
    state.ships.forEach(function (other) {
      const there = shownAt(other);
      if (there && there.x === at.x && there.y === at.y) mates.push(other.id);
    });
    if (mates.length < 2) return 0;
    return (mates.indexOf(s.id) - (mates.length - 1) / 2) * 14;
  }

  function drawShip(s) {
    const at = shownAt(s);
    if (!at) return;
    const show = s.side === state.player || s.visible || s.kind === "beach";
    const ghost = !show && !s.sunk;
    const c = cellCenter(at.x, at.y);
    c.x += stackShift(s, at);
    if (s.kind === "beach") {
      ctx.fillStyle = s.sunk ? "#5c4030" : "#d8b56a";
      roundRect(c.x - 16, c.y - 12, 32, 24, 3);
      ctx.fill();
      ctx.fillStyle = INK;
      ctx.font = "bold 10px Georgia, Palatino, serif";
      ctx.textAlign = "center";
      ctx.fillText(s.sunk ? "LOST" : "BEACH", c.x, c.y + 3);
      ctx.textAlign = "left";
      return;
    }
    if (s.sunk) {
      ctx.strokeStyle = "rgba(220,220,220,0.7)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(c.x - 8, c.y - 8);
      ctx.lineTo(c.x + 8, c.y + 8);
      ctx.moveTo(c.x + 8, c.y - 8);
      ctx.lineTo(c.x - 8, c.y + 8);
      ctx.stroke();
      return;
    }
    const w = 36;
    const h = 26;
    ctx.globalAlpha = ghost ? 0.45 : 1;
    ctx.fillStyle = s.side === "us" ? "#1d4e89" : s.kind === "convoy" ? "#6b4a22" : "#8c1d2c";
    roundRect(c.x - w / 2, c.y - h / 2, w, h, 3);
    ctx.fill();
    ctx.strokeStyle = selected === s.id ? GOLD : "#f3e6c4";
    ctx.lineWidth = selected === s.id ? 3 : 1;
    ctx.stroke();
    ctx.fillStyle = "#f7f1e2";
    ctx.font = "bold 11px Georgia, Palatino, serif";
    ctx.textAlign = "center";
    ctx.fillText(ghost ? "?" : s.short, c.x, c.y + 1);
    ctx.fillStyle = GOLD;
    const pips = Math.max(0, s.hull);
    for (let i = 0; i < pips; i++) {
      ctx.fillRect(c.x - w / 2 + 3 + i * 5, c.y + h / 2 - 5, 3, 3);
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = "left";
    if (s.side === state.player || s.visible) {
      hot.push({
        x: c.x - w / 2,
        y: c.y - h / 2,
        w: w,
        h: h,
        id: "ship:" + s.id,
        enabled: true
      });
    }
  }

  function kindWord(kind) {
    if (kind === "CV") return "Carrier";
    if (kind === "CVL") return "Light carrier";
    if (kind === "BB") return "Battleship";
    if (kind === "island") return "Airfield";
    if (kind === "convoy") return "Convoy";
    if (kind === "beach") return "Beach";
    return kind;
  }

  function drawPanel() {
    const x = 582;
    const y = 18;
    ctx.fillStyle = PAPER;
    roundRect(x, y, 424, 336, 6);
    ctx.fill();
    ctx.strokeStyle = "#6d5424";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = INK;
    ctx.font = "bold 22px Georgia, Palatino, serif";
    ctx.fillText(state.name, x + 16, y + 32);
    ctx.font = "16px Georgia, Palatino, serif";
    ctx.fillText(state.date + "    Turn " + state.turn + " of " + state.limit, x + 16, y + 54);
    const s = selected && Rules.byId(state, selected);
    if (!s) {
      ctx.fillText("Select one of your ships.", x + 16, y + 96);
    } else {
      ctx.font = "bold 20px Georgia, Palatino, serif";
      ctx.fillText(s.name, x + 16, y + 90);
      ctx.font = "16px Georgia, Palatino, serif";
      ctx.fillText(kindWord(s.kind) + "    Hull " + s.hull + "/" + s.hullMax, x + 16, y + 114);
      ctx.fillText("Fighters " + s.fighters + "    Strike planes " + s.bombers, x + 16, y + 136);
      const strike = s.order.strike ? Rules.byId(state, s.order.strike) : null;
      ctx.fillText(strike ? "Strike: " + strike.name : "Planes holding", x + 16, y + 164);
      ctx.fillText(s.order.move ? "Move to " + s.order.move.x + "," + s.order.move.y : "Holding station", x + 16, y + 186);
    }
    button(x + 16, y + 214, 150, 36, "Hold planes", "hold", !!s);
    button(x + 176, y + 214, 110, 36, "Stay", "stay", !!s);
    if (state.sub) {
      const label = state.subUsed ? "Sub used" : state.subArmed ? "Sub armed" : "Submarine";
      button(x + 296, y + 214, 112, 36, label, "sub", !state.subUsed);
    }
    button(x + 16, y + 268, 392, 48, "Commit orders", "commit", true);
  }

  function drawLog() {
    ctx.fillStyle = "#061018";
    roundRect(18, 384, 988, 170, 6);
    ctx.fill();
    ctx.strokeStyle = "#8a6a28";
    ctx.strokeRect(18, 384, 988, 170);
    ctx.fillStyle = PAPER;
    ctx.font = "16px Georgia, Palatino, serif";
    const lines = state.log.slice(-6);
    lines.forEach(function (line, i) {
      ctx.fillText(line, 34, 414 + i * 22);
    });
  }

  function drawBattle() {
    frame();
    hot.push({ x: MAP.x, y: MAP.y, w: Rules.COLS * MAP.cell, h: Rules.ROWS * MAP.cell, id: "map", enabled: true });
    drawMap();
    drawPanel();
    drawLog();
  }

  function drawDebrief() {
    frame();
    ctx.fillStyle = PAPER;
    roundRect(48, 36, 928, 500, 8);
    ctx.fill();
    ctx.strokeStyle = "#6d5424";
    ctx.lineWidth = 3;
    ctx.stroke();
    const over = state.over || { title: "The day ends.", detail: "", winner: "draw" };
    ctx.fillStyle = over.winner === "us" ? "#1d4e89" : over.winner === "jp" ? "#8c1d2c" : "#6d5424";
    ctx.font = "bold 32px Georgia, Palatino, serif";
    ctx.fillText(over.title, 72, 86);
    ctx.fillStyle = INK;
    ctx.font = "18px Georgia, Palatino, serif";
    let y = wrapText(over.detail, 72, 120, 860, 24, 3);
    ctx.font = "italic 17px Georgia, Palatino, serif";
    ctx.fillStyle = "#3d3426";
    y = wrapText(state.note, 72, y + 8, 860, 22, 3);
    ctx.font = "16px Georgia, Palatino, serif";
    ctx.fillStyle = INK;
    const ships = state.ships.filter(function (s) { return s.kind !== "beach"; });
    ships.forEach(function (s, i) {
      const col = i < Math.ceil(ships.length / 2) ? 72 : 520;
      const row = y + 28 + (i < Math.ceil(ships.length / 2) ? i : i - Math.ceil(ships.length / 2)) * 20;
      ctx.fillStyle = s.side === "us" ? "#1d4e89" : "#8c1d2c";
      ctx.fillText(s.name + (s.sunk ? "  sunk" : "  hull " + s.hull), col, row);
    });
    button(72, 470, 220, 44, "Another battle", "again");
    button(760, 470, 170, 44, "Leave", "leave");
  }

  function draw() {
    hot = [];
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.globalAlpha = 1;
    if (mode === "load") drawLoad();
    else if (mode === "title") drawTitle();
    else if (mode === "pick") drawPick();
    else if (mode === "brief") drawBrief();
    else if (mode === "battle") drawBattle();
    else if (mode === "debrief") drawDebrief();
  }

  function firstOwn() {
    const own = state.ships.find(function (s) {
      return s.side === state.player && !s.sunk && !s.waiting && s.kind !== "beach";
    });
    return own ? own.id : null;
  }

  function beginBattle() {
    state = Rules.start(battleId, side, (Date.now() >>> 0) % 100000);
    selected = firstOwn();
    mode = "battle";
    if (ui.setTitle) ui.setTitle("⚓ " + state.name);
  }

  function onHot(id) {
    const before = mode;
    if (id === "battles") mode = "pick";
    else if (id.indexOf("battle:") === 0) {
      battleId = id.slice(7);
      mode = "brief";
    } else if (id === "side:us" || id === "side:jp") {
      side = id === "side:jp" ? "jp" : "us";
      setHint(side === "us" ? "You have the American side." : "You have the Japanese side.");
    } else if (id === "back") mode = "pick";
    else if (id === "begin") beginBattle();
    else if (id === "again") {
      mode = "pick";
      if (ui.setTitle) ui.setTitle("⚓ Carriers");
    } else if (id === "leave") {
      if (window.GameDesk && typeof window.GameDesk.close === "function") window.GameDesk.close();
    } else if (id === "hold" && selected) {
      Rules.clearStrike(state, selected);
      setHint("Planes holding.");
    } else if (id === "stay" && selected) {
      Rules.clearMove(state, selected);
      setHint("Holding station.");
    } else if (id === "sub") {
      const armed = Rules.armSub(state);
      setHint(armed.ok ? "Submarine armed. Click a Japanese carrier." : "The submarine has fired.");
    } else if (id === "commit" && state && !state.over) {
      Rules.commit(state);
      selected = firstOwn();
      if (state.over) mode = "debrief";
      else setHint("Orders sent.");
    } else if (id.indexOf("ship:") === 0) onShip(id.slice(5));
    if (mode !== before) enterHint();
  }

  function onShip(id) {
    const ship = Rules.byId(state, id);
    if (!ship) return;
    if (ship.side === state.player && !ship.sunk && !ship.waiting && ship.kind !== "beach") {
      selected = id;
      setHint(ship.name + ". Click a spotted enemy, or a gold dot.");
      return;
    }
    if (!selected) {
      setHint("Select one of your ships first.");
      return;
    }
    if (state.subArmed && !state.subUsed && ship.side === "jp") {
      const sub = Rules.setSub(state, id);
      setHint(sub.ok ? "Submarine aimed at " + ship.name + "." : "The submarine cannot take that target.");
      return;
    }
    const hit = Rules.setStrike(state, selected, id);
    if (hit.ok) setHint("Strike armed on " + ship.name + ".");
    else if (hit.reason === "not spotted") setHint("You cannot see " + ship.name + ".");
    else if (hit.reason === "out of range") setHint(ship.name + " is out of range.");
    else if (hit.reason === "no bombers") setHint("No strike planes left on that ship.");
    else setHint("That is not a target.");
  }

  function onMap(px, py) {
    const x = Math.floor((px - MAP.x) / MAP.cell);
    const y = Math.floor((py - MAP.y) / MAP.cell);
    if (x < 0 || y < 0 || x >= Rules.COLS || y >= Rules.ROWS) return;
    const hits = state.ships.filter(function (s) {
      return !s.waiting && s.kind !== "beach" && s.x === x && s.y === y && (s.side === state.player || s.visible);
    });
    if (hits.length) {
      onShip(hits[hits.length - 1].id);
      return;
    }
    if (!selected) {
      setHint("Select one of your ships first.");
      return;
    }
    const moved = Rules.setMove(state, selected, x, y);
    if (moved.ok) setHint("Move set to " + x + "," + y + ".");
    else if (moved.reason === "blocked") setHint("That square is land.");
    else if (moved.reason === "too far") setHint("That square is beyond this turn's speed.");
    else if (moved.reason === "no speed") setHint("That ship cannot move.");
    else setHint("That ship stays.");
  }

  function pointer(event) {
    const rect = el.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    return {
      x: (event.clientX - rect.left) * (el.width / rect.width),
      y: (event.clientY - rect.top) * (el.height / rect.height)
    };
  }

  el.addEventListener("click", function (event) {
    const p = pointer(event);
    if (!p || mode === "load" || mode === "idle") return;
    ui.wrap.focus();
    for (let i = hot.length - 1; i >= 0; i--) {
      const b = hot[i];
      if (!b.enabled) continue;
      if (p.x < b.x || p.y < b.y || p.x >= b.x + b.w || p.y >= b.y + b.h) continue;
      if (b.id === "map") onMap(p.x, p.y);
      else onHot(b.id);
      draw();
      return;
    }
  });

  ui.wrap.addEventListener("keydown", function (event) {
    if (mode === "battle" && event.key === "Enter") {
      event.preventDefault();
      onHot("commit");
      draw();
    } else if (mode === "debrief" && (event.key === "r" || event.key === "R")) {
      onHot("again");
      draw();
    } else if (mode === "title" && event.key === "Enter") {
      onHot("battles");
      draw();
    }
  });

  function loop() {
    if (!running) return;
    draw();
    raf = requestAnimationFrame(loop);
  }

  function openAt(screen) {
    running = true;
    if (screen === "battle") {
      battleId = params.get("battle") || battleId;
      side = params.get("side") === "jp" ? "jp" : "us";
      beginBattle();
    } else if (screen === "brief" || screen === "pick" || screen === "title") {
      if (params.get("battle")) battleId = params.get("battle");
      mode = screen;
    } else {
      mode = "load";
      loadT = 0;
    }
    cancelAnimationFrame(raf);
    enterHint();
    loop();
  }

  const params = new URLSearchParams(window.location.search);
  function onOpen() {
    if (mode === "idle") openAt(params.get("screen"));
    else {
      running = true;
      cancelAnimationFrame(raf);
      loop();
    }
  }

  if (params.get("probe") === "1") {
    window.__probe = {
      mode: function () { return mode; },
      press: function (id) { onHot(id); draw(); },
      summary: function () {
        return {
          mode: mode,
          side: side,
          selected: selected,
          hint: hint,
          turn: state && state.turn,
          over: state && state.over,
          log: state && state.log.slice(),
          ships: state && state.ships.map(function (s) {
            return { id: s.id, hull: s.hull, sunk: s.sunk, x: s.x, y: s.y, waiting: s.waiting };
          })
        };
      }
    };
  }

  if (window.GameDesk) {
    window.GameDesk.onOpen = onOpen;
    window.GameDesk.onClose = function () {
      running = false;
      cancelAnimationFrame(raf);
    };
  } else {
    onOpen();
  }

  return function () {
    running = false;
    cancelAnimationFrame(raf);
  };
});
