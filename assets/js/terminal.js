/**
 * Lightweight VT100-style terminal emulator.
 * Compare-and-update rendering, natural emoji colors, optional focus hint.
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
   * @param {boolean} [options.focusHint=true] - Show "click to continue" on blur
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

    this.colors = [
      '#000000','#aa0000','#00aa00','#aa5500',
      '#0000aa','#aa00aa','#00aaaa','#aaaaaa',
      '#555555','#ff5555','#55ff55','#ffff55',
      '#5555ff','#ff55ff','#55ffff','#ffffff'
    ];

    this.wrap = document.createElement('div');
    this.wrap.className = 'terminal';
    this.wrap.tabIndex = 0;
    this.wrap.style.cssText = `
      background: ${this.bg};
      color: ${this.fg};
      font-family: ${this.font};
      font-size: ${this.fontSize};
      line-height: 1.25;
      width: ${this.cols}ch;
      height: ${this.rows * 1.25}em;
      padding: 8px;
      overflow: hidden;
      white-space: pre;
      border: 2px solid ${this.border};
      box-shadow: 0 0 12px ${this.border}40;
      position: relative;
      box-sizing: border-box;
      outline: none;
      cursor: ${this.hideMouse ? 'none' : 'auto'};
    `;

    this.screen = document.createElement('div');
    this.screen.style.cssText = 'width:100%;height:100%;overflow:hidden;';
    this.wrap.appendChild(this.screen);

    // Corner button (always inside the terminal)
    const fsBtn = document.createElement('button');
    fsBtn.innerHTML = '⛶ F11';
    fsBtn.style.cssText = `
      position: absolute;
      top: 2px;
      right: 2px;
      z-index: 50;
      background: #111;
      color: #fff;
      border: 1px solid #39ff14;
      border-radius: 3px;
      padding: 2px 8px;
      font-size: 12px;
      font-family: system-ui, sans-serif;
      cursor: pointer;
      line-height: 1.3;
    `;
    fsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleFullscreen();
    });
    this.wrap.appendChild(fsBtn);
    this.fsBtn = fsBtn;

    document.addEventListener('fullscreenchange', () => {
      if (document.fullscreenElement === this.wrap) {
        this.fsBtn.innerHTML = '✕ Esc';
        setTimeout(() => this.wrap.focus(), 50);
      } else {
        this.fsBtn.innerHTML = '⛶ F11';
      }
    });

    this.wrap.addEventListener('keydown', (e) => {
      if (e.key === 'F11') {
        e.preventDefault();
        this.toggleFullscreen();
      }
    });

    this.cellEls = [];
    this.buffer = [];
    this.displayed = [];
    for (let y = 0; y < this.rows; y++) {
      const row = [];
      const dispRow = [];
      const rowEls = [];
      const rowDiv = document.createElement('div');
      rowDiv.style.whiteSpace = 'pre';
      for (let x = 0; x < this.cols; x++) {
        const span = document.createElement('span');
        span.textContent = ' ';
        rowDiv.appendChild(span);
        rowEls.push(span);
        row.push({ ch: ' ', fg: 2, bg: 0, bright: false });
        dispRow.push({ ch: ' ', fg: 2, bg: 0, bright: false, isCursor: false });
      }
      this.screen.appendChild(rowDiv);
      this.cellEls.push(rowEls);
      this.buffer.push(row);
      this.displayed.push(dispRow);
    }

    this.cx = 0;
    this.cy = 0;
    this.fgIdx = 2;
    this.bgIdx = 0;
    this.bright = false;
    this.cursorOn = true;
    this._focused = false;
    this._hintShown = false;

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

    this._blink = setInterval(() => {
      this.cursorOn = !this.cursorOn;
      this.render();
    }, 530);

    this.render();
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      this.wrap.requestFullscreen().then(() => {
        this.wrap.focus();
      }).catch(() => {});
    } else {
      document.exitFullscreen();
    }
  }

  put(ch, x = this.cx, y = this.cy) {
    if (x < 0 || x >= this.cols || y < 0 || y >= this.rows) return;
    const cell = this.buffer[y][x];
    cell.ch = (ch && [...ch][0]) || ' ';
    cell.fg = this.fgIdx;
    cell.bg = this.bgIdx;
    cell.bright = this.bright;
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

  writeAt(x, y, text) {
    this.moveTo(x, y);
    this.write(text);
  }

  fill(x, y, w, h, ch = ' ', fg = this.fgIdx, bg = this.bgIdx) {
    for (let yy = Math.max(0, y); yy < Math.min(this.rows, y + h); yy++) {
      for (let xx = Math.max(0, x); xx < Math.min(this.cols, x + w); xx++) {
        const cell = this.buffer[yy][xx];
        cell.ch = ch || ' ';
        cell.fg = fg;
        cell.bg = bg;
        cell.bright = this.bright;
      }
    }
    if (this.autoRender) this.render();
  }

  getChar(x, y) {
    if (x < 0 || y < 0 || x >= this.cols || y >= this.rows) return null;
    return this.buffer[y][x];
  }

  moveTo(x, y) {
    this.cx = Math.max(0, Math.min(this.cols - 1, Math.floor(x)));
    this.cy = Math.max(0, Math.min(this.rows - 1, Math.floor(y)));
  }

  home() { this.moveTo(0, 0); }

  clear() {
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        const cell = this.buffer[y][x];
        cell.ch = ' ';
        cell.fg = 2;
        cell.bg = 0;
        cell.bright = false;
      }
    }
    this.cx = 0;
    this.cy = 0;
    if (this.autoRender) this.render();
  }

  clearLine() {
    for (let x = this.cx; x < this.cols; x++) {
      const cell = this.buffer[this.cy][x];
      cell.ch = ' ';
      cell.fg = this.fgIdx;
      cell.bg = this.bgIdx;
      cell.bright = this.bright;
    }
    if (this.autoRender) this.render();
  }

  scroll() {
    this.buffer.shift();
    this.displayed.shift();
    this.cellEls.shift();
    const newRow = [];
    const newDisp = [];
    const newEls = [];
    const rowDiv = document.createElement('div');
    rowDiv.style.whiteSpace = 'pre';
    for (let x = 0; x < this.cols; x++) {
      const span = document.createElement('span');
      span.textContent = ' ';
      rowDiv.appendChild(span);
      newEls.push(span);
      newRow.push({ ch: ' ', fg: 2, bg: 0, bright: false });
      newDisp.push({ ch: ' ', fg: 2, bg: 0, bright: false, isCursor: false });
    }
    this.screen.appendChild(rowDiv);
    this.buffer.push(newRow);
    this.displayed.push(newDisp);
    this.cellEls.push(newEls);
    if (this.cy > 0) this.cy--;
  }

  hideCursor() { this.cursorOn = false; this.render(); }
  showCursor() { this.cursorOn = true; this.render(); }

  setHideMouse(hide) {
    this.hideMouse = !!hide;
    this.wrap.style.cursor = this.hideMouse ? 'none' : 'auto';
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

  setFg(n) { this.fgIdx = n & 15; }
  setBg(n) { this.bgIdx = n & 15; }
  setBright(b) { this.bright = !!b; }
  resetAttr() { this.fgIdx = 2; this.bgIdx = 0; this.bright = false; }

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
          for (const n of nums) {
            if (n === 0) this.resetAttr();
            else if (n === 1) this.bright = true;
            else if (n === 22) this.bright = false;
            else if (n >= 30 && n <= 37) this.fgIdx = n - 30;
            else if (n >= 40 && n <= 47) this.bgIdx = n - 40;
            else if (n >= 90 && n <= 97) { this.fgIdx = n - 90; this.bright = true; }
            else if (n >= 100 && n <= 107) this.bgIdx = n - 100;
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

  render() {
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        const cell = this.buffer[y][x];
        const disp = this.displayed[y][x];
        const isCursor = this.cursorOn && y === this.cy && x === this.cx && this._focused;
        let ch = isCursor ? '█' : (cell.ch || ' ');
        let fgIdx = cell.fg;
        let bgIdx = cell.bg;
        let bright = cell.bright;

        if (this._hintShown && y === this.rows - 1) {
          const hint = ' [ click terminal to continue ] ';
          const start = Math.floor((this.cols - hint.length) / 2);
          if (x >= start && x < start + hint.length) {
            ch = hint[x - start];
            fgIdx = 11;
            bright = true;
          }
        }

        const isEmoji = ch.length > 1 || (ch.codePointAt(0) > 0xFFFF);
        const fg = isEmoji ? '' : (this.colors[bright ? Math.min(fgIdx + 8, 15) : fgIdx] || this.fg);
        const bg = this.colors[bgIdx] || this.bg;

        if (disp.ch !== ch || disp.fg !== fgIdx || disp.bg !== bgIdx || disp.bright !== bright || disp.isCursor !== isCursor) {
          const el = this.cellEls[y][x];
          el.textContent = ch;
          el.style.color = fg;
          el.style.backgroundColor = bg;
          disp.ch = ch;
          disp.fg = fgIdx;
          disp.bg = bgIdx;
          disp.bright = bright;
          disp.isCursor = isCursor;
        }
      }
    }
  }

  destroy() {
    clearInterval(this._blink);
    this.wrap.remove();
  }
}
