// Flight, combat, trade, and docking. Cash and prices are tenths of a credit.
(function (root) {
  "use strict";

  const WORLD = 14;
  const SCAN = 5200;
  const SAFE = 2300;
  const ARRIVE = 9200;
  const PLAYER_R = 12;
  const MAX_SPEED = 36;

  function create() {
    const math = root.EliteMath;
    const G = root.EliteGalaxy;
    const Ships = root.EliteShips;
    const ST = Ships.STATION;
    let seq = 1;
    const state = blank();

    function blank() {
      return {
        name: "JAMESON",
        cash: 1000,
        fuel: G.MAX_FUEL,
        galaxy: 1,
        system: G.LAVE,
        dest: G.LAVE,
        cargo: zeroCargo(),
        hold: 20,
        lasers: { front: "pulse", rear: null, left: null, right: null },
        missiles: 0,
        ecm: false,
        scoop: false,
        pod: false,
        bomb: false,
        energyUnit: false,
        dockingComputer: false,
        galdrive: false,
        legal: 0,
        kills: 0,
        rank: 0,
        trumbles: 0,
        mission: null,
        offer: null,
        pendingLaser: null,
        market: null,
        docked: true,
        witch: false,
        witchCool: 0,
        hyper: 0,
        hyperDist: 0,
        galHyper: 0,
        autoDock: false,
        dead: false,
        podTimer: 0,
        log: [],
        events: [],
        ships: [],
        bolts: [],
        fx: [],
        planet: null,
        sun: null,
        station: null,
        stars: null,
        orbit: 1400,
        orbitAng: 0,
        stationSpin: 0,
        time: 0,
        scanTimer: 5,
        spawnTimer: 18,
        trumbleTimer: 45,
        scrapeTimer: 0,
        ecmCool: 0,
        altWarn: false,
        player: freshPilot()
      };
    }
    function freshPilot() {
      return {
        pos: [0, 0, 0], q: math.qId(), speed: 0, view: "front", compass: "station",
        fore: 200, aft: 200, energy: 200, heat: 0, cabin: 0,
        laserCool: 0, flash: 0, armed: false, target: 0, dead: false
      };
    }
    function zeroCargo() {
      const cargo = [];
      for (let i = 0; i < 17; i += 1) cargo.push(0);
      return cargo;
    }
    function say(text) {
      state.log.unshift({ text: text, life: 5.5 });
      if (state.log.length > 5) state.log.pop();
    }
    function event(name) {
      state.events.push(name);
    }
    function drainEvents() {
      const list = state.events.slice();
      state.events.length = 0;
      return list;
    }
    function galaxy() {
      return G.galaxies()[state.galaxy - 1];
    }
    function current() {
      return galaxy()[state.system];
    }
    function holdUsed() {
      let n = 0;
      for (let i = 0; i < 17; i += 1) n += state.cargo[i];
      n += Math.ceil(state.trumbles / 2);
      return n;
    }
    function reserved(good) {
      if (!state.mission || state.mission.type !== "deliver" || state.mission.good !== good) return 0;
      return state.mission.amount;
    }
    function outwardOf(station) {
      return math.scale(math.basis(station.q).forward, -1);
    }
    function placeStation(dt) {
      state.orbitAng += dt * 0.022;
      state.stationSpin += dt * 0.52;
      const pos = [Math.cos(state.orbitAng) * state.orbit, 60, Math.sin(state.orbitAng) * state.orbit];
      const outward = math.norm(pos);
      let q = math.qLook(math.scale(outward, -1), [0, 1, 0]);
      q = math.qLocal(q, 0, 0, state.stationSpin);
      state.station = { pos: pos, q: q };
    }
    function buildLocal() {
      const sys = current();
      const planetR = 340 + ((sys.radius - 2816) / (6911 - 2816)) * 190;
      state.planet = { pos: [0, 0, 0], radius: planetR, system: sys };
      state.orbit = planetR + 1080;
      state.orbitAng = ((sys.x * 13 + sys.y * 3) % 628) / 100;
      state.stationSpin = (sys.goat.c % 50) / 8;
      placeStation(0);
      state.sun = {
        pos: [((sys.goat.d % 5) - 2) * 3200, 1600 + (sys.goat.a % 4) * 500, -19000 - (sys.goat.b % 6) * 800],
        radius: 880
      };
      state.ships = [];
      state.bolts = [];
      state.fx = [];
      state.stars = root.EliteView.makeStars(sys);
      state.witch = false;
    }
    function shell(min, max) {
      const dir = math.norm([Math.random() - 0.5, (Math.random() - 0.5) * 0.5, Math.random() - 0.5]);
      let pos = math.add(state.player.pos, math.scale(dir, min + Math.random() * (max - min)));
      if (state.planet && math.len(pos) < state.planet.radius + 250) {
        pos = math.scale(math.norm(pos.length ? pos : [1, 0, 0]), state.planet.radius + 500);
      }
      return pos;
    }
    function tintFor(role) {
      if (role === "pirate") return [1.2, 0.58, 0.5];
      if (role === "trader") return [0.82, 0.88, 1];
      if (role === "police") return [0.7, 0.86, 1.2];
      if (role === "hunter") return [1.1, 0.86, 0.5];
      if (role === "thargoid") return [0.65, 1.15, 0.6];
      return [0.9, 0.9, 0.92];
    }
    function spawn(kind, role, pos, q) {
      const spec = Ships.SHIPS[kind];
      const ship = {
        id: seq++,
        kind: kind,
        role: role,
        spec: spec,
        pos: pos.slice(),
        q: q || math.qId(),
        speed: spec.speed * 0.45,
        energy: spec.hull,
        radius: spec.radius,
        ai: role === "trader" ? "trade" : role === "police" ? "patrol" : role === "asteroid" ? "drift" : role === "canister" || role === "pod" ? "drift" : "attack",
        target: "player",
        hostile: role === "pirate" || role === "thargoid" || role === "hunter",
        cool: 0.6 + Math.random(),
        missileCool: 5 + Math.random() * 6,
        droneCool: 6,
        bounty: spec.bounty,
        cargoLeft: spec.cargo,
        missiles: spec.missiles,
        variant: (Math.random() * 3) | 0,
        tint: tintFor(role),
        gone: false,
        good: 12,
        owner: null,
        mission: false,
        fleeDump: false
      };
      state.ships.push(ship);
      return ship;
    }
    function lookAt(from, to) {
      return math.qLook(math.norm(math.sub(to, from)), [0, 1, 0]);
    }
    function populate() {
      const gov = current().gov;
      const pirates = [7, 5, 3, 2, 2, 1, 0, 0][gov];
      const police = [0, 0, 1, 1, 2, 3, 3, 4][gov];
      for (let i = 0; i < 3; i += 1) {
        const pos = shell(1800, 4200);
        spawn(Ships.traderKind(Math.random), "trader", pos, lookAt(pos, state.station.pos));
      }
      for (let i = 0; i < police; i += 1) {
        const pos = math.add(state.station.pos, shell(400, 900).map(function (n, idx) { return n * 0 + (Math.random() - 0.5) * 800; }));
        const ship = spawn("viper", "police", pos, math.qId());
        if (state.legal >= 50) {
          ship.hostile = true;
          ship.ai = "attack";
        }
      }
      for (let i = 0; i < pirates; i += 1) spawnPirate();
      for (let i = 0; i < 8; i += 1) {
        const pos = shell(1500, 5000);
        const rock = spawn("asteroid", "asteroid", pos, math.qId());
        rock.radius = 12 + Math.random() * 16;
        rock.energy = 28 + rock.radius;
        rock.speed = 2 + Math.random() * 4;
      }
      if (state.legal >= 16) spawnHunter();
      ensureMission();
    }
    function spawnPirate() {
      const pos = shell(2600, 5200);
      if (state.station && math.len(math.sub(pos, state.station.pos)) < SAFE) return;
      spawn(Ships.pirateKind(current().gov, Math.random), "pirate", pos, lookAt(pos, state.player.pos));
    }
    function spawnHunter() {
      const pos = shell(3000, 4800);
      const kind = Math.random() < 0.5 ? "ferdelance" : "viper";
      spawn(kind, "hunter", pos, lookAt(pos, state.player.pos));
    }
    function ensureMission() {
      const mission = state.mission;
      if (!mission || mission.type !== "hunt" || mission.dest !== state.system) return;
      if (state.ships.some(function (ship) { return ship.mission && !ship.gone; })) return;
      const pos = shell(2200, 3800);
      const ship = spawn(mission.ship, "pirate", pos, lookAt(pos, state.player.pos));
      ship.mission = true;
      ship.bounty = mission.reward;
      ship.energy = Math.floor(ship.energy * 1.35);
      ship.tint = [1, 0.35, 0.85];
      say(mission.who + " IS IN THIS SYSTEM");
    }
    function resetPilotVitals() {
      const view = state.player.view;
      const compass = state.player.compass;
      state.player = freshPilot();
      state.player.view = view || "front";
      state.player.compass = compass || "station";
    }
    function newCommander(name) {
      const next = blank();
      Object.keys(next).forEach(function (key) { state[key] = next[key]; });
      state.name = (name || "JAMESON").toUpperCase().replace(/[^A-Z ]/g, "").slice(0, 8) || "JAMESON";
      buildLocal();
      state.market = G.genMarket(0, current());
      state.offer = rollOffer();
      state.docked = true;
      say("DOCKED AT " + current().name);
    }
    function applyCommander(data) {
      newCommander(data.name);
      state.cash = data.cash;
      state.fuel = data.fuel;
      state.galaxy = data.galaxy;
      state.system = data.system;
      state.dest = data.dest;
      state.cargo = data.cargo.slice();
      state.hold = data.hold;
      state.lasers = {
        front: data.lasers.front, rear: data.lasers.rear,
        left: data.lasers.left, right: data.lasers.right
      };
      state.missiles = data.missiles;
      state.ecm = data.ecm;
      state.scoop = data.scoop;
      state.pod = data.pod;
      state.bomb = data.bomb;
      state.energyUnit = data.energyUnit;
      state.dockingComputer = data.dockingComputer;
      state.galdrive = data.galdrive;
      state.legal = data.legal;
      state.kills = data.kills;
      state.rank = G.ratingIndex(data.kills);
      state.trumbles = data.trumbles || 0;
      state.mission = data.mission || null;
      state.offer = data.offer || null;
      buildLocal();
      state.market = data.market || G.genMarket(0, current());
      state.player.fore = data.fore != null ? data.fore : 200;
      state.player.aft = data.aft != null ? data.aft : 200;
      state.player.energy = data.energy != null ? data.energy : 200;
      state.docked = true;
      state.dead = false;
    }
    function snapshot() {
      return {
        v: 1,
        name: state.name, cash: state.cash, fuel: state.fuel,
        galaxy: state.galaxy, system: state.system, dest: state.dest,
        cargo: state.cargo.slice(), hold: state.hold,
        lasers: {
          front: state.lasers.front, rear: state.lasers.rear,
          left: state.lasers.left, right: state.lasers.right
        },
        missiles: state.missiles, ecm: state.ecm, scoop: state.scoop, pod: state.pod,
        bomb: state.bomb, energyUnit: state.energyUnit,
        dockingComputer: state.dockingComputer, galdrive: state.galdrive,
        legal: state.legal, kills: state.kills, trumbles: state.trumbles,
        mission: state.mission, offer: state.offer,
        market: {
          fluct: state.market.fluct,
          quantity: state.market.quantity.slice(),
          price: state.market.price.slice()
        },
        fore: state.player.fore, aft: state.player.aft, energy: state.player.energy
      };
    }
    function rollOffer() {
      const systems = galaxy();
      const near = G.neighbors(systems, state.system, 70).filter(function (n) { return n.index !== state.system; });
      if (!near.length || Math.random() > 0.62) return null;
      const dest = near[(Math.random() * near.length) | 0].index;
      if (state.kills >= 8 && Math.random() < 0.45) {
        const names = ["CORVUS", "DRAKE", "HEX", "VEX", "NYX", "KAEL", "SABLE", "ROOK"];
        const kinds = ["ferdelance", "python", "asp", "cobra3"];
        return {
          type: "hunt",
          dest: dest,
          reward: 4000 + ((Math.random() * 6000) | 0),
          ship: kinds[(Math.random() * kinds.length) | 0],
          who: names[(Math.random() * names.length) | 0]
        };
      }
      const goods = [0, 1, 4, 11, 12];
      const good = goods[(Math.random() * goods.length) | 0];
      const amount = 2 + ((Math.random() * 4) | 0);
      if (state.hold - holdUsed() < amount) return null;
      const quote = G.genMarket(0, systems[dest]);
      return {
        type: "deliver",
        dest: dest,
        good: good,
        amount: amount,
        reward: Math.max(1000, amount * quote.price[good] + 1500)
      };
    }
    function launch() {
      if (!state.docked || state.dead || state.player.dead) return false;
      const out = outwardOf(state.station);
      state.player.pos = math.add(state.station.pos, math.scale(out, ST.face + 120));
      state.player.q = math.qLook(out, [0, 1, 0]);
      state.player.speed = 12;
      state.player.view = "front";
      state.docked = false;
      state.autoDock = false;
      if (!state.ships.length) populate();
      ensureMission();
      event("launch");
      say("LAUNCH");
      return true;
    }
    function dock() {
      state.docked = true;
      state.autoDock = false;
      state.hyper = 0;
      state.galHyper = 0;
      state.player.speed = 0;
      state.player.armed = false;
      event("waltz-stop");
      event("dock");
      say("DOCKED AT " + current().name);
      const mission = state.mission;
      if (mission && mission.type === "deliver" && mission.dest === state.system) {
        if (state.cargo[mission.good] >= mission.amount) {
          state.cargo[mission.good] -= mission.amount;
          state.cash += mission.reward;
          state.mission = null;
          say("CONTRACT COMPLETE");
          event("buy");
        } else {
          state.mission = null;
          say("CONTRACT FAILED");
          event("deny");
        }
      }
      if (!state.mission && !state.offer) state.offer = rollOffer();
      event("save");
    }
    function crime(ship) {
      return ship.role === "trader" || ship.role === "police";
    }
    function noteKill() {
      state.kills += 1;
      const rank = G.ratingIndex(state.kills);
      if (rank > state.rank) {
        state.rank = rank;
        say("RIGHT ON COMMANDER");
        event("fanfare");
      }
    }
    function boom(pos, color, count, speed) {
      for (let i = 0; i < count; i += 1) {
        const vel = [(Math.random() - 0.5) * speed, (Math.random() - 0.5) * speed, (Math.random() - 0.5) * speed];
        const life = 0.35 + Math.random() * 0.45;
        state.fx.push({ pos: pos.slice(), vel: vel, life: life, max: life, size: 2 + Math.random() * 5, color: color });
      }
    }
    function destroyShip(ship, byPlayer) {
      if (ship.gone) return;
      ship.gone = true;
      boom(ship.pos, ship.tint, ship.radius > 25 ? 16 : 8, 80);
      event("explosion");
      if (byPlayer && ship.kind !== "missile" && ship.kind !== "canister" && ship.kind !== "pod" && ship.kind !== "asteroid") {
        noteKill();
        if (crime(ship)) {
          state.legal = Math.max(state.legal, 64);
          say("FUGITIVE");
          aggroPolice();
          event("alarm");
        } else if (ship.mission && state.mission && state.mission.type === "hunt") {
          state.cash += ship.bounty;
          state.mission = null;
          say("CONTRACT COMPLETE");
        } else if (ship.bounty > 0) {
          state.cash += ship.bounty;
          say("BOUNTY " + G.cashText(ship.bounty));
        }
      }
      if (ship.kind === "asteroid") {
        const n = 1 + ((Math.random() * 3) | 0);
        for (let i = 0; i < n; i += 1) dropCan(ship.pos, mineralGood(), false);
      } else if (ship.cargoLeft > 0 && ship.kind !== "missile") {
        const n = Math.min(ship.cargoLeft, 1 + ((Math.random() * 3) | 0));
        for (let i = 0; i < n; i += 1) dropCan(ship.pos, lootGood(ship), Math.random() < 0.04);
        if (Math.random() < 0.35 && ship.role === "trader") dropPod(ship.pos);
      }
      if (ship.kind === "thargoid") {
        dropCan(ship.pos, 16, false);
        if (Math.random() < 0.5) dropCan(ship.pos, 16, false);
      }
    }
    function mineralGood() {
      const r = Math.random();
      if (r < 0.08) return 15;
      if (r < 0.2) return 14;
      if (r < 0.35) return 13;
      return 12;
    }
    function lootGood(ship) {
      if (ship.role === "pirate") return Math.random() < 0.3 ? 10 : mineralGood();
      return [0, 1, 7, 8, 12][(Math.random() * 5) | 0];
    }
    function dropCan(pos, good, trumble) {
      const can = spawn("canister", "canister", math.add(pos, [(Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20]), math.qId());
      can.good = good;
      can.trumble = trumble;
      can.speed = 6 + Math.random() * 8;
      can.ai = "drift";
      can.tint = trumble ? [0.9, 0.7, 0.3] : [0.4, 0.8, 0.45];
    }
    function dropPod(pos) {
      const pod = spawn("pod", "pod", pos, math.qId());
      pod.speed = 14;
      pod.ai = "drift";
    }
    function aggroPolice() {
      for (let i = 0; i < state.ships.length; i += 1) {
        const ship = state.ships[i];
        if (ship.role === "police" && !ship.gone) {
          ship.hostile = true;
          ship.ai = "attack";
          ship.target = "player";
        }
      }
    }
    function hurt(amount, from) {
      if (state.player.dead || state.docked) return;
      const to = math.norm(math.sub(from, state.player.pos));
      const front = math.dot(to, math.basis(state.player.q).forward);
      let left = amount;
      if (front >= 0) {
        const take = Math.min(state.player.fore, left);
        state.player.fore -= take;
        left -= take;
      } else {
        const take = Math.min(state.player.aft, left);
        state.player.aft -= take;
        left -= take;
      }
      if (left > 0) state.player.energy -= left;
      state.player.flash = 0.22;
      event("hit");
      if (state.player.energy <= 0) die();
    }
    function playerHit(ship, dmg) {
      if (ship.gone) return;
      if (crime(ship) && !ship.hostile) {
        if (state.legal < 16) {
          state.legal = 16;
          say("OFFENDER");
          event("alarm");
        }
        aggroPolice();
      }
      if (ship.role === "trader") {
        ship.ai = "flee";
        ship.fleeDump = true;
        ship.hostile = true;
      }
      ship.energy -= dmg;
      if (ship.energy <= 0) destroyShip(ship, true);
    }
    function die() {
      if (state.player.dead) return;
      state.player.dead = true;
      state.autoDock = false;
      state.hyper = 0;
      boom(state.player.pos, [1, 0.6, 0.2], 22, 140);
      event("explosion");
      if (state.pod) {
        state.podTimer = 1.6;
        say("ESCAPE POD LAUNCHED");
      } else {
        state.dead = true;
        event("dead");
        say("GAME OVER");
      }
    }
    function stockShip() {
      state.cargo = zeroCargo();
      state.hold = 20;
      state.lasers = { front: "pulse", rear: null, left: null, right: null };
      state.missiles = 0;
      state.ecm = false;
      state.scoop = false;
      state.pod = false;
      state.bomb = false;
      state.energyUnit = false;
      state.dockingComputer = false;
      state.galdrive = false;
      state.trumbles = 0;
      state.fuel = G.MAX_FUEL;
      state.legal = state.legal >> 1;
      resetPilotVitals();
    }
    function rescue() {
      if (state.witch) {
        state.system = state.dest;
        state.witch = false;
      }
      stockShip();
      buildLocal();
      state.market = G.genMarket((Math.random() * 256) | 0, current());
      state.docked = true;
      state.dead = false;
      state.player.dead = false;
      say("A NEW COBRA. DOCKED AT " + current().name);
      event("save");
    }
    function raySphere(origin, dir, center, radius) {
      const oc = math.sub(origin, center);
      const b = math.dot(oc, dir);
      const c = math.dot(oc, oc) - radius * radius;
      const h = b * b - c;
      if (h < 0) return null;
      const s = Math.sqrt(h);
      const t0 = -b - s;
      if (t0 > 1) return t0;
      const t1 = -b + s;
      if (t1 > 1) return t1;
      return null;
    }
    function stationLocal(point) {
      return math.qInvRot(state.station.q, math.sub(point, state.station.pos));
    }
    function inSlot(local) {
      return Math.abs(local[0]) < ST.halfW && Math.abs(local[1]) < ST.halfH && local[2] > 16 && local[2] < ST.face + 80;
    }
    function hullHit(local) {
      if (inSlot(local)) return false;
      const radial = Math.hypot(local[0], local[1]);
      return radial < ST.radius + 6 && local[2] > ST.back && local[2] < ST.face;
    }
    function raycast(origin, dir, range, ignoreId) {
      let bestT = range;
      let best = null;
      for (let i = 0; i < state.ships.length; i += 1) {
        const ship = state.ships[i];
        if (ship.gone || ship.id === ignoreId || ship.kind === "canister" || ship.kind === "pod") continue;
        const t = raySphere(origin, dir, ship.pos, ship.radius);
        if (t != null && t < bestT) {
          bestT = t;
          best = { t: t, ship: ship };
        }
      }
      const playerT = raySphere(origin, dir, state.player.pos, PLAYER_R);
      if (playerT != null && playerT < bestT) best = { t: playerT, player: true };
      if (state.station) {
        for (let t = 8; t < bestT; t += 16) {
          const point = math.add(origin, math.scale(dir, t));
          if (hullHit(stationLocal(point))) {
            best = { t: t, station: true };
            break;
          }
        }
      }
      return best;
    }
    function viewForward() {
      const q = root.EliteView.viewQuat(state.player.q, state.player.view);
      return math.basis(q).forward;
    }
    function fireLaser(edge) {
      const mount = state.player.view;
      const type = state.lasers[mount];
      if (!type) {
        if (edge) say("NO LASER");
        return;
      }
      const spec = Ships.LASERS[type];
      if (state.player.laserCool > 0) return;
      if (state.player.heat > 228) {
        if (edge) say("LASER TEMPERATURE");
        return;
      }
      if (state.player.energy < spec.energy) {
        if (edge) say("ENERGY LOW");
        return;
      }
      state.player.laserCool = spec.cool;
      state.player.heat = Math.min(255, state.player.heat + spec.heat);
      state.player.energy -= spec.energy;
      const dir = viewForward();
      const origin = math.add(state.player.pos, math.scale(dir, 8));
      const hit = raycast(origin, dir, spec.range, null);
      const reach = hit ? hit.t : spec.range * 0.65;
      state.bolts.push({
        a: origin,
        b: math.add(origin, math.scale(dir, reach)),
        color: spec.color,
        life: 0.07,
        width: type === "beam" ? 0.45 : 0.85
      });
      event(type === "mining" ? "mining" : type === "military" ? "military" : type === "beam" ? "beam" : "laser");
      if (hit && hit.ship) {
        let dmg = spec.damage;
        if (hit.ship.kind === "asteroid") dmg = spec.mine || Math.max(4, spec.damage * 0.4);
        if (hit.ship.kind === "missile") {
          hit.ship.gone = true;
          boom(hit.ship.pos, [1, 0.8, 0.4], 4, 40);
        } else playerHit(hit.ship, dmg);
      }
    }
    function npcShoot(ship, aim, dist) {
      if (ship.spec.damage <= 0 || ship.cool > 0) return;
      const forward = math.basis(ship.q).forward;
      if (math.dot(forward, aim) < 0.97 || dist > ship.spec.range) return;
      ship.cool = ship.spec.cool * (0.85 + Math.random() * 0.4);
      const origin = math.add(ship.pos, math.scale(forward, ship.radius + 3));
      const wobble = math.norm(math.add(forward, [(Math.random() - 0.5) * 0.04, (Math.random() - 0.5) * 0.04, (Math.random() - 0.5) * 0.04]));
      const hit = raycast(origin, wobble, ship.spec.range, ship.id);
      const reach = hit ? hit.t : Math.min(dist, ship.spec.range);
      state.bolts.push({
        a: origin,
        b: math.add(origin, math.scale(wobble, reach)),
        color: ship.alien || ship.kind === "thargoid" || ship.kind === "thargon" ? [0.5, 1, 0.4] : [1, 0.4, 0.28],
        life: 0.08,
        width: 0.7
      });
      if (hit && hit.player) hurt(ship.spec.damage, ship.pos);
      else if (hit && hit.ship && hit.ship.kind !== "asteroid") {
        hit.ship.energy -= ship.spec.damage * 0.55;
        if (hit.ship.role === "trader") {
          hit.ship.ai = "flee";
          hit.ship.fleeDump = true;
        }
        if (hit.ship.energy <= 0) destroyShip(hit.ship, false);
      }
    }
    function resolve(target) {
      if (target === "player") return { pos: state.player.pos, radius: PLAYER_R, player: true };
      for (let i = 0; i < state.ships.length; i += 1) {
        if (state.ships[i].id === target && !state.ships[i].gone) return state.ships[i];
      }
      return null;
    }
    function steerShip(ship, dt) {
      if (ship.gone) return;
      let aim = null;
      let want = ship.spec.speed;
      if (ship.ai === "drift") {
        ship.q = math.qLocal(ship.q, dt * 0.3, dt * 0.2, dt * 0.1);
      } else if (ship.ai === "missile") {
        const tgt = resolve(ship.target);
        if (!tgt) {
          ship.gone = true;
          return;
        }
        const delta = math.sub(tgt.pos, ship.pos);
        const dist = math.len(delta);
        aim = math.norm(delta);
        want = 50;
        if (dist < tgt.radius + 8) {
          if (tgt.player) hurt(ship.spec.damage, ship.pos);
          else if (ship.owner === "player") playerHit(tgt, ship.spec.damage);
          else {
            tgt.energy -= ship.spec.damage;
            if (tgt.energy <= 0) destroyShip(tgt, false);
          }
          boom(ship.pos, [1, 0.7, 0.3], 6, 50);
          ship.gone = true;
          event("explosion");
          return;
        }
      } else if (ship.ai === "trade") {
        if (!state.station) ship.ai = "leave";
        else {
          const delta = math.sub(state.station.pos, ship.pos);
          if (math.len(delta) < 200) {
            ship.gone = true;
            return;
          }
          aim = math.norm(delta);
          want = ship.spec.speed * 0.7;
        }
      } else if (ship.ai === "flee") {
        aim = math.norm(math.sub(ship.pos, state.player.pos));
        want = ship.spec.speed;
        if (ship.fleeDump && ship.cargoLeft > 0) {
          dropCan(ship.pos, lootGood(ship), false);
          ship.cargoLeft -= 1;
          ship.fleeDump = false;
          say("CARGO JETTISONED");
        }
      } else if (ship.ai === "patrol") {
        if (state.legal >= 50) {
          ship.hostile = true;
          ship.ai = "attack";
        } else if (state.station) {
          const away = math.norm(math.sub(ship.pos, state.station.pos));
          aim = math.norm([-away[2], 0, away[0]]);
          want = 14;
          if (math.len(math.sub(ship.pos, state.station.pos)) > 1600) aim = math.norm(math.sub(state.station.pos, ship.pos));
        }
      } else if (ship.ai === "leave") {
        aim = math.norm(ship.pos[0] || ship.pos[2] ? ship.pos : [1, 0, 0]);
        want = ship.spec.speed;
        if (math.len(ship.pos) > 14000) ship.gone = true;
      } else {
        const tgt = ship.target === "player" ? { pos: state.player.pos, radius: PLAYER_R } : resolve(ship.target);
        if (!tgt) {
          ship.ai = "patrol";
          return;
        }
        const delta = math.sub(tgt.pos, ship.pos);
        const dist = math.len(delta);
        aim = math.norm(delta);
        want = dist > 700 ? ship.spec.speed : ship.spec.speed * 0.5;
        if (ship.role === "pirate" && state.station && math.len(math.sub(ship.pos, state.station.pos)) < SAFE && ship.target === "player") {
          ship.ai = "leave";
        } else {
          npcShoot(ship, aim, dist);
          if (ship.missiles > 0 && ship.missileCool <= 0 && dist < 2000 && math.dot(math.basis(ship.q).forward, aim) > 0.92) {
            ship.missiles -= 1;
            ship.missileCool = 12;
            const missile = spawn("missile", "missile", math.add(ship.pos, math.scale(aim, ship.radius + 8)), ship.q);
            missile.ai = "missile";
            missile.target = ship.target;
            missile.owner = ship.role;
            missile.speed = 28;
            missile.tint = [1, 0.85, 0.45];
            if (ship.target === "player") {
              say("INCOMING MISSILE");
              event("alarm");
            }
          }
        }
      }
      if (ship.kind === "thargoid") {
        ship.droneCool -= dt;
        if (ship.droneCool <= 0) {
          const drones = state.ships.filter(function (s) { return s.kind === "thargon" && !s.gone; }).length;
          if (drones < 6) {
            const drone = spawn("thargon", "thargoid", math.add(ship.pos, [(Math.random() - 0.5) * 40, (Math.random() - 0.5) * 40, (Math.random() - 0.5) * 40]), ship.q);
            drone.target = "player";
            drone.hostile = true;
          }
          ship.droneCool = 7;
        }
      }
      if (aim && ship.spec.agility > 0) {
        const b = math.basis(ship.q);
        const pitch = math.clamp(math.dot(aim, b.up) * 2.5, -1, 1);
        const yaw = math.clamp(math.dot(aim, b.right) * 2.5, -1, 1);
        ship.q = math.steer(ship.q, pitch * ship.spec.agility * dt, yaw * ship.spec.agility * dt, 0);
      }
      ship.cool -= dt;
      ship.missileCool -= dt;
      if (ship.speed < want) ship.speed = Math.min(want, ship.speed + 12 * dt);
      else ship.speed = Math.max(want, ship.speed - 16 * dt);
      const forward = math.basis(ship.q).forward;
      ship.pos = math.add(ship.pos, math.scale(forward, ship.speed * WORLD * dt));
    }
    function scoop(ship) {
      const dist = math.len(math.sub(ship.pos, state.player.pos));
      if (dist > ship.radius + PLAYER_R + 6) return;
      if (!state.scoop) return;
      if (state.player.speed > 24) {
        say(ship.kind === "pod" ? "CAPSULE DESTROYED" : "CARGO DESTROYED");
        if (ship.good === 2) hurt(28, ship.pos);
        ship.gone = true;
        return;
      }
      if (ship.trumble) {
        state.trumbles += 1;
        ship.gone = true;
        say("CUTE LITTLE TRUMBLE");
        event("scoop");
        return;
      }
      if (holdUsed() >= state.hold) {
        say("HOLD FULL");
        return;
      }
      if (ship.kind === "pod") {
        state.cargo[3] += 1;
        say("ESCAPE CAPSULE SCOOPED");
      } else {
        state.cargo[ship.good] += 1;
        say("SCOOPED " + G.GOODS[ship.good].name.toUpperCase());
      }
      ship.gone = true;
      event("scoop");
    }
    function separate() {
      const bodies = state.ships.filter(function (ship) { return !ship.gone && ship.kind !== "missile"; });
      for (let i = 0; i < bodies.length; i += 1) {
        const a = bodies[i];
        const delta = math.sub(state.player.pos, a.pos);
        const dist = math.len(delta);
        const reach = a.radius + PLAYER_R;
        if (dist < reach && dist > 0.001 && a.kind !== "canister" && a.kind !== "pod") {
          const push = math.scale(math.norm(delta), (reach - dist) * 0.6);
          state.player.pos = math.add(state.player.pos, push);
          if (state.player.speed > 12) hurt(6, a.pos);
        }
        for (let j = i + 1; j < bodies.length; j += 1) {
          const b = bodies[j];
          const d = math.sub(b.pos, a.pos);
          const ld = math.len(d);
          const need = a.radius + b.radius;
          if (ld < need && ld > 0.001) {
            const push = math.scale(math.norm(d), (need - ld) * 0.5);
            b.pos = math.add(b.pos, push);
            a.pos = math.sub(a.pos, push);
          }
        }
      }
    }
    function dockingInput() {
      const out = outwardOf(state.station);
      const approach = math.add(state.station.pos, math.scale(out, 720));
      const toApproach = math.sub(approach, state.player.pos);
      const far = math.len(toApproach);
      const toStation = math.len(math.sub(state.station.pos, state.player.pos));
      const aim = (far > 90 && toStation > 520) ? math.norm(toApproach) : math.norm(math.sub(state.station.pos, state.player.pos));
      const want = (far > 90 && toStation > 520) ? (far > 500 ? 20 : 11) : 8;
      const b = math.basis(state.player.q);
      const stationUp = math.basis(state.station.q).up;
      const pitch = math.clamp(math.dot(aim, b.up) * 2.4, -1, 1);
      const yaw = math.clamp(math.dot(aim, b.right) * 2.4, -1, 1);
      const roll = math.clamp(math.dot(math.cross(b.up, stationUp), b.forward) * -2.2, -1, 1);
      const throttle = state.player.speed < want - 0.4 ? 1 : state.player.speed > want + 0.8 ? -1 : 0;
      return { pitch: pitch, yaw: yaw, roll: roll, throttle: throttle };
    }
    function tryDock() {
      if (!state.station) return;
      const local = stationLocal(state.player.pos);
      const forward = math.qInvRot(state.station.q, math.basis(state.player.q).forward);
      const up = math.qInvRot(state.station.q, math.basis(state.player.q).up);
      const aligned = forward[2] < -0.9;
      const rolled = up[1] > 0.86;
      const slot = inSlot(local);
      const speedOk = state.player.speed >= 2 && state.player.speed <= 16;
      if (slot && aligned && rolled && speedOk && local[2] < ST.face - 6) {
        dock();
        return;
      }
      if (slot && local[2] < ST.face && (!aligned || !rolled || state.player.speed > 16)) {
        if (state.scrapeTimer <= 0) {
          state.scrapeTimer = 0.45;
          if (state.player.speed > 26) die();
          else {
            hurt(18 + state.player.speed, state.station.pos);
            say("SCRAPE");
          }
          if (state.autoDock) {
            state.autoDock = false;
            event("waltz-stop");
            say("DOCKING ABORTED");
          }
        }
        return;
      }
      if (hullHit(local)) {
        if (state.player.speed > 20) die();
        else {
          hurt(30 + state.player.speed * 2, state.station.pos);
          const out = outwardOf(state.station);
          state.player.pos = math.add(state.player.pos, math.scale(out, 8));
          state.player.speed *= 0.4;
          if (state.autoDock) {
            state.autoDock = false;
            event("waltz-stop");
            say("DOCKING ABORTED");
          }
        }
      }
    }
    function environment(dt) {
      if (state.planet) {
        const alt = math.len(state.player.pos) - state.planet.radius;
        if (alt < 0) {
          die();
          return;
        }
        if (alt < 140) {
          if (!state.altWarn) say("ALTITUDE");
          state.altWarn = true;
        } else state.altWarn = false;
      }
      if (state.sun) {
        const alt = math.len(math.sub(state.player.pos, state.sun.pos)) - state.sun.radius;
        if (alt < 0) {
          die();
          return;
        }
        if (alt < 1200) {
          state.player.cabin = Math.min(280, state.player.cabin + (1 - alt / 1200) * 62 * dt);
          if (state.scoop && alt < 700) {
            const gain = (1 - alt / 700) * 12 * dt;
            if (state.fuel < G.MAX_FUEL) {
              state.fuel = Math.min(G.MAX_FUEL, state.fuel + gain);
              if (state.time % 1.2 < dt) say("FUEL SCOOP");
            }
          }
        } else {
          state.player.cabin = Math.max(0, state.player.cabin - 20 * dt);
        }
        if (state.player.cabin > 180 && state.trumbles > 0) {
          state.trumbles = 0;
          say("THE TRUMBLES ARE GONE");
        }
        if (state.player.cabin >= 255) hurt(40 * dt, state.sun.pos);
      }
    }
    function scan() {
      if (!state.station) return;
      const illegal = state.cargo.some(function (qty, i) { return qty > 0 && G.illegal(i, current().gov); });
      if (!illegal) return;
      for (let i = 0; i < state.ships.length; i += 1) {
        const ship = state.ships[i];
        if (ship.role !== "police" || ship.gone) continue;
        if (math.len(math.sub(ship.pos, state.player.pos)) < 900) {
          say("ILLEGAL CARGO");
          state.legal = Math.max(state.legal, 40);
          aggroPolice();
          event("alarm");
          return;
        }
      }
    }
    function condition() {
      if (state.docked) return "DOCKED";
      if (state.dead || state.player.dead) return "DEAD";
      let hostile = false;
      let any = false;
      for (let i = 0; i < state.ships.length; i += 1) {
        const ship = state.ships[i];
        if (ship.gone) continue;
        const dist = math.len(math.sub(ship.pos, state.player.pos));
        if (dist > SCAN) continue;
        if (ship.kind === "canister" || ship.kind === "pod" || ship.kind === "asteroid") continue;
        any = true;
        if (ship.kind === "missile" && ship.target === "player") hostile = true;
        if (ship.hostile && ship.ai === "attack") hostile = true;
      }
      if (state.witch) hostile = true;
      if (hostile) return "RED";
      if (any) return "YELLOW";
      return "GREEN";
    }
    function arrive(message) {
      state.docked = false;
      state.autoDock = false;
      state.hyper = 0;
      state.galHyper = 0;
      state.player.dead = false;
      buildLocal();
      const out = outwardOf(state.station);
      state.player.pos = math.add(state.station.pos, math.scale(out, ARRIVE));
      state.player.q = math.qLook(math.scale(out, -1), [0, 1, 0]);
      state.player.speed = 0;
      state.player.heat = 0;
      state.player.cabin = 0;
      state.player.view = "front";
      state.player.armed = false;
      state.market = G.genMarket((Math.random() * 256) | 0, current());
      populate();
      breed();
      say(message || current().name);
      event("arrive");
      event("save");
    }
    function enterWitch() {
      state.witch = true;
      state.witchCool = 14;
      state.planet = null;
      state.sun = null;
      state.station = null;
      state.ships = [];
      state.player.pos = [0, 0, 0];
      state.player.q = math.qId();
      state.player.speed = 8;
      const mother = spawn("thargoid", "thargoid", [0, 0, -1700], math.qLook([0, 0, 1], [0, 1, 0]));
      mother.hostile = true;
      for (let i = 0; i < 4; i += 1) {
        const drone = spawn("thargon", "thargoid", [-200 + i * 120, (i - 2) * 40, -1200], math.qId());
        drone.hostile = true;
        drone.target = "player";
      }
      say("WITCHSPACE");
      event("alarm");
    }
    function commitHyper() {
      state.fuel -= state.hyperDist;
      state.legal = state.legal >> 1;
      if (Math.random() < 0.045) enterWitch();
      else {
        state.system = state.dest;
        arrive();
      }
    }
    function commitGal() {
      state.galaxy = state.galaxy === 8 ? 1 : state.galaxy + 1;
      state.galdrive = false;
      state.legal = state.legal >> 1;
      arrive("GALAXY " + state.galaxy);
    }
    function breed() {
      if (state.trumbles <= 0) return;
      state.trumbles = Math.min(80, state.trumbles + Math.max(1, state.trumbles >> 1));
      while (holdUsed() > state.hold) {
        let ate = false;
        for (let i = 0; i < 17; i += 1) {
          if (state.cargo[i] > reserved(i)) {
            state.cargo[i] -= 1;
            ate = true;
            break;
          }
        }
        if (!ate) {
          state.trumbles = Math.max(0, state.trumbles - 2);
          break;
        }
      }
    }
    function step(dt, input) {
      dt = Math.max(0, Math.min(dt, 0.05));
      state.time += dt;
      for (let i = state.log.length - 1; i >= 0; i -= 1) {
        state.log[i].life -= dt;
        if (state.log[i].life <= 0) state.log.splice(i, 1);
      }
      state.player.flash = Math.max(0, state.player.flash - dt);
      if (state.podTimer > 0) {
        state.podTimer -= dt;
        if (state.podTimer <= 0) rescue();
        return;
      }
      if (state.dead || state.docked || state.player.dead) return;
      const axes = state.autoDock && state.station ? dockingInput() : input;
      const turn = 1.55 * dt;
      state.player.q = math.steer(state.player.q, (axes.pitch || 0) * turn, (axes.yaw || 0) * turn, (axes.roll || 0) * turn);
      if ((axes.throttle || 0) > 0) state.player.speed = Math.min(MAX_SPEED, state.player.speed + 16 * dt);
      if ((axes.throttle || 0) < 0) state.player.speed = Math.max(0, state.player.speed - 18 * dt);
      const forward = math.basis(state.player.q).forward;
      state.player.pos = math.add(state.player.pos, math.scale(forward, state.player.speed * WORLD * dt));
      if (state.station && !state.witch) placeStation(dt);
      if (state.hyper > 0) {
        state.hyper -= dt;
        if (state.hyper <= 0) commitHyper();
      }
      if (state.galHyper > 0) {
        state.galHyper -= dt;
        if (state.galHyper <= 0) commitGal();
      }
      if (state.witchCool > 0) state.witchCool -= dt;
      if (state.ecmCool > 0) state.ecmCool -= dt;
      state.player.laserCool = Math.max(0, state.player.laserCool - dt);
      state.player.heat = Math.max(0, state.player.heat - 24 * dt);
      state.scrapeTimer = Math.max(0, state.scrapeTimer - dt);
      const regen = state.player.flash > 0 ? 0 : 1;
      const energyRate = state.energyUnit ? 18 : 8;
      state.player.energy = Math.min(200, state.player.energy + energyRate * regen * dt);
      state.player.fore = Math.min(200, state.player.fore + 16 * regen * dt);
      state.player.aft = Math.min(200, state.player.aft + 16 * regen * dt);
      if (input.fire) fireLaser(!!input.fireEdge);
      for (let i = 0; i < state.ships.length; i += 1) {
        const ship = state.ships[i];
        if (ship.kind === "canister" || ship.kind === "pod") scoop(ship);
        steerShip(ship, dt);
      }
      separate();
      if (!state.player.dead && state.station) tryDock();
      if (!state.player.dead) environment(dt);
      state.scanTimer -= dt;
      if (state.scanTimer <= 0) {
        state.scanTimer = 6;
        scan();
      }
      state.spawnTimer -= dt;
      if (state.spawnTimer <= 0 && !state.witch) {
        state.spawnTimer = 24;
        const gov = current().gov;
        const cap = [7, 5, 3, 2, 2, 1, 0, 0][gov];
        const have = state.ships.filter(function (ship) { return ship.role === "pirate" && !ship.gone; }).length;
        const nearStation = state.station && math.len(math.sub(state.player.pos, state.station.pos)) < SAFE;
        if (have < cap && !nearStation) spawnPirate();
      }
      state.trumbleTimer -= dt;
      if (state.trumbleTimer <= 0) {
        state.trumbleTimer = 42;
        breed();
      }
      for (let i = state.bolts.length - 1; i >= 0; i -= 1) {
        state.bolts[i].life -= dt;
        if (state.bolts[i].life <= 0) state.bolts.splice(i, 1);
      }
      for (let i = state.fx.length - 1; i >= 0; i -= 1) {
        const fx = state.fx[i];
        fx.life -= dt;
        fx.pos = math.add(fx.pos, math.scale(fx.vel, dt));
        if (fx.life <= 0) state.fx.splice(i, 1);
      }
      for (let i = state.ships.length - 1; i >= 0; i -= 1) {
        if (state.ships[i].gone) state.ships.splice(i, 1);
      }
    }
    function buy(good, qty) {
      qty = Math.max(0, qty | 0);
      if (good < 0 || good > 16) return 0;
      const market = state.market;
      const price = market.price[good];
      const room = state.hold - holdUsed();
      qty = Math.min(qty, market.quantity[good], room);
      if (price > 0) qty = Math.min(qty, Math.floor(state.cash / price));
      if (qty <= 0) {
        say(room <= 0 ? "HOLD FULL" : "CANNOT BUY");
        event("deny");
        return 0;
      }
      market.quantity[good] -= qty;
      state.cargo[good] += qty;
      state.cash -= qty * price;
      event("buy");
      event("save");
      return qty;
    }
    function sell(good, qty) {
      qty = Math.max(0, qty | 0);
      const free = state.cargo[good] - reserved(good);
      if (free <= 0) {
        say(reserved(good) ? "CONTRACT GOODS" : "NOT IN HOLD");
        event("deny");
        return 0;
      }
      qty = Math.min(qty, free);
      state.cargo[good] -= qty;
      state.market.quantity[good] += qty;
      state.cash += qty * state.market.price[good];
      event("buy");
      event("save");
      return qty;
    }
    function buyFuel(tenths) {
      let n = Math.max(0, tenths | 0);
      n = Math.min(n, G.MAX_FUEL - state.fuel, Math.floor(state.cash / G.FUEL_COST));
      if (n <= 0) {
        say("CAN'T BUY FUEL");
        event("deny");
        return 0;
      }
      state.fuel += n;
      state.cash -= n * G.FUEL_COST;
      event("buy");
      event("save");
      return n;
    }
    function afford(price) {
      if (state.cash < price * 10) {
        say("NOT ENOUGH CASH");
        event("deny");
        return false;
      }
      return true;
    }
    function buyEquip(id) {
      const item = G.EQUIPMENT.find(function (entry) { return entry.id === id; });
      if (!item) return false;
      const tech = G.techShown(current());
      if (tech < item.tech) {
        say("TECH TOO LOW");
        event("deny");
        return false;
      }
      if (id === "missile") {
        if (state.missiles >= 4) {
          say("PYLONS FULL");
          return false;
        }
        if (!afford(item.price)) return false;
        state.cash -= item.price * 10;
        state.missiles += 1;
        event("buy");
        event("save");
        return true;
      }
      if (item.kind === "laser") {
        if (!afford(item.price)) return false;
        state.pendingLaser = id;
        say("CHOOSE A MOUNT");
        return true;
      }
      if (id === "bay" && state.hold >= 35) {
        say("ALREADY FITTED");
        return false;
      }
      if (id === "bomb" && state.bomb) {
        say("ALREADY FITTED");
        return false;
      }
      if (id === "galdrive" && state.galdrive) {
        say("ALREADY FITTED");
        return false;
      }
      const owned = {
        ecm: state.ecm, scoop: state.scoop, pod: state.pod, energy: state.energyUnit,
        docking: state.dockingComputer
      };
      if (owned[id]) {
        say("ALREADY FITTED");
        return false;
      }
      if (!afford(item.price)) return false;
      state.cash -= item.price * 10;
      if (id === "bay") state.hold = 35;
      if (id === "ecm") state.ecm = true;
      if (id === "scoop") state.scoop = true;
      if (id === "pod") state.pod = true;
      if (id === "bomb") state.bomb = true;
      if (id === "energy") state.energyUnit = true;
      if (id === "docking") state.dockingComputer = true;
      if (id === "galdrive") state.galdrive = true;
      event("buy");
      event("save");
      say(item.name.toUpperCase());
      return true;
    }
    function fitLaser(mount) {
      const id = state.pendingLaser;
      if (!id || !state.lasers || !(mount in state.lasers)) return false;
      const item = G.EQUIPMENT.find(function (entry) { return entry.id === id; });
      if (!item || !afford(item.price)) return false;
      state.cash -= item.price * 10;
      state.lasers[mount] = id;
      state.pendingLaser = null;
      event("buy");
      event("save");
      say(item.name.toUpperCase() + " " + mount.toUpperCase());
      return true;
    }
    function accept() {
      const offer = state.offer;
      if (!offer || state.mission) return false;
      if (offer.type === "deliver") {
        if (state.hold - holdUsed() < offer.amount) {
          say("HOLD FULL");
          event("deny");
          return false;
        }
        state.cargo[offer.good] += offer.amount;
      }
      state.mission = offer;
      state.offer = null;
      say(offer.type === "hunt" ? "ASSASSINATION" : "CONTRACT");
      event("ui");
      event("save");
      return true;
    }
    function decline() {
      state.offer = null;
      say("DECLINED");
    }
    function jettison() {
      if (state.docked) return;
      if (state.trumbles > 0) {
        state.trumbles = 0;
        say("TRUMBLES JETTISONED");
        return;
      }
      for (let i = 0; i < 17; i += 1) {
        if (state.cargo[i] <= 0) continue;
        if (reserved(i) >= state.cargo[i]) {
          state.mission = null;
          say("CONTRACT FAILED");
        }
        state.cargo[i] -= 1;
        const back = math.scale(math.basis(state.player.q).forward, -1);
        dropCan(math.add(state.player.pos, math.scale(back, 20)), i, false);
        say("JETTISON " + G.GOODS[i].name.toUpperCase());
        return;
      }
      say("HOLD EMPTY");
    }
    function arm() {
      if (state.missiles <= 0) {
        say("NO MISSILES");
        event("deny");
        return;
      }
      const list = state.ships.filter(function (ship) {
        return !ship.gone && ship.kind !== "canister" && ship.kind !== "pod" && ship.kind !== "asteroid" && ship.kind !== "missile" && math.len(math.sub(ship.pos, state.player.pos)) < SCAN;
      });
      if (!list.length) {
        state.player.armed = false;
        say("NO TARGET");
        return;
      }
      let index = list.findIndex(function (ship) { return ship.id === state.player.target; });
      index = (index + 1) % list.length;
      state.player.target = list[index].id;
      state.player.armed = true;
      const ship = list[index];
      say("TARGET " + (ship.mission && state.mission ? state.mission.who : ship.spec.name).toUpperCase());
      event("ui");
    }
    function unarm() {
      state.player.armed = false;
      say("MISSILE UNARMED");
    }
    function missile() {
      if (!state.player.armed || state.missiles <= 0) {
        say("NO TARGET");
        event("deny");
        return;
      }
      const target = state.ships.find(function (ship) { return ship.id === state.player.target && !ship.gone; });
      if (!target) {
        state.player.armed = false;
        say("NO TARGET");
        return;
      }
      state.missiles -= 1;
      state.player.armed = false;
      const q = root.EliteView.viewQuat(state.player.q, state.player.view);
      const shot = spawn("missile", "missile", math.add(state.player.pos, math.scale(math.basis(q).forward, 18)), q);
      shot.ai = "missile";
      shot.target = target.id;
      shot.owner = "player";
      shot.speed = 30;
      shot.tint = [0.7, 0.9, 1];
      event("missile");
      say("MISSILE LAUNCHED");
    }
    function ecm() {
      if (!state.ecm) {
        say("NO ECM");
        event("deny");
        return;
      }
      if (state.ecmCool > 0) return;
      let hit = false;
      for (let i = 0; i < state.ships.length; i += 1) {
        const ship = state.ships[i];
        if (ship.kind === "missile" && !ship.gone && math.len(math.sub(ship.pos, state.player.pos)) < 4800) {
          ship.gone = true;
          hit = true;
        }
      }
      state.ecmCool = 3;
      state.player.energy = Math.max(0, state.player.energy - 8);
      event("ecm");
      say(hit ? "ECM" : "ECM READY");
    }
    function bomb() {
      if (!state.bomb) {
        say("NO ENERGY BOMB");
        event("deny");
        return;
      }
      state.bomb = false;
      let felony = false;
      const victims = state.ships.slice();
      for (let i = 0; i < victims.length; i += 1) {
        const ship = victims[i];
        if (ship.gone || ship.kind === "thargoid" || ship.kind === "thargon") continue;
        if (math.len(math.sub(ship.pos, state.player.pos)) > 4200) continue;
        if (crime(ship)) felony = true;
        destroyShip(ship, ship.role === "pirate" || ship.role === "hunter");
      }
      if (felony) {
        state.legal = Math.max(state.legal, 64);
        say("FUGITIVE");
        aggroPolice();
      }
      state.player.energy = Math.max(1, state.player.energy - 24);
      event("bomb");
      say("ENERGY BOMB");
    }
    function hyper() {
      if (state.docked || state.player.dead) return;
      if (state.hyper > 0 || state.galHyper > 0) {
        state.hyper = 0;
        state.galHyper = 0;
        say("HYPERSPACE ABORTED");
        return;
      }
      if (state.witch) {
        if (state.witchCool > 0) {
          say("DRIVE CHARGING");
          return;
        }
        state.system = state.dest;
        state.legal = state.legal >> 1;
        arrive();
        return;
      }
      if (state.dest === state.system) {
        say("NO TARGET SET");
        event("deny");
        return;
      }
      const dist = G.distance(current(), galaxy()[state.dest]);
      if (dist > G.MAX_FUEL) {
        say("OUT OF RANGE");
        event("deny");
        return;
      }
      if (dist > state.fuel) {
        say("NOT ENOUGH FUEL");
        event("deny");
        return;
      }
      state.hyper = 8;
      state.hyperDist = dist;
      state.autoDock = false;
      event("hyperspace");
      say("HYPERSPACE " + galaxy()[state.dest].name);
    }
    function galhyper() {
      if (state.docked || state.player.dead || state.witch) return;
      if (!state.galdrive) {
        say("NO GALACTIC HYPERDRIVE");
        event("deny");
        return;
      }
      if (state.hyper > 0 || state.galHyper > 0) {
        state.hyper = 0;
        state.galHyper = 0;
        say("HYPERSPACE ABORTED");
        return;
      }
      state.galHyper = 6;
      state.autoDock = false;
      event("hyperspace");
      say("GALACTIC HYPERSPACE");
    }
    function compass() {
      const order = ["station", "planet", "sun"];
      const i = order.indexOf(state.player.compass);
      state.player.compass = order[(i + 1) % order.length];
      say(state.player.compass.toUpperCase());
    }
    function setView(view) {
      if (view === "front" || view === "rear" || view === "left" || view === "right") state.player.view = view;
    }
    function toggleDock() {
      if (state.docked) return;
      if (!state.dockingComputer) {
        say("NO DOCKING COMPUTER");
        event("deny");
        return;
      }
      if (state.autoDock) {
        state.autoDock = false;
        event("waltz-stop");
        say("DOCKING COMPUTER OFF");
        return;
      }
      if (!state.station) {
        say("NO STATION");
        return;
      }
      const dist = math.len(math.sub(state.player.pos, state.station.pos));
      if (dist > 3800) {
        say("OUT OF RANGE");
        return;
      }
      if (state.player.speed > 28) {
        say("TOO FAST");
        return;
      }
      state.autoDock = true;
      event("waltz");
      say("DOCKING COMPUTER ON");
    }
    function setDest(index) {
      if (index < 0 || index > 255) return false;
      const dist = index === state.system ? 0 : G.distance(current(), galaxy()[index]);
      if (dist > G.MAX_FUEL) {
        say("OUT OF RANGE");
        event("deny");
        return false;
      }
      state.dest = index;
      say("TARGET " + galaxy()[index].name);
      event("ui");
      return true;
    }
    function debugSlot() {
      if (!state.station) buildLocal();
      state.docked = false;
      state.player.dead = false;
      state.dead = false;
      const out = outwardOf(state.station);
      const up = math.basis(state.station.q).up;
      state.player.pos = math.add(state.station.pos, math.scale(out, ST.face - 28));
      state.player.q = math.qLook(math.scale(out, -1), up);
      state.player.speed = 8;
      state.ships = [];
    }

    newCommander("JAMESON");
    return {
      state: state,
      newCommander: newCommander,
      applyCommander: applyCommander,
      snapshot: snapshot,
      launch: launch,
      buy: buy,
      sell: sell,
      buyFuel: buyFuel,
      buyEquip: buyEquip,
      fitLaser: fitLaser,
      accept: accept,
      decline: decline,
      jettison: jettison,
      arm: arm,
      unarm: unarm,
      missile: missile,
      ecm: ecm,
      bomb: bomb,
      hyper: hyper,
      galhyper: galhyper,
      compass: compass,
      setView: setView,
      toggleDock: toggleDock,
      setDest: setDest,
      step: step,
      drainEvents: drainEvents,
      holdUsed: holdUsed,
      condition: condition,
      current: current,
      galaxy: galaxy,
      say: say,
      debugSlot: debugSlot,
      MAX_SPEED: MAX_SPEED
    };
  }

  root.EliteSim = { create: create };
  if (typeof module !== "undefined" && module.exports) module.exports = { create: create };
})(typeof globalThis !== "undefined" ? globalThis : this);
