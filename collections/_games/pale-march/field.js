// The field. Boxes for the ground and the ruins, emoji for everyone who fights.
(function (root) {
  "use strict";

  const W = root.PaleWorld;
  const TURN = 2.45;
  const SPEED = 7.4;
  const DODGE = 16;
  const STAND = 1.05;
  const HALF = 16;
  const PLAY = 14.6;

  function create(engine) {
    const canvas = engine.canvas;
    canvas.followDistance = 7.4;
    canvas.followHeight = 4.6;
    canvas.camera.fov = 58;
    canvas.camera.far = 80;

    const field = {
      time: 0,
      phase: "idle",
      log: "",
      logT: 0,
      vitae: 10,
      vitaeMax: 10,
      focus: 6,
      spell: 0,
      won: false,
      lost: false,
      paused: false,
      siteId: "wood"
    };

    let mods = null;
    let witch = null;
    let robe = null;
    let staff = null;
    let quill = null;
    let quillHome = true;
    let quillT = 0;
    let foes = [];
    let bolts = [];
    let solids = [];
    let ally = null;
    let shade = null;
    let moth = null;
    let mothT = 0;
    let waves = [];
    let wave = 0;
    let breath = 0;
    let castCd = 0;
    let wakeCd = 0;
    let markCd = 0;
    let dodgeT = 0;
    let dodgeCd = 0;
    let iframes = 0;
    let hurtFlash = 0;
    let saidHalf = false;
    let slowPulse = 0;

    function say(text) {
      field.log = text;
      field.logT = 3.2;
    }

    function beep(freq, ms) {
      if (field.onBeep) field.onBeep(freq, ms);
    }

    function wipe() {
      engine.actors.slice().forEach(function (actor) {
        actor.alive = false;
        canvas.remove(actor);
      });
      engine.actors.length = 0;
      foes = [];
      bolts = [];
      solids = [];
      witch = robe = staff = quill = ally = shade = moth = null;
    }

    function pin(actor) {
      if (!actor) return;
      actor.y = STAND;
      actor.vy = 0;
      if (actor.x < -PLAY) actor.x = -PLAY;
      if (actor.x > PLAY) actor.x = PLAY;
      if (actor.z < -PLAY) actor.z = -PLAY;
      if (actor.z > PLAY) actor.z = PLAY;
    }

    function addSolid(x, z, w, d, h, color) {
      const box = engine.box(x, h / 2, z, w, h, d, color, "solid");
      box.sensor = false;
      solids.push(box);
      return box;
    }

    function buildArena(id) {
      const ground = engine.box(0, -0.5, 0, 40, 1, 40, W.GROUND[id] || "#2a3140", "ground");
      ground.sensor = true;
      const dais = engine.box(0, 0.02, -2, 7, 0.08, 7, id === "gate" ? "#2a2834" : "#323846", "ground");
      dais.sensor = true;
      const span = HALF * 2 + 1.4;
      addSolid(0, -HALF, span, 1.4, 3, "#2a3038");
      addSolid(0, HALF, span, 1.4, 3, "#2a3038");
      addSolid(-HALF, 0, 1.4, span, 3, "#2a3038");
      addSolid(HALF, 0, 1.4, span, 3, "#2a3038");
      W.obstacles(id).forEach(function (ob) {
        addSolid(ob.x, ob.z, ob.w, ob.d, ob.h, ob.color);
      });
      engine.sprite("🌙", 0, 7.5, -12, 2.2, "sky");
    }

    function buildWitch() {
      witch = engine.sprite("🧙‍♀️", 0, STAND, 11, 1.2, "people");
      witch.yaw = 0;
      witch.data = { kind: "witch" };
      robe = engine.box(0, 0.62, 11, 0.72, 1.16, 0.46, "#f4f1ea", "people");
      robe.sensor = true;
      staff = engine.box(0.4, 0.7, 11, 0.12, 1.35, 0.12, "#9ec9d6", "people");
      staff.sensor = true;
      quill = engine.sprite("🦉", 0.8, STAND + 0.8, 11, 0.7, "people");
      quill.data = { kind: "owl" };
      canvas.follow(witch);
    }

    function spawnFoe(kind, x, z) {
      const spec = W.KINDS[kind];
      const foe = engine.sprite(spec.emoji, x, STAND, z, spec.boss ? 1.25 : 1, "people");
      const body = engine.box(x, spec.boss ? 0.7 : 0.58, z, 0.7, spec.boss ? 1.3 : 1.05, 0.5, spec.color, "people");
      body.sensor = true;
      foe.data = {
        kind: "foe",
        id: kind,
        name: spec.name,
        hp: spec.hp,
        max: spec.hp,
        speed: spec.speed,
        dmg: spec.dmg,
        wait: spec.wait,
        cd: 0.4,
        reach: spec.reach,
        ranged: !!spec.ranged,
        prefer: spec.prefer || 0,
        boltEvery: spec.boltEvery || 0,
        bolt: spec.boltEvery ? 0.8 : 0,
        boss: !!spec.boss,
        slow: 0,
        color: spec.color,
        body: body
      };
      foes.push(foe);
      return foe;
    }

    function spawnWave(index) {
      const list = waves[index] || [];
      const z = index === 0 ? -5 : -8;
      list.forEach(function (kind, i) {
        const x = (i - (list.length - 1) / 2) * 2.3;
        spawnFoe(kind, x, z);
      });
      const boss = list.map(function (kind) { return W.KINDS[kind]; }).filter(function (spec) { return spec && spec.boss; })[0];
      if (boss) say(boss.name + " comes onto the field.");
      else if (index > 0) say("The next rank steps out.");
    }

    function spawnCompanion(id) {
      if (id === "pell") {
        ally = engine.sprite("⚔️", -1.4, STAND, 9.5, 1.05, "people");
        const body = engine.box(-1.4, 0.6, 9.5, 0.7, 1.15, 0.5, "#8a939c", "people");
        body.sensor = true;
        ally.data = { kind: "ally", name: "Sir Pell", hp: 7, max: 7, cd: 0.3, body: body };
      } else if (id === "shade") {
        shade = engine.sprite("👻", 1.2, STAND + 0.2, 10, 0.9, "people");
        shade.data = { kind: "shade" };
      } else if (id === "moth") {
        moth = engine.sprite("🧚", -1.1, STAND + 0.35, 10.4, 0.75, "people");
        moth.data = { kind: "moth" };
        mothT = 2.2;
      }
    }

    function killActor(actor) {
      if (!actor || !actor.alive) return;
      actor.alive = false;
      actor.vx = actor.vz = 0;
      canvas.remove(actor);
      const body = actor.data && actor.data.body;
      if (body) {
        body.alive = false;
        canvas.remove(body);
      }
    }

    function shoot(x, z, dx, dz, dmg, owner, emoji) {
      const len = Math.hypot(dx, dz) || 1;
      const bolt = engine.sprite(emoji || "❄️", x + dx / len * 1.25, STAND, z + dz / len * 1.25, 0.62, "fx");
      bolt.data = {
        kind: "bolt",
        dmg: dmg,
        owner: owner,
        ux: dx / len,
        uz: dz / len,
        speed: owner === "host" ? 9 : 16,
        life: 1.2
      };
      bolts.push(bolt);
      return bolt;
    }

    function hurtFoe(foe, dmg) {
      foe.data.hp -= dmg;
      if (foe.data.hp <= 0) {
        const boss = foe.data.boss;
        const name = foe.data.name;
        killActor(foe);
        beep(boss ? 196 : 240, boss ? 140 : 50);
        if (boss) say(name + " falls.");
        return;
      }
      beep(320, 30);
    }

    function hurtWitch(dmg) {
      if (iframes > 0 || field.won || field.lost || breath > 0) return;
      field.vitae -= dmg;
      iframes = 0.6;
      hurtFlash = 0.18;
      beep(110, 90);
      if (field.vitae <= 0) {
        field.vitae = 0;
        field.lost = true;
        field.phase = "lost";
        say("The grimoire slams shut.");
      }
    }

    function nearestFoe(from) {
      let best = null;
      let bestD = 1e9;
      foes.forEach(function (foe) {
        if (!foe.alive) return;
        const d = (foe.x - from.x) ** 2 + (foe.z - from.z) ** 2;
        if (d < bestD) {
          bestD = d;
          best = foe;
        }
      });
      return best;
    }

    function livingFoes() {
      return foes.filter(function (foe) { return foe.alive; });
    }

    function castFrost() {
      if (castCd > 0) return;
      const ahead = W.forward(witch.yaw);
      shoot(witch.x, witch.z, ahead.x, ahead.z, 1 + (mods.frost || 0), "witch", "❄️");
      castCd = 0.32;
      beep(680, 40);
    }

    function castWake() {
      if (wakeCd > 0 || field.focus < 2) {
        if (field.focus < 2) say("The wake needs two focus.");
        return;
      }
      const radius = mods.wake ? 5.5 : 4.2;
      const dmg = 2 + (mods.wake || 0);
      livingFoes().forEach(function (foe) {
        const dx = foe.x - witch.x;
        const dz = foe.z - witch.z;
        const dist = Math.hypot(dx, dz);
        if (dist > radius) return;
        hurtFoe(foe, dmg);
        if (foe.alive && dist > 0.05) {
          foe.x += dx / dist * 2.3;
          foe.z += dz / dist * 2.3;
        }
      });
      field.focus -= 2;
      wakeCd = 3.6;
      beep(220, 120);
      say("White Wake.");
    }

    function castMark() {
      if (markCd > 0 || field.focus < 1) {
        if (field.focus < 1) say("Quill needs a point of focus.");
        return;
      }
      const foe = nearestFoe(witch);
      if (!foe) return;
      hurtFoe(foe, 3);
      field.focus -= 1;
      markCd = 5.4;
      quillHome = false;
      quillT = 0.45;
      if (foe.alive) {
        quill.x = foe.x;
        quill.z = foe.z;
      }
      beep(880, 70);
      say("Quill marks them.");
    }

    function placeVisuals() {
      if (!witch) return;
      const ahead = W.forward(witch.yaw);
      const side = W.right(witch.yaw);
      robe.x = witch.x;
      robe.z = witch.z;
      robe.yaw = witch.yaw;
      robe.color = hurtFlash > 0 ? "#9ec9ff" : "#f4f1ea";
      staff.x = witch.x + side.x * 0.42 + ahead.x * 0.15;
      staff.z = witch.z + side.z * 0.42 + ahead.z * 0.15;
      staff.yaw = witch.yaw;
      if (quillHome) {
        quill.x = witch.x + Math.cos(field.time * 1.6) * 0.85;
        quill.y = STAND + 0.85;
        quill.z = witch.z + Math.sin(field.time * 1.6) * 0.85;
      }
      foes.forEach(function (foe) {
        if (!foe.alive || !foe.data.body) return;
        foe.data.body.x = foe.x;
        foe.data.body.z = foe.z;
        foe.data.body.yaw = foe.yaw || 0;
      });
      if (ally && ally.alive && ally.data.body) {
        ally.data.body.x = ally.x;
        ally.data.body.z = ally.z;
        ally.data.body.yaw = ally.yaw || 0;
      }
      if (shade && shade.alive) {
        shade.x = witch.x + Math.cos(field.time * 0.8) * 1.5;
        shade.y = STAND + 0.15;
        shade.z = witch.z + Math.sin(field.time * 0.8) * 1.5;
      }
      if (moth && moth.alive) {
        moth.x = witch.x - side.x * 0.9;
        moth.y = STAND + 0.4;
        moth.z = witch.z - side.z * 0.9;
      }
    }

    function separate() {
      const bodies = livingFoes();
      if (ally && ally.alive) bodies.push(ally);
      for (let i = 0; i < bodies.length; i += 1) {
        for (let j = i + 1; j < bodies.length; j += 1) {
          const a = bodies[i];
          const b = bodies[j];
          let dx = b.x - a.x;
          let dz = b.z - a.z;
          const dist = Math.hypot(dx, dz);
          if (dist >= 0.95 || dist < 1e-4) continue;
          dx /= dist;
          dz /= dist;
          const push = (0.95 - dist) / 2;
          a.x -= dx * push;
          a.z -= dz * push;
          b.x += dx * push;
          b.z += dz * push;
        }
        const dx = bodies[i].x - witch.x;
        const dz = bodies[i].z - witch.z;
        const dist = Math.hypot(dx, dz);
        if (dist < 0.95 && dist > 1e-4) {
          bodies[i].x += dx / dist * (0.95 - dist);
          bodies[i].z += dz / dist * (0.95 - dist);
        }
      }
    }

    function steerFoe(foe, dt) {
      const data = foe.data;
      const pellUp = ally && ally.alive;
      let target = witch;
      if (pellUp) {
        const toWitch = (witch.x - foe.x) ** 2 + (witch.z - foe.z) ** 2;
        const toPell = (ally.x - foe.x) ** 2 + (ally.z - foe.z) ** 2;
        if (toPell < toWitch) target = ally;
      }
      let dx = target.x - foe.x;
      let dz = target.z - foe.z;
      const dist = Math.hypot(dx, dz) || 1;
      let dir = 1;
      if (data.ranged) {
        if (dist < data.prefer - 1.6) dir = -1;
        else if (dist < data.prefer + 0.8) dir = 0;
      }
      const slow = (data.slow > 0 ? 0.55 : 1) * (mods.slow || 1);
      const speed = data.speed * slow;
      if (dir === 0) {
        foe.vx = -dz / dist * speed * dt;
        foe.vz = dx / dist * speed * dt;
      } else {
        foe.vx = dx / dist * speed * dir * dt;
        foe.vz = dz / dist * speed * dir * dt;
      }
      foe.vy = 0;
      if (Math.hypot(foe.vx, foe.vz) > 1e-5) foe.yaw = W.yawToward(foe.vx, foe.vz);
      data.cd -= dt;
      data.slow = Math.max(0, data.slow - dt);
      if (breath > 0 || field.lost || field.won) return;
      if (!data.ranged && dist < data.reach + 0.7 && data.cd <= 0) {
        data.cd = data.wait;
        if (target === witch) hurtWitch(data.dmg);
        else {
          ally.data.hp -= data.dmg;
          beep(140, 40);
          if (ally.data.hp <= 0) {
            killActor(ally);
            ally = null;
            say("Pell goes down. The oath can wait.");
          }
        }
      }
      if (data.ranged) {
        data.bolt -= dt;
        if (data.bolt <= 0 && dist < 16) {
          data.bolt = data.boltEvery;
          shoot(foe.x, foe.z, dx, dz, 1, "host", "🔥");
        }
      }
    }

    function steerAlly(dt) {
      if (!ally || !ally.alive) return;
      const foe = nearestFoe(ally);
      if (!foe) {
        ally.vx = 0;
        ally.vz = 0;
        return;
      }
      const dx = foe.x - ally.x;
      const dz = foe.z - ally.z;
      const dist = Math.hypot(dx, dz) || 1;
      const speed = dist > 1.15 ? 5 : 0;
      ally.vx = dx / dist * speed * dt;
      ally.vz = dz / dist * speed * dt;
      ally.vy = 0;
      ally.yaw = W.yawToward(dx, dz);
      ally.data.cd -= dt;
      if (dist < 1.25 && ally.data.cd <= 0 && breath <= 0) {
        ally.data.cd = 0.7;
        hurtFoe(foe, 1);
      }
    }

    function checkBolts() {
      bolts.forEach(function (bolt) {
        if (!bolt.alive) return;
        const data = bolt.data;
        const movedX = bolt.x - data.expectX;
        const movedZ = bolt.z - data.expectZ;
        if (movedX * movedX + movedZ * movedZ > 0.05) {
          killActor(bolt);
          return;
        }
        if (data.owner === "witch") {
          livingFoes().forEach(function (foe) {
            if (!bolt.alive) return;
            const dx = foe.x - bolt.x;
            const dz = foe.z - bolt.z;
            if (dx * dx + dz * dz < 0.75) {
              hurtFoe(foe, data.dmg);
              killActor(bolt);
            }
          });
        } else if (breath <= 0) {
          const dx = witch.x - bolt.x;
          const dz = witch.z - bolt.z;
          if (dx * dx + dz * dz < 0.7) {
            hurtWitch(1);
            killActor(bolt);
          } else if (ally && ally.alive) {
            const ax = ally.x - bolt.x;
            const az = ally.z - bolt.z;
            if (ax * ax + az * az < 0.7) {
              ally.data.hp -= 1;
              killActor(bolt);
              if (ally.data.hp <= 0) {
                killActor(ally);
                ally = null;
                say("Pell goes down. The oath can wait.");
              }
            }
          }
        }
      });
      bolts = bolts.filter(function (bolt) { return bolt.alive; });
      foes = foes.filter(function (foe) { return foe.alive; });
    }

    function advanceWaves() {
      if (field.won || field.lost) return;
      if (livingFoes().length) return;
      if (wave + 1 < waves.length) {
        wave += 1;
        breath = 0.85;
        spawnWave(wave);
        return;
      }
      field.won = true;
      field.phase = "won";
      say(field.siteId === "gate" ? "The gate goes quiet." : "The seal answers.");
      beep(523, 90);
      beep(659, 140);
    }

    field.begin = function (siteId, nextMods) {
      wipe();
      mods = nextMods || {};
      field.siteId = siteId;
      field.time = 0;
      field.phase = "fight";
      field.vitae = mods.vitae || 10;
      field.vitaeMax = mods.vitaeMax || 10;
      field.focus = 6;
      field.spell = 0;
      field.won = false;
      field.lost = false;
      field.paused = false;
      castCd = wakeCd = markCd = dodgeT = dodgeCd = iframes = hurtFlash = 0;
      saidHalf = false;
      slowPulse = 0;
      mothT = 2.2;
      quillHome = true;
      wave = 0;
      breath = 0;
      waves = W.waveList(siteId, !!mods.crown);
      buildArena(siteId);
      buildWitch();
      if (mods.companion) spawnCompanion(mods.companion);
      spawnWave(0);
      say(siteId === "gate" ? root.PaleCampaign.gateLine({ name: mods.name || "WINTER", pages: mods.pages || 0 }) : (W.site(siteId).battleLine || "They are already here."));
      canvas.follow(witch);
    };

    field.shutdown = function () {
      canvas.follow(null);
      wipe();
      field.phase = "idle";
    };

    field.step = function (dt, input) {
      if (!witch || field.phase === "idle") return;
      field.time += dt;
      if (field.logT > 0) field.logT -= dt;
      if (field.paused || field.won || field.lost) {
        witch.vx = witch.vz = 0;
        return;
      }
      breath = Math.max(0, breath - dt);
      castCd = Math.max(0, castCd - dt);
      wakeCd = Math.max(0, wakeCd - dt);
      markCd = Math.max(0, markCd - dt);
      dodgeCd = Math.max(0, dodgeCd - dt);
      dodgeT = Math.max(0, dodgeT - dt);
      iframes = Math.max(0, iframes - dt);
      hurtFlash = Math.max(0, hurtFlash - dt);
      field.focus = Math.min(6, field.focus + dt * 0.85);

      const moving = input.forward || input.back || input.strafeLeft || input.strafeRight;
      if (input.dodge && dodgeCd <= 0) {
        dodgeT = 0.18;
        dodgeCd = 1.15;
        iframes = Math.max(iframes, 0.18);
        if (!moving) input = Object.assign({}, input, { forward: true });
      }
      witch.yaw = W.turnYaw(witch.yaw, input, TURN, dt);
      const speed = dodgeT > 0 ? DODGE : SPEED;
      const vel = W.velocity(witch.yaw, input, speed);
      witch.vx = vel.vx * dt;
      witch.vz = vel.vz * dt;
      witch.vy = 0;

      if (field.spell === 0 && input.cast) castFrost();
      else if (input.castEdge && field.spell === 1) castWake();
      else if (input.castEdge && field.spell === 2) castMark();

      livingFoes().forEach(function (foe) { steerFoe(foe, dt); });
      steerAlly(dt);

      if (shade && slowPulse <= 0) {
        slowPulse = 1.4;
        livingFoes().forEach(function (foe) {
          const d = (foe.x - witch.x) ** 2 + (foe.z - witch.z) ** 2;
          if (d < 4.6 * 4.6) foe.data.slow = 1.4;
        });
      } else slowPulse -= dt;

      if (moth && moth.alive) {
        mothT -= dt;
        if (mothT <= 0) {
          mothT = 5;
          const foe = nearestFoe(moth);
          if (foe && breath <= 0) shoot(moth.x, moth.z, foe.x - moth.x, foe.z - moth.z, 1, "witch", "❄️");
        }
      }

      if (!quillHome) {
        quillT -= dt;
        if (quillT <= 0) quillHome = true;
      }

      bolts.forEach(function (bolt) {
        if (!bolt.alive) return;
        const data = bolt.data;
        data.life -= dt;
        bolt.vx = data.ux * data.speed * dt;
        bolt.vz = data.uz * data.speed * dt;
        bolt.vy = 0;
        data.expectX = bolt.x + bolt.vx;
        data.expectZ = bolt.z + bolt.vz;
        if (data.life <= 0) killActor(bolt);
      });

      engine.update();

      separate();
      pin(witch);
      livingFoes().forEach(pin);
      if (ally && ally.alive) pin(ally);
      bolts.forEach(function (bolt) { if (bolt.alive) pin(bolt); });
      checkBolts();
      placeVisuals();

      const hollow = livingFoes().filter(function (foe) { return foe.data.id === "hollow"; })[0];
      if (hollow && !saidHalf && hollow.data.hp <= hollow.data.max / 2) {
        saidHalf = true;
        say("The gate leans in to listen.");
      }
      advanceWaves();
      witch.data.blink = iframes > 0 && Math.floor(field.time * 16) % 2 === 0;
      witch.emoji = witch.data.blink ? "✨" : "🧙‍♀️";
    };

    field.probe = function () {
      return witch ? {
        x: witch.x,
        z: witch.z,
        yaw: witch.yaw,
        foes: livingFoes().length,
        won: field.won,
        lost: field.lost,
        vitae: field.vitae
      } : null;
    };

    field.status = function () {
      const alive = livingFoes();
      const boss = alive.filter(function (foe) { return foe.data.boss; })[0];
      const names = ["First Frost", "White Wake", "Quill's Mark"];
      const cds = [castCd, wakeCd, markCd];
      const ready = cds[field.spell] <= 0;
      let objective = alive.length + " still standing";
      if (boss) objective = boss.data.name + " " + Math.max(0, boss.data.hp) + "/" + boss.data.max;
      else if (field.won) objective = "The field is yours";
      else if (!alive.length && breath > 0) objective = "Hold";
      const pell = ally && ally.alive ? " · Pell " + ally.data.hp + "/" + ally.data.max : "";
      return {
        vitae: field.vitae,
        vitaeMax: field.vitaeMax,
        focus: field.focus,
        spell: names[field.spell],
        ready: ready,
        wait: ready ? "" : cds[field.spell].toFixed(1),
        objective: objective,
        log: field.log,
        won: field.won,
        lost: field.lost,
        paused: field.paused,
        meter: "Vitae " + field.vitae + "/" + field.vitaeMax + " · Focus " + field.focus.toFixed(1) + " · " + (field.spell + 1) + " " + names[field.spell] + (ready ? "" : " " + cds[field.spell].toFixed(1)) + pell,
        objectiveLine: objective
      };
    };

    field.killAll = function () {
      let guard = 0;
      while (!field.won && !field.lost && guard < 6) {
        livingFoes().forEach(function (foe) { killActor(foe); });
        foes = [];
        advanceWaves();
        guard += 1;
      }
    };

    return field;
  }

  root.PaleField = { create: create, PLAY: PLAY, STAND: STAND, SPEED: SPEED, TURN: TURN };
})(typeof globalThis !== "undefined" ? globalThis : this);
