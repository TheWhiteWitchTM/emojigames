// The chronicle map. Roads, the hold, and the witch walking between them.
(function (root) {
  "use strict";

  const W = root.PaleWorld;

  function create(engine) {
    const canvas = engine.canvas;
    let selected = "wood";
    let travel = null;
    const marks = {};

    const plate = {
      draw: function (ctx, camera) {
        const w = ctx.canvas.width;
        const h = ctx.canvas.height;
        ctx.fillStyle = "#10141c";
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = "#e6ebf2";
        ctx.beginPath();
        ctx.arc(w - 78, 64, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#10141c";
        ctx.beginPath();
        ctx.arc(w - 68, 58, 18, 0, Math.PI * 2);
        ctx.fill();

        ctx.save();
        ctx.translate(-camera.x, -camera.y);
        ctx.fillStyle = "#1a2030";
        ctx.fillRect(80, 40, 1440, 980);
        const hold = W.site("hold");
        W.SITES.forEach(function (place) {
          if (place.id === "hold") return;
          const locked = place.id === "gate" && selected !== "gate" && plate.gateLocked;
          const on = place.id === selected;
          ctx.beginPath();
          ctx.moveTo(hold.x, hold.y);
          ctx.lineTo(place.x, place.y);
          ctx.strokeStyle = locked ? "rgba(180, 190, 210, 0.28)" : on ? "#f4f1ea" : "rgba(186, 204, 224, 0.55)";
          ctx.lineWidth = on ? 4 : 2;
          ctx.setLineDash(locked ? [7, 9] : []);
          ctx.stroke();
          ctx.setLineDash([]);
        });
        ctx.font = "15px ui-monospace, monospace";
        ctx.textAlign = "center";
        W.SITES.forEach(function (place) {
          ctx.fillStyle = place.id === selected ? "#f4f1ea" : "#b7c3d4";
          ctx.fillText(place.name, place.x, place.y + 40);
          const note = plate.notes && plate.notes[place.id];
          if (note) {
            ctx.fillStyle = "#8ea0b8";
            ctx.font = "12px ui-monospace, monospace";
            ctx.fillText(note, place.x, place.y + 58);
            ctx.font = "15px ui-monospace, monospace";
          }
        });
        ctx.restore();
      }
    };
    plate.gateLocked = true;
    plate.notes = {};
    canvas.add(plate, "ground");

    const witch = engine.sprite("🧙‍♀️", 800, 540, 52, "people");
    const quill = engine.sprite("🦉", 830, 500, 30, "people");
    W.SITES.forEach(function (place) {
      const mark = engine.sprite(place.emoji, place.x, place.y, place.id === "hold" ? 46 : 40, "sites");
      marks[place.id] = mark;
    });
    canvas.follow(witch);

    function placeAt(id) {
      const place = W.site(id) || W.site("hold");
      witch.x = place.x;
      witch.y = place.y;
      travel = null;
    }

    function layout(st, cursorId) {
      selected = cursorId || selected;
      plate.gateLocked = root.PaleCampaign.sealsClosed(st) < 4;
      const notes = { hold: "fire" };
      W.SEALS.forEach(function (id) {
        notes[id] = st.seals[id] ? "sealed" : "open";
      });
      notes.gate = plate.gateLocked ? "shut" : "open";
      plate.notes = notes;
      W.SITES.forEach(function (place) {
        const sealed = place.id !== "hold" && place.id !== "gate" && st.seals[place.id];
        marks[place.id].emoji = sealed ? "🌙" : place.emoji;
        marks[place.id].size = place.id === selected ? 48 : place.id === "hold" ? 44 : 38;
      });
    }

    function go(dest, done) {
      const place = W.site(dest);
      if (!place) return;
      travel = { x: witch.x, y: witch.y, dest: place, t: 0, done: done };
    }

    function step(dt) {
      if (travel) {
        travel.t += dt / 1.35;
        const u = Math.min(1, travel.t);
        const e = u * u * (3 - 2 * u);
        witch.x = travel.x + (travel.dest.x - travel.x) * e;
        witch.y = travel.y + (travel.dest.y - travel.y) * e;
        if (u >= 1) {
          const done = travel.done;
          witch.x = travel.dest.x;
          witch.y = travel.dest.y;
          travel = null;
          if (done) done();
        }
      }
      const t = (root.performance ? root.performance.now() : Date.now()) / 1000;
      quill.x = witch.x + Math.cos(t * 1.7) * 34;
      quill.y = witch.y - 42 + Math.sin(t * 1.7) * 8;
    }

    function worldAt(el, clientX, clientY) {
      const rect = el.getBoundingClientRect();
      const sx = rect.width ? el.width / rect.width : 1;
      const sy = rect.height ? el.height / rect.height : 1;
      return {
        x: (clientX - rect.left) * sx + canvas.camera.x,
        y: (clientY - rect.top) * sy + canvas.camera.y
      };
    }

    function hitSite(x, y) {
      let found = null;
      W.SITES.forEach(function (place) {
        if (Math.hypot(place.x - x, place.y - y) < 46) found = place.id;
      });
      return found;
    }

    function busy() {
      return !!travel;
    }

    return {
      step: step,
      placeAt: placeAt,
      layout: layout,
      go: go,
      worldAt: worldAt,
      hitSite: hitSite,
      busy: busy,
      element: canvas.element
    };
  }

  root.PaleMap = { create: create };
})(typeof globalThis !== "undefined" ? globalThis : this);
