/**
 * Full-canvas VT100-style terminal emulator.
 * Cell buffer is the single source of truth. No per-cell DOM spans.
 * Supports 16/256/truecolor, optional cursor, scrolling, get/set, and primitives.
 */
class Terminal {
  /**
   * @param {object} [options]
   * @param {number} [options.cols=80]
   * @param {number} [options.rows=24]
   * @param {string} [options.font]
   * @param {string} [options.fontSize='15px']
   * @param {string} [options.fg='#39ff14']
   * @param {string} [options.bg='#000000']
   * @param {string} [options.border='#39ff14']
   * @param {boolean} [options.hideMouse=true]
   * @param {boolean} [options.autoRender=true]
   * @param {boolean} [options.focusHint=true]
   * @param {boolean} [options.showCursor=true]
   * @param {number} [options.scale=1]
   * Cell size multiplier. 1 keeps the 10×18 pixel cell and `fontSize`.
   * 2 draws every cell twice as wide and twice as tall (the area of four
   * cells at scale 1) and doubles a pixel font so the glyph stays sharp.
   * @param {boolean} [options.fitWidth=false]
   * Grow or shrink the whole window so it matches the container width.
   * The column and row counts stay the same.
   */
  constructor(options = {}) {
    this.cols = options.cols || 80;
    this.rows = options.rows || 24;
    this.font = options.font || '"Courier New", Courier, monospace';
    this.fontSize = options.fontSize || '15px';
    this.fg = options.fg || '#39ff14';
    this.bg = options.bg || '#000000';
    this.border = options.border || '#39ff14';
    this.hideMouse = options.hideMouse !== undefined ? options.hideMouse : true;
    this.autoRender = options.autoRender !== undefined ? options.autoRender : true;
    this.focusHint = options.focusHint !== undefined ? options.focusHint : true;
    this.cursorEnabled = options.showCursor !== false;
    this.scale = this._scaleOf(options.scale);
    this.fitWidth = options.fitWidth === true;
    // Scale 1 must keep the font string it was given. A larger scale turns
    // a pixel size into pixels times scale, and the cell grows with it.
    this.drawFontSize = this.scale === 1
      ? this.fontSize
      : ((parseFloat(this.fontSize) || 15) * this.scale) + 'px';
    this.charW = 10 * this.scale;
    this.charH = 18 * this.scale;

    this.colors = [
      '#000000','#aa0000','#00aa00','#aa5500',
      '#0000aa','#aa00aa','#00aaaa','#aaaaaa',
      '#555555','#ff5555','#55ff55','#ffff55',
      '#5555ff','#ff55ff','#55ffff','#ffffff'
    ];
    this.xterm256 = this._buildXterm256();

    this.wrap = document.createElement('div');
    this.wrap.className = 'terminal-outer';
    this.wrap.tabIndex = 0;
    this.wrap.style.cssText = `
      display: flex; flex-direction: column; align-items: center;
      width: 100%; max-width: 100%; min-width: 0;
      margin: 0 auto; outline: none; box-sizing: border-box;
    `;

    // Stage hugs the canvas. The title bar must not widen the window,
    // or a narrow game (Witch Hunt is 40 columns) sits on the left.
    this.stage = document.createElement('div');
    this.stage.className = 'terminal-stage';
    this.stage.style.cssText = `
      display: flex; flex-direction: column; align-items: stretch;
      min-width: 0; max-width: 100%; margin: 0 auto; box-sizing: border-box;
      container-type: inline-size;
    `;
    this.wrap.appendChild(this.stage);

    // ===== Header =====
    this.titleBar = document.createElement('div');
    this.titleBar.className = 'terminal-title';
    this.titleBar.style.cssText = `
      display: flex; align-items: center; justify-content: space-between;
      background: #111; padding: 8px 12px; font-family: system-ui, sans-serif;
      font-size: clamp(1rem, 4cqw, 1.75rem); font-weight: 600; color: #fff; gap: 12px;
      width: 100%; min-width: 0; box-sizing: border-box; overflow: hidden;
    `;

    this.titleText = document.createElement('span');
    this.titleText.textContent = 'Terminal';
    this.titleText.style.cssText = `
      flex: 0 1 auto; min-width: 0; overflow: hidden;
      text-overflow: ellipsis; white-space: nowrap;
    `;

    this.headerMiddle = document.createElement('div');
    this.headerMiddle.style.cssText = `
      flex: 1 1 auto; min-width: 0; text-align: center; font-size: 1rem; font-weight: 500;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    `;

    this.fsBtn = document.createElement('button');
    this.fsBtn.innerHTML = '<b>F11</b> Fullscreen ⛶';
    this.fsBtn.style.cssText = `
      background: #111; color: #fff; border: 1px solid #39ff14; border-radius: 4px;
      padding: 6px 12px; font-size: clamp(0.8rem, 2.6cqw, 1.1rem); font-family: system-ui, sans-serif;
      font-weight: 600; cursor: pointer; flex: 0 1 auto; min-width: 0;
      white-space: nowrap;
    `;
    this.fsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleFullscreen();
    });

    this.titleBar.appendChild(this.titleText);
    this.titleBar.appendChild(this.headerMiddle);
    this.titleBar.appendChild(this.fsBtn);
    this.stage.appendChild(this.titleBar);

    // ===== Canvas =====
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.canvas.style.cssText = `
      border: 2px solid ${this.border};
      box-shadow: 0 0 12px ${this.border}40;
      cursor: ${this.hideMouse ? 'none' : 'auto'};
      display: block; margin: 0 auto; box-sizing: content-box;
    `;
    this.stage.appendChild(this.canvas);

    // ===== Footer (plain) =====
    this.footer = document.createElement('div');
    this.footer.className = 'terminal-footer';
    this.footer.style.cssText = `
      background: #111; padding: 6px 12px; font-family: system-ui, sans-serif;
      font-size: 1rem; color: #fff; flex-shrink: 0;
      width: 100%; min-width: 0; box-sizing: border-box;
      overflow-wrap: anywhere;
    `;
    this.stage.appendChild(this.footer);

    this._onFullscreen = () => {
      if (document.fullscreenElement) {
        this.fsBtn.innerHTML = '<b>Esc</b> Exit ⎋';
        setTimeout(() => this.focus(), 50);
      } else {
        this.fsBtn.innerHTML = '<b>F11</b> Fullscreen ⛶';
      }
      requestAnimationFrame(() => this._layout());
    };
    document.addEventListener('fullscreenchange', this._onFullscreen);

    this._onResize = () => this._layout();
    window.addEventListener('resize', this._onResize);
    if (typeof ResizeObserver !== 'undefined') {
      this._ro = new ResizeObserver(() => this._layout());
      this._ro.observe(this.wrap);
    }

    this.wrap.addEventListener('keydown', (e) => {
      if (e.key === 'F11') {
        e.preventDefault();
        this.toggleFullscreen();
      }
    });

    setTimeout(() => {
      this.detectTitle();
      this._layout();
    }, 0);

    this.buffer = [];
    for (let y = 0; y < this.rows; y++) {
      const row = [];
      for (let x = 0; x < this.cols; x++) {
        row.push({ ch: ' ', fg: 2, bg: 0, bright: false, fgRgb: null, bgRgb: null });
      }
      this.buffer.push(row);
    }

    this.cx = 0;
    this.cy = 0;
    this.fgIdx = 2;
    this.bgIdx = 0;
    this.fgRgb = null;
    this.bgRgb = null;
    this.bright = false;
    this.cursorOn = true;
    this._focused = false;
    this._hintShown = false;
    this._keysDown = new Set();

    this.wrap.addEventListener('focus', () => {
      this._focused = true;
      if (this._hintShown) {
        this._hintShown = false;
        this.render();
      }
    });
    this.wrap.addEventListener('blur', () => {
      this._focused = false;
      if (this.focusHint) {
        this._hintShown = true;
        this.render();
      }
    });
    this.wrap.addEventListener('click', () => this.focus());

    this.wrap.addEventListener('keydown', (e) => this._keysDown.add(e.key));
    this.wrap.addEventListener('keyup', (e) => this._keysDown.delete(e.key));

    this._onDocKeyDown = (e) => this._forwardKey(e);
    document.addEventListener('keydown', this._onDocKeyDown, true);

    this._setupCanvas();

    this._blink = setInterval(() => {
      this.cursorOn = !this.cursorOn;
      if (this.autoRender) this.render();
    }, 530);

    this.render();
  }

  // ===== Getters =====
  get headerMiddleEl() { return this.headerMiddle; }
  get footerEl() { return this.footer; }

  /** @private */
  _scaleOf(value) {
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) return 1;
    return n;
  }

  /** @private */
  _buildXterm256() {
    const c = new Array(256);
    const classic = [
      '#000000','#800000','#008000','#808000','#000080','#800080','#008080','#c0c0c0',
      '#808080','#ff0000','#00ff00','#ffff00','#0000ff','#ff00ff','#00ffff','#ffffff'
    ];
    for (let i = 0; i < 16; i++) c[i] = classic[i];
    const steps = [0, 95, 135, 175, 215, 255];
    for (let r = 0; r < 6; r++)
      for (let g = 0; g < 6; g++)
        for (let b = 0; b < 6; b++)
          c[16 + r * 36 + g * 6 + b] = `rgb(${steps[r]},${steps[g]},${steps[b]})`;
    for (let i = 0; i < 24; i++) {
      const v = 8 + i * 10;
      c[232 + i] = `rgb(${v},${v},${v})`;
    }
    return c;
  }

  /** @private */
  _setupCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const w = this.cols * this.charW;
    const h = this.rows * this.charH;
    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.stage.style.width = (w + 4) + 'px';
    this.ctx.scale(dpr, dpr);
    this.ctx.font = `${this.drawFontSize} ${this.font}`;
    this.ctx.textBaseline = 'top';
    this._layout();
  }

  /**
   * Match the window to the cell grid. fitWidth grows it to the container.
   * A narrower parent, or fullscreen, shrinks it so the window stays on screen.
   * @private
   */
  _layout() {
    if (this._laying || !this.stage || !this.canvas || !this.wrap.isConnected) return;
    this._laying = true;
    try {
    this._layoutNow();
    } finally {
      this._laying = false;
    }
  }

  /** @private */
  _layoutNow() {
    const logicalW = this.cols * this.charW;
    const logicalH = this.rows * this.charH;
    const border = 4;
    const full = document.fullscreenElement === this.wrap;
    const cs = getComputedStyle(this.wrap);
    const padX = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
    const padY = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
    const availW = this.wrap.clientWidth - padX;
    const availH = full ? this.wrap.clientHeight - padY : Infinity;
    if (availW < 8) return;

    let scale = 1;
    const widthScale = availW / (logicalW + border);
    if (this.fitWidth || widthScale < 1) scale = widthScale;

    const apply = (s) => {
      let cw = Math.max(1, Math.floor(logicalW * s));
      let ch = Math.max(1, Math.floor(logicalH * s));
      if (cw + border > availW) cw = Math.max(1, Math.floor(availW) - border);
      this.canvas.style.width = cw + 'px';
      this.canvas.style.height = ch + 'px';
      this.stage.style.width = (cw + border) + 'px';
    };

    apply(scale);
    if (availH < Infinity) {
      for (let i = 0; i < 4; i++) {
        const total = this.stage.offsetHeight;
        if (total <= availH || total < 1) break;
        scale *= (availH - 1) / total;
        apply(scale);
      }
    }
  }

  get(x, y) {
    if (x < 0 || y < 0 || x >= this.cols || y >= this.rows) return null;
    const c = this.buffer[y][x];
    return {
      ch: c.ch,
      fg: c.fg,
      bg: c.bg,
      fgRgb: c.fgRgb ? { ...c.fgRgb } : null,
      bgRgb: c.bgRgb ? { ...c.bgRgb } : null,
      bright: c.bright
    };
  }

  set(x, y, data = {}) {
    if (x < 0 || y < 0 || x >= this.cols || y >= this.rows) return;
    const cell = this.buffer[y][x];
    if (data.ch != null) cell.ch = [...data.ch][0] || ' ';
    if (data.fg !== undefined) cell.fg = data.fg;
    if (data.bg !== undefined) cell.bg = data.bg;
    if (data.fgRgb !== undefined) cell.fgRgb = data.fgRgb;
    if (data.bgRgb !== undefined) cell.bgRgb = data.bgRgb;
    if (data.bright !== undefined) cell.bright = !!data.bright;
  }

  detectTitle() {
    const game = this.wrap.closest('#game') || this.wrap.parentElement;
    let title = '';
    if (game) {
      const h = game.querySelector('h1, h2, h3');
      if (h) title = h.textContent.trim();
    }
    if (!title) title = document.title || 'Terminal';
    this.titleText.textContent = title;
  }

  toggleFullscreen() {
    const stage = document.getElementById("game-stage");
    const root = (window.GameDesk && window.GameDesk.open && stage) ? stage : this.wrap;
    if (!document.fullscreenElement) {
      root.requestFullscreen().then(() => this.wrap.focus()).catch(() => {});
    } else {
      document.exitFullscreen();
    }
  }

  put(ch, x = this.cx, y = this.cy) {
    this.set(x, y, {
      ch,
      fg: this.fgIdx,
      bg: this.bgIdx,
      fgRgb: this.fgRgb,
      bgRgb: this.bgRgb,
      bright: this.bright
    });
  }

  write(text) {
    const chars = [...text];
    for (const ch of chars) {
      if (ch === '\n') {
        this.cx = 0;
        this.cy++;
        if (this.cy >= this.rows) {
          this.scroll();
          this.cy = this.rows - 1;
        }
      } else if (ch === '\r') {
        this.cx = 0;
      } else if (ch === '\b') {
        if (this.cx > 0) {
          this.cx--;
          this.put(' ');
        }
      } else {
        if (this.cx >= this.cols) {
          this.cx = 0;
          this.cy++;
          if (this.cy >= this.rows) {
            this.scroll();
            this.cy = this.rows - 1;
          }
        }
        this.put(ch);
        this.cx++;
      }
    }
    if (this.autoRender) this.render();
  }

  writeln(text = '') { this.write(text + '\n'); }
  writeAt(x, y, text) { this.moveTo(x, y); this.write(text); }

  fill(x, y, w, h, ch = ' ', fg, bg) {
    const oldFg = this.fgIdx, oldBg = this.bgIdx;
    if (fg != null) this.fgIdx = fg;
    if (bg != null) this.bgIdx = bg;
    for (let yy = Math.max(0, y); yy < Math.min(this.rows, y + h); yy++) {
      for (let xx = Math.max(0, x); xx < Math.min(this.cols, x + w); xx++) {
        this.put(ch, xx, yy);
      }
    }
    this.fgIdx = oldFg;
    this.bgIdx = oldBg;
    if (this.autoRender) this.render();
  }

  getChar(x, y) { return this.get(x, y); }

  moveTo(x, y) {
    this.cx = Math.max(0, Math.min(this.cols - 1, Math.floor(x)));
    this.cy = Math.max(0, Math.min(this.rows - 1, Math.floor(y)));
  }

  home() { this.moveTo(0, 0); }

  clear() {
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        this.set(x, y, { ch: ' ', fg: 2, bg: 0, fgRgb: null, bgRgb: null, bright: false });
      }
    }
    this.cx = 0;
    this.cy = 0;
    if (this.autoRender) this.render();
  }

  clearLine() {
    for (let x = this.cx; x < this.cols; x++) this.put(' ', x, this.cy);
    if (this.autoRender) this.render();
  }

  scroll() {
    this.buffer.shift();
    const newRow = [];
    for (let x = 0; x < this.cols; x++) {
      newRow.push({ ch: ' ', fg: 2, bg: 0, bright: false, fgRgb: null, bgRgb: null });
    }
    this.buffer.push(newRow);
  }

  hideCursor() { this.cursorEnabled = false; this.render(); }
  showCursor() { this.cursorEnabled = true; this.render(); }

  /** @private */
  _isForeignTyping(el) {
    if (!el || el === document.body || el === document.documentElement) return false;
    if (this.wrap.contains(el)) return false;
    const tag = el.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'A' || tag === 'BUTTON') return true;
    return !!el.isContentEditable;
  }

  /** @private */
  _forwardKey(e) {
    if (this._destroyed || e.__fromTerminal) return;
    if (window.GameDesk && typeof window.GameDesk.live === "function" && !window.GameDesk.live()) return;
    if (e.target && this.wrap.contains(e.target)) return;
    if (this._isForeignTyping(e.target)) return;
    const fwd = new KeyboardEvent('keydown', {
      key: e.key,
      code: e.code,
      ctrlKey: e.ctrlKey,
      metaKey: e.metaKey,
      altKey: e.altKey,
      shiftKey: e.shiftKey,
      repeat: e.repeat,
      bubbles: true,
      cancelable: true
    });
    fwd.__fromTerminal = true;
    this.wrap.dispatchEvent(fwd);
    if (fwd.defaultPrevented) e.preventDefault();
    if (document.activeElement !== this.wrap) setTimeout(() => this.focus(), 0);
  }

  destroy() {
    if (this._destroyed) return;
    this._destroyed = true;
    clearInterval(this._blink);
    document.removeEventListener('keydown', this._onDocKeyDown, true);
    document.removeEventListener('fullscreenchange', this._onFullscreen);
    window.removeEventListener('resize', this._onResize);
    if (this._ro) this._ro.disconnect();
    this.wrap.remove();
  }

  setHideMouse(hide) {
    this.hideMouse = !!hide;
    this.canvas.style.cursor = this.hideMouse ? 'none' : 'auto';
  }
  toggleHideMouse() { this.setHideMouse(!this.hideMouse); }

  focus() { this.wrap.focus(); }

  onKey(handler) {
    const wrapped = (e) => {
      const k = e.key;
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Tab'].includes(k) ||
          (e.ctrlKey && ['r','R','f','F'].includes(k))) {
        e.preventDefault();
        e.stopPropagation();
      }
      handler(e);
    };
    this.wrap.addEventListener('keydown', wrapped);
    return () => this.wrap.removeEventListener('keydown', wrapped);
  }

  setFg(n) { this.fgIdx = n & 15; this.fgRgb = null; }
  setBg(n) { this.bgIdx = n & 15; this.bgRgb = null; }
  setBright(b) { this.bright = !!b; }
  resetAttr() { this.fgIdx = 2; this.bgIdx = 0; this.fgRgb = null; this.bgRgb = null; this.bright = false; }

  writeAnsi(text) {
    let i = 0;
    while (i < text.length) {
      if (text[i] === '\x1b' && text[i + 1] === '[') {
        let j = i + 2;
        let params = '';
        while (j < text.length && !/[A-Za-z]/.test(text[j])) {
          params += text[j];
          j++;
        }
        const cmd = text[j] || '';
        const nums = params ? params.split(';').map(n => parseInt(n, 10) || 0) : [0];

        if (cmd === 'm') {
          let k = 0;
          while (k < nums.length) {
            const n = nums[k];
            if (n === 0) this.resetAttr();
            else if (n === 1) this.bright = true;
            else if (n === 22) this.bright = false;
            else if (n >= 30 && n <= 37) { this.fgIdx = n - 30; this.fgRgb = null; }
            else if (n >= 40 && n <= 47) { this.bgIdx = n - 40; this.bgRgb = null; }
            else if (n >= 90 && n <= 97) { this.fgIdx = n - 90; this.bright = true; this.fgRgb = null; }
            else if (n >= 100 && n <= 107) { this.bgIdx = n - 100; this.bgRgb = null; }
            else if (n === 38 && nums[k + 1] === 5) { this.fgIdx = nums[k + 2]; this.fgRgb = null; k += 2; }
            else if (n === 48 && nums[k + 1] === 5) { this.bgIdx = nums[k + 2]; this.bgRgb = null; k += 2; }
            else if (n === 38 && nums[k + 1] === 2) {
              this.fgRgb = { r: nums[k + 2], g: nums[k + 3], b: nums[k + 4] };
              this.fgIdx = null;
              k += 4;
            } else if (n === 48 && nums[k + 1] === 2) {
              this.bgRgb = { r: nums[k + 2], g: nums[k + 3], b: nums[k + 4] };
              this.bgIdx = null;
              k += 4;
            }
            k++;
          }
        } else if (cmd === 'H' || cmd === 'f') {
          this.moveTo((nums[1] || 1) - 1, (nums[0] || 1) - 1);
        } else if (cmd === 'J' && (nums[0] === 2 || nums[0] === 0)) {
          this.clear();
        } else if (cmd === 'K') {
          this.clearLine();
        } else if (cmd === 'A') this.moveTo(this.cx, this.cy - (nums[0] || 1));
        else if (cmd === 'B') this.moveTo(this.cx, this.cy + (nums[0] || 1));
        else if (cmd === 'C') this.moveTo(this.cx + (nums[0] || 1), this.cy);
        else if (cmd === 'D') this.moveTo(this.cx - (nums[0] || 1), this.cy);
        i = j + 1;
      } else {
        this.write(text[i]);
        i++;
      }
    }
    if (this.autoRender) this.render();
  }

  setFg256(n) { this.fgIdx = n; this.fgRgb = null; }
  setBg256(n) { this.bgIdx = n; this.bgRgb = null; }
  setFgRGB(r, g, b) { this.fgRgb = { r, g, b }; this.fgIdx = null; }
  setBgRGB(r, g, b) { this.bgRgb = { r, g, b }; this.bgIdx = null; }

  rect(x, y, w, h, opts = {}) {
    const fill = !!opts.fill;
    const ch = opts.ch || '█';
    const fg = opts.fg;
    const bg = opts.bg;
    for (let yy = y; yy < y + h; yy++) {
      for (let xx = x; xx < x + w; xx++) {
        if (!fill && yy !== y && yy !== y + h - 1 && xx !== x && xx !== x + w - 1) continue;
        this.set(xx, yy, { ch, fg, bg });
      }
    }
    if (this.autoRender) this.render();
  }

  circle(cx, cy, r, opts = {}) {
    const fill = !!opts.fill;
    const ch = opts.ch || '█';
    const fg = opts.fg;
    const bg = opts.bg;
    const plot = (x, y) => this.set(x, y, { ch, fg, bg });
    let x = r, y = 0, err = 1 - r;
    while (x >= y) {
      if (fill) {
        for (let i = cx - x; i <= cx + x; i++) {
          plot(i, cy + y);
          plot(i, cy - y);
        }
        for (let i = cx - y; i <= cx + y; i++) {
          plot(i, cy + x);
          plot(i, cy - x);
        }
      } else {
        plot(cx + x, cy + y); plot(cx - x, cy + y);
        plot(cx + x, cy - y); plot(cx - x, cy - y);
        plot(cx + y, cy + x); plot(cx - y, cy + x);
        plot(cx + y, cy - x); plot(cx - y, cy - x);
      }
      y++;
      if (err < 0) err += 2 * y + 1;
      else { x--; err += 2 * (y - x) + 1; }
    }
    if (this.autoRender) this.render();
  }

  drawBox(x, y, w, h, style = 'single') {
    const borders = {
      single: ['┌', '─', '┐', '│', '└', '┘'],
      double: ['╔', '═', '╗', '║', '╚', '╝'],
      ascii:  ['+', '-', '+', '|', '+', '+']
    };
    const b = borders[style] || borders.single;
    this.set(x, y, { ch: b[0] });
    this.set(x + w - 1, y, { ch: b[2] });
    this.set(x, y + h - 1, { ch: b[4] });
    this.set(x + w - 1, y + h - 1, { ch: b[5] });
    for (let i = 1; i < w - 1; i++) {
      this.set(x + i, y, { ch: b[1] });
      this.set(x + i, y + h - 1, { ch: b[1] });
    }
    for (let i = 1; i < h - 1; i++) {
      this.set(x, y + i, { ch: b[3] });
      this.set(x + w - 1, y + i, { ch: b[3] });
    }
    if (this.autoRender) this.render();
  }

  isKeyDown(key) { return this._keysDown.has(key); }

  getKey() {
    return new Promise(resolve => {
      const unsub = this.onKey(e => { unsub(); resolve(e); });
    });
  }

  beginFrame() { this.autoRender = false; }
  endFrame() { this.autoRender = true; this.render(); }

  /** @private */
  _resolveColor(idx, rgb) {
    if (rgb) return `rgb(${rgb.r},${rgb.g},${rgb.b})`;
    if (idx == null) return null;
    if (idx < 16) return this.colors[idx];
    return this.xterm256[idx] || this.colors[7];
  }

  render() {
    const ctx = this.ctx;
    const w = this.cols * this.charW;
    const h = this.rows * this.charH;

    ctx.fillStyle = this.bg;
    ctx.fillRect(0, 0, w, h);

    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        const cell = this.buffer[y][x];
        const px = x * this.charW;
        const py = y * this.charH;

        const bg = this._resolveColor(cell.bg, cell.bgRgb);
        if (bg) {
          ctx.fillStyle = bg;
          ctx.fillRect(px, py, this.charW, this.charH);
        }

        if (cell.ch && cell.ch !== ' ') {
          let fgIdx = cell.fg;
          if (cell.bright && fgIdx != null && fgIdx < 8) fgIdx += 8;
          ctx.font = `${cell.bright ? 'bold ' : ''}${this.drawFontSize} ${this.font}`;
          ctx.fillStyle = this._resolveColor(fgIdx, cell.fgRgb) || this.fg;
          ctx.fillText(cell.ch, px, py);
        }
      }
    }

    if (this.cursorEnabled && this.cursorOn && this._focused && this.cx >= 0 && this.cy >= 0 && this.cx < this.cols && this.cy < this.rows) {
      ctx.fillStyle = '#ffff00';
      ctx.fillRect(this.cx * this.charW, this.cy * this.charH, this.charW, this.charH);
    }

    if (this._hintShown) {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, (this.rows - 1) * this.charH, w, this.charH);
      ctx.fillStyle = '#ffff55';
      ctx.fillText(' [ click terminal to continue ] ', 10, (this.rows - 1) * this.charH);
    }
  }
}

if (typeof module !== 'undefined') module.exports = Terminal;
