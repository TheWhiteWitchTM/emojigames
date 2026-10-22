// Carriers. The orders, the dice, and the seven battles.
// A browser page or a test can both call CarrierRules.
(function (root) {
  "use strict";

  var COLS = 13;
  var ROWS = 8;
  var STRIKE = 6;

  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function cheb(a, b) {
    return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
  }

  function key(x, y) {
    return x + "," + y;
  }

  function ship(partial) {
    var fighters = partial.fighters || 0;
    var bombers = partial.bombers || 0;
    return {
      id: partial.id,
      name: partial.name,
      short: partial.short,
      side: partial.side,
      kind: partial.kind,
      x: partial.x,
      y: partial.y,
      hull: partial.hull,
      hullMax: partial.hull,
      speed: partial.speed == null ? 2 : partial.speed,
      fighters: fighters,
      fighterMax: partial.fighterMax != null ? partial.fighterMax : fighters,
      bombers: bombers,
      bomberMax: partial.bomberMax != null ? partial.bomberMax : bombers,
      aa: partial.aa || 0,
      skill: partial.skill == null ? 0.5 : partial.skill,
      waiting: !!partial.arrive,
      arrive: partial.arrive || 0,
      arriveX: partial.arriveX,
      arriveY: partial.arriveY,
      knownTo: partial.knownTo || null,
      sunk: false,
      visible: false,
      lastX: null,
      lastY: null,
      order: { strike: null, move: null }
    };
  }

  function landSet(cells) {
    var set = new Set();
    cells.forEach(function (cell) {
      set.add(key(cell[0], cell[1]));
    });
    return set;
  }

  function cv(partial) {
    partial.kind = partial.kind || "CV";
    if (partial.hull == null) partial.hull = partial.kind === "CVL" ? 3 : 4;
    if (partial.aa == null) partial.aa = partial.kind === "CVL" ? 0 : 1;
    if (partial.fighters == null) partial.fighters = partial.kind === "CVL" ? 2 : 3;
    if (partial.bombers == null) partial.bombers = partial.kind === "CVL" ? 1 : 3;
    return ship(partial);
  }

  // Dates and fleets follow the battles. The map is a reduction, not a chart.
  function battles() {
    return {
      "coral-sea": {
        id: "coral-sea",
        name: "Coral Sea",
        date: "8 May 1942",
        limit: 12,
        brainJp: "cover-convoy",
        brainUs: "kill-convoy",
        sub: false,
        southLine: null,
        note: "Lexington was lost. Yorktown was damaged. Shokaku was damaged, and Zuikaku's air group was used up. The ships never saw each other. Port Moresby was not invaded.",
        briefs: {
          us: "Fletcher has Lexington and Yorktown. A convoy is running for the New Guinea coast. Sink the convoy, or sink one of Shokaku and Zuikaku. Lose a carrier, or let the convoy reach the coast, and the invasion goes through.",
          jp: "Shokaku and Zuikaku are covering the Port Moresby convoy. Sink Lexington or Yorktown, or walk the convoy to the coast. Lose a carrier, or lose the convoy, and the invasion turns back."
        },
        land: [[0, 3], [0, 4], [0, 5], [0, 6], [1, 4], [1, 5]],
        convoyGoal: { x: 2, y: 5 },
        ships: [
          cv({ id: "lexington", name: "Lexington", short: "LEX", side: "us", x: 4, y: 6, skill: 0.54 }),
          cv({ id: "yorktown", name: "Yorktown", short: "YOR", side: "us", x: 5, y: 7, skill: 0.54 }),
          cv({ id: "shokaku", name: "Shokaku", short: "SHO", side: "jp", x: 9, y: 1, skill: 0.56 }),
          cv({ id: "zuikaku", name: "Zuikaku", short: "ZUI", side: "jp", x: 10, y: 2, skill: 0.56 }),
          ship({ id: "convoy", name: "Moresby convoy", short: "CON", side: "jp", kind: "convoy", x: 9, y: 3, hull: 5, speed: 1, aa: 2, skill: 0.2 })
        ]
      },
      midway: {
        id: "midway",
        name: "Midway",
        date: "4 June 1942",
        limit: 9,
        brainJp: "seek-island",
        brainUs: "seek",
        sub: false,
        note: "Akagi, Kaga, Soryu, and Hiryu were sunk. Yorktown was lost. After this morning Japan was on the defensive.",
        briefs: {
          us: "Enterprise, Hornet, and Yorktown are northeast of Midway. Four Japanese carriers are closing from the northwest. Sink three of them. If Midway falls, or all three of your carriers do, the island is lost.",
          jp: "The First Mobile Force has Akagi, Kaga, Soryu, and Hiryu. Midway is the island in the center. Wreck the island, or sink every American carrier. Lose three of your four and Nagumo turns back."
        },
        land: [[6, 3]],
        ships: [
          cv({ id: "enterprise", name: "Enterprise", short: "ENT", side: "us", x: 11, y: 1, skill: 0.58 }),
          cv({ id: "hornet", name: "Hornet", short: "HOR", side: "us", x: 11, y: 2, skill: 0.54 }),
          cv({ id: "yorktown", name: "Yorktown", short: "YOR", side: "us", x: 10, y: 3, skill: 0.56 }),
          ship({ id: "midway", name: "Midway", short: "MID", side: "us", kind: "island", x: 6, y: 3, hull: 6, speed: 0, fighters: 2, bombers: 2, aa: 2, skill: 0.42 }),
          cv({ id: "akagi", name: "Akagi", short: "AKA", side: "jp", x: 1, y: 1, skill: 0.52 }),
          cv({ id: "kaga", name: "Kaga", short: "KAG", side: "jp", x: 2, y: 1, skill: 0.52 }),
          cv({ id: "soryu", name: "Soryu", short: "SOR", side: "jp", x: 1, y: 4, skill: 0.5 }),
          cv({ id: "hiryu", name: "Hiryu", short: "HIR", side: "jp", x: 2, y: 5, skill: 0.54 })
        ]
      },
      "eastern-solomons": {
        id: "eastern-solomons",
        name: "Eastern Solomons",
        date: "24 August 1942",
        limit: 8,
        brainJp: "seek",
        brainUs: "seek",
        sub: false,
        note: "Ryujo was sunk. Enterprise was damaged. Shokaku and Zuikaku were not found in time to be hit.",
        briefs: {
          us: "Enterprise and Saratoga are off Guadalcanal. Ryujo is detached in front of Shokaku and Zuikaku. Sink Ryujo and keep a carrier afloat. Lose both decks and the watch on the island fails.",
          jp: "Shokaku and Zuikaku stay back. Ryujo is the bait in front of them. Sink Enterprise and Saratoga. If Ryujo goes down and an American deck is still up at the end, Fletcher keeps the watch."
        },
        land: [[5, 7], [6, 7], [7, 7], [6, 6]],
        ships: [
          cv({ id: "enterprise", name: "Enterprise", short: "ENT", side: "us", x: 4, y: 5, skill: 0.56 }),
          cv({ id: "saratoga", name: "Saratoga", short: "SAR", side: "us", x: 5, y: 4, skill: 0.54 }),
          cv({ id: "shokaku", name: "Shokaku", short: "SHO", side: "jp", x: 11, y: 1, skill: 0.52 }),
          cv({ id: "zuikaku", name: "Zuikaku", short: "ZUI", side: "jp", x: 10, y: 0, skill: 0.52 }),
          cv({ id: "ryujo", name: "Ryujo", short: "RYU", side: "jp", kind: "CVL", x: 8, y: 2, skill: 0.46, hull: 3 })
        ]
      },
      "santa-cruz": {
        id: "santa-cruz",
        name: "Santa Cruz",
        date: "26 October 1942",
        limit: 7,
        brainJp: "seek",
        brainUs: "seek",
        sub: false,
        note: "Hornet was sunk and Enterprise damaged. Shokaku and Zuiho were damaged. Japan won the day and spent aircrew it could not replace.",
        briefs: {
          us: "Hornet and Enterprise face Shokaku, Zuikaku, and the light carrier Zuiho. Sink two of those three and keep one of your decks. Lose both and the day is theirs.",
          jp: "You have the larger deck count. Sink Hornet and Enterprise. Two of your three carriers on the bottom, with an American deck still up, is a defeat."
        },
        land: [],
        ships: [
          cv({ id: "hornet", name: "Hornet", short: "HOR", side: "us", x: 3, y: 5, hull: 5, skill: 0.6 }),
          cv({ id: "enterprise", name: "Enterprise", short: "ENT", side: "us", x: 4, y: 3, hull: 5, skill: 0.6 }),
          cv({ id: "shokaku", name: "Shokaku", short: "SHO", side: "jp", x: 10, y: 1, skill: 0.56 }),
          cv({ id: "zuikaku", name: "Zuikaku", short: "ZUI", side: "jp", x: 11, y: 2, skill: 0.56 }),
          cv({ id: "zuiho", name: "Zuiho", short: "ZHO", side: "jp", kind: "CVL", x: 10, y: 4, skill: 0.48 })
        ]
      },
      "philippine-sea": {
        id: "philippine-sea",
        name: "Philippine Sea",
        date: "19 June 1944",
        limit: 8,
        brainJp: "seek",
        brainUs: "seek",
        sub: true,
        note: "Ozawa's strikes were cut to pieces. Albacore sank Taiho and Cavalla sank Shokaku. The next day aircraft sank Hiyo. This battle uses Junyo in that light-carrier place on the map.",
        briefs: {
          us: "Mitscher has Enterprise, Lexington, Yorktown, and Hornet, and the fighters to shred a strike. Ozawa has Taiho, Shokaku, Zuikaku, and Junyo, with green air groups. Sink two of them. One submarine attack is yours to place, once, on a carrier you can see.",
          jp: "Your pilots are green and their fighters are thick. Taiho, Shokaku, Zuikaku, and Junyo have to land a real blow: sink two American carriers before they thin you out. A submarine is hunting your decks."
        },
        land: [],
        ships: [
          cv({ id: "enterprise", name: "Enterprise", short: "ENT", side: "us", x: 2, y: 1, fighters: 2, bombers: 3, skill: 0.62, aa: 1 }),
          cv({ id: "lexington", name: "Lexington", short: "LEX", side: "us", x: 2, y: 3, fighters: 2, bombers: 3, skill: 0.6, aa: 1 }),
          cv({ id: "yorktown", name: "Yorktown", short: "YOR", side: "us", x: 2, y: 5, fighters: 2, bombers: 3, skill: 0.6, aa: 1 }),
          cv({ id: "hornet", name: "Hornet", short: "HOR", side: "us", x: 3, y: 6, fighters: 2, bombers: 3, skill: 0.58, aa: 1 }),
          cv({ id: "taiho", name: "Taiho", short: "TAI", side: "jp", x: 11, y: 1, fighters: 2, bombers: 3, skill: 0.48 }),
          cv({ id: "shokaku", name: "Shokaku", short: "SHO", side: "jp", x: 11, y: 3, fighters: 2, bombers: 3, skill: 0.48 }),
          cv({ id: "zuikaku", name: "Zuikaku", short: "ZUI", side: "jp", x: 10, y: 5, fighters: 2, bombers: 3, skill: 0.46 }),
          cv({ id: "junyo", name: "Junyo", short: "JUN", side: "jp", x: 11, y: 6, hull: 3, fighters: 1, bombers: 2, skill: 0.4, aa: 0 })
        ]
      },
      engano: {
        id: "engano",
        name: "Cape Engaño",
        date: "25 October 1944",
        limit: 8,
        brainJp: "decoy",
        brainUs: "chase",
        sub: false,
        southLine: 6,
        note: "Ozawa's nearly empty carriers pulled Halsey north. Zuikaku, Zuiho, Chitose, and Chiyoda were sunk. While that happened, the landing in Leyte Gulf was uncovered.",
        briefs: {
          us: "Ozawa is north with Zuikaku and three light carriers, and very few planes. The beach is the south edge. A carrier of yours has to stay on the southern rows or the landing loses its cover. Sink Zuikaku and keep that cover.",
          jp: "The decks are almost empty. That is the point. Draw the American carriers off the beach until the landing fails. If Zuikaku is sunk and the beach still has cover, the decoy failed."
        },
        land: [],
        ships: [
          cv({ id: "enterprise", name: "Enterprise", short: "ENT", side: "us", x: 5, y: 7, skill: 0.62 }),
          cv({ id: "essex", name: "Essex", short: "ESS", side: "us", x: 6, y: 7, skill: 0.62 }),
          cv({ id: "lexington", name: "Lexington", short: "LEX", side: "us", x: 7, y: 6, skill: 0.6 }),
          cv({ id: "intrepid", name: "Intrepid", short: "INT", side: "us", x: 4, y: 6, skill: 0.6 }),
          cv({ id: "zuikaku", name: "Zuikaku", short: "ZUI", side: "jp", x: 6, y: 0, fighters: 1, bombers: 2, skill: 0.36, hull: 4 }),
          cv({ id: "zuiho", name: "Zuiho", short: "ZHO", side: "jp", kind: "CVL", x: 7, y: 0, fighters: 1, bombers: 1, skill: 0.3 }),
          cv({ id: "chitose", name: "Chitose", short: "CHI", side: "jp", kind: "CVL", x: 5, y: 1, fighters: 1, bombers: 1, skill: 0.28 }),
          cv({ id: "chiyoda", name: "Chiyoda", short: "CHO", side: "jp", kind: "CVL", x: 8, y: 1, fighters: 1, bombers: 1, skill: 0.28 }),
          ship({ id: "beach", name: "Leyte beach", short: "LEY", side: "us", kind: "beach", x: 8, y: 7, hull: 4, speed: 0, aa: 0, skill: 0 })
        ]
      },
      pearl: {
        id: "pearl",
        name: "Pearl Harbor",
        date: "7 December 1941",
        limit: 6,
        brainJp: "raid",
        brainUs: "harbor",
        sub: false,
        note: "Kido Butai was Akagi, Kaga, Soryu, Hiryu, Shokaku, and Zuikaku. The Pacific Fleet's carriers were not in the harbor. Arizona, Oklahoma, West Virginia, and Nevada stand here for the row.",
        briefs: {
          us: "The carriers of the Pacific Fleet are not in port. Arizona, Oklahoma, West Virginia, and Nevada are, and the airfield is surprised. Enterprise is at sea and can reach the island later. Sink a Japanese carrier, or keep three of the four battleships afloat until the raid leaves.",
          jp: "You have the six carriers, and you already know the harbor. Sink three of the four battleships. Lose a carrier and the raid has failed. The American carriers were at sea. Enterprise can show up late."
        },
        land: [[5, 5], [6, 5], [7, 5], [4, 6], [4, 7], [8, 6], [8, 7]],
        ships: [
          ship({ id: "arizona", name: "Arizona", short: "ARI", side: "us", kind: "BB", x: 6, y: 6, hull: 5, speed: 0, aa: 0, knownTo: "jp" }),
          ship({ id: "oklahoma", name: "Oklahoma", short: "OKL", side: "us", kind: "BB", x: 6, y: 7, hull: 5, speed: 0, aa: 0, knownTo: "jp" }),
          ship({ id: "west-virginia", name: "West Virginia", short: "WVA", side: "us", kind: "BB", x: 5, y: 7, hull: 5, speed: 0, aa: 0, knownTo: "jp" }),
          ship({ id: "nevada", name: "Nevada", short: "NEV", side: "us", kind: "BB", x: 7, y: 6, hull: 5, speed: 0, aa: 0, knownTo: "jp" }),
          ship({ id: "hickam", name: "Hickam", short: "HIK", side: "us", kind: "island", x: 8, y: 5, hull: 5, speed: 0, fighters: 1, fighterMax: 2, bombers: 1, bomberMax: 2, aa: 1, skill: 0.45, knownTo: "jp" }),
          cv({ id: "enterprise", name: "Enterprise", short: "ENT", side: "us", x: 0, y: 0, skill: 0.58, arrive: 3, arriveX: 0, arriveY: 3 }),
          cv({ id: "akagi", name: "Akagi", short: "AKA", side: "jp", x: 4, y: 0, bombers: 2, skill: 0.66 }),
          cv({ id: "kaga", name: "Kaga", short: "KAG", side: "jp", x: 5, y: 0, bombers: 2, skill: 0.66 }),
          cv({ id: "soryu", name: "Soryu", short: "SOR", side: "jp", x: 7, y: 0, bombers: 2, skill: 0.64 }),
          cv({ id: "hiryu", name: "Hiryu", short: "HIR", side: "jp", x: 8, y: 0, bombers: 2, skill: 0.64 }),
          cv({ id: "shokaku", name: "Shokaku", short: "SHO", side: "jp", x: 5, y: 1, bombers: 2, skill: 0.62 }),
          cv({ id: "zuikaku", name: "Zuikaku", short: "ZUI", side: "jp", x: 7, y: 1, bombers: 2, skill: 0.62 })
        ]
      }
    };
  }

  var BOOK = battles();

  function list() {
    return ["coral-sea", "midway", "eastern-solomons", "santa-cruz", "philippine-sea", "engano", "pearl"].map(function (id) {
      var b = BOOK[id];
      return { id: id, name: b.name, date: b.date };
    });
  }

  function byId(state, id) {
    for (var i = 0; i < state.ships.length; i++) {
      if (state.ships[i].id === id) return state.ships[i];
    }
    return null;
  }

  function living(state, pred) {
    return state.ships.filter(function (s) {
      return !s.sunk && !s.waiting && pred(s);
    });
  }

  function spotRange(s) {
    if (s.kind === "island") return 3;
    if (s.kind === "CV" || s.kind === "CVL") return 4;
    if (s.kind === "BB") return 2;
    return 1;
  }

  function sees(state, side, target) {
    if (!target || target.sunk || target.waiting) return false;
    if (target.side === side) return true;
    if (target.knownTo === side) return true;
    return state.ships.some(function (s) {
      return s.side === side && !s.sunk && !s.waiting && cheb(s, target) <= spotRange(s);
    });
  }

  function inBounds(x, y) {
    return x >= 0 && y >= 0 && x < COLS && y < ROWS;
  }

  function blocked(state, x, y) {
    return !inBounds(x, y) || state.land.has(key(x, y));
  }

  function say(state, line) {
    state.log.push(line);
    if (state.log.length > 8) state.log.shift();
  }

  function refresh(state) {
    var side = state.player;
    state.ships.forEach(function (s) {
      if (s.side === side || s.sunk || s.waiting) {
        if (s.side === side) s.visible = !s.waiting && !s.sunk;
        return;
      }
      if (sees(state, side, s)) {
        s.visible = true;
        s.lastX = s.x;
        s.lastY = s.y;
      } else {
        s.visible = false;
      }
    });
  }

  function start(id, side, seed) {
    var src = BOOK[id];
    if (!src) throw new Error("No such battle: " + id);
    if (side !== "us" && side !== "jp") side = "us";
    var state = {
      id: id,
      name: src.name,
      date: src.date,
      note: src.note,
      brief: src.briefs[side],
      player: side,
      turn: 1,
      limit: src.limit,
      brainJp: src.brainJp,
      brainUs: src.brainUs,
      sub: !!src.sub && side === "us",
      subUsed: false,
      subArmed: false,
      subTarget: null,
      southLine: src.southLine,
      convoyGoal: src.convoyGoal ? { x: src.convoyGoal.x, y: src.convoyGoal.y } : null,
      convoyId: null,
      land: landSet(src.land),
      ships: src.ships.map(function (s) {
        return ship(s);
      }),
      log: [],
      over: null,
      rng: mulberry32(seed == null ? 1 : seed >>> 0)
    };
    // ship() already copied numbers off the template objects. Rebuild from
    // the plain template so start() never shares a ship with the book.
    state.ships = src.ships.map(function (s) {
      return ship({
        id: s.id,
        name: s.name,
        short: s.short,
        side: s.side,
        kind: s.kind,
        x: s.x,
        y: s.y,
        hull: s.hull,
        speed: s.speed,
        fighters: s.fighters,
        bombers: s.bombers,
        aa: s.aa,
        skill: s.skill,
        arrive: s.arrive,
        arriveX: s.arriveX,
        arriveY: s.arriveY,
        knownTo: s.knownTo
      });
    });
    state.ships.forEach(function (s) {
      if (s.kind === "convoy") state.convoyId = s.id;
    });
    say(state, src.name + ". " + src.date + ".");
    refresh(state);
    return state;
  }

  function own(state, id) {
    var s = byId(state, id);
    if (!s || s.side !== state.player || s.sunk || s.waiting) return null;
    return s;
  }

  function setStrike(state, id, targetId) {
    if (state.over) return { ok: false, reason: "over" };
    var s = own(state, id);
    var target = byId(state, targetId);
    if (!s) return { ok: false, reason: "not yours" };
    if (s.bombers <= 0) return { ok: false, reason: "no bombers" };
    if (!target || target.side === s.side || target.kind === "beach") return { ok: false, reason: "bad target" };
    if (!sees(state, s.side, target)) return { ok: false, reason: "not spotted" };
    if (cheb(s, target) > STRIKE) return { ok: false, reason: "out of range" };
    s.order.strike = targetId;
    return { ok: true };
  }

  function clearStrike(state, id) {
    var s = own(state, id);
    if (!s) return { ok: false };
    s.order.strike = null;
    return { ok: true };
  }

  function setMove(state, id, x, y) {
    if (state.over) return { ok: false, reason: "over" };
    var s = own(state, id);
    if (!s) return { ok: false, reason: "not yours" };
    if (s.speed <= 0) return { ok: false, reason: "no speed" };
    if (blocked(state, x, y)) return { ok: false, reason: "blocked" };
    if (cheb(s, { x: x, y: y }) > s.speed) return { ok: false, reason: "too far" };
    s.order.move = { x: x, y: y };
    return { ok: true };
  }

  function clearMove(state, id) {
    var s = own(state, id);
    if (!s) return { ok: false };
    s.order.move = null;
    return { ok: true };
  }

  function armSub(state) {
    if (!state.sub || state.subUsed || state.over) return { ok: false };
    state.subArmed = true;
    return { ok: true };
  }

  function setSub(state, targetId) {
    if (!state.sub || state.subUsed || !state.subArmed || state.over) return { ok: false, reason: "no submarine" };
    var target = byId(state, targetId);
    if (!target || target.side !== "jp" || (target.kind !== "CV" && target.kind !== "CVL")) {
      return { ok: false, reason: "bad target" };
    }
    if (!sees(state, "us", target)) return { ok: false, reason: "not spotted" };
    state.subTarget = targetId;
    return { ok: true };
  }

  function targetValue(t, brain) {
    if (t.kind === "beach") return -1;
    if (brain === "raid") {
      if (t.kind === "BB") return 100;
      if (t.kind === "island") return 30;
      if (t.kind === "CV") return 20;
      return 5;
    }
    if (brain === "kill-convoy") {
      if (t.kind === "convoy") return 120;
      if (t.kind === "CV") return 70;
      return 10;
    }
    if (brain === "seek-island") {
      if (t.kind === "island") return 140;
      if (t.kind === "CV") return 70;
      return 10;
    }
    if (t.kind === "CV") return 100;
    if (t.kind === "CVL") return 70;
    if (t.kind === "island") return 40;
    if (t.kind === "BB") return 35;
    if (t.kind === "convoy") return 80;
    return 8;
  }

  function bestTarget(state, s, brain, assigned) {
    var best = null;
    var score = -1;
    state.ships.forEach(function (t) {
      if (t.side === s.side || t.sunk || t.waiting || t.kind === "beach") return;
      if (!sees(state, s.side, t)) return;
      if (cheb(s, t) > STRIKE) return;
      var load = assigned[t.id] || 0;
      var v = targetValue(t, brain) + (t.hullMax - t.hull) * 4 - load * 35;
      if (v > score) {
        score = v;
        best = t;
      }
    });
    return best;
  }

  function nearestSeen(state, side, brain) {
    var best = null;
    var score = -1;
    var near = 99;
    state.ships.forEach(function (t) {
      if (t.side === side || t.sunk || t.waiting || t.kind === "beach") return;
      if (!sees(state, side, t)) return;
      var v = targetValue(t, brain);
      var d = 0;
      state.ships.forEach(function (s) {
        if (s.side === side && !s.sunk && !s.waiting) d += cheb(s, t);
      });
      if (v > score || (v === score && d < near)) {
        score = v;
        near = d;
        best = t;
      }
    });
    return best;
  }

  function stepToward(state, s, tx, ty, speed) {
    var best = null;
    var bestKey = null;
    var here = cheb(s, { x: tx, y: ty });
    var y;
    var x;
    for (y = 0; y < ROWS; y++) {
      for (x = 0; x < COLS; x++) {
        var step = cheb(s, { x: x, y: y });
        if (step === 0 || step > speed) continue;
        if (blocked(state, x, y)) continue;
        if (occupants(state, x, y) >= 2) continue;
        var d = cheb({ x: x, y: y }, { x: tx, y: ty });
        if (d >= here) continue;
        var man = Math.abs(x - tx) + Math.abs(y - ty);
        var score = d * 100 + man;
        if (bestKey == null || score < bestKey) {
          bestKey = score;
          best = { x: x, y: y };
        }
      }
    }
    return best;
  }

  function occupants(state, x, y) {
    var n = 0;
    state.ships.forEach(function (s) {
      if (!s.sunk && !s.waiting && s.x === x && s.y === y) n += 1;
    });
    return n;
  }

  function planSide(state, side) {
    var brain = side === "jp" ? state.brainJp : state.brainUs;
    var seen = nearestSeen(state, side, brain);
    var assigned = {};
    state.ships.forEach(function (s) {
      if (s.side !== side || s.sunk || s.waiting) return;
      if (s.kind === "convoy" || s.kind === "beach") return;
      s.order = { strike: null, move: null };
      if (s.bombers > 0) {
        var target = bestTarget(state, s, brain, assigned);
        if (target) {
          s.order.strike = target.id;
          assigned[target.id] = (assigned[target.id] || 0) + 1;
        }
      }
      if (s.speed <= 0) return;
      var goal = null;
      if (brain === "decoy") goal = { x: s.x, y: 0 };
      else if (brain === "raid" && state.turn >= 4) goal = { x: s.x, y: 0 };
      else if (brain === "harbor" && s.kind === "BB") goal = { x: 0, y: s.y };
      else if (brain === "cover-convoy" && state.convoyId) {
        var convoy = byId(state, state.convoyId);
        if (convoy && !convoy.sunk && cheb(s, convoy) > 2) goal = convoy;
      } else if (seen) goal = seen;
      else if (brain === "seek-island") goal = { x: 6, y: 3 };
      else if (brain === "kill-convoy") goal = state.convoyGoal || { x: 8, y: 3 };
      else if (brain === "chase") goal = { x: 6, y: 1 };
      else goal = { x: 6, y: 3 };
      if (!goal) return;
      if (cheb(s, goal) === 0) return;
      var step = stepToward(state, s, goal.x, goal.y, s.speed);
      if (step) s.order.move = step;
    });
    if (side === "us" && state.sub && !state.subUsed && state.player !== "us" && state.turn >= 3) {
      var prey = null;
      var preyScore = -1;
      state.ships.forEach(function (t) {
        if (t.side !== "jp" || t.sunk || (t.kind !== "CV" && t.kind !== "CVL")) return;
        if (!sees(state, "us", t)) return;
        var v = 10 + (t.hullMax - t.hull);
        if (v > preyScore) {
          preyScore = v;
          prey = t;
        }
      });
      if (prey) state.subTarget = prey.id;
    }
  }

  function fireSub(state) {
    var target = byId(state, state.subTarget);
    state.subUsed = true;
    state.subArmed = false;
    state.subTarget = null;
    if (!target || target.sunk || target.side !== "jp") return;
    var roll = state.rng();
    if (roll < 0.45) {
      target.hull -= 2;
      say(state, "A submarine hits " + target.name + " twice.");
    } else if (roll < 0.7) {
      target.hull -= 1;
      say(state, "A submarine hits " + target.name + ".");
    } else {
      say(state, "Torpedoes miss " + target.name + ".");
    }
    if (target.hull <= 0) {
      target.hull = 0;
      target.sunk = true;
      say(state, target.name + " sinks.");
    }
  }

  function resolveStrike(state, s, target) {
    if (s.bombers <= 0 || s.sunk || s.waiting) return;
    if (target.sunk || target.kind === "beach") return;
    if (!sees(state, s.side, target) || cheb(s, target) > STRIKE) {
      say(state, s.name + " cannot find " + target.name + ".");
      return;
    }
    var incoming = s.bombers;
    var cap = target.fighters;
    var stopped = 0;
    var capLeft = cap;
    while (incoming > 0 && capLeft > 0) {
      if (state.rng() < 0.62) {
        incoming -= 1;
        stopped += 1;
      }
      capLeft -= 1;
    }
    var aa = target.aa;
    state.ships.forEach(function (other) {
      if (other === target || other.side !== target.side || other.sunk || other.waiting) return;
      if (cheb(other, target) <= 1) aa += other.aa;
    });
    if (aa > 2) aa = 2;
    var aaLeft = aa;
    while (incoming > 0 && aaLeft > 0) {
      if (state.rng() < 0.4) incoming -= 1;
      aaLeft -= 1;
    }
    var hits = 0;
    var i;
    for (i = 0; i < incoming; i++) {
      if (state.rng() < s.skill) hits += 1;
    }
    var lost = Math.min(s.bombers, Math.ceil(stopped / 2));
    if (aa > 0 && stopped < s.bombers && state.rng() < 0.35) lost = Math.min(s.bombers, lost + 1);
    s.bombers -= lost;
    if (incoming === 0) {
      say(state, "Fighters and guns break up the strike from " + s.name + ".");
      return;
    }
    target.hull -= hits;
    if (hits === 0) say(state, s.name + " strikes " + target.name + " and misses.");
    else say(state, s.name + " strikes " + target.name + " for " + hits + ".");
    if (target.hull <= 0) {
      target.hull = 0;
      target.sunk = true;
      say(state, target.name + " sinks.");
    }
  }

  function applyMoves(state) {
    var plans = [];
    state.ships.forEach(function (s) {
      if (s.sunk || s.waiting || !s.order.move || s.speed <= 0) return;
      var m = s.order.move;
      if (blocked(state, m.x, m.y) || cheb(s, m) > s.speed) return;
      plans.push({ s: s, x: m.x, y: m.y });
    });
    plans.forEach(function (plan) {
      var others = 0;
      state.ships.forEach(function (s) {
        if (s === plan.s || s.sunk || s.waiting) return;
        var x = s.x;
        var y = s.y;
        plans.forEach(function (p) {
          if (p.s === s) {
            x = p.x;
            y = p.y;
          }
        });
        if (x === plan.x && y === plan.y) others += 1;
      });
      if (others >= 2) return;
      plan.s.x = plan.x;
      plan.s.y = plan.y;
    });
  }

  function tickConvoy(state) {
    if (!state.convoyId || !state.convoyGoal || state.over) return;
    var convoy = byId(state, state.convoyId);
    if (!convoy || convoy.sunk) return;
    if (cheb(convoy, state.convoyGoal) <= 1) {
      state.over = {
        winner: "jp",
        title: "The convoy is in.",
        detail: "Port Moresby is in reach. The invasion goes ashore."
      };
      return;
    }
    var step = stepToward(state, convoy, state.convoyGoal.x, state.convoyGoal.y, 1);
    if (step) {
      convoy.x = step.x;
      convoy.y = step.y;
      say(state, "The convoy steams for the coast.");
    }
  }

  function tickBeach(state) {
    if (state.id !== "engano" || state.over) return;
    var beach = byId(state, "beach");
    if (!beach || beach.sunk) return;
    var cover = state.ships.some(function (s) {
      return s.side === "us" && !s.sunk && !s.waiting && (s.kind === "CV" || s.kind === "CVL") && s.y >= state.southLine;
    });
    if (cover) return;
    beach.hull -= 1;
    say(state, "The beach has no carrier cover. " + beach.hull + " left.");
    if (beach.hull <= 0) {
      beach.hull = 0;
      beach.sunk = true;
    }
  }

  function tickPearl(state) {
    if (state.id !== "pearl") return;
    state.ships.forEach(function (s) {
      if (s.side === "jp" && state.turn >= 2) s.knownTo = "us";
      if (state.turn < 3) return;
      if (s.kind === "BB" && s.side === "us" && !s.sunk) {
        s.aa = 1;
        s.speed = 1;
      }
    });
  }

  function arrive(state) {
    state.ships.forEach(function (s) {
      if (!s.waiting || state.turn < s.arrive) return;
      s.waiting = false;
      s.x = s.arriveX;
      s.y = s.arriveY;
      say(state, s.name + " arrives.");
    });
  }

  function recover(state) {
    state.ships.forEach(function (s) {
      if (s.sunk || s.waiting) return;
      if (s.kind !== "CV" && s.kind !== "CVL" && s.kind !== "island") return;
      s.fighters = Math.min(s.fighterMax, s.fighters + 1);
      s.bombers = Math.min(s.bomberMax, s.bombers + 1);
    });
  }

  function countKind(state, side, kinds) {
    return living(state, function (s) {
      return s.side === side && kinds.indexOf(s.kind) >= 0;
    }).length;
  }

  function outcome(state) {
    var id = state.id;
    if (id === "coral-sea") {
      var convoy = byId(state, "convoy");
      if (convoy && convoy.sunk) return { winner: "us", title: "The convoy is gone.", detail: "Port Moresby stays out of reach." };
      if (countKind(state, "jp", ["CV"]) < 2) return { winner: "us", title: "A Japanese carrier is down.", detail: "The invasion will not sail under that sky." };
      if (countKind(state, "us", ["CV"]) < 2) return { winner: "jp", title: "An American carrier is down.", detail: "The convoy still has its cover." };
      return null;
    }
    if (id === "midway") {
      var island = byId(state, "midway");
      if (countKind(state, "jp", ["CV"]) <= 1) return { winner: "us", title: "Three carriers are down.", detail: "Nagumo cannot stay." };
      var decksGone = countKind(state, "us", ["CV"]) === 0;
      var islandGone = island && island.sunk;
      if (decksGone && islandGone) return { winner: "jp", title: "Midway is open.", detail: "The island and the American decks are finished." };
      if (islandGone) return { winner: "jp", title: "Midway is open.", detail: "The island is finished." };
      if (decksGone) return { winner: "jp", title: "Midway is open.", detail: "The American decks are finished." };
      return null;
    }
    if (id === "eastern-solomons") {
      var ryujo = byId(state, "ryujo");
      if (countKind(state, "us", ["CV"]) === 0) return { winner: "jp", title: "The watch is broken.", detail: "Enterprise and Saratoga are both gone." };
      if (ryujo && ryujo.sunk && countKind(state, "us", ["CV"]) >= 1) {
        return { winner: "us", title: "Ryujo is down.", detail: "An American deck is still on the watch." };
      }
      return null;
    }
    if (id === "santa-cruz") {
      if (countKind(state, "us", ["CV"]) === 0) return { winner: "jp", title: "Both American decks are gone.", detail: "The day belongs to the larger force." };
      if (countKind(state, "jp", ["CV", "CVL"]) <= 1 && countKind(state, "us", ["CV"]) >= 1) {
        return { winner: "us", title: "Two of theirs are down.", detail: "You still have a deck." };
      }
      return null;
    }
    if (id === "philippine-sea") {
      var jpDown = 4 - countKind(state, "jp", ["CV", "CVL"]);
      var usDown = 4 - countKind(state, "us", ["CV"]);
      if (jpDown >= 2 && jpDown >= usDown) return { winner: "us", title: "Two of Ozawa's decks are gone.", detail: "The strikes did not get through in time." };
      if (usDown >= 2) return { winner: "jp", title: "Two American decks are gone.", detail: "The green pilots landed the blow." };
      return null;
    }
    if (id === "engano") {
      var beach = byId(state, "beach");
      var zuikaku = byId(state, "zuikaku");
      if (countKind(state, "us", ["CV"]) === 0) return { winner: "jp", title: "Halsey's decks are gone.", detail: "The decoy did more than pull them." };
      if (beach && beach.sunk && zuikaku && zuikaku.sunk) {
        return { winner: "draw", title: "Halsey's run.", detail: "Zuikaku is sunk. The beach had no cover." };
      }
      if (beach && beach.sunk) return { winner: "jp", title: "The decoy worked.", detail: "The carriers drew the cover off Leyte." };
      if (zuikaku && zuikaku.sunk && beach && !beach.sunk) {
        return { winner: "us", title: "The bait is sunk.", detail: "Zuikaku is down, and a carrier still covers the beach." };
      }
      return null;
    }
    if (id === "pearl") {
      var bbDown = state.ships.filter(function (s) { return s.kind === "BB" && s.sunk; }).length;
      var jpDown = countKind(state, "jp", ["CV"]) < 6;
      if (jpDown) return { winner: "us", title: "A carrier is lost.", detail: "The raid cannot pay that price." };
      if (bbDown >= 3) return { winner: "jp", title: "The row is wrecked.", detail: "Three battleships are down, and the carriers are leaving." };
      return null;
    }
    return null;
  }

  function timeLimit(state) {
    var id = state.id;
    if (id === "coral-sea") {
      var left = byId(state, "convoy");
      if (left && !left.sunk && countKind(state, "jp", ["CV"]) > 0) {
        return { winner: "jp", title: "The invasion is not stopped.", detail: "The convoy is still at sea, and a Japanese carrier is still up." };
      }
      return { winner: "us", title: "The invasion turns back.", detail: "There is no cover left for Port Moresby." };
    }
    if (id === "midway") {
      var island = byId(state, "midway");
      if (island && !island.sunk) return { winner: "us", title: "Japan retires.", detail: "Midway is still there." };
      return { winner: "jp", title: "The island is silent.", detail: "There is nothing left to defend." };
    }
    if (id === "eastern-solomons") {
      var ryujo = byId(state, "ryujo");
      if (ryujo && ryujo.sunk) return { winner: "us", title: "The bait is gone.", detail: "The rest of the force slips off." };
      return { winner: "jp", title: "Ryujo gets away.", detail: "Fletcher never pinned the light carrier." };
    }
    if (id === "santa-cruz") {
      var usHull = 0;
      var jpHull = 0;
      state.ships.forEach(function (s) {
        if (s.sunk || (s.kind !== "CV" && s.kind !== "CVL")) return;
        if (s.side === "us") usHull += s.hull;
        else jpHull += s.hull;
      });
      if (usHull > jpHull) return { winner: "us", title: "You still have more ship.", detail: "The day ends with your decks in better shape." };
      if (jpHull > usHull) return { winner: "jp", title: "They still have more ship.", detail: "The day ends with their decks in better shape." };
      return { winner: "draw", title: "Both sides sheer off.", detail: "Neither fleet can claim the day." };
    }
    if (id === "philippine-sea") {
      var usB = 0;
      var jpB = 0;
      state.ships.forEach(function (s) {
        if (s.sunk || s.waiting) return;
        if (s.side === "us") usB += s.bombers + s.fighters;
        else jpB += s.bombers + s.fighters;
      });
      if (usB >= jpB) return { winner: "us", title: "The air battle is over.", detail: "Ozawa no longer has the planes." };
      return { winner: "jp", title: "The blow landed.", detail: "Enough of the strike got through." };
    }
    if (id === "engano") {
      var beach = byId(state, "beach");
      var zuikaku = byId(state, "zuikaku");
      if (beach && !beach.sunk && zuikaku && !zuikaku.sunk) {
        return { winner: "us", title: "The beach holds.", detail: "Ozawa is still out there. The landing kept its cover." };
      }
      return outcome(state) || { winner: "draw", title: "The day ends.", detail: "Neither order was finished." };
    }
    if (id === "pearl") {
      var bbDown = state.ships.filter(function (s) { return s.kind === "BB" && s.sunk; }).length;
      if (bbDown >= 3) return { winner: "jp", title: "The row is wrecked.", detail: "The carriers turn north." };
      return { winner: "us", title: "The raid is over.", detail: "Three battleships are still afloat. The American carriers were never in port." };
    }
    return { winner: "draw", title: "Time.", detail: "Both fleets break off." };
  }

  function clearOrders(state) {
    state.ships.forEach(function (s) {
      s.order = { strike: null, move: null };
    });
  }

  function finish(state) {
    if (state.over) return state;
    if (state.subTarget && !state.subUsed) fireSub(state);
    var strikes = state.ships.filter(function (s) {
      return s.order.strike && !s.sunk && !s.waiting;
    });
    strikes.sort(function (a, b) {
      if (b.skill !== a.skill) return b.skill - a.skill;
      return a.id < b.id ? -1 : 1;
    });
    strikes.forEach(function (s) {
      var target = byId(state, s.order.strike);
      if (!target) return;
      resolveStrike(state, s, target);
    });
    applyMoves(state);
    tickConvoy(state);
    tickBeach(state);
    if (!state.over) {
      var now = outcome(state);
      if (now) state.over = now;
    }
    tickPearl(state);
    recover(state);
    clearOrders(state);
    if (!state.over) {
      state.turn += 1;
      arrive(state);
      if (state.turn > state.limit) state.over = timeLimit(state);
    }
    refresh(state);
    return state;
  }

  function commit(state) {
    if (state.over) return state;
    var enemy = state.player === "us" ? "jp" : "us";
    planSide(state, enemy);
    return finish(state);
  }

  root.CarrierRules = {
    COLS: COLS,
    ROWS: ROWS,
    STRIKE: STRIKE,
    list: list,
    start: start,
    sees: sees,
    spotRange: spotRange,
    setStrike: setStrike,
    clearStrike: clearStrike,
    setMove: setMove,
    clearMove: clearMove,
    armSub: armSub,
    setSub: setSub,
    planSide: planSide,
    finish: finish,
    commit: commit,
    outcome: outcome,
    byId: byId,
    cheb: cheb,
    book: function () { return BOOK; }
  };
})(typeof window !== "undefined" ? window : globalThis);
