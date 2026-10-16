/**
 * Lightweight VT100-style terminal emulator.
 * Supports 16/256/truecolor, dirty-row rendering, optional canvas mode,
 * and game-oriented cell get/set + primitive drawing.
 *
 * Backward compatible with previous public API.
 */
class Terminal {
  /**
   * @param {object} [options]
   * @param {number} [options.cols=80]
   * @param {number} [options.rows=24]
   * @param {string} [options.font]
   * @param {string} [options.fontSize]
   * @param {string} [options.fg='#39ff14']
   * @param {string} [options.bg='#000000']
   * @param {string} [options.border='#39ff14']
   * @param {boolean} [options.hideMouse=true]
   * @param {boolean} [options.autoRender=true]
   * @param {boolean} [options.focusHint=true]
   * @param {boolean} [options.useCanvas=false]
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
    this.useCanvas = options.useCanvas || false;

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
      display: flex; flex-direction: column; width: ${this.cols}ch;
      margin: 0 auto; outline: none;
    `;

    this.titleBar = document.createElement('div');
    this.titleBar.style.cssText = `
      display: flex; align-items: center; justify-content: space-between;
      background: #111; padding: 8px 12px; font-family: system-ui, sans-serif;
      font-size: 1.75rem; font-weight: 600; color: #fff; flex-shrink: 0;
    `;
    this.titleText = document.createElement('span');
    this.titleText.textContent = 'Terminal';
    this.titleBar.appendChild(this.titleText);

    this.fsBtn = document.createElement('button');
    this.fsBtn.innerHTML = '<b>F11</b> Fullscreen ⛶';
    this.fsBtn.style.cssText = `
      background: #111; color: #fff; border: 1px solid #39ff14; border-radius: 4px;
      padding: 8px 18px; font-size: 1.1rem; font-family: system-ui, sans-serif;
      font-weight: 600; cursor: pointer;
    `;
    this.fsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleFullscreen();
    });
    this.titleBar.appendChild(this.fsBtn);
    this.wrap.appendChild(this.titleBar);

    this.screenWrap = document.createElement('div');
    this.screenWrap.className = 'terminal';
    this.screenWrap.style.cssText = `
      background: ${this.bg}; color: ${this.fg}; font-family: ${this.font};
      font-size: ${this.fontSize}; line-height: 1.25; width: 100%;
      height: ${this.rows * 1.25}em; padding: 8px; overflow: hidden;
      white-space: pre; border: 2px solid ${this.border};
      box-shadow: 0 0 12px ${this.border}40; box-sizing: border-box;
      cursor: ${this.hideMouse ? 'none' : 'auto'}; flex-shrink: 0;
    `;
    this.wrap.appendChild(this.screenWrap);

    if (this.useCanvas) {
      this.canvas = document.createElement('canvas');
      this.ctx = this.canvas.getContext('2d');
      this.screenWrap.appendChild(this.canvas);
      this._setupCanvas();
    } else {
      this.screen = document.createElement('div');
      this.screen.style.cssText = 'width:100%;height:100%;overflow:hidden;';
      this.screenWrap.appendChild(this.screen);
    }

    document.addEventListener('fullscreenchange', () => {
      if (document.fullscreenElement === this.wrap) {
        this.fsBtn.innerHTML = '<b>Esc</b> Shrink ⤡';
        setTimeout(() => this.wrap.focus(), 50);
      } else {
        this.fsBtn.innerHTML = '<b>F11</b> Fullscreen ⛶';
      }
    });

    this.wrap.addEventListener('keydown', (e) => {
      if (e.key === 'F11') {
        e.preventDefault();
        this.toggleFullscreen();
      }
    });

    setTimeout(() => this.detectTitle(), 0);

    this.cellEls = [];
    this.buffer = [];
    this.displayed = [];
    this.dirtyRows = new Set();

    for (let y = 0; y < this.rows; y++) {
      const row = [];
      const dispRow = [];
      const rowEls = [];
      if (!this.useCanvas) {
        const rowDiv = document.createElement('div');
        rowDiv.style.whiteSpace = 'pre';
        for (let x = 0; x < this.cols; x++) {
          const span = document.createElement('span');
          span.textContent = ' ';
          rowDiv.appendChild(span);
          rowEls.push(span);
        }
        this.screen.appendChild(rowDiv);
      }
      for (let x = 0; x < this.cols; x++) {
        row.push({ ch: ' ', fg: 2, bg: 0, bright: false, fgRgb: null, bgRgb: null });
        dispRow.push({ ch: ' ', fg: 2, bg: 0, bright: false, isCursor: false, fgRgb: null, bgRgb: null });
      }
      this.cellEls.push(rowEls);
      this.buffer.push(row);
      this.displayed.push(dispRow);
      this.dirtyRows.add(y);
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
        this.markDirty(this.rows - 1);
        this.render();
      }
    });
    this.wrap.addEventListener('blur', () => {
      this._focused = false;
      if (this.focusHint) {
        this._hintShown = true;
        this.markDirty(this.rows - 1);
        this.render();
      }
    });
    this.wrap.addEventListener('click', () => this.focus());

    this.wrap.addEventListener('keydown', (e) => this._keysDown.add(e.key));
    this.wrap.addEventListener('keyup', (e) => this._keysDown.delete(e.key));

    this._blink = setInterval(() => {
      this.cursorOn = !this.cursorOn;
      this.markDirty(this.cy);
      if (this.autoRender) this.render();
    }, 530);

    this.render();
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
    const charW = 10, charH = 18;
    this.canvas.width = this.cols * charW * dpr;
    this.canvas.height = this.rows * charH * dpr;
    this.canvas.style.width = (this.cols * charW) + 'px';
    this.canvas.style.height = (this.rows * charH) + 'px';
    this.ctx.scale(dpr, dpr);
    this.ctx.font = `${this.fontSize} ${this.font}`;
    this.ctx.textBaseline = 'top';
  }

  /** @private */
  markDirty(y) {
    if (y >= 0 && y < this.rows) this.dirtyRows.add(y);
  }

