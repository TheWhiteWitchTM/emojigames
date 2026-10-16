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

    this.charW = 10;
    this.charH = 18;

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
      display: flex; flex-direction: column; width: fit-content;
      margin: 0 auto; outline: none;
    `;

    // ===== Header =====
    this.titleBar = document.createElement('div');
    this.titleBar.style.cssText = `
      display: flex; align-items: center; justify-content: space-between;
      background: #111; padding: 8px 12px; font-family: system-ui, sans-serif;
      font-size: 1.75rem; font-weight: 600; color: #fff; gap: 12px;
    `;

    this.titleText = document.createElement('span');
    this.titleText.textContent = 'Terminal';
    this.titleText.style.flex = '0 0 auto';

    this.headerMiddle = document.createElement('div');
    this.headerMiddle.style.cssText = `
      flex: 1 1 auto; text-align: center; font-size: 1.1rem; font-weight: 500;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    `;

    this.fsBtn = document.createElement('button');
    this.fsBtn.innerHTML = '<b>F11</b> Fullscreen ⛶';
    this.fsBtn.style.cssText = `
      background: #111; color: #fff; border: 1px solid #39ff14; border-radius: 4px;
      padding: 8px 18px; font-size: 1.1rem; font-family: system-ui, sans-serif;
      font-weight: 600; cursor: pointer; flex: 0 0 auto;
    `;
    this.fsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleFullscreen();
    });

    this.titleBar.appendChild(this.titleText);
    this.titleBar.appendChild(this.headerMiddle);
    this.titleBar.appendChild(this.fsBtn);
    this.wrap.appendChild(this.titleBar);

    // ===== Canvas =====
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.canvas.style.cssText = `
      border: 2px solid ${this.border};
      box-shadow: 0 0 12px ${this.border}40;
      cursor: ${this.hideMouse ? 'none' : 'auto'};
      display: block;
    `;
    this.wrap.appendChild(this.canvas);

    // ===== Footer (plain) =====
    this.footer = document.createElement('div');
    this.footer.style.cssText = `
      background: #111; padding: 6px 12px; font-family: system-ui, sans-serif;
      font-size: 1rem; color: #fff; flex-shrink: 0;
    `;
    this.wrap.appendChild(this.footer);

    this._onFullscreen = () => {
      if (document.fullscreenElement === this.wrap) {
        this.fsBtn.innerHTML = '<b>Esc</b> Shrink ⤡';
        setTimeout(() => this.focus(), 50);
      } else {
        this.fsBtn.innerHTML = '<b>F11</b> Fullscreen ⛶';
      }
    };
    document.addEventListener('fullscreenchange', this._onFullscreen);

    this.wrap.addEventListener('keydown', (e) => {
      if (e.key === 'F11') {
        e.preventDefault();
        this.toggleFullscreen();
      }
    });

    setTimeout(() => this.detectTitle(), 0);

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
    this.ctx.scale(dpr, dpr);
    this.ctx.font = `${this.fontSize} ${this.font}`;
    this.ctx.textBaseline = 'top';
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
    if (!document.fullscreenElement) {
      this.wrap.requestFullscreen().then(() => this.wrap.focus()).catch(() => {});
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
            else if (n === 
