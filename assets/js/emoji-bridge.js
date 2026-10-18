// Educational door onto the three emoji engines.
// Programs say 2d.emoji, 3d.box, and ui.say. This file does the rest.
"use strict";
(function (root) {
  var PALETTE = [
    "#000000", "#aa0000", "#00aa00", "#aa5500",
    "#0000aa", "#aa00aa", "#00aaaa", "#aaaaaa",
    "#555555", "#ff5555", "#55ff55", "#ffff55",
    "#5555ff", "#ff55ff", "#55ffff", "#ffffff"
  ];
  var NAMES = {
    black: "#000000", white: "#ffffff", red: "#e23b3b", green: "#3aaa5a",
    blue: "#3b6fe2", yellow: "#f2d24b", orange: "#e28a2b", purple: "#8a4ad4",
    pink: "#e27ab0", brown: "#8a5a32", gray: "#8a8a8a", grey: "#8a8a8a",
    cyan: "#3ec8c8", teal: "#1f8a8a", navy: "#1a2a6b", gold: "#e6c36a",
    ash: "#cbbfa6", cream: "#f3ead2", night: "#1c2430"
  };
  var KEYS = {
    left: "ArrowLeft", right: "ArrowRight", up: "ArrowUp", down: "ArrowDown",
    space: " ", enter: "Enter", return: "Enter", esc: "Escape", escape: "Escape",
    shift: "Shift", ctrl: "Control", control: "Control", alt: "Alt"
  };

  function color(value, method) {
    if (value == null || value === "") return null;
    if (typeof value === "number" && Number.isFinite(value)) {
      var index = value | 0;
      if (index >= 0 && index <= 15) return PALETTE[index];
      throw new Error(method + " has no color " + value + ". Numbers 0 through 15 are the old palette. Names like red work too.");
    }
    var text = String(value).trim().toLowerCase();
    if (NAMES[text]) return NAMES[text];
    if (/^#[0-9a-f]{3}$/.test(text)) {
      return "#" + text[1] + text[1] + text[2] + text[2] + text[3] + text[3];
    }
    if (/^#[0-9a-f]{6}$/.test(text)) return text;
    throw new Error(method + " does not know the color " + JSON.stringify(String(value)) + ". Try red, or a code like #ff8800.");
  }

  function preview(value) {
    if (value == null) return "nothing";
    if (typeof value === "number") return Number.isFinite(value) ? "the number " + value : "a number that is not usable";
    if (typeof value === "string") {
      var shown = value.length > 24 ? value.slice(0, 24) + "…" : value;
      return "the text " + JSON.stringify(shown);
    }
    if (typeof value === "boolean") return value ? "true" : "false";
    if (Array.isArray(value)) return "a list";
    return "the wrong kind of value";
  }

  function needCount(method, got, min, max, signature) {
    if (got >= min && (max == null || got <= max)) return;
    var how = min === max ? String(min) : (max == null ? "at least " + min : min + " to " + max);
    var noun = max === 1 && min === 1 ? "value" : "values";
    throw new Error(method + " takes " + how + " " + noun + ": " + signature + ". You gave " + got + ".");
  }

  function num(value, method, name) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    throw new Error(method + " needs a number for " + name + ". You gave " + preview(value) + ".");
  }

  function text(value, method, name) {
    if (typeof value === "string") return value;
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
    throw new Error(method + " needs text for " + name + ". You gave " + preview(value) + ".");
  }

  function keyName(value, method) {
    if (typeof value !== "string" || value === "") {
      throw new Error(method + " needs a key name, such as \"left\" or \"a\". You gave " + preview(value) + ".");
    }
    if (value.length === 1) return value;
    return KEYS[value.toLowerCase()] || value;
  }

  function held(engine, name) {
    if (!engine) return false;
    if (engine.isKeyDown(name)) return true;
    if (name.length === 1) {
      var lower = name.toLowerCase();
      var upper = name.toUpperCase();
      return engine.isKeyDown(lower) || engine.isKeyDown(upper);
    }
    return false;
  }

  function missing(globalName, file) {
    if (typeof root[globalName] === "undefined") {
      throw new Error("This page has not loaded " + file + ", so that picture cannot be drawn.");
    }
  }

  function closest(word, names) {
    var best = "";
    var bestD = 3;
    for (var i = 0; i < names.length; i += 1) {
      var d = distance(word, names[i]);
      if (d < bestD) {
        bestD = d;
        best = names[i];
      }
    }
    return bestD <= 2 ? best : "";
  }

  function distance(a, b) {
    var prev = [];
    var row = [];
    var i;
    var j;
    for (j = 0; j <= b.length; j += 1) prev[j] = j;
    for (i = 1; i <= a.length; i += 1) {
      row[0] = i;
      for (j = 1; j <= b.length; j += 1) {
        var cost = a[i - 1] === b[j - 1] ? 0 : 1;
        row[j] = Math.min(row[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
      }
      var swap = prev;
      prev = row;
      row = swap;
    }
    return prev[b.length];
  }

  function mount(container) {
    if (!container) throw new Error("EmojiBridge.mount needs an element.");
    var hint = document.createElement("div");
    hint.className = "studio-hint";
    hint.textContent = "When the program uses 2d, 3d, or ui, the picture lands here.";
    var pane2 = pane();
    var pane3 = pane();
    var paneU = pane();
    container.appendChild(hint);
    container.appendChild(pane2);
    container.appendChild(pane3);
    container.appendChild(paneU);

    var session = {
      root: container,
      hint: hint,
      stopped: false,
      mode: "text",
      print: function () {},
      lookup: null,
      openDialog: null
    };
    var waiters = [];
    var frameQueued = false;
    var drawSoon = false;
    var loop2 = null;
    var loop3 = null;

    function pane() {
      var node = document.createElement("div");
      node.className = "studio-pane";
      node.hidden = true;
      return node;
    }

    function show(mode) {
      session.mode = mode;
      hint.hidden = true;
      pane2.hidden = mode !== "2d";
      pane3.hidden = mode !== "3d";
      paneU.hidden = mode !== "ui";
      resize();
    }

    function halt() {
      session.stopped = true;
      if (session.openDialog && typeof session.openDialog.close === "function") {
        try { session.openDialog.close(null); } catch (err) { /* already closed */ }
      }
      session.openDialog = null;
      var pending = waiters;
      waiters = [];
      pending.forEach(function (fn) { fn(); });
    }

    function checkStop() {
      if (!session.stopped) return;
      var err = new Error("Stopped.");
      err.magicStop = true;
      throw err;
    }

    function nextFrame() {
      return new Promise(function (resolve) {
        waiters.push(resolve);
        if (frameQueued) return;
        frameQueued = true;
        var raf = root.requestAnimationFrame || function (fn) { return setTimeout(fn, 16); };
        raf(function () {
          frameQueued = false;
          var list = waiters;
          waiters = [];
          list.forEach(function (fn) { fn(); });
        });
      });
    }

    function laterDraw(fn) {
      if (drawSoon) return;
      drawSoon = true;
      Promise.resolve().then(function () {
        drawSoon = false;
        try { fn(); } catch (err) { /* a draw during teardown can miss the canvas */ }
      });
    }

    var flat = null;
    var solid = null;
    var desk = null;

    function api2d() {
      if (flat) return flat.api;
      missing("EmojiEngine", "emoji-engine-2d.js");
      show("2d");
      var width = Math.max(2, pane2.clientWidth || 480);
      var height = Math.max(2, pane2.clientHeight || 320);
      var canvas = new root.EmojiEngine.Canvas({ width: width, height: height });
      var engine = new root.EmojiEngine.Engine({ canvas: canvas });
      pane2.appendChild(canvas.element);
      var paper = {
        color: "#1c2430",
        draw: function (ctx) {
          ctx.fillStyle = this.color;
          ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        }
      };
      canvas.add(paper, "paper");
      var things = new Map();
      var seq = 1;

      function paint() {
        if (canvas) canvas.draw();
      }

      function add(kind, props) {
        props.kind = kind;
        var drawable = {
          draw: function (ctx, camera) {
            paintShape(ctx, camera, props);
          }
        };
        var thing = { id: seq, props: props, drawable: drawable, vx: 0, vy: 0 };
        seq += 1;
        things.set(thing.id, thing);
        canvas.add(drawable, "ink");
        laterDraw(paint);
        return thing.id;
      }

      function thing(id, method) {
        var found = things.get(id);
        if (!found) {
          throw new Error(method + " has no picture " + preview(id) + ". emoji, text, rect, circle, and line give you a number. clear removes those numbers.");
        }
        return found;
      }

      function pump() {
        things.forEach(function (item) {
          item.props.x += item.vx;
          item.props.y += item.vy;
        });
        paint();
      }

      var api = {
        __host: true,
        __name: "2d",
        clear: function (ink) {
          needCount("2d.clear", arguments.length, 0, 1, "clear() or clear(color)");
          if (arguments.length && ink != null) paper.color = color(ink, "2d.clear") || paper.color;
          things.forEach(function (item) { canvas.remove(item.drawable); });
          things.clear();
          canvas.follow(null);
          laterDraw(paint);
        },
        paper: function (ink) {
          needCount("2d.paper", arguments.length, 1, 1, "paper(color)");
          paper.color = color(ink, "2d.paper") || paper.color;
          laterDraw(paint);
        },
        emoji: function (picture, x, y, size) {
          needCount("2d.emoji", arguments.length, 3, 4, "emoji(picture, x, y) or emoji(picture, x, y, size)");
          var glyph = text(picture, "2d.emoji", "the emoji");
          if (!glyph) throw new Error("2d.emoji needs an emoji, such as \"😀\".");
          return add("emoji", {
            emoji: glyph,
            x: num(x, "2d.emoji", "x"),
            y: num(y, "2d.emoji", "y"),
            size: size == null ? 48 : num(size, "2d.emoji", "size")
          });
        },
        text: function (words, x, y, size, ink) {
          needCount("2d.text", arguments.length, 3, 5, "text(words, x, y) or text(words, x, y, size, color)");
          var px = num(x, "2d.text", "x");
          var py = num(y, "2d.text", "y");
          var ps = 22;
          var pc = "#f3ead2";
          if (arguments.length === 4 && typeof size === "string") pc = color(size, "2d.text") || pc;
          else {
            if (size != null) ps = num(size, "2d.text", "size");
            if (ink != null) pc = color(ink, "2d.text") || pc;
          }
          return add("text", { text: text(words, "2d.text", "the words"), x: px, y: py, size: ps, color: pc });
        },
        rect: function (x, y, w, h, ink) {
          needCount("2d.rect", arguments.length, 4, 5, "rect(x, y, width, height) or rect(x, y, width, height, color)");
          return add("rect", {
            x: num(x, "2d.rect", "x"),
            y: num(y, "2d.rect", "y"),
            w: num(w, "2d.rect", "width"),
            h: num(h, "2d.rect", "height"),
            color: ink == null ? "#e6c36a" : (color(ink, "2d.rect") || "#e6c36a")
          });
        },
        circle: function (x, y, r, ink) {
          needCount("2d.circle", arguments.length, 3, 4, "circle(x, y, radius) or circle(x, y, radius, color)");
          var radius = num(r, "2d.circle", "radius");
          if (radius < 0) throw new Error("2d.circle radius cannot be negative.");
          return add("circle", {
            x: num(x, "2d.circle", "x"),
            y: num(y, "2d.circle", "y"),
            r: radius,
            color: ink == null ? "#7eb6ff" : (color(ink, "2d.circle") || "#7eb6ff")
          });
        },
        line: function (x1, y1, x2, y2, ink) {
          needCount("2d.line", arguments.length, 4, 5, "line(x1, y1, x2, y2) or line(x1, y1, x2, y2, color)");
          return add("line", {
            x: num(x1, "2d.line", "x1"),
            y: num(y1, "2d.line", "y1"),
            x2: num(x2, "2d.line", "x2"),
            y2: num(y2, "2d.line", "y2"),
            color: ink == null ? "#f3ead2" : (color(ink, "2d.line") || "#f3ead2")
          });
        },
        move: function (id, x, y) {
          needCount("2d.move", arguments.length, 3, 3, "move(number, x, y)");
          var item = thing(id, "2d.move");
          item.props.x = num(x, "2d.move", "x");
          item.props.y = num(y, "2d.move", "y");
          laterDraw(paint);
        },
        nudge: function (id, vx, vy) {
          needCount("2d.nudge", arguments.length, 3, 3, "nudge(number, vx, vy)");
          var item = thing(id, "2d.nudge");
          item.vx = num(vx, "2d.nudge", "vx");
          item.vy = num(vy, "2d.nudge", "vy");
        },
        drop: function (id) {
          needCount("2d.drop", arguments.length, 1, 1, "drop(number)");
          var item = thing(id, "2d.drop");
          canvas.remove(item.drawable);
          things.delete(id);
          laterDraw(paint);
        },
        camera: function (x, y) {
          needCount("2d.camera", arguments.length, 2, 2, "camera(x, y)");
          canvas.follow(null);
          canvas.setCamera(num(x, "2d.camera", "x"), num(y, "2d.camera", "y"));
          laterDraw(paint);
        },
        follow: function (id) {
          needCount("2d.follow", arguments.length, 0, 1, "follow(number) or follow()");
          if (id == null) {
            canvas.follow(null);
            return;
          }
          canvas.follow(thing(id, "2d.follow").props);
        },
        key: function (name) {
          needCount("2d.key", arguments.length, 1, 1, "key(\"left\")");
          return held(engine, keyName(name, "2d.key"));
        },
        touch: function (a, b) {
          needCount("2d.touch", arguments.length, 2, 2, "touch(number, number)");
          return touches(thing(a, "2d.touch"), thing(b, "2d.touch"));
        },
        wait: async function () {
          needCount("2d.wait", arguments.length, 0, 0, "wait()");
          checkStop();
          show("2d");
          pump();
          await nextFrame();
          checkStop();
        },
        run: async function (update, draw) {
          needCount("2d.run", arguments.length, 0, 2, "run() or run(update, draw)");
          if (arguments.length === 0 && typeof session.lookup === "function") {
            update = session.lookup("update");
            draw = session.lookup("draw");
          }
          var hasUpdate = typeof update === "function";
          var hasDraw = typeof draw === "function";
          if (!hasUpdate && !hasDraw) {
            throw new Error("2d.run looks for update() and draw(). Write one of them, or use 2d.wait() inside a loop.");
          }
          show("2d");
          loop2 = true;
          try {
            while (!session.stopped && loop2) {
              if (hasUpdate) await update();
              if (session.stopped) break;
              if (hasDraw) await draw();
              if (session.stopped) break;
              pump();
              await nextFrame();
            }
          } finally {
            loop2 = false;
          }
          checkStop();
        },
        stop: function () {
          loop2 = false;
          halt();
        },
        beep: function (freq, ms) {
          needCount("2d.beep", arguments.length, 0, 2, "beep() or beep(frequency, milliseconds)");
          tone(engine, freq == null ? 440 : num(freq, "2d.beep", "frequency"), ms == null ? 120 : num(ms, "2d.beep", "milliseconds"));
        },
        help: function () {
          session.print(helpText("2d", HELP_2D));
        }
      };
      Object.defineProperty(api, "width", { enumerable: true, get: function () { return canvas.element.width; } });
      Object.defineProperty(api, "height", { enumerable: true, get: function () { return canvas.element.height; } });
      flat = { canvas: canvas, engine: engine, api: api, pump: pump, things: things };
      paint();
      return api;
    }

    function api3d() {
      if (solid) return solid.api;
      missing("EmojiEngine3D", "emoji-engine-3d.js");
      show("3d");
      var width = Math.max(2, pane3.clientWidth || 480);
      var height = Math.max(2, pane3.clientHeight || 320);
      var canvas;
      try {
        canvas = new root.EmojiEngine3D.Canvas({ width: width, height: height, clear: "#1c2430" });
      } catch (err) {
        throw new Error("This browser cannot draw 3d here. 2d and ui still work.");
      }
      var engine = new root.EmojiEngine3D.Engine({ canvas: canvas });
      pane3.appendChild(canvas.element);
      var actors = new Map();
      var seq = 1;

      function paint() {
        try { canvas.draw(); } catch (err) { /* context lost */ }
      }

      function keep(actor) {
        var id = seq;
        seq += 1;
        actors.set(id, actor);
        laterDraw(paint);
        return id;
      }

      function actor(id, method) {
        var found = actors.get(id);
        if (!found || found.alive === false) {
          throw new Error(method + " has no solid " + preview(id) + ". box and emoji give you a number. clear removes those numbers.");
        }
        return found;
      }

      function wipe() {
        actors.forEach(function (item) {
          item.alive = false;
          canvas.remove(item);
        });
        actors.clear();
      }

      var api = {
        __host: true,
        __name: "3d",
        clear: function (ink) {
          needCount("3d.clear", arguments.length, 0, 1, "clear() or clear(color)");
          if (arguments.length && ink != null) canvas.clearColor = color(ink, "3d.clear") || canvas.clearColor;
          wipe();
          canvas.follow(null);
          laterDraw(paint);
        },
        paper: function (ink) {
          needCount("3d.paper", arguments.length, 1, 1, "paper(color)");
          canvas.clearColor = color(ink, "3d.paper") || canvas.clearColor;
          laterDraw(paint);
        },
        camera: function (x, y, z, yaw, pitch) {
          needCount("3d.camera", arguments.length, 3, 5, "camera(x, y, z) or camera(x, y, z, yaw, pitch)");
          canvas.follow(null);
          var eye = canvas.camera;
          var nextYaw = yaw == null ? eye.yaw : num(yaw, "3d.camera", "yaw") * Math.PI / 180;
          var nextPitch = pitch == null ? eye.pitch : num(pitch, "3d.camera", "pitch") * Math.PI / 180;
          canvas.setCamera(num(x, "3d.camera", "x"), num(y, "3d.camera", "y"), num(z, "3d.camera", "z"), nextYaw, nextPitch);
          laterDraw(paint);
        },
        look: function (x, y, z) {
          needCount("3d.look", arguments.length, 3, 3, "look(x, y, z)");
          var eye = canvas.camera.eye;
          var lx = num(x, "3d.look", "x") - eye.x;
          var ly = num(y, "3d.look", "y") - eye.y;
          var lz = num(z, "3d.look", "z") - eye.z;
          var horiz = Math.hypot(lx, lz);
          canvas.follow(null);
          canvas.setCamera(eye.x, eye.y, eye.z, Math.atan2(-lx, -lz), Math.atan2(ly, horiz));
          laterDraw(paint);
        },
        box: function (x, y, z, w, h, d, ink) {
          needCount("3d.box", arguments.length, 3, 7, "box(x, y, z) or box(x, y, z, width, height, depth, color)");
          var px = num(x, "3d.box", "x");
          var py = num(y, "3d.box", "y");
          var pz = num(z, "3d.box", "z");
          var size = [1, 1, 1];
          var tint = "#c8c8d0";
          if (arguments.length === 4) {
            if (typeof w !== "string") throw new Error("3d.box takes 3 numbers, or those plus a color, or x, y, z, width, height, depth, and an optional color.");
            tint = color(w, "3d.box") || tint;
          } else if (arguments.length >= 6) {
            size = [num(w, "3d.box", "width"), num(h, "3d.box", "height"), num(d, "3d.box", "depth")];
            if (ink != null) tint = color(ink, "3d.box") || tint;
          } else if (arguments.length > 4) {
            throw new Error("3d.box takes 3 numbers, or those plus a color, or x, y, z, width, height, depth, and an optional color.");
          }
          return keep(engine.box(px, py, pz, size[0], size[1], size[2], tint));
        },
        emoji: function (picture, x, y, z, size) {
          needCount("3d.emoji", arguments.length, 4, 5, "emoji(picture, x, y, z) or emoji(picture, x, y, z, size)");
          var glyph = text(picture, "3d.emoji", "the emoji");
          if (!glyph) throw new Error("3d.emoji needs an emoji, such as \"🌟\".");
          return keep(engine.sprite(
            glyph,
            num(x, "3d.emoji", "x"),
            num(y, "3d.emoji", "y"),
            num(z, "3d.emoji", "z"),
            size == null ? 1 : num(size, "3d.emoji", "size")
          ));
        },
        move: function (id, x, y, z) {
          needCount("3d.move", arguments.length, 4, 4, "move(number, x, y, z)");
          var body = actor(id, "3d.move");
          body.x = num(x, "3d.move", "x");
          body.y = num(y, "3d.move", "y");
          body.z = num(z, "3d.move", "z");
          laterDraw(paint);
        },
        nudge: function (id, vx, vy, vz) {
          needCount("3d.nudge", arguments.length, 4, 4, "nudge(number, vx, vy, vz)");
          engine.motion(actor(id, "3d.nudge"), num(vx, "3d.nudge", "vx"), num(vy, "3d.nudge", "vy"), num(vz, "3d.nudge", "vz"));
        },
        turn: function (id, degrees) {
          needCount("3d.turn", arguments.length, 2, 2, "turn(number, degrees)");
          actor(id, "3d.turn").yaw = num(degrees, "3d.turn", "degrees") * Math.PI / 180;
          laterDraw(paint);
        },
        drop: function (id) {
          needCount("3d.drop", arguments.length, 1, 1, "drop(number)");
          var body = actor(id, "3d.drop");
          body.alive = false;
          canvas.remove(body);
          actors.delete(id);
          laterDraw(paint);
        },
        follow: function (id) {
          needCount("3d.follow", arguments.length, 0, 1, "follow(number) or follow()");
          canvas.follow(id == null ? null : actor(id, "3d.follow"));
        },
        key: function (name) {
          needCount("3d.key", arguments.length, 1, 1, "key(\"left\")");
          return held(engine, keyName(name, "3d.key"));
        },
        touch: function (a, b) {
          needCount("3d.touch", arguments.length, 2, 2, "touch(number, number)");
          var A = actor(a, "3d.touch");
          var B = actor(b, "3d.touch");
          var dx = A.x - B.x;
          var dy = A.y - B.y;
          var dz = A.z - B.z;
          var reach = (A.size || Math.max(A.w || 1, A.h || 1, A.d || 1)) / 2 + (B.size || Math.max(B.w || 1, B.h || 1, B.d || 1)) / 2;
          return dx * dx + dy * dy + dz * dz <= reach * reach;
        },
        wait: async function () {
          needCount("3d.wait", arguments.length, 0, 0, "wait()");
          checkStop();
          show("3d");
          engine.update();
          paint();
          await nextFrame();
          checkStop();
        },
        run: async function (update, draw) {
          needCount("3d.run", arguments.length, 0, 2, "run() or run(update, draw)");
          if (arguments.length === 0 && typeof session.lookup === "function") {
            update = session.lookup("update");
            draw = session.lookup("draw");
          }
          var hasUpdate = typeof update === "function";
          var hasDraw = typeof draw === "function";
          if (!hasUpdate && !hasDraw) {
            throw new Error("3d.run looks for update() and draw(). Write one of them, or use 3d.wait() inside a loop.");
          }
          show("3d");
          loop3 = true;
          try {
            while (!session.stopped && loop3) {
              if (hasUpdate) await update();
              if (session.stopped) break;
              if (hasDraw) await draw();
              if (session.stopped) break;
              engine.update();
              paint();
              await nextFrame();
            }
          } finally {
            loop3 = false;
          }
          checkStop();
        },
        stop: function () {
          loop3 = false;
          halt();
        },
        beep: function (freq, ms) {
          needCount("3d.beep", arguments.length, 0, 2, "beep() or beep(frequency, milliseconds)");
          tone(engine, freq == null ? 440 : num(freq, "3d.beep", "frequency"), ms == null ? 120 : num(ms, "3d.beep", "milliseconds"));
        },
        help: function () {
          session.print(helpText("3d", HELP_3D));
        }
      };
      solid = { canvas: canvas, engine: engine, api: api, wipe: wipe };
      paint();
      return api;
    }

    function apiUi() {
      if (desk) return desk.api;
      var form = null;
      var answers = {};
      var themeName = "borland";

      function ensure() {
        if (desk && desk.app) return;
        missing("EmojiEngine", "emoji-engine-2d.js");
        missing("EmojiEngineUI", "emoji-engine-ui.js");
        show("ui");
        var cols = Math.max(48, Math.floor((paneU.clientWidth || 700) / 14));
        var rows = Math.max(18, Math.floor((paneU.clientHeight || 420) / 22));
        var term = new root.EmojiEngine.Terminal({ cols: cols, rows: rows, cellWidth: 14, cellHeight: 22 });
        paneU.appendChild(term.canvas.element);
        var app = new root.EmojiEngineUI.Application(term, { theme: themeName, sound: false });
        app.run();
        desk = desk || { api: api, app: app, term: term };
        desk.app = app;
        desk.term = term;
      }

      function itemsOf(method, rest) {
        var list = rest.length === 1 && Array.isArray(rest[0]) ? rest[0] : rest;
        if (!list.length) throw new Error(method + " needs at least one choice.");
        return list.map(function (item, index) {
          if (typeof item !== "string" && typeof item !== "number") {
            throw new Error(method + " choice " + (index + 1) + " needs to be text. You gave " + preview(item) + ".");
          }
          return String(item);
        });
      }

      function begin(title) {
        form = { title: title || "Window", rows: [] };
      }

      function rows() {
        if (!form) begin("Window");
        return form;
      }

      async function modal(dialog) {
        ensure();
        session.openDialog = dialog;
        show("ui");
        try {
          return await desk.app.modal(dialog);
        } finally {
          if (session.openDialog === dialog) session.openDialog = null;
        }
      }

      var api = {
        __host: true,
        __name: "ui",
        theme: function (name) {
          needCount("ui.theme", arguments.length, 1, 1, "theme(\"borland\") or theme(\"linux\")");
          var next = String(name || "").toLowerCase();
          if (next !== "borland" && next !== "linux") throw new Error("ui.theme takes \"borland\" or \"linux\".");
          themeName = next;
          if (desk && desk.app) desk.app.setTheme(next);
        },
        window: function (title) {
          needCount("ui.window", arguments.length, 0, 1, "window(\"Title\")");
          begin(title == null ? "Window" : text(title, "ui.window", "the title"));
        },
        label: function (words) {
          needCount("ui.label", arguments.length, 1, 1, "label(\"Score\")");
          rows().rows.push({ kind: "label", text: text(words, "ui.label", "the words") });
        },
        note: function (words) {
          needCount("ui.note", arguments.length, 1, 1, "note(\"A longer sentence.\")");
          rows().rows.push({ kind: "note", text: text(words, "ui.note", "the words") });
        },
        button: function (words, fn) {
          needCount("ui.button", arguments.length, 1, 2, "button(\"OK\") or button(\"OK\", function() end)");
          if (fn != null && typeof fn !== "function") throw new Error("ui.button's second value has to be a function. You gave " + preview(fn) + ".");
          rows().rows.push({ kind: "button", text: text(words, "ui.button", "the label"), fn: fn || null });
        },
        field: function (name, label) {
          needCount("ui.field", arguments.length, 1, 2, "field(\"name\") or field(\"name\", \"Your name\")");
          var id = text(name, "ui.field", "the name");
          rows().rows.push({ kind: "field", name: id, label: label == null ? id : text(label, "ui.field", "the label") });
        },
        check: function (name, label) {
          needCount("ui.check", arguments.length, 1, 2, "check(\"sound\") or check(\"sound\", \"Sound on\")");
          var id = text(name, "ui.check", "the name");
          rows().rows.push({ kind: "check", name: id, label: label == null ? id : text(label, "ui.check", "the label") });
        },
        pick: function (name) {
          if (arguments.length < 2) needCount("ui.pick", arguments.length, 2, null, "pick(\"color\", \"red\", \"green\") or pick(\"color\", list)");
          var id = text(name, "ui.pick", "the name");
          var rest = Array.prototype.slice.call(arguments, 1);
          rows().rows.push({ kind: "pick", name: id, label: id, items: itemsOf("ui.pick", rest) });
        },
        show: async function () {
          needCount("ui.show", arguments.length, 0, 0, "show()");
          checkStop();
          ensure();
          var spec = form || { title: "Window", rows: [] };
          form = null;
          if (!spec.rows.length) throw new Error("ui.show has nothing to show. Add a label, a button, or a field first. Call ui.window(\"Title\") before them.");
          var UI = root.EmojiEngineUI;
          var area = desk.app.workArea();
          var title = spec.title;
          var width = Math.max(28, title.length + 6);
          spec.rows.forEach(function (row) {
            var wide = (row.label || row.text || "").length + 6;
            if (row.items) wide = Math.max(wide, 16);
            if (wide + 4 > width) width = wide + 4;
          });
          width = Math.min(Math.max(20, area.w || width), width);
          var inner = Math.max(8, width - 4);
          var y = 1;
          var dialog = new UI.Dialog({ title: title, w: width, h: 6, center: true, closeable: true });
          var live = {};
          spec.rows.forEach(function (row) {
            if (row.kind === "label" || row.kind === "note") {
              var h = row.kind === "note" ? Math.min(4, Math.max(1, Math.ceil(row.text.length / inner))) : 1;
              dialog.add(new UI.StaticText({ x: 2, y: y, w: inner, h: h, text: row.text }));
              y += h;
            } else if (row.kind === "button") {
              dialog.add(new UI.Button({
                x: 2,
                y: y,
                text: row.text,
                isDefault: true,
                result: row.text,
                onPress: row.fn ? function () {
                  Promise.resolve(row.fn()).catch(function (err) {
                    if (session.print && err && !err.magicStop) session.print(err.message || String(err));
                  });
                } : null
              }));
              y += 2;
            } else if (row.kind === "field") {
              dialog.add(new UI.Label({ x: 2, y: y, text: row.label }));
              var input = new UI.InputLine({ x: 2, y: y + 1, w: inner });
              dialog.add(input);
              live[row.name] = { kind: "field", read: function () { return input.value; } };
              y += 3;
            } else if (row.kind === "check") {
              var box = new UI.CheckBox({ x: 2, y: y, text: row.label, w: inner });
              dialog.add(box);
              live[row.name] = { kind: "check", read: function () { return !!box.checked; } };
              y += 1;
            } else if (row.kind === "pick") {
              dialog.add(new UI.Label({ x: 2, y: y, text: row.label }));
              var listH = Math.min(7, Math.max(3, row.items.length + 2));
              var list = new UI.ListBox({ x: 2, y: y + 1, w: inner, h: listH, items: row.items.slice() });
              dialog.add(list);
              live[row.name] = {
                kind: "pick",
                read: function () {
                  return list.selected >= 0 ? list.items[list.selected] : "";
                }
              };
              y += listH + 1;
            }
          });
          dialog.h = Math.max(5, Math.min(area.h || y + 1, y + 1));
          dialog.w = width;
          var buttons = 0;
          spec.rows.forEach(function (row) {
            if (row.kind === "button") buttons += 1;
          });
          var seenButtons = 0;
          dialog.children.forEach(function (child) {
            if (child instanceof UI.Button) {
              seenButtons += 1;
              child.isDefault = seenButtons === 1;
            }
          });
          var result = await modal(dialog);
          answers = {};
          Object.keys(live).forEach(function (key) { answers[key] = live[key].read(); });
          checkStop();
          return result == null ? null : result;
        },
        value: function (name) {
          needCount("ui.value", arguments.length, 1, 1, "value(\"name\")");
          var id = text(name, "ui.value", "the name");
          if (!Object.prototype.hasOwnProperty.call(answers, id)) {
            throw new Error("There is no answer named " + JSON.stringify(id) + ". field, check, and pick each take a name, and value reads it after show.");
          }
          return answers[id];
        },
        say: async function (message) {
          needCount("ui.say", arguments.length, 1, 1, "say(\"Hello\")");
          checkStop();
          ensure();
          var UI = root.EmojiEngineUI;
          var words = text(message, "ui.say", "the message");
          var dialog = new UI.Dialog({ title: "Message", w: 36, h: 8, center: true });
          dialog.add(new UI.StaticText({ x: 2, y: 1, w: 30, h: 3, text: words }));
          dialog.add(new UI.Button({ x: 13, y: 5, text: "&Ok", isDefault: true, result: "ok" }));
          await modal(dialog);
          checkStop();
        },
        ask: async function (prompt) {
          needCount("ui.ask", arguments.length, 0, 1, "ask(\"Your name\")");
          checkStop();
          ensure();
          var UI = root.EmojiEngineUI;
          var words = prompt == null ? "Type, then press Ok." : text(prompt, "ui.ask", "the question");
          var dialog = new UI.Dialog({ title: "Ask", w: 42, h: 8, center: true });
          dialog.add(new UI.StaticText({ x: 2, y: 1, w: 36, h: 2, text: words }));
          var field = new UI.InputLine({ x: 2, y: 3, w: 36 });
          dialog.add(field);
          dialog.add(new UI.Button({ x: 15, y: 5, text: "&Ok", isDefault: true, result: "ok" }));
          var result = await modal(dialog);
          checkStop();
          return result == null ? "" : field.value;
        },
        confirm: async function (message) {
          needCount("ui.confirm", arguments.length, 1, 1, "confirm(\"Quit?\")");
          checkStop();
          ensure();
          var UI = root.EmojiEngineUI;
          var words = text(message, "ui.confirm", "the question");
          var dialog = new UI.Dialog({ title: "Check", w: 36, h: 8, center: true });
          dialog.add(new UI.StaticText({ x: 2, y: 1, w: 30, h: 3, text: words }));
          dialog.add(new UI.Button({ x: 6, y: 5, text: "&Yes", isDefault: true, result: "yes" }));
          dialog.add(new UI.Button({ x: 16, y: 5, text: "&No", result: "no" }));
          var answer = await modal(dialog);
          checkStop();
          return answer === "yes";
        },
        choose: async function (title) {
          if (arguments.length < 2) needCount("ui.choose", arguments.length, 2, null, "choose(\"Pick\", \"red\", \"green\")");
          checkStop();
          ensure();
          var UI = root.EmojiEngineUI;
          var heading = text(title, "ui.choose", "the title");
          var items = itemsOf("ui.choose", Array.prototype.slice.call(arguments, 1));
          var listH = Math.min(10, Math.max(3, items.length + 2));
          var dialog = new UI.Dialog({ title: heading, w: 32, h: listH + 4, center: true });
          var list = new UI.ListBox({ x: 2, y: 1, w: 26, h: listH, items: items });
          dialog.add(list);
          list.onAccept = function () {
            dialog.close(list.selected >= 0 ? list.items[list.selected] : null);
          };
          dialog.add(new UI.Button({
            x: 2,
            y: listH + 1,
            text: "&Ok",
            isDefault: true,
            result: "ok",
            onPress: function () {
              dialog.close(list.selected >= 0 ? list.items[list.selected] : null);
            }
          }));
          var picked = await modal(dialog);
          checkStop();
          return picked == null || picked === "ok" ? null : picked;
        },
        help: function () {
          session.print(helpText("ui", HELP_UI));
        }
      };
      desk = { api: api, app: null, term: null, reset: function () { form = null; answers = {}; } };
      return api;
    }

    function resize() {
      if (flat && !pane2.hidden) {
        var w2 = pane2.clientWidth;
        var h2 = pane2.clientHeight;
        if (w2 > 1 && h2 > 1) {
          flat.canvas.element.width = w2;
          flat.canvas.element.height = h2;
          flat.canvas.draw();
        }
      }
      if (solid && !pane3.hidden) {
        var w3 = pane3.clientWidth;
        var h3 = pane3.clientHeight;
        if (w3 > 1 && h3 > 1) {
          solid.canvas.resize(w3, h3);
          try { solid.canvas.draw(); } catch (err) { /* not ready */ }
        }
      }
    }

    function reset() {
      session.stopped = false;
      loop2 = false;
      loop3 = false;
      if (session.openDialog && typeof session.openDialog.close === "function") {
        try { session.openDialog.close(null); } catch (err) { /* gone */ }
      }
      session.openDialog = null;
      if (flat) {
        flat.api.clear("#1c2430");
        flat.canvas.follow(null);
        flat.canvas.setCamera(0, 0);
      }
      if (solid) {
        solid.wipe();
        solid.canvas.follow(null);
        solid.canvas.clearColor = "#1c2430";
        solid.canvas.setCamera(0, 2, 6, 0, 0);
        try { solid.canvas.draw(); } catch (err) { /* not ready */ }
      }
      if (desk && desk.reset) desk.reset();
      hint.hidden = false;
      pane2.hidden = true;
      pane3.hidden = true;
      paneU.hidden = true;
      session.mode = "text";
    }

    var lazy2 = null;
    var lazy3 = null;
    var lazyU = null;
    session.api = {
      "2d": gate("2d", function () { lazy2 = lazy2 || api2d(); return lazy2; }),
      "3d": gate("3d", function () { lazy3 = lazy3 || api3d(); return lazy3; }),
      ui: gate("ui", function () { lazyU = lazyU || apiUi(); return lazyU; })
    };
    session.show = show;
    session.halt = halt;
    session.reset = reset;
    session.resize = resize;
    session.destroy = function () {
      halt();
      container.textContent = "";
    };
    return session;
  }

  function gate(name, build) {
    var api = null;
    var proxy = new Proxy({}, {
      get: function (_target, key) {
        if (typeof key === "symbol") return undefined;
        if (key === "__host") return true;
        if (key === "__name") return name;
        if (key === "then") return undefined;
        api = api || build();
        var value = api[key];
        if (value === undefined && typeof key === "string") {
          var names = Object.keys(api).filter(function (item) { return item[0] !== "_"; });
          var guess = closest(String(key).toLowerCase(), names);
          throw new Error(name + " has no " + key + "." + (guess ? " Did you mean " + name + "." + guess + "?" : ""));
        }
        return typeof value === "function" ? value.bind(api) : value;
      },
      set: function () {
        throw new Error(name + " is a tool. Call " + name + ".something(). You cannot store a new field on it.");
      }
    });
    return proxy;
  }

  function paintShape(ctx, camera, props) {
    var x = props.x - camera.x;
    var y = props.y - camera.y;
    ctx.save();
    if (props.kind === "rect") {
      ctx.fillStyle = props.color;
      ctx.fillRect(x, y, props.w, props.h);
    } else if (props.kind === "circle") {
      ctx.fillStyle = props.color;
      ctx.beginPath();
      ctx.arc(x, y, Math.max(0, props.r), 0, Math.PI * 2);
      ctx.fill();
    } else if (props.kind === "line") {
      ctx.strokeStyle = props.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(props.x2 - camera.x, props.y2 - camera.y);
      ctx.stroke();
    } else if (props.kind === "text") {
      ctx.fillStyle = props.color;
      ctx.font = (props.size || 22) + "px sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(props.text, x, y);
    } else if (props.kind === "emoji") {
      ctx.font = (props.size || 48) + "px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(props.emoji, x, y);
    }
    ctx.restore();
  }

  function touches(a, b) {
    var A = centerOf(a);
    var B = centerOf(b);
    var dx = A.x - B.x;
    var dy = A.y - B.y;
    var reach = radiusOf(a) + radiusOf(b);
    return dx * dx + dy * dy <= reach * reach;
  }

  function centerOf(thing) {
    var p = thing.props;
    if (p.kind === "rect") return { x: p.x + p.w / 2, y: p.y + p.h / 2 };
    return { x: p.x, y: p.y };
  }

  function radiusOf(thing) {
    var p = thing.props;
    if (p.kind === "circle") return p.r;
    if (p.kind === "rect") return Math.min(Math.abs(p.w), Math.abs(p.h)) / 2;
    return (p.size || 32) / 2;
  }

  function tone(engine, freq, ms) {
    if (freq < 20 || freq > 8000) throw new Error("beep frequency stays between 20 and 8000.");
    if (ms < 0 || ms > 8000) throw new Error("beep time stays between 0 and 8000 milliseconds.");
    try {
      var AudioCtor = root.AudioContext || root.webkitAudioContext;
      if (!engine.audio && typeof AudioCtor === "function") engine.audio = new AudioCtor();
      if (engine.audio && engine.audio.state === "suspended" && engine.audio.resume) engine.audio.resume();
    } catch (err) { /* the beep itself will try */ }
    engine.beep(freq, ms);
  }

  function helpText(name, rows) {
    return rows.map(function (row) { return name + "." + row[0] + " — " + row[1]; }).join("\n");
  }

  var HELP_2D = [
    ["clear(color)", "Wipe the picture. Color is optional."],
    ["paper(color)", "Change the background and leave the pictures."],
    ["emoji(picture, x, y, size)", "Draw an emoji. x and y are the center. Gives a number."],
    ["text(words, x, y, size, color)", "Draw words. x and y are the top left."],
    ["rect(x, y, width, height, color)", "A filled rectangle. x and y are the top left."],
    ["circle(x, y, radius, color)", "A filled circle. x and y are the center."],
    ["line(x1, y1, x2, y2, color)", "A line between two points."],
    ["move(number, x, y)", "Put that picture at a new point."],
    ["nudge(number, vx, vy)", "Move it by this much on every wait or run."],
    ["drop(number)", "Remove one picture."],
    ["camera(x, y)", "Put this world point at the top left."],
    ["follow(number)", "Keep that picture centered."],
    ["key(\"left\")", "True while that key is held. left, right, up, down, space, or a letter."],
    ["touch(a, b)", "True when two pictures overlap."],
    ["wait()", "Show the picture and pause for one frame."],
    ["run()", "Call update() and draw() every frame."],
    ["beep(frequency, milliseconds)", "A short square note."],
    ["width and height", "The picture size in pixels. Read them. Do not set them."]
  ];
  var HELP_3D = [
    ["clear(color)", "Remove every solid. Color is optional."],
    ["paper(color)", "Change the sky and leave the solids."],
    ["camera(x, y, z, yaw, pitch)", "Place the eye. Yaw and pitch are degrees."],
    ["look(x, y, z)", "Point the eye at this point."],
    ["box(x, y, z, width, height, depth, color)", "A solid box. Gives a number."],
    ["emoji(picture, x, y, z, size)", "An emoji that faces you. Gives a number."],
    ["move(number, x, y, z)", "Put that solid at a new point."],
    ["nudge(number, vx, vy, vz)", "Move it on every wait or run."],
    ["turn(number, degrees)", "Spin a box or an emoji around up."],
    ["drop(number)", "Remove one solid."],
    ["follow(number)", "Keep the eye behind that solid."],
    ["key(\"left\")", "True while that key is held."],
    ["touch(a, b)", "True when two solids are close."],
    ["wait()", "Show the scene and pause for one frame."],
    ["run()", "Call update() and draw() every frame."],
    ["beep(frequency, milliseconds)", "A short square note."]
  ];
  var HELP_UI = [
    ["say(\"Hello\")", "A small window. Waits until Ok."],
    ["ask(\"Your name\")", "A question. Gives back the text, or \"\" if they close it."],
    ["confirm(\"Quit?\")", "Yes or No. Gives true or false."],
    ["choose(\"Pick\", \"red\", \"green\")", "A list. Gives the chosen text, or nothing."],
    ["window(\"Title\")", "Start a form."],
    ["label(\"Score\")", "One line in the form."],
    ["note(\"A longer sentence.\")", "Wrapped words."],
    ["button(\"OK\", function)", "A button. show gives its label. The function is optional."],
    ["field(\"name\", \"Your name\")", "A line they can type in."],
    ["check(\"sound\", \"Sound on\")", "A box they can tick."],
    ["pick(\"color\", \"red\", \"green\")", "A list inside the form."],
    ["show()", "Open the form and wait. Gives the button label, or nothing."],
    ["value(\"name\")", "Read a field, a check, or a pick after show."],
    ["theme(\"borland\")", "borland or linux."]
  ];

  root.EmojiBridge = {
    mount: mount,
    color: function (value) { return color(value, "color"); },
    palette: PALETTE.slice()
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
