// Glass. The emoji engine's terminal, with the calls the games already make.
// Witch I talks to EmojiEngine itself and does not use this file.
(function () {
  "use strict";

  function isReturn(key) {
    return key === "Enter" || key === "NumpadEnter";
  }

  function isRestart(key) {
    return key === "r" || key === "R";
  }

  function isForeignTyping(el) {
    if (!el || el === document.body || el === document.documentElement) return false;
    const tag = el.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
    return !!el.isContentEditable;
  }

  function isGameLive() {
    if (window.GameDesk && typeof window.GameDesk.live === "function") return !!window.GameDesk.live();
    return true;
  }

  function armGameKeys(handler) {
    function onKey(event) {
      if (!isGameLive()) return;
      if (isForeignTyping(event.target)) return;
      const key = event.key;
      if (key === "ArrowUp" || key === "ArrowDown" || key === "ArrowLeft" || key === "ArrowRight" || key === " " || key === "Tab") {
        event.preventDefault();
      }
      handler(event);
    }
    document.addEventListener("keydown", onKey, true);
    return function () {
      document.removeEventListener("keydown", onKey, true);
    };
  }

  class Glass {
    constructor(options) {
      options = options || {};
      const E = globalThis.EmojiEngine;
      if (!E) throw new Error("Emoji engine is missing");
      const cols = options.cols || 80;
      const rows = options.rows || 24;
      const cellWidth = options.cellWidth || Math.max(11, Math.min(20, Math.floor(960 / cols)));
      const cellHeight = options.cellHeight || Math.max(16, Math.round(cellWidth * 1.45));
      this.cols = cols;
      this.rows = rows;
      this.charW = cellWidth;
      this.charH = cellHeight;
      this.autoRender = options.autoRender !== false;
      this.cursorEnabled = options.showCursor !== false;
      this.cursorStyle = options.cursorStyle || "block";
      this.core = new E.Terminal({
        cols: cols,
        rows: rows,
        cellWidth: cellWidth,
        cellHeight: cellHeight,
        showCursor: this.cursorEnabled,
        cursorStyle: this.cursorStyle,
        cursorColor: options.cursor || "#d6ff9a",
        cursorSpeed: this.cursorEnabled ? 530 : 0
      });
      this.engine = new E.Engine({ canvas: this.core.canvas });
      this.core.color(2, 0);
      this.core.cursorLit = this.cursorEnabled;
      this.core.cursorColor = options.cursor || "#d6ff9a";
      this.core.setCursorStyle(this.cursorStyle);
      const showFooter = options.footer !== false;
      this.ui = E.Utilities.wrap(this.core, {
        title: options.title || document.title || "Emoji Games",
        footer: showFooter
      });
      this.wrap = this.ui.wrap;
      this.wrap.classList.add("ee-game");
      this.wrap.tabIndex = 0;
      this.wrap.setAttribute("role", "application");
      this.wrap.style.outline = "none";
      this.headerMiddle = this.ui.headerMiddle;
      this.footerEl = this.ui.footer;
      this.canvas = this.core.canvas.element;
      const border = options.border || "#39ff14";
      this.canvas.style.background = options.bg || "#000000";
      this.canvas.style.border = "2px solid " + border;
      this.canvas.style.boxShadow = "0 0 16px " + border + "55";
      this.canvas.style.width = "100%";
      this.canvas.style.height = "auto";
      this.canvas.style.display = "block";
      if (typeof options.footer === "string" && this.footerEl) this.footerEl.textContent = options.footer;
      this._destroyed = false;
      this._onDocKeyDown = (event) => this._forwardKey(event);
      document.addEventListener("keydown", this._onDocKeyDown, true);
      this.wrap.addEventListener("click", () => this.focus());
      this.wrap.addEventListener("keydown", (event) => {
        if (event.key === "F11") {
          event.preventDefault();
          this.toggleFullscreen();
        }
      });
      if (!this.autoRender) this.core.beginFrame();
      this.core.flush();
    }

    focus() {
      if (this.wrap) this.wrap.focus();
    }

    toggleFullscreen() {
      if (window.GameDesk && window.GameDesk.open && typeof window.GameDesk.close === "function") {
        if (document.fullscreenElement) {
          window.GameDesk.close();
          return;
        }
        const stage = document.getElementById("game-stage");
        if (stage && stage.requestFullscreen) {
          Promise.resolve(stage.requestFullscreen()).catch(function () {});
          return;
        }
      }
      const request = document.fullscreenElement ? document.exitFullscreen() : this.wrap.requestFullscreen();
      if (request && request.catch) request.catch(function () {});
    }

    setFooter(text) {
      if (this.footerEl) this.footerEl.textContent = text;
    }

    destroy() {
      if (this._destroyed) return;
      this._destroyed = true;
      document.removeEventListener("keydown", this._onDocKeyDown, true);
      if (this.wrap && this.wrap.parentNode) this.wrap.parentNode.removeChild(this.wrap);
    }

    tone(freq, seconds, type) {
      const ms = Math.max(16, Math.round((Number(seconds) || 0.08) * 1000));
      const hz = Number(freq) || 440;
      const engine = this.engine;
      if (engine.audio && engine.audio.state === "suspended") engine.audio.resume();
      if (!type || type === "square") {
        engine.beep(hz, ms);
        return;
      }
      const AudioCtor = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (typeof AudioCtor !== "function") return;
      try {
        const audio = engine.audio || new AudioCtor();
        engine.audio = audio;
        if (audio.state === "suspended") audio.resume();
        const osc = audio.createOscillator();
        const gain = audio.createGain();
        osc.type = type;
        osc.frequency.value = hz;
        gain.gain.value = 0.05;
        osc.connect(gain);
        gain.connect(audio.destination);
        const stopAt = audio.currentTime + ms / 1000;
        gain.gain.exponentialRampToValueAtTime(0.0001, stopAt);
        osc.start();
        osc.stop(stopAt);
      } catch (err) {}
    }

    resumeAudio() {
      const audio = this.engine && this.engine.audio;
      if (audio && audio.state === "suspended") audio.resume();
    }

    write(text) {
      let buf = "";
      const flush = () => {
        if (!buf) return;
        this.core.write(buf);
        buf = "";
      };
      for (const ch of String(text)) {
        if (ch === "\b") {
          flush();
          if (this.core.cursor.col > 0) {
            this.core.cursor.col -= 1;
            this.core.set(this.core.cursor.col, this.core.cursor.row, {
              ch: " ",
              fg: this.core.fg,
              bg: this.core.bg,
              bright: this.core.bright
            });
          }
        } else {
          buf += ch;
        }
      }
      flush();
    }

    writeln(text) {
      this.write((text || "") + "\n");
    }

    writeAnsi(text) {
      this.write(text);
    }

    moveTo(x, y) {
      this.core.place(Math.floor(x), Math.floor(y));
    }

    writeAt(x, y, text) {
      this.moveTo(x, y);
      this.write(text);
    }

    setFg(n) {
      this.core.fg = n & 15;
      this.core.fgRgb = null;
    }

    setBg(n) {
      this.core.bg = n & 15;
      this.core.bgRgb = null;
    }

    setBright(on) {
      this.core.bright = !!on;
    }

    resetAttr() {
      this.core.fg = 2;
      this.core.bg = 0;
      this.core.fgRgb = null;
      this.core.bgRgb = null;
      this.core.bright = false;
      this.core.bold = false;
    }

    clear() {
      this.core.clear();
      this.resetAttr();
    }

    fill(x, y, w, h, ch, fg, bg) {
      const glyph = Array.from(ch == null ? " " : String(ch))[0] || " ";
      const ink = fg == null ? this.core.fg : fg;
      const paper = bg == null ? this.core.bg : bg;
      const x0 = Math.max(0, x);
      const y0 = Math.max(0, y);
      const x1 = Math.min(this.cols, x + w);
      const y1 = Math.min(this.rows, y + h);
      for (let row = y0; row < y1; row++) {
        for (let col = x0; col < x1; col++) {
          this.core.set(col, row, { ch: glyph, fg: ink, bg: paper, bright: false });
        }
      }
    }

    hideCursor() {
      this.cursorEnabled = false;
      this.core.cursorLit = false;
      this.core.cursorSpeed(0);
      this.core.dirty = true;
      if (this.core.batch === 0) this.core.flush();
    }

    showCursor() {
      this.cursorEnabled = true;
      this.core.cursorLit = true;
      this.core.setCursorStyle(this.cursorStyle);
      this.core.cursorSpeed(530);
      this.core.dirty = true;
      if (this.core.batch === 0) this.core.flush();
    }

    beginFrame() {
      this.core.beginFrame();
    }

    endFrame() {
      this.core.endFrame();
    }

    render() {
      const batch = this.core.batch;
      this.core.batch = 0;
      this.core.dirty = true;
      this.core.flush();
      this.core.batch = batch;
    }

    onKey(handler) {
      const wrapped = (event) => {
        const key = event.key;
        if (
          key === "ArrowUp" || key === "ArrowDown" || key === "ArrowLeft" || key === "ArrowRight" ||
          key === "Tab" || key === " " ||
          (event.ctrlKey && (key === "s" || key === "S" || key === "r" || key === "R"))
        ) {
          event.preventDefault();
        }
        this.resumeAudio();
        handler(event);
      };
      this.wrap.addEventListener("keydown", wrapped);
      return () => this.wrap.removeEventListener("keydown", wrapped);
    }

    isKeyDown(key) {
      return this.core.isKeyDown(key) || this.engine.isKeyDown(key);
    }

    paintCard(spec) {
      spec = spec || {};
      const rows = [];
      if (spec.kicker) rows.push({ text: spec.kicker, fg: 6 });
      rows.push({ text: spec.title || "", fg: spec.fg == null ? 11 : spec.fg, bright: true });
      rows.push({ text: "", fg: 7 });
      (spec.lines || []).forEach((line) => {
        if (typeof line === "string") rows.push({ text: line, fg: 7 });
        else rows.push({ text: line.text || "", fg: line.fg == null ? 7 : line.fg, bright: !!line.bright });
      });
      rows.push({ text: "", fg: 7 });
      if (spec.foot) rows.push({ text: spec.foot, fg: 10, bright: true });
      this.beginFrame();
      this.cursorEnabled = false;
      this.core.cursorLit = false;
      this.core.cursorSpeed(0);
      this.clear();
      const start = Math.max(1, Math.floor((this.rows - rows.length) / 2));
      rows.forEach((row, index) => {
        const text = String(row.text || "").slice(0, this.cols);
        const width = Array.from(text).length;
        const x = Math.max(0, Math.floor((this.cols - width) / 2));
        this.setBright(!!row.bright);
        this.setFg(row.fg == null ? 7 : row.fg);
        this.writeAt(x, start + index, text);
      });
      this.resetAttr();
      this.endFrame();
      if (!this.autoRender) this.render();
    }

    _forwardKey(event) {
      if (this._destroyed || event.__fromGlass) return;
      if (!isGameLive()) return;
      if (event.target && this.wrap.contains(event.target)) return;
      if (isForeignTyping(event.target)) return;
      const forwarded = new KeyboardEvent("keydown", {
        key: event.key,
        code: event.code,
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
        altKey: event.altKey,
        shiftKey: event.shiftKey,
        repeat: event.repeat,
        bubbles: true,
        cancelable: true
      });
      forwarded.__fromGlass = true;
      this.wrap.dispatchEvent(forwarded);
      if (forwarded.defaultPrevented) event.preventDefault();
    }
  }

  globalThis.Glass = Glass;
  globalThis.isReturn = isReturn;
  globalThis.isRestart = isRestart;
  globalThis.armGameKeys = armGameKeys;
  globalThis.isGameLive = isGameLive;
})();
