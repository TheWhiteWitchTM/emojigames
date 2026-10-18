// The march itself: seals, choices, the name, and the save.
(function (root) {
  "use strict";

  const W = root.PaleWorld;
  const FLAG_OK = {
    bramble: { bound: 1, laid: 1 },
    vellum: { lantern: 1, broken: 1 },
    stacks: { spared: 1, burned: 1 },
    throne: { refused: 1, taken: 1 }
  };

  function fresh(name) {
    return {
      v: 1,
      name: cleanName(name),
      site: "hold",
      seals: { wood: false, stair: false, choir: false, barrow: false },
      companions: [],
      with: null,
      relics: [],
      relic: null,
      vitae: 10,
      pages: 0,
      flags: { bramble: null, vellum: null, stacks: null, throne: null },
      chronicle: ["Quill opened the grimoire at Pale Hold."],
      pending: null,
      introduced: false,
      ending: null
    };
  }

  function cleanName(raw) {
    const text = String(raw || "").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 12);
    return text || "WINTER";
  }

  function vitaeMax(st) {
    let n = 10;
    if (st.flags.bramble === "laid") n += 1;
    if (st.relic === "crown") n += 2;
    return n;
  }

  function sealsClosed(st) {
    return W.SEALS.filter(function (id) { return st.seals[id]; }).length;
  }

  function destinations(st) {
    if (!st || st.pending || st.ending || st.site !== "hold") return [];
    const roads = W.SEALS.filter(function (id) { return !st.seals[id]; });
    if (sealsClosed(st) >= 4) roads.push("gate");
    return roads;
  }

  function canTravel(st, id) {
    return destinations(st).indexOf(id) >= 0;
  }

  function arrive(st, id) {
    if (!W.site(id)) return;
    st.site = id;
  }

  function needsBattle(st) {
    if (!st || st.pending || st.ending) return false;
    if (st.site === "gate") return sealsClosed(st) >= 4;
    return W.SEALS.indexOf(st.site) >= 0 && !st.seals[st.site];
  }

  function clampVitae(st) {
    st.vitae = Math.max(0, Math.min(vitaeMax(st), st.vitae | 0));
  }

  function mods(st) {
    clampVitae(st);
    return {
      frost: st.relic === "lantern" ? 1 : 0,
      slow: st.relic === "banner" ? 0.8 : 1,
      wake: st.relic === "page" ? 1 : 0,
      companion: st.with,
      crown: st.relic === "crown",
      vitae: st.vitae,
      vitaeMax: vitaeMax(st),
      name: st.name,
      pages: st.pages
    };
  }

  function giveCompanion(st, id) {
    if (!W.COMPANIONS[id] || st.companions.indexOf(id) >= 0) return;
    st.companions.push(id);
    if (!st.with) st.with = id;
  }

  function giveRelic(st, id) {
    if (!W.RELICS[id] || st.relics.indexOf(id) >= 0) return;
    st.relics.push(id);
    st.relic = id;
  }

  function applyChoice(st, which) {
    const site = st.pending;
    const choice = W.CHOICES[site];
    if (!choice) return false;
    const pick = choice.a.id === which ? choice.a : choice.b.id === which ? choice.b : null;
    if (!pick) return false;
    if (site === "wood") {
      st.flags.bramble = which;
      if (which === "bound") giveCompanion(st, "shade");
      st.chronicle.push(which === "bound"
        ? "You bound Bramble's shade in the Whisper Wood."
        : "You laid Sister Bramble down. The wood gave one breath back.");
    } else if (site === "stair") {
      st.flags.vellum = which;
      giveRelic(st, which === "lantern" ? "lantern" : "banner");
      st.chronicle.push(which === "lantern"
        ? "You took Vellum's lantern."
        : "You broke Vellum's lantern on the stair.");
    } else if (site === "choir") {
      st.flags.stacks = which;
      if (which === "spared") giveCompanion(st, "moth");
      else giveRelic(st, "page");
      st.chronicle.push(which === "spared"
        ? "You spared a page. Moth came out of the margin."
        : "You burned the stacks of the choir.");
    } else if (site === "barrow") {
      st.flags.throne = which;
      if (which === "refused") giveCompanion(st, "pell");
      else giveRelic(st, "crown");
      st.chronicle.push(which === "refused"
        ? "You left the crown in the dirt. Sir Pell walked out with you."
        : "You took Yarrow's crown for a night.");
    }
    st.seals[site] = true;
    st.pending = null;
    st.site = "hold";
    st.introduced = true;
    clampVitae(st);
    return true;
  }

  function endingId(st) {
    if (st.flags.throne === "taken") return "throne";
    const mercy = st.flags.bramble === "bound" && st.flags.vellum === "lantern" && st.flags.stacks === "spared" && st.flags.throne === "refused";
    if (mercy) return "mercy";
    const ash = st.flags.bramble === "laid" && st.flags.vellum === "broken" && st.flags.stacks === "burned" && st.flags.throne === "refused";
    if (ash) return "ash";
    return "road";
  }

  function onClear(st, vitae) {
    st.vitae = Math.max(1, Math.min(vitaeMax(st), vitae | 0));
    if (st.site === "gate") {
      st.ending = endingId(st);
      st.chronicle.push("The Unlit Gate shut.");
      st.site = "hold";
      return "ending";
    }
    st.pending = st.site;
    return "choice";
  }

  function onDefeat(st) {
    const where = W.site(st.site);
    if (st.site === "gate") {
      st.pages += 1;
      st.vitae = Math.max(1, Math.ceil(vitaeMax(st) / 2));
      st.chronicle.push("King Hollow tore a letter from your name.");
      st.site = "hold";
      st.pending = null;
      if (st.pages >= 3) {
        st.ending = "name";
        return "lost";
      }
      return "wake";
    }
    st.vitae = 1;
    st.chronicle.push("You fell at " + (where ? where.name : "the march") + ". The grimoire brought you home.");
    st.site = "hold";
    st.pending = null;
    return "wake";
  }

  function rest(st) {
    st.vitae = vitaeMax(st);
    st.introduced = true;
    return st.vitae;
  }

  function equip(st, kind, id) {
    if (kind === "with" && st.companions.indexOf(id) >= 0) st.with = id;
    if (kind === "relic" && st.relics.indexOf(id) >= 0) {
      st.relic = id;
      clampVitae(st);
    }
  }

  function holdLine(st) {
    if (st.ending) return W.ENDINGS[st.ending].text;
    if (!st.introduced) return W.OPENING.join(" ");
    if (st.pages > 0) {
      return "He has torn " + st.pages + (st.pages === 1 ? " letter" : " letters") + " from your name. The fire is still lit.";
    }
    const n = sealsClosed(st);
    if (n === 0) return "Four roads leave the hold. The wood is the nearest trouble.";
    if (n < 4) return n + (n === 1 ? " seal is shut." : " seals are shut.") + " The fire keeps.";
    return "The four seals are shut. The gate road is open.";
  }

  function summary(st) {
    const withName = st.with && W.COMPANIONS[st.with] ? W.COMPANIONS[st.with].name : "no one beside you";
    const relic = st.relic && W.RELICS[st.relic] ? W.RELICS[st.relic].name : "no relic";
    return "Vitae " + st.vitae + "/" + vitaeMax(st) + " · " + withName + " · " + relic;
  }

  function menu(st) {
    const items = [{
      id: "rest",
      label: "Rest by the fire",
      hint: "Vitae fills to " + vitaeMax(st) + "."
    }];
    destinations(st).forEach(function (id) {
      const place = W.site(id);
      items.push({ id: "road:" + id, label: "Walk to " + place.name, hint: place.blurb });
    });
    st.companions.forEach(function (id) {
      const who = W.COMPANIONS[id];
      items.push({
        id: "with:" + id,
        label: (st.with === id ? "With you: " : "Call ") + who.name,
        hint: who.hint
      });
    });
    st.relics.forEach(function (id) {
      const relic = W.RELICS[id];
      items.push({
        id: "relic:" + id,
        label: (st.relic === id ? "Carried: " : "Carry ") + relic.name,
        hint: relic.hint
      });
    });
    items.push({ id: "chronicle", label: "Read the chronicle", hint: "What the marches already know." });
    items.push({ id: "keys", label: "The keys", hint: "How the field is walked." });
    return items;
  }

  function written(st) {
    const name = st.name;
    const done = Math.min(st.pages, name.length);
    const head = name.slice(0, name.length - done);
    const tail = name.slice(name.length - done);
    return tail ? head + "·" + tail : head;
  }

  function gateLine(st) {
    return "He says " + written(st) + " and stops before the end.";
  }

  function knownId(list, id) {
    return list.indexOf(id) >= 0;
  }

  function restore(data) {
    if (!data || data.v !== 1 || !data.seals || !data.flags) return null;
    const st = fresh(data.name);
    W.SEALS.forEach(function (id) { st.seals[id] = !!data.seals[id]; });
    if (Array.isArray(data.companions)) {
      data.companions.forEach(function (id) {
        if (W.COMPANIONS[id] && st.companions.indexOf(id) < 0) st.companions.push(id);
      });
    }
    if (W.COMPANIONS[data.with]) st.with = data.with;
    if (Array.isArray(data.relics)) {
      data.relics.forEach(function (id) {
        if (W.RELICS[id] && st.relics.indexOf(id) < 0) st.relics.push(id);
      });
    }
    if (W.RELICS[data.relic]) st.relic = data.relic;
    ["bramble", "vellum", "stacks", "throne"].forEach(function (key) {
      const value = data.flags[key];
      if (value && FLAG_OK[key][value]) st.flags[key] = value;
    });
    if (Array.isArray(data.chronicle)) {
      st.chronicle = data.chronicle.filter(function (line) { return typeof line === "string"; }).slice(-40);
    }
    if (!st.chronicle.length) st.chronicle = fresh(st.name).chronicle;
    st.pages = Math.max(0, Math.min(3, data.pages | 0));
    st.introduced = !!data.introduced;
    st.vitae = Number.isFinite(data.vitae) ? data.vitae : vitaeMax(st);
    clampVitae(st);
    if (st.vitae < 1) st.vitae = 1;
    if (data.pending && knownId(W.SEALS, data.pending) && !st.seals[data.pending]) st.pending = data.pending;
    const siteOk = data.site === "hold" || data.site === "gate" || knownId(W.SEALS, data.site);
    st.site = siteOk ? data.site : "hold";
    if (data.ending && W.ENDINGS[data.ending]) st.ending = data.ending;
    if (st.ending) {
      st.pending = null;
      st.site = "hold";
    } else if (st.pending) st.site = st.pending;
    return st;
  }

  function snapshot(st) {
    return {
      v: 1,
      name: st.name,
      site: st.site,
      seals: st.seals,
      companions: st.companions,
      with: st.with,
      relics: st.relics,
      relic: st.relic,
      vitae: st.vitae,
      pages: st.pages,
      flags: st.flags,
      chronicle: st.chronicle.slice(-40),
      pending: st.pending,
      introduced: st.introduced,
      ending: st.ending
    };
  }

  root.PaleCampaign = {
    fresh: fresh,
    cleanName: cleanName,
    vitaeMax: vitaeMax,
    sealsClosed: sealsClosed,
    destinations: destinations,
    canTravel: canTravel,
    arrive: arrive,
    needsBattle: needsBattle,
    mods: mods,
    applyChoice: applyChoice,
    endingId: endingId,
    onClear: onClear,
    onDefeat: onDefeat,
    rest: rest,
    equip: equip,
    holdLine: holdLine,
    summary: summary,
    menu: menu,
    written: written,
    gateLine: gateLine,
    restore: restore,
    snapshot: snapshot
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
