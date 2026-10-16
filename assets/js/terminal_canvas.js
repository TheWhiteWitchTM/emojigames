/**
 * TerminalCanvas
 * Layered terminal that understands ANSI, supports an optional background image,
 * optional cursor, and simple early-style sprites (character or small image overlays).
 *
 * Built on the same cell model as Terminal. Cursor is optional.
 */
class TerminalCanvas {
  /**
   * @param {object} [options]
   * @param {number} [options.cols=80]
   * @param {number} [options.rows=24]
   * @param {string} [options.font]
   * @param {string} [options.fontSize='15px']
   * @param {string} [options.fg='#39ff14']
   * @param {string} [options.bg='#000000']
   * @param {boolean} [options.showCursor=false]
   * @param {string|HTMLImageElement|null} [options.backgroundImage=null]
   * @param {boolean} [options.autoRender=true]
   */
  constructor(options = {}) {
    this.cols = options.cols || 80;
    this.rows = options.rows || 24;
    this.font = options.font || '"Courier New", Courier, monospace';
    this.fontSize = options.fontSize || '15px';
    this.fg = options.fg || '#39ff14';
    this.bg = options.bg || '#000000';
    this.showCursor = options.showCursor || false;
    this.autoRender = options.autoRender !== undefined ? options.autoRender : true;

    this.charW = 10;
    this.charH = 18;

    // Outer container
    this.wrap = document.createElement('div');
    this.wrap.style.cssText = `
      position: relative;
      display: inline-block;
      font-family: ${this.font};
      font-size: ${this.fontSize};
      line-height: 1;
      background: ${this.bg};
    `;

    // Background image layer
    this.bgLayer = document.createElement('div');
    this.bgLayer.style.cssText = `
      position: absolute;
      inset: 0;
      background-size: cover;
      background-position: center;
      pointer-events: none;
      z-index: 0;
    `;
    this.wrap.appendChild(this.bgLayer);
    this.setBackgroundImage(options.backgroundImage || null);

    // Main canvas (cells + sprites)
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.wrap.appendChild(this.canvas);

    // Cell buffer (same model as Terminal)
    this.buffer = [];
    for (let y = 0; y < this.rows; y++) {
      const row = [];
      for (let x = 0; x < this.cols; x++) {
        row.push({ ch: ' ', fg: null, bg: null, fgRgb: null, bgRgb: null, bright: false });
      }
      this.buffer.push(row);
    }

    this.cx = 0;
    this.cy = 0;
    this.fgIdx = null;
    this.bgIdx = null;
    this.fgRgb = null;
    this.bgRgb = null;
    this.bright = false;

    // Simple sprite list: { x, y, ch, fg, bg, image, visible }
    this.sprites = [];

    this._setupCanvas();
    this.render();
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
    this.canvas.style.position = 'relative';
    this.canvas.style.zIndex = '1';
    this.ctx.scale(dpr, dpr);
    this.ctx.font = `${this.fontSize} ${this.font}`;
    this.ctx.textBaseline = 'top';
  }

  /**
   * Set or clear the background image.
   * @param {string|HTMLImageElement|null} src
   */
  setBackgroundImage(src) {
    if (!src) {
      this.bgLayer.style.backgroundImage = 'none';
      return;
    }
    if (typeof src === 'string') {
      this.bgLayer.style.backgroundImage = `url(${src})`;
    } else if (src instanceof HTMLImageElement) {
      this.bgLayer.style.backgroundImage = `url(${src.src})`;
    }
  }

  // ── Cell get / set ─────────────────────────────────────────────────────

  /**
   * @param {number} x
   * @param {number} y
   * @returns {object|null}
   */
  get(x, y) {
    if (x < 0 || y < 0 || x >= this.cols || y >= this.rows) return null;
    const c = this.buffer[y][x];
    return { ...c, fgRgb: c.fgRgb ? { ...c.fgRgb } : null, bgRgb: c.bgRgb ? { ...c.bgRgb } : null };
  }