  // ── Cell get / set (preferred for primitives) ──────────────────────────

  /**
   * Get the cell at (x, y). Returns a copy.
   * @param {number} x
   * @param {number} y
   * @returns {{ch:string, fg:number|null, bg:number|null, fgRgb:object|null, bgRgb:object|null, bright:boolean}|null}
   */
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

  /**
   * Set a cell at (x, y). Only provided fields are overwritten.
   * @param {number} x
   * @param {number} y
   * @param {object} data
   * @param {string} [data.ch]
   * @param {number|null} [data.fg]
   * @param {number|null} [data.bg]
   * @param {{r:number,g:number,b:number}|null} [data.fgRgb]
   * @param {{r:number,g:number,b:number}|null} [data.bgRgb]
   * @param {boolean} [data.bright]
   */
  set(x, y, data = {}) {
    if (x < 0 || y < 0 || x >= this.cols || y >= this.rows) return;
    const cell = this.buffer[y][x];
    if (data.ch != null) cell.ch = [...data.ch][0] || ' ';
    if (data.fg !== undefined) cell.fg = data.fg;
    if (data.bg !== undefined) cell.bg = data.bg;
    if (data.fgRgb !== undefined) cell.fgRgb = data.fgRgb;
    if (data.bgRgb !== undefined) cell.bgRgb = data.bgRgb;
    if (data.bright !== undefined) cell.bright = !!data.bright;
    this.markDirty(y);
  }

