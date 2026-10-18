// Cockpit, station screens, and the save. Escape belongs to the desk.
(function (root) {
  "use strict";

  const EE = root.EmojiEngine3D;
  const G = root.EliteGalaxy;
  const host = document.getElementById("game");
  if (!host || !EE || !G || !root.EliteSim || !root.EliteView || !root.EliteAudio) return;

  const SAVE = "emojigames.elite.commander";
  const TABS = [
    ["market", "Market"],
    ["equip", "Equip"],
    ["status", "Status"],
    ["chart", "Chart"],
    ["galaxy", "Galaxy"],
    ["data", "Data"],
    ["mission", "Mission"]
  ];

  const style = document.createElement("style");
  style.textContent = [
    "#game .elite { position: relative; width: 100%; max-width: 100%; outline: none; }",
    "#game .elite .ee-wrap { width: 100% !important; background: #02040a; }",
    "#game .elite-hud, #game .elite-ui { position: absolute; inset: 0; width: 100%; height: 100%; }",
    "#game .elite-hud { pointer-events: none; }",
    "#game .elite-ui { display: flex; align-items: flex-end; justify-content: center; pointer-events: none; padding: 10px; box-sizing: border-box; }",
    "#game .elite-ui.mid { align-items: center; }",
    "#game .elite-panel, #game .title-card { pointer-events: auto; width: min(880px, 100%); max-height: 100%; overflow: auto;",
    "  color: #d7f6ea; background: rgba(4, 12, 18, 0.9); border: 1px solid rgba(125, 255, 168, 0.38);",
    "  border-radius: 12px; box-shadow: 0 16px 48px rgba(0, 0, 0, 0.45); font: 13px/1.45 ui-monospace, monospace; }",
    "#game .title-card { width: min(440px, 100%); padding: 28px 26px 22px; text-align: center; }",
    "#game .title-card h1 { margin: 0 0 6px; font-size: 42px; letter-spacing: 0.28em; font-weight: 700; }",
    "#game .kicker { margin: 0; letter-spacing: 0.22em; text-transform: uppercase; color: #8cffb0; font-size: 12px; }",
    "#game .title-card p { margin: 8px 0 16px; color: #b7d8c8; }",
    "#game .title-card label { display: block; margin-bottom: 14px; color: #9fcbb6; }",
    "#game .title-card input { display: block; width: 100%; margin-top: 6px; box-sizing: border-box; text-align: center;",
    "  letter-spacing: 0.18em; text-transform: uppercase; font: 18px ui-monospace, monospace; padding: 8px;",
    "  color: #e9fff4; background: #07141c; border: 1px solid rgba(125, 255, 168, 0.45); border-radius: 8px; }",
    "#game .row { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; }",
    "#game .elite button { font: 12px ui-monospace, monospace; color: #d7f6ea; background: #0c1c24;",
    "  border: 1px solid rgba(125, 255, 168, 0.35); border-radius: 7px; padding: 6px 10px; cursor: pointer; }",
    "#game .elite button.on, #game .elite button.go { color: #07140c; background: #8cffb0; border-color: #8cffb0; }",
    "#game .elite button:hover { border-color: #d7f6ea; }",
    "#game .tabs { display: flex; flex-wrap: wrap; gap: 6px; padding: 10px 10px 0; }",
    "#game .meter, #game .logline, #game .hint { padding: 6px 12px; color: #9fd8c0; }",
    "#game .logline { min-height: 1.2em; color: #ffd27a; }",
    "#game .sheet { width: 100%; border-collapse: collapse; }",
    "#game .sheet th, #game .sheet td { padding: 4px 8px; text-align: left; white-space: nowrap; }",
    "#game .sheet tr.on td { background: rgba(140, 255, 176, 0.14); }",
    "#game .sheet td.num, #game .sheet th.num { text-align: right; }",
    "#game .bad { color: #ff8d8d; }",
    "#game .prose { padding: 4px 14px 14px; }",
    "#game .prose h2 { margin: 8px 0; font-size: 18px; letter-spacing: 0.08em; }",
    "#game .chart-wrap { padding: 0 12px 12px; }",
    "#game .chart-wrap canvas { width: 100%; height: 280px; display: block; background: #061018; border-radius: 8px; cursor: crosshair; }",
    "#game .keys { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 16px; padding: 4px 14px 14px; }",
    "#game .keys b { color: #8cffb0; font-weight: 600; }",
    "#game .elite-pads { display: none; }",
    "@media (pointer: coarse) { #game .elite-ui.flight .elite-pads { display: flex; position: absolute; left: 0; right: 0; bottom: 0; height: 46%; pointer-events: none; } }",
    "#game .elite-pads .pad { flex: 1; margin: 10px; pointer-events: auto; touch-action: none; border: 1px dashed rgba(140, 255, 176, 0.35); border-radius: 16px; }"
  ].join("\n");
  document.head.appendChild(style);

  const sim = root.EliteSim.create();
  const audio = root.EliteAudio.create();
  let engine;
  let renderer;
  try {
    engine = new EE.Engine({
      width: 960,
      height: 540,
      clear: "#02040a",
      pixelRatio: Math.min(2, root.devicePixelRatio || 1)
    });
    renderer = root.EliteView.createRenderer(engine.canvas.gl);
  } catch (err) {
    host.textContent = "This cockpit needs WebGL2.";
    return;
  }

  const shell = EE.Utilities.wrap(engine.canvas, { header: false, footer: false });
  shell.wrap.tabIndex = 0;
  const elite = document.createElement("div");
  elite.className = "elite";
  const hud = document.createElement("canvas");
  hud.className = "elite-hud";
  const ui = document.createElement("div");
  ui.className = "elite-ui mid";
  elite.appendChild(shell.wrap);
  elite.appendChild(hud);
  elite.appendChild(ui);
  host.appendChild(elite);

  let mode = "title";
  let panel = "market";
  let overlay = null;
  let row = 0;
  let equipRow = 0;
  let cursor = sim.state.dest;
  let typed = "";
  let last = 0;
  let fireWas = false;
  let stick = { pitch: 0, roll: 0, throttle: 0 };
  const padIds = { stick: null, throttle: null };

  function esc(text) {
    return String(text).replace(/[&<>"]/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[ch];
    });
  }
  function readSave() {
    try {
      const data = JSON.parse(localStorage.getItem(SAVE) || "null");
      if (!data || data.v !== 1 || !data.name) return null;
      return data;
    } catch (err) {
      return null;
    }
  }
  function save() {
    if (sim.state.dead) return;
    try { localStorage.setItem(SAVE, JSON.stringify(sim.snapshot())); } catch (err) { /* private mode */ }
  }
  function nameValue() {
    const input = ui.querySelector("#elite-name");
    const raw = input ? input.value : "JAMESON";
    return raw.toUpperCase().replace(/[^A-Z ]/g, "").trim().slice(0, 8) || "JAMESON";
  }
  function beginNew(name) {
    sim.newCommander(name || "JAMESON");
    mode = "flight";
    panel = "market";
    overlay = null;
    cursor = sim.state.system;
    save();
    showPanel();
  }
  function continueGame(data) {
    sim.applyCommander(data || readSave());
    mode = "flight";
    panel = "market";
    overlay = null;
    cursor = sim.state.dest;
    showPanel();
  }
  function doLaunch() {
    if (!sim.launch()) return;
    panel = null;
    overlay = null;
    showPanel();
  }
  function gearList() {
    const tech = G.techShown(sim.current());
    return G.EQUIPMENT.filter(function (item) { return tech >= item.tech; });
  }
  function owned(id) {
    const st = sim.state;
    if (id === "missile") return st.missiles ? st.missiles + "/4" : "";
    if (id === "bay") return st.hold >= 35 ? "fitted" : "";
    if (id === "ecm") return st.ecm ? "fitted" : "";
    if (id === "scoop") return st.scoop ? "fitted" : "";
    if (id === "pod") return st.pod ? "fitted" : "";
    if (id === "bomb") return st.bomb ? "fitted" : "";
    if (id === "energy") return st.energyUnit ? "fitted" : "";
    if (id === "docking") return st.dockingComputer ? "fitted" : "";
    if (id === "galdrive") return st.galdrive ? "fitted" : "";
    const mounts = ["front", "rear", "left", "right"].filter(function (mount) { return st.lasers[mount] === id; });
    return mounts.join(" ");
  }

  function tabs() {
    const buttons = TABS.map(function (tab) {
      return `<button type="button" data-act="tab" data-tab="${tab[0]}" class="${panel === tab[0] ? "on" : ""}">${tab[1]}</button>`;
    }).join("");
    return `<nav class="tabs">${buttons}<button type="button" data-act="launch" class="go">Launch</button></nav>`;
  }
  function meter() {
    const st = sim.state;
    const trumble = st.trumbles > 0 ? " · " + st.trumbles + " trumbles" : "";
    return `<div class="meter">${esc(st.name)} · ${esc(G.cashText(st.cash))} · fuel ${esc(G.fuelText(st.fuel))} · hold ${sim.holdUsed()}t/${st.hold}t${trumble}</div><div class="logline" id="elite-log"></div>`;
  }
  function marketHtml() {
    const st = sim.state;
    const gov = sim.current().gov;
    const lines = G.GOODS.map(function (good, i) {
      const illegal = G.illegal(i, gov) ? " bad" : "";
      const mark = G.illegal(i, gov) ? " · illegal" : "";
      return `<tr class="${row === i + 1 ? "on" : ""}" data-row="${i}"><td>${esc(good.name)}${mark}</td><td class="num">${G.priceText(st.market.price[i])}</td><td class="num${illegal}">${st.market.quantity[i]}${good.unit}</td><td class="num">${st.cargo[i]}</td><td><button type="button" data-act="sell" data-good="${i}">Sell</button> <button type="button" data-act="buy" data-good="${i}">Buy</button></td></tr>`;
    }).join("");
    return `${tabs()}${meter()}<table class="sheet"><tr class="${row === 0 ? "on" : ""}"><td>Fuel</td><td class="num">0.2</td><td class="num" colspan="2">${esc(G.fuelText(st.fuel))} of 7.0</td><td><button type="button" data-act="fuel" data-qty="1">+0.1</button> <button type="button" data-act="fuel" data-qty="70">Fill</button></td></tr><tr><th>Commodity</th><th class="num">CR</th><th class="num">For sale</th><th class="num">Hold</th><th></th></tr>${lines}</table><p class="hint">Arrows move. Right buys, left sells. Shift buys or sells the hold. L launches.</p>`;
  }
  function equipHtml() {
    const list = gearList();
    if (equipRow >= list.length) equipRow = 0;
    const pending = sim.state.pendingLaser;
    const mounts = pending ? `<p class="hint">Fit the ${esc(pending)} laser. <button type="button" data-act="mount" data-mount="front">Front</button> <button type="button" data-act="mount" data-mount="rear">Rear</button> <button type="button" data-act="mount" data-mount="left">Left</button> <button type="button" data-act="mount" data-mount="right">Right</button></p>` : "";
    const lines = list.map(function (item, i) {
      const have = owned(item.id);
      return `<tr class="${i === equipRow ? "on" : ""}"><td>${esc(item.name)}</td><td class="num">${item.price}</td><td>${esc(have)}</td><td><button type="button" data-act="equip" data-id="${item.id}">Buy</button></td></tr>`;
    }).join("");
    return `${tabs()}${meter()}${mounts}<table class="sheet"><tr><th>Item</th><th class="num">CR</th><th>Fitted</th><th></th></tr>${lines}</table><p class="hint">A laser asks for a mount. There is no refund. Lave sells what its tech level allows.</p>`;
  }
  function laserLine() {
    const lasers = sim.state.lasers;
    return ["front", "rear", "left", "right"].map(function (mount) {
      return mount + " " + (lasers[mount] || "—");
    }).join(" · ");
  }
  function statusHtml(station) {
    const st = sim.state;
    const sys = sim.current();
    const head = station === false ? `<p class="kicker">Status</p>` : tabs() + meter();
    return `${head}<div class="prose"><h2>${esc(st.name)}</h2><p>${esc(G.ratingName(st.kills))} · ${st.kills} kills · ${esc(G.legalName(st.legal))}</p><p>${esc(G.cashText(st.cash))} · fuel ${esc(G.fuelText(st.fuel))} · hold ${st.hold}t</p><p>Present system ${esc(sys.name)} · galaxy ${st.galaxy}</p><p>Lasers ${esc(laserLine())}</p><p>Missiles ${st.missiles} · ECM ${st.ecm ? "yes" : "no"} · scoops ${st.scoop ? "yes" : "no"} · pod ${st.pod ? "yes" : "no"}</p><p>Bomb ${st.bomb ? "yes" : "no"} · energy unit ${st.energyUnit ? "yes" : "no"} · docking computer ${st.dockingComputer ? "yes" : "no"} · galactic drive ${st.galdrive ? "yes" : "no"}</p>${st.trumbles ? "<p>" + st.trumbles + " trumbles are breeding in the hold.</p>" : ""}</div>`;
  }
  function missionHtml(station) {
    const st = sim.state;
    const systems = sim.galaxy();
    const head = station === false ? `<p class="kicker">Hold</p>` : tabs() + meter();
    let body = "";
    const mission = st.mission || st.offer;
    if (!mission) body = "<p>No contracts on the board.</p>";
    else {
      const dest = systems[mission.dest];
      const dist = G.lyText(G.distance(sim.current(), dest));
      if (mission.type === "hunt") {
        body = `<p>Assassination. ${esc(mission.who)} was last seen at ${esc(dest.name)}, ${dist} LY. ${esc(G.cashText(mission.reward))} on proof.</p>`;
      } else {
        const good = G.GOODS[mission.good];
        body = `<p>Deliver ${mission.amount}${good.unit} ${esc(good.name)} to ${esc(dest.name)}, ${dist} LY. Pays ${esc(G.cashText(mission.reward))}.</p>`;
      }
      if (!st.mission && st.offer) {
        body += `<p class="row"><button type="button" data-act="accept">Accept</button><button type="button" data-act="decline">Decline</button></p>`;
      } else body += "<p>The goods stay in the hold until you dock there, or the target dies.</p>";
    }
    const cargo = G.GOODS.map(function (good, i) {
      if (!st.cargo[i]) return "";
      return `<li>${st.cargo[i]}${good.unit} ${esc(good.name)}</li>`;
    }).join("");
    return `${head}<div class="prose"><h2>Contracts</h2>${body}<h2>Hold</h2>${cargo || "<p>Empty.</p>"}</div>`;
  }
  function dataHtml(sys, station) {
    const pop = (sys.population / 10).toFixed(1);
    const dist = sys === sim.current() ? "here" : G.lyText(G.distance(sim.current(), sys)) + " LY";
    const head = station === false ? `<p class="kicker">Data</p>` : tabs() + meter();
    return `${head}<div class="prose"><h2>${esc(sys.name)}</h2><p>${esc(G.describe(sys))}</p><p>${esc(G.GOV[sys.gov])} · ${esc(G.ECON[sys.economy])}</p><p>Tech level ${G.techShown(sys)} · ${pop} billion · radius ${sys.radius} km</p><p>${esc(sys.species)}</p><p>Productivity ${sys.productivity} MCr · ${dist}</p></div>`;
  }
  function chartHtml(galactic, station) {
    const systems = sim.galaxy();
    const target = systems[cursor];
    const dist = cursor === sim.state.system ? 0 : G.distance(sim.current(), target);
    const reach = dist <= sim.state.fuel ? "" : " · out of fuel";
    const head = station === false ? `<p class="kicker">${galactic ? "Galaxy" : "Chart"}</p>` : tabs() + meter();
    return `${head}<div class="chart-wrap"><canvas class="star-chart" data-galactic="${galactic ? "1" : "0"}"></canvas></div><p class="hint">${esc(target.name)} · ${G.lyText(dist)} LY${reach}${typed ? " · " + esc(typed) : ""}. Arrows move. Enter sets the target. Type a name.</p>`;
  }
  function keysHtml() {
    const rows = [
      ["W S ↑ ↓", "Pitch. Up raises the nose."],
      ["A D ← →", "Roll."],
      ["Q E", "Yaw."],
      ["R F = −", "Throttle. The wheel does it too."],
      ["Space", "Fire the laser on this view."],
      ["1 2 3 4", "Front, rear, left, right."],
      ["T M U", "Arm a missile, launch, unarm."],
      ["X B", "ECM, energy bomb."],
      ["J", "Jettison a trumble, or one tonne."],
      ["H G", "Hyperspace, galactic jump. H aborts."],
      ["C", "Docking computer, inside 3.8 km and under speed 28."],
      ["N", "Compass: station, planet, sun."],
      ["5 6 7 8 9", "Chart, galaxy, data, status, hold."],
      ["K P Z", "Keys, pause, mute."],
      ["L", "Launch. 0 or Backspace closes a page."]
    ];
    const body = rows.map(function (pair) { return `<div><b>${pair[0]}</b> ${pair[1]}</div>`; }).join("");
    const head = sim.state.docked ? tabs() + meter() : `<p class="kicker">Keys</p>`;
    return `${head}<div class="keys">${body}</div>`;
  }
  function cargoOverlay() {
    return `<div class="elite-panel">${missionHtml(false)}</div>`;
  }

  function showPanel() {
    const flying = mode === "flight" && !sim.state.docked;
    ui.className = "elite-ui" + (mode === "title" || mode === "dead" || flying ? " mid" : "") + (flying ? " flight" : "");
    if (mode === "title") {
      const saveData = readSave();
      ui.innerHTML = `<div class="title-card"><p class="kicker">Commander</p><h1>ELITE</h1><p>Trade, fight, and dock. Eight galaxies. The Cobra is yours.</p><label>Name<input id="elite-name" maxlength="8" autocomplete="off" value="${esc(saveData ? saveData.name : "JAMESON")}"></label><div class="row"><button type="button" data-act="new" class="go">New commander</button>${saveData ? `<button type="button" data-act="continue">Continue ${esc(saveData.name)}</button>` : ""}</div></div>`;
      const input = ui.querySelector("#elite-name");
      if (input && root.GameDesk && root.GameDesk.live()) input.focus();
      return;
    }
    if (mode === "dead") {
      const st = sim.state;
      ui.innerHTML = `<div class="title-card"><p class="kicker">Game over</p><h1>${esc(st.name)}</h1><p>${esc(G.ratingName(st.kills))} · ${esc(G.cashText(st.cash))}</p><p>The Cobra is gone. R starts another commander.</p><button type="button" data-act="again" class="go">New commander</button></div>`;
      return;
    }
    if (!sim.state.docked) {
      if (!overlay) {
        ui.innerHTML = `<div class="elite-pads"><div class="pad" data-pad="stick"></div><div class="pad" data-pad="throttle"></div></div>`;
        return;
      }
      let inner = "";
      if (overlay === "pause") inner = `<div class="title-card"><p class="kicker">Paused</p><h1>ELITE</h1><p>P flies.</p></div>`;
      else if (overlay === "keys") inner = `<div class="elite-panel">${keysHtml()}</div>`;
      else if (overlay === "chart") inner = `<div class="elite-panel">${chartHtml(false, false)}</div>`;
      else if (overlay === "galaxy") inner = `<div class="elite-panel">${chartHtml(true, false)}</div>`;
      else if (overlay === "data") inner = `<div class="elite-panel">${dataHtml(sim.galaxy()[cursor], false)}</div>`;
      else if (overlay === "status") inner = `<div class="elite-panel">${statusHtml(false)}</div>`;
      else if (overlay === "cargo") inner = cargoOverlay();
      ui.innerHTML = inner;
      paintChart();
      return;
    }
    let inner = "";
    if (panel === "equip") inner = equipHtml();
    else if (panel === "status" || panel === "keys") inner = panel === "keys" ? keysHtml() : statusHtml();
    else if (panel === "mission") inner = missionHtml();
    else if (panel === "data") inner = dataHtml(sim.galaxy()[cursor] || sim.current());
    else if (panel === "chart") inner = chartHtml(false);
    else if (panel === "galaxy") inner = chartHtml(true);
    else inner = marketHtml();
    ui.innerHTML = `<div class="elite-panel">${inner}</div>`;
    paintChart();
    const log = document.getElementById("elite-log");
    if (log && sim.state.log[0]) log.textContent = sim.state.log[0].text;
  }

  function chartLayout(w, h, galactic) {
    const here = sim.current();
    if (galactic) {
      const pad = 24;
      return {
        galactic: true,
        toScreen: function (sys) {
          return [
            pad + (sys.x / 256) * (w - pad * 2),
            pad + (1 - (sys.y / 2) / 128) * (h - pad * 2)
          ];
        }
      };
    }
    const scale = Math.min(w, h) / 48;
    return {
      galactic: false,
      scale: scale,
      toScreen: function (sys) {
        return [w / 2 + (sys.x - here.x) * scale, h / 2 - (sys.y - here.y) / 2 * scale];
      }
    };
  }
  function paintChart() {
    const canvas = ui.querySelector(".star-chart");
    if (!canvas) return;
    const galactic = canvas.getAttribute("data-galactic") === "1";
    const dpr = engine.canvas.pixelRatio || 1;
    const w = canvas.clientWidth || 640;
    const h = canvas.clientHeight || 280;
    canvas.width = Math.max(1, Math.round(w * dpr));
    canvas.height = Math.max(1, Math.round(h * dpr));
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#061018";
    ctx.fillRect(0, 0, w, h);
    const layout = chartLayout(w, h, galactic);
    const systems = sim.galaxy();
    const here = sim.current();
    if (!galactic) {
      const fuelR = (sim.state.fuel / 4) * layout.scale;
      const maxR = (G.MAX_FUEL / 4) * layout.scale;
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, maxR, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(140, 255, 176, 0.18)";
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, fuelR, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255, 210, 122, 0.7)";
      ctx.stroke();
    }
    ctx.font = "11px ui-monospace, monospace";
    for (let i = 0; i < systems.length; i += 1) {
      const sys = systems[i];
      const dist = i === sim.state.system ? 0 : G.distance(here, sys);
      if (!galactic && dist > G.MAX_FUEL) continue;
      const at = layout.toScreen(sys);
      const selected = i === cursor;
      const home = i === sim.state.system;
      const dest = i === sim.state.dest;
      ctx.beginPath();
      ctx.fillStyle = home ? "#8cffb0" : selected ? "#ffe08a" : dest ? "#9fd0ff" : "rgba(190, 220, 210, 0.8)";
      ctx.arc(at[0], at[1], selected ? 4 : 2.2, 0, Math.PI * 2);
      ctx.fill();
      if (selected || home || dest || (!galactic && dist <= G.MAX_FUEL)) {
        if (galactic && !selected && !home && !dest) continue;
        ctx.fillStyle = ctx.fillStyle;
        ctx.fillText(sys.name, at[0] + 6, at[1] - 4);
      }
    }
  }
  function pickChart(canvas, x, y) {
    const galactic = canvas.getAttribute("data-galactic") === "1";
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    const layout = chartLayout(w, h, galactic);
    const systems = sim.galaxy();
    const here = sim.current();
    let best = -1;
    let bestD = 18;
    for (let i = 0; i < systems.length; i += 1) {
      if (!galactic && i !== sim.state.system && G.distance(here, systems[i]) > G.MAX_FUEL) continue;
      const at = layout.toScreen(systems[i]);
      const d = Math.hypot(at[0] - x, at[1] - y);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    if (best >= 0) {
      cursor = best;
      sim.setDest(best);
      showPanel();
    }
  }
  function nudge(dx, dy, galactic) {
    const systems = sim.galaxy();
    const origin = systems[cursor];
    const here = sim.current();
    let best = cursor;
    let bestScore = Infinity;
    for (let i = 0; i < systems.length; i += 1) {
      if (i === cursor) continue;
      if (!galactic && G.distance(here, systems[i]) > G.MAX_FUEL) continue;
      const vx = systems[i].x - origin.x;
      const vy = (systems[i].y - origin.y) / 2;
      const along = vx * dx + vy * dy;
      if (along < 0.75) continue;
      const side = vx * dy - vy * dx;
      const score = vx * vx + vy * vy + side * side * 3;
      if (score < bestScore) {
        bestScore = score;
        best = i;
      }
    }
    cursor = best;
  }

  function drawHud() {
    const ctx = hud.getContext("2d");
    const dpr = engine.canvas.pixelRatio || 1;
    const w = engine.canvas.width;
    const h = engine.canvas.height;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    if (drawable.fault) {
      ctx.fillStyle = "#ff8d8d";
      ctx.font = "14px ui-monospace, monospace";
      ctx.fillText(drawable.fault, 16, 24);
    }
    if (mode !== "flight" || sim.state.docked || sim.state.dead) return;
    const st = sim.state;
    const s = Math.max(0.72, Math.min(w, h) / 540);
    const cond = sim.condition();
    const condColor = cond === "RED" || cond === "DEAD" ? "#ff5c5c" : cond === "YELLOW" ? "#ffc56b" : "#8cffb0";
    ctx.fillStyle = "rgba(2, 6, 12, 0.45)";
    ctx.fillRect(0, 0, w, 32 * s);
    ctx.font = `600 ${Math.round(13 * s)}px ui-monospace, monospace`;
    ctx.fillStyle = condColor;
    ctx.fillText(cond, 14 * s, 21 * s);
    ctx.fillStyle = "#d7f6ea";
    const sys = st.witch ? "WITCHSPACE" : sim.current().name;
    const bits = [sys, "GAL " + st.galaxy, G.legalName(st.legal), G.cashText(st.cash), "FUEL " + G.fuelText(st.fuel), st.player.view.toUpperCase()];
    ctx.fillText(bits.join("   "), 86 * s, 21 * s);

    const cx = w / 2;
    const cy = h / 2;
    let locked = false;
    const look = root.EliteMath.basis(root.EliteView.viewQuat(st.player.q, st.player.view));
    for (let i = 0; i < st.ships.length; i += 1) {
      const ship = st.ships[i];
      if (ship.gone || ship.kind === "canister" || ship.kind === "pod") continue;
      const rel = root.EliteMath.sub(ship.pos, st.player.pos);
      const along = root.EliteMath.dot(rel, look.forward);
      if (along < 30) continue;
      const off = root.EliteMath.sub(rel, root.EliteMath.scale(look.forward, along));
      if (root.EliteMath.len(off) < Math.max(ship.radius, 18)) locked = true;
    }
    ctx.strokeStyle = locked ? "#ff5c5c" : "rgba(215, 246, 234, 0.85)";
    ctx.lineWidth = 1.5;
    const g = 7 * s;
    const gap = 10 * s;
    ctx.beginPath();
    ctx.moveTo(cx - gap - g, cy); ctx.lineTo(cx - gap, cy);
    ctx.moveTo(cx + gap, cy); ctx.lineTo(cx + gap + g, cy);
    ctx.moveTo(cx, cy - gap - g); ctx.lineTo(cx, cy - gap);
    ctx.moveTo(cx, cy + gap); ctx.lineTo(cx, cy + gap + g);
    ctx.stroke();

    ctx.font = `${Math.round(12 * s)}px ui-monospace, monospace`;
    st.log.forEach(function (line, i) {
      ctx.globalAlpha = Math.max(0.25, Math.min(1, line.life / 2));
      ctx.fillStyle = "#ffe08a";
      ctx.fillText(line.text, 16 * s, 52 * s + i * 16 * s);
    });
    ctx.globalAlpha = 1;
    if (st.hyper > 0) {
      ctx.fillStyle = "#8cffb0";
      ctx.fillText("HYPERSPACE " + Math.ceil(st.hyper), cx - 50 * s, 52 * s);
    }
    if (st.galHyper > 0) {
      ctx.fillStyle = "#9fd0ff";
      ctx.fillText("GALACTIC " + Math.ceil(st.galHyper), cx - 46 * s, 52 * s);
    }

    function bar(x, y, label, value, max, color) {
      ctx.fillStyle = "#9fd8c0";
      ctx.fillText(label, x, y);
      ctx.fillStyle = "rgba(255,255,255,0.12)";
      ctx.fillRect(x + 46 * s, y - 9 * s, 90 * s, 8 * s);
      ctx.fillStyle = color;
      ctx.fillRect(x + 46 * s, y - 9 * s, 90 * s * Math.max(0, Math.min(1, value / max)), 8 * s);
    }
    bar(14 * s, h - 62 * s, "FWD", st.player.fore, 200, "#8cffb0");
    bar(14 * s, h - 44 * s, "AFT", st.player.aft, 200, "#8cffb0");
    bar(14 * s, h - 26 * s, "EN", st.player.energy, 200, "#9fd0ff");
    bar(14 * s, h - 78 * s, "HEAT", st.player.heat, 255, st.player.heat > 180 ? "#ff5c5c" : "#ffc56b");
    bar(160 * s, h - 78 * s, "CABIN", st.player.cabin, 255, st.player.cabin > 180 ? "#ff5c5c" : "#ff9a55");

    ctx.fillStyle = "#d7f6ea";
    ctx.font = `600 ${Math.round(22 * s)}px ui-monospace, monospace`;
    ctx.fillText(String(Math.round(st.player.speed)), w - 64 * s, h - 28 * s);
    ctx.font = `${Math.round(11 * s)}px ui-monospace, monospace`;
    ctx.fillStyle = "#9fd8c0";
    ctx.fillText("SPEED", w - 78 * s, h - 46 * s);
    const missiles = st.missiles;
    ctx.fillText(st.player.armed ? "ARMED" : "MISSILE " + missiles, w - 92 * s, 52 * s);

    const compass = compassBlip();
    ctx.beginPath();
    ctx.arc(w - 48 * s, 78 * s, 22 * s, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(215,246,234,0.55)";
    ctx.stroke();
    ctx.fillStyle = "#9fd8c0";
    ctx.fillText(st.player.compass.slice(0, 3).toUpperCase(), w - 78 * s, 116 * s);
    if (compass) {
      ctx.fillStyle = compass.ahead ? "#8cffb0" : "#ff8d8d";
      ctx.beginPath();
      ctx.arc(w - 48 * s + compass.x * 16 * s, 78 * s - compass.y * 16 * s, 3.5 * s, 0, Math.PI * 2);
      ctx.fill();
    }

    drawScanner(ctx, w, h, s);
    if (overlay === "pause") {
      ctx.fillStyle = "rgba(2, 6, 12, 0.35)";
      ctx.fillRect(0, 0, w, h);
    }
  }
  function compassBlip() {
    const st = sim.state;
    const body = st.player.compass === "sun" ? st.sun : st.player.compass === "planet" ? st.planet : st.station;
    if (!body) return null;
    const rel = root.EliteMath.norm(root.EliteMath.sub(body.pos, st.player.pos));
    const b = root.EliteMath.basis(st.player.q);
    const x = root.EliteMath.dot(rel, b.right);
    const y = root.EliteMath.dot(rel, b.up);
    const z = root.EliteMath.dot(rel, b.forward);
    const planar = Math.hypot(x, y) || 1;
    const limit = z > 0.2 ? 1 : planar;
    return { x: x / limit, y: y / limit, ahead: z > 0 };
  }
  function drawScanner(ctx, w, h, s) {
    const st = sim.state;
    const cx = w / 2;
    const cy = h - 58 * s;
    const rx = 78 * s;
    const ry = 46 * s;
    ctx.strokeStyle = "rgba(140, 255, 176, 0.45)";
    ctx.strokeRect(cx - rx, cy - ry, rx * 2, ry * 2);
    ctx.beginPath();
    ctx.moveTo(cx - 6 * s, cy); ctx.lineTo(cx + 6 * s, cy);
    ctx.moveTo(cx, cy - 6 * s); ctx.lineTo(cx, cy + 6 * s);
    ctx.stroke();
    const b = root.EliteMath.basis(st.player.q);
    const math = root.EliteMath;
    function blot(pos, color, radius) {
      const rel = math.sub(pos, st.player.pos);
      const dist = math.len(rel);
      if (dist > 5200 || dist < 1) return;
      const x = math.dot(rel, b.right) / 5200;
      const y = math.dot(rel, b.forward) / 5200;
      const z = math.dot(rel, b.up) / 5200;
      const px = cx + x * rx;
      const py = cy - y * ry;
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px, py - z * ry * 0.85);
      ctx.stroke();
      ctx.fillRect(px - 1.5, py - 1.5, radius, radius);
    }
    if (st.station) blot(st.station.pos, "#8cffb0", 4);
    if (st.planet) blot(st.planet.pos, "#6aa8ff", 4);
    for (let i = 0; i < st.ships.length; i += 1) {
      const ship = st.ships[i];
      if (ship.gone) continue;
      let color = "#c9ddd4";
      if (ship.role === "pirate" || ship.role === "hunter") color = "#ff7a7a";
      else if (ship.role === "police") color = "#9fd0ff";
      else if (ship.role === "trader") color = "#d7f6ea";
      else if (ship.kind === "thargoid" || ship.kind === "thargon") color = "#b6ff6a";
      else if (ship.kind === "missile") color = "#ffe08a";
      else if (ship.kind === "asteroid") color = "#8a8178";
      blot(ship.pos, color, ship.kind === "missile" ? 3 : 3);
    }
  }

  function axes() {
    const down = function (key) { return engine.isKeyDown(key); };
    let pitch = stick.pitch;
    let yaw = 0;
    let roll = stick.roll;
    let throttle = stick.throttle;
    if (down("w") || down("W") || down("ArrowUp")) pitch += 1;
    if (down("s") || down("S") || down("ArrowDown")) pitch -= 1;
    if (down("a") || down("A") || down("ArrowLeft")) roll -= 1;
    if (down("d") || down("D") || down("ArrowRight")) roll += 1;
    if (down("q") || down("Q")) yaw -= 1;
    if (down("e") || down("E")) yaw += 1;
    if (down("r") || down("R") || down("=") || down("+")) throttle += 1;
    if (down("f") || down("F") || down("-") || down("_")) throttle -= 1;
    pitch = Math.max(-1, Math.min(1, pitch));
    roll = Math.max(-1, Math.min(1, roll));
    yaw = Math.max(-1, Math.min(1, yaw));
    throttle = Math.max(-1, Math.min(1, throttle));
    const fire = down(" ");
    const fireEdge = fire && !fireWas;
    fireWas = fire;
    return { pitch: pitch, yaw: yaw, roll: roll, throttle: throttle, fire: fire, fireEdge: fireEdge };
  }
  function zeroInput() {
    fireWas = engine.isKeyDown(" ");
    return { pitch: 0, yaw: 0, roll: 0, throttle: 0, fire: false, fireEdge: false };
  }

  function pump() {
    const events = sim.drainEvents();
    for (let i = 0; i < events.length; i += 1) {
      const name = events[i];
      if (name === "save") save();
      else if (name === "dead") {
        try { localStorage.removeItem(SAVE); } catch (err) { /* ignore */ }
      } else audio.play(name);
    }
    const log = document.getElementById("elite-log");
    if (log) log.textContent = sim.state.log[0] ? sim.state.log[0].text : "";
  }
  function syncMode() {
    if (sim.state.dead) {
      if (mode !== "dead") {
        mode = "dead";
        panel = null;
        overlay = null;
        showPanel();
      }
      return;
    }
    if (mode !== "flight") return;
    if (sim.state.docked) {
      if (overlay) overlay = null;
      if (!panel) {
        panel = "market";
        showPanel();
      }
    } else if (panel) {
      panel = null;
      if (!overlay) showPanel();
    }
  }

  function fit() {
    const w = Math.max(320, host.clientWidth || 960);
    const h = Math.max(200, host.clientHeight || Math.round(w * 9 / 16));
    engine.canvas.resize(w, h);
    hud.width = engine.canvas.element.width;
    hud.height = engine.canvas.element.height;
  }

  const drawable = {
    draw: function () {
      const now = performance.now();
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
      last = now;
      const live = root.GameDesk && root.GameDesk.live();
      const stepping = live && mode === "flight" && !overlay;
      sim.step(stepping ? dt : 0, stepping && !sim.state.docked ? axes() : zeroInput());
      pump();
      syncMode();
      const spin = mode === "flight" ? sim.state.time : now / 1000;
      const scene = root.EliteView.buildScene(sim.state, mode === "flight" ? "flight" : "title", spin);
      const gl = engine.canvas.gl;
      try {
        renderer.draw(scene, gl.canvas.width, gl.canvas.height);
      } catch (err) {
        if (!drawable.fault) console.error(err);
        drawable.fault = err && err.message ? err.message : "view failed";
      }
      drawHud();
      if (stepping && !sim.state.docked && !sim.state.player.dead) audio.engineSpeed(sim.state.player.speed, sim.MAX_SPEED);
      else audio.engineSpeed(0, sim.MAX_SPEED);
    }
  };
  engine.canvas.add(drawable);

  function trade(dir, all) {
    const qty = all ? 99 : 1;
    if (row <= 0) {
      if (dir > 0) sim.buyFuel(all ? G.MAX_FUEL : 1);
    } else if (dir > 0) sim.buy(row - 1, qty);
    else sim.sell(row - 1, qty);
    showPanel();
  }
  function chartOpen() {
    return panel === "chart" || panel === "galaxy" || overlay === "chart" || overlay === "galaxy";
  }
  function onChartKey(e) {
    const galactic = panel === "galaxy" || overlay === "galaxy";
    if (e.key === "ArrowRight") nudge(1, 0, galactic);
    else if (e.key === "ArrowLeft") nudge(-1, 0, galactic);
    else if (e.key === "ArrowUp") nudge(0, 1, galactic);
    else if (e.key === "ArrowDown") nudge(0, -1, galactic);
    else if (e.key === "Backspace" && typed) typed = typed.slice(0, -1);
    else if (e.key === "Enter") {
      sim.setDest(cursor);
      if (!sim.state.docked) { overlay = null; }
    } else if (/^[a-z]$/i.test(e.key)) {
      typed = (typed + e.key).toUpperCase().slice(0, 8);
      const found = G.findByPrefix(sim.galaxy(), typed, sim.current());
      if (found >= 0) cursor = found;
    } else return false;
    showPanel();
    return true;
  }
  function onKey(e) {
    if (!root.GameDesk || !root.GameDesk.live()) return;
    if (e.key === "Escape") return;
    const typing = e.target && e.target.closest && e.target.closest("input, textarea");
    if (typing) {
      if (e.key === "Enter") {
        e.preventDefault();
        const data = readSave();
        if (data && nameValue() === data.name) continueGame(data);
        else beginNew(nameValue());
      }
      return;
    }
    if (e.key === " " || e.key.indexOf("Arrow") === 0 || e.key === "Tab") e.preventDefault();
    if (e.repeat) return;
    const key = e.key;
    if (mode === "title") {
      if (key === "Enter") {
        const data = readSave();
        if (data && nameValue() === data.name) continueGame(data);
        else beginNew(nameValue());
      }
      return;
    }
    if (mode === "dead") {
      if (key === "r" || key === "R") beginNew("JAMESON");
      return;
    }
    if (key === "z" || key === "Z") {
      sim.say(audio.toggle() ? "AUDIO OFF" : "AUDIO ON");
      return;
    }
    if ((key === "p" || key === "P") && !sim.state.docked) {
      overlay = overlay === "pause" ? null : "pause";
      showPanel();
      return;
    }
    if (key === "k" || key === "K") {
      if (sim.state.docked) panel = panel === "keys" ? "market" : "keys";
      else overlay = overlay === "keys" ? null : "keys";
      showPanel();
      return;
    }
    if (!sim.state.docked && overlay) {
      if (chartOpen() && onChartKey(e)) return;
      if (key === "0" || key === "Backspace") { overlay = null; typed = ""; showPanel(); return; }
      if (key === "h" || key === "H") { overlay = null; sim.hyper(); showPanel(); }
      if (key === "g" || key === "G") { overlay = null; sim.galhyper(); showPanel(); }
      return;
    }
    if (sim.state.docked) {
      if (chartOpen() && onChartKey(e)) return;
      if (key === "l" || key === "L") { doLaunch(); return; }
      if (key === "Tab") {
        const ids = TABS.map(function (tab) { return tab[0]; });
        const at = Math.max(0, ids.indexOf(panel));
        panel = ids[(at + 1) % ids.length];
        showPanel();
        return;
      }
      if (key === "5") panel = "chart";
      else if (key === "6") panel = "galaxy";
      else if (key === "7") panel = "data";
      else if (key === "8") panel = "status";
      else if (key === "9") panel = "mission";
      else if (key === "0" || key === "Backspace") panel = "market";
      else if (key === "ArrowUp") { if (panel === "equip") equipRow = Math.max(0, equipRow - 1); else row = Math.max(0, row - 1); }
      else if (key === "ArrowDown") { if (panel === "equip") equipRow = Math.min(gearList().length - 1, equipRow + 1); else row = Math.min(17, row + 1); }
      else if (key === "ArrowRight" || key === "Enter") {
        if (panel === "market") trade(1, e.shiftKey);
        else if (panel === "equip") { const item = gearList()[equipRow]; if (item) sim.buyEquip(item.id); }
        else if (panel === "mission" && key === "Enter") sim.accept();
        else return;
      } else if (key === "ArrowLeft") { if (panel === "market") trade(-1, e.shiftKey); else return; }
      else if (key === "y" || key === "Y") { if (panel === "mission") sim.accept(); else return; }
      else if (key === "n" || key === "N") { if (panel === "mission") sim.decline(); else return; }
      else if (sim.state.pendingLaser && "1234".indexOf(key) >= 0) {
        sim.fitLaser(["front", "rear", "left", "right"][Number(key) - 1]);
      } else return;
      showPanel();
      return;
    }
    if (key === "t" || key === "T") sim.arm();
    else if (key === "m" || key === "M") sim.missile();
    else if (key === "u" || key === "U") sim.unarm();
    else if (key === "x" || key === "X") sim.ecm();
    else if (key === "b" || key === "B") sim.bomb();
    else if (key === "h" || key === "H") sim.hyper();
    else if (key === "g" || key === "G") sim.galhyper();
    else if (key === "c" || key === "C") sim.toggleDock();
    else if (key === "j" || key === "J") sim.jettison();
    else if (key === "n" || key === "N") sim.compass();
    else if (key === "1") sim.setView("front");
    else if (key === "2") sim.setView("rear");
    else if (key === "3") sim.setView("left");
    else if (key === "4") sim.setView("right");
    else if (key === "5") { overlay = "chart"; cursor = sim.state.dest; showPanel(); }
    else if (key === "6") { overlay = "galaxy"; cursor = sim.state.dest; showPanel(); }
    else if (key === "7") { overlay = "data"; cursor = sim.state.system; showPanel(); }
    else if (key === "8") { overlay = "status"; showPanel(); }
    else if (key === "9") { overlay = "cargo"; showPanel(); }
  }

  ui.addEventListener("click", function (e) {
    const btn = e.target.closest("[data-act]");
    if (!btn) return;
    const act = btn.getAttribute("data-act");
    if (act === "new") beginNew(nameValue());
    else if (act === "continue") continueGame(readSave());
    else if (act === "again") beginNew("JAMESON");
    else if (act === "tab") { panel = btn.getAttribute("data-tab"); showPanel(); }
    else if (act === "launch") doLaunch();
    else if (act === "buy") { row = Number(btn.getAttribute("data-good")) + 1; trade(1, e.shiftKey); }
    else if (act === "sell") { row = Number(btn.getAttribute("data-good")) + 1; trade(-1, e.shiftKey); }
    else if (act === "fuel") sim.buyFuel(Number(btn.getAttribute("data-qty")) || 1);
    else if (act === "equip") sim.buyEquip(btn.getAttribute("data-id"));
    else if (act === "mount") sim.fitLaser(btn.getAttribute("data-mount"));
    else if (act === "accept") sim.accept();
    else if (act === "decline") sim.decline();
    if (act !== "new" && act !== "continue") showPanel();
    shell.wrap.focus();
  });
  ui.addEventListener("click", function (e) {
    const canvas = e.target.closest(".star-chart");
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    pickChart(canvas, e.clientX - rect.left, e.clientY - rect.top);
  });
  ui.addEventListener("pointerdown", function (e) {
    const pad = e.target.closest(".pad");
    if (!pad) return;
    pad.setPointerCapture(e.pointerId);
    padIds[pad.getAttribute("data-pad")] = e.pointerId;
    movePad(pad, e);
  });
  ui.addEventListener("pointermove", function (e) {
    const pad = e.target.closest(".pad");
    if (!pad || padIds[pad.getAttribute("data-pad")] !== e.pointerId) return;
    movePad(pad, e);
  });
  function endPad(e) {
    Object.keys(padIds).forEach(function (name) {
      if (padIds[name] === e.pointerId) padIds[name] = null;
    });
    if (padIds.stick == null) { stick.pitch = 0; stick.roll = 0; }
    if (padIds.throttle == null) stick.throttle = 0;
  }
  ui.addEventListener("pointerup", endPad);
  ui.addEventListener("pointercancel", endPad);
  function movePad(pad, e) {
    const rect = pad.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width * 2 - 1;
    const y = (e.clientY - rect.top) / rect.height * 2 - 1;
    if (pad.getAttribute("data-pad") === "stick") {
      stick.roll = Math.max(-1, Math.min(1, x * 1.4));
      stick.pitch = Math.max(-1, Math.min(1, -y * 1.4));
    } else {
      stick.throttle = y < -0.15 ? 1 : y > 0.15 ? -1 : 0;
    }
  }

  elite.addEventListener("wheel", function (e) {
    if (mode !== "flight" || sim.state.docked || overlay) return;
    e.preventDefault();
    const dir = e.deltaY > 0 ? -2 : 2;
    sim.state.player.speed = Math.max(0, Math.min(sim.MAX_SPEED, sim.state.player.speed + dir));
  }, { passive: false });

  window.addEventListener("keydown", onKey);
  window.addEventListener("resize", fit);

  const desk = root.GameDesk || {};
  desk.onOpen = function () {
    last = 0;
    fit();
    engine.start();
    audio.resume();
    requestAnimationFrame(fit);
    shell.wrap.focus();
  };
  desk.onClose = function () {
    engine.stop();
    audio.suspend();
    last = 0;
    if (mode === "dead" || sim.state.dead) {
      try { localStorage.removeItem(SAVE); } catch (err) { /* ignore */ }
    } else if (mode === "flight") save();
  };
  root.GameDesk = desk;

  showPanel();
  fit();

  root.EliteGame = {
    sim: sim,
    audio: audio,
    engine: engine,
    beginNew: beginNew,
    continueGame: continueGame,
    launch: doLaunch,
    showPanel: showPanel,
    fault: function () { return drawable.fault || ""; }
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