  /**
   * @param {number} x
   * @param {number} y
   * @param {object} data
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
  }

  // ── ANSI-aware writing ─────────────────────────────────────────────────

  /**
   * Write text (supports basic ANSI color + cursor sequences).
   * @param {string} text
   */
  write(text) {
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
          for (const n of nums) {
            if (n === 0) { this.fgIdx = null; this.bgIdx = null; this.fgRgb = null; this.bgRgb = null; this.bright = false; }
            else if (n === 1) this.bright = true;
            else if (n >= 30 && n <= 37) this.fgIdx = n - 30;
            else if (n >= 40 && n <= 47) this.bgIdx = n - 40;
            else if (n === 38 && nums.includes(5)) { /* 256 handled simply */ }
            else if (n === 38 && nums.includes(2)) { /* truecolor placeholder */ }
          }
        } else if (cmd === 'H' || cmd === 'f') {
          this.cy = Math.max(0, (nums[0] || 1) - 1);
          this.cx = Math.max(0, (nums[1] || 1) - 1);
        } else if (cmd === 'J') {
          this.clear();
        } else if (cmd === 'A') this.cy = Math.max(0, this.cy - (nums[0] || 1));
        else if (cmd === 'B') this.cy = Math.min(this.rows - 1, this.cy + (nums[0] || 1));
        else if (cmd === 'C') this.cx = Math.min(this.cols - 1, this.cx + (nums[0] || 1));
        else if (cmd === 'D') this.cx = Math.max(0, this.cx - (nums[0] || 1));
        i = j + 1;
        continue;
      }

      const ch = text[i];
      if (ch === '\n') { this.cx = 0; this.cy++; }
      else if (ch === '\r') { this.cx = 0; }
      else if (ch !== '\b') {
        if (this.cx < this.cols && this.cy < this.rows) {
          this.set(this.cx, this.cy, {
            ch,
            fg: this.fgIdx,
            bg: this.bgIdx,
            fgRgb: this.fgRgb,
            bgRgb: this.bgRgb,
            bright: this.bright
          });
        }
        this.cx++;
      }
      if (this.cy >= this.rows) this.cy = this.rows - 1;
      i++;
    }
    if (this.autoRender) this.render();
  }

  writeln(text = '') { this.write(text + '\n'); }

  clear() {
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        this.set(x, y, { ch: ' ', fg: null, bg: null, fgRgb: null, bgRgb: null, bright: false });
      }
    }
    this.cx = 0;
    this.cy = 0;
    if (this.autoRender) this.render();
  }

  // ── Simple early sprites ───────────────────────────────────────────────

  /**
   * Add a character sprite.
   * @param {number} x
   * @param {number} y
   * @param {string} ch
   * @param {object} [opts]
   * @param {number|null} [opts.fg]
   * @param {number|null} [opts.bg]
   * @param {boolean} [opts.visible=true]
   * @returns {object} sprite handle
   */
  addSprite(x, y, ch, opts = {}) {
    const sprite = {
      x, y, ch: [...ch][0] || ' ',
      fg: opts.fg ?? null,
      bg: opts.bg ?? null,
      image: null,
      visible: opts.visible !== false
    };
    this.sprites.push(sprite);
    if (this.autoRender) this.render();
    return sprite;
  }

  /**
   * Add a small image sprite (early style).
   * @param {number} x
   * @param {number} y
   * @param {HTMLImageElement|string} img
   * @param {object} [opts]
   * @returns {object} sprite handle
   */
  addImageSprite(x, y, img, opts = {}) {
    const sprite = {
      x, y, ch: null,
      image: typeof img === 'string' ? this._loadImage(img) : img,
      visible: opts.visible !== false,
      width: opts.width || this.charW,
      height: opts.height || this.charH
    };
    this.sprites.push(sprite);
    if (this.autoRender) this.render();
    return sprite;
  }

  /** @private */
  _loadImage(src) {
    const img = new Image();
    img.src = src;
    img.onload = () => { if (this.autoRender) this.render(); };
    return img;
  }

  /**
   * Remove a sprite.
   * @param {object} sprite
   */
  removeSprite(sprite) {
    const i = this.sprites.indexOf(sprite);
    if (i >= 0) this.sprites.splice(i, 1);
    if (this.autoRender) this.render();
  }

  // ── Render ─────────────────────────────────────────────────────────────

  render() {
    const ctx = this.ctx;
    const w = this.cols * this.charW;
    const h = this.rows * this.charH;

    ctx.clearRect(0, 0, w, h);

    // Cells
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        const cell = this.buffer[y][x];
        if (cell.ch === ' ' && !cell.bg && !cell.bgRgb) continue;

        const px = x * this.charW;
        const py = y * this.charH;

        if (cell.bgRgb) {
          ctx.fillStyle = `rgb(${cell.bgRgb.r},${cell.bgRgb.g},${cell.bgRgb.b})`;
          ctx.fillRect(px, py, this.charW, this.charH);
        } else if (cell.bg != null) {
          ctx.fillStyle = this._color(cell.bg);
          ctx.fillRect(px, py, this.charW, this.charH);
        }

        if (cell.ch && cell.ch !== ' ') {
          ctx.fillStyle = cell.fgRgb
            ? `rgb(${cell.fgRgb.r},${cell.fgRgb.g},${cell.fgRgb.b})`
            : (cell.fg != null ? this._color(cell.fg) : this.fg);
          ctx.fillText(cell.ch, px, py);
        }
      }
    }

    // Cursor (optional)
    if (this.showCursor && this.cx >= 0 && this.cy >= 0 && this.cx < this.cols && this.cy < this.rows) {
      ctx.fillStyle = '#ffff00';
      ctx.fillRect(this.cx * this.charW, this.cy * this.charH, this.charW, this.charH);
    }

    // Sprites (drawn on top)
    for (const s of this.sprites) {
      if (!s.visible) continue;
      const px = s.x * this.charW;
      const py = s.y * this.charH;

      if (s.image && s.image.complete) {
        ctx.drawImage(s.image, px, py, s.width || this.charW, s.height || this.charH);
      } else if (s.ch) {
        if (s.bg != null) {
          ctx.fillStyle = this._color(s.bg);
          ctx.fillRect(px, py, this.charW, this.charH);
        }
        ctx.fillStyle = s.fg != null ? this._color(s.fg) : this.fg;
        ctx.fillText(s.ch, px, py);
      }
    }
  }

  /** @private */
  _color(idx) {
    const classic = ['#000','#a00','#0a0','#a50','#00a','#a0a','#0aa','#aaa',
                     '#555','#f55','#5f5','#ff5','#55f','#f5f','#5ff','#fff'];
    return classic[idx & 15] || '#fff';
  }

  // Convenience
  beginFrame() { this.autoRender = false; }
  endFrame() { this.autoRender = true; this.render(); }
}

if (typeof module !== 'undefined') module.exports = TerminalCanvas;