  // ── Existing public API (unchanged behavior) ───────────────────────────

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
        if (this.cy >= this.rows) this.scroll();
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
          if (this.cy >= this.rows) this.scroll();
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
    this.displayed.shift();
    this.cellEls.shift();
    const newRow = [];
    const newDisp = [];
    for (let x = 0; x < this.cols; x++) {
      newRow.push({ ch: ' ', fg: 2, bg: 0, bright: false, fgRgb: null, bgRgb: null });
      newDisp.push({ ch: ' ', fg: 2, bg: 0, bright: false, isCursor: false, fgRgb: null, bgRgb: null });
    }
    this.buffer.push(newRow);
    this.displayed.push(newDisp);
    this.cellEls.push([]);
    if (this.cy > 0) this.cy--;
    for (let y = 0; y < this.rows; y++) this.markDirty(y);
  }

  hideCursor() { this.cursorOn = false; this.markDirty(this.cy); this.render(); }
  showCursor() { this.cursorOn = true; this.markDirty(this.cy); this.render(); }

  setHideMouse(hide) {
    this.hideMouse = !!hide;
    this.screenWrap.style.cursor = this.hideMouse ? 'none' : 'auto';
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

  // ── Color helpers ──────────────────────────────────────────────────────

  setFg256(n) { this.fgIdx = n; this.fgRgb = null; }
  setBg256(n) { this.bgIdx = n; this.bgRgb = null; }
  setFgRGB(r, g, b) { this.fgRgb = { r, g, b }; this.fgIdx = null; }
  setBgRGB(r, g, b) { this.bgRgb = { r, g, b }; this.bgIdx = null; }

  // ── Drawing primitives (use get/set internally) ────────────────────────

  /**
   * Draw a rectangle. Outline only by default.
   * @param {number} x
   * @param {number} y
   * @param {number} w
   * @param {number} h
   * @param {object} [opts]
   * @param {boolean} [opts.fill=false]
   * @param {string} [opts.ch='█']
   * @param {number|null} [opts.fg]
   * @param {number|null} [opts.bg]
   */
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

  /**
   * Draw a circle (midpoint algorithm). Outline only by default.
   * @param {number} cx
   * @param {number} cy
   * @param {number} r
   * @param {object} [opts]
   * @param {boolean} [opts.fill=false]
   * @param {string} [opts.ch='█']
   * @param {number|null} [opts.fg]
   * @param {number|null} [opts.bg]
   */
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

  /**
   * Draw a box using border characters.
   * @param {number} x
   * @param {number} y
   * @param {number} w
   * @param {number} h
   * @param {string} [style='single']
   */
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

  // ── Input helpers ──────────────────────────────────────────────────────

  isKeyDown(key) { return this._keysDown.has(key); }

  getKey() {
    return new Promise(resolve => {
      const unsub = this.onKey(e => { unsub(); resolve(e); });
    });
  }

  beginFrame() { this.autoRender = false; }
  endFrame() { this.autoRender = true; this.render(); }

  // ── Rendering ──────────────────────────────────────────────────────────

  /** @private */
  _resolveColor(idx, rgb) {
    if (rgb) return `rgb(${rgb.r},${rgb.g},${rgb.b})`;
    if (idx == null) return null;
    if (idx < 16) return this.colors[idx];
    return this.xterm256[idx] || this.colors[7];
  }

  render() {
    if (this.useCanvas) {
      this._renderCanvas();
      this.dirtyRows.clear();
      return;
    }

    for (const y of this.dirtyRows) {
      if (y < 0 || y >= this.rows) continue;
      for (let x = 0; x < this.cols; x++) {
        const cell = this.buffer[y][x];
        const disp = this.displayed[y][x];
        const isCursor = this.cursorOn && y === this.cy && x === this.cx && this._focused;
        const ch = isCursor ? '█' : (cell.ch || ' ');

        if (ch !== disp.ch || cell.fg !== disp.fg || cell.bg !== disp.bg ||
            cell.bright !== disp.bright || isCursor !== disp.isCursor ||
            (cell.fgRgb || disp.fgRgb) && JSON.stringify(cell.fgRgb) !== JSON.stringify(disp.fgRgb) ||
            (cell.bgRgb || disp.bgRgb) && JSON.stringify(cell.bgRgb) !== JSON.stringify(disp.bgRgb)) {

          const span = this.cellEls[y][x];
          if (!span) continue;
          span.textContent = ch;
          const fg = this._resolveColor(cell.fg, cell.fgRgb);
          const bg = this._resolveColor(cell.bg, cell.bgRgb);
          span.style.color = fg || '';
          span.style.backgroundColor = bg || '';
          span.style.fontWeight = cell.bright ? 'bold' : 'normal';

          disp.ch = ch;
          disp.fg = cell.fg;
          disp.bg = cell.bg;
          disp.fgRgb = cell.fgRgb ? { ...cell.fgRgb } : null;
          disp.bgRgb = cell.bgRgb ? { ...cell.bgRgb } : null;
          disp.bright = cell.bright;
          disp.isCursor = isCursor;
        }
      }
    }
    this.dirtyRows.clear();

    if (this._hintShown) {
      const hint = ' [ click terminal to continue ] ';
      const start = Math.floor((this.cols - hint.length) / 2);
      const y = this.rows - 1;
      for (let i = 0; i < hint.length; i++) {
        const x = start + i;
        if (x >= 0 && x < this.cols && this.cellEls[y][x]) {
          const span = this.cellEls[y][x];
          span.textContent = hint[i];
          span.style.color = '#ffff55';
          span.style.backgroundColor = '#000000';
        }
      }
    }
  }

  /** @private */
  _renderCanvas() {
    const ctx = this.ctx;
    const charW = 10, charH = 18;
    ctx.fillStyle = this.bg;
    ctx.fillRect(0, 0, this.cols * charW, this.rows * charH);

    for (const y of this.dirtyRows) {
      for (let x = 0; x < this.cols; x++) {
        const cell = this.buffer[y][x];
        const isCursor = this.cursorOn && y === this.cy && x === this.cx && this._focused;
        const ch = isCursor ? '█' : (cell.ch || ' ');
        const fg = this._resolveColor(cell.fg, cell.fgRgb) || this.fg;
        const bg = this._resolveColor(cell.bg, cell.bgRgb);

        if (bg) {
          ctx.fillStyle = bg;
          ctx.fillRect(x * charW, y * charH, charW, charH);
        }
        ctx.fillStyle = fg;
        ctx.fillText(ch, x * charW, y * charH);
      }
    }
  }
}

if (typeof module !== 'undefined') module.exports = Terminal;
