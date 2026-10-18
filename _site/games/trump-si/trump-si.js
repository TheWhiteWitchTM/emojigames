const TRUMP_FACE_ROWS = 8;

class TrumpSI {
  constructor(term) {
    this.term = term;
    this.history = [];
    this.mood = "neutral";
    this.inputBuffer = "";
    this.greetingLine = "";
    this.faceImage = null;
    this.faceMap = {
      happy: "1.jpg",
      smug: "2.jpg",
      rant: "3.jpg",
      winning: "4.jpg",
      neutral: "5.jpg"
    };
    this.images = {};
    this.audioCtx = null;
    const self = this;
    Object.entries(this.faceMap).forEach(function (pair) {
      const img = new Image();
      img.onload = function () {
        if (self.faceImage === img && self.term.core) {
          self.term.core.dirty = true;
          self.term.core.flush();
        }
      };
      img.src = pair[1];
      self.images[pair[0]] = img;
    });
    if (term.core && term.core.canvas) {
      term.core.canvas.add({ draw: function (ctx) { self.drawFace(ctx); } }, "face");
    }
  }

  pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  analyze(input) {
    const lower = input.toLowerCase();
    let best = null;
    let score = 0;
    for (const [key, words] of Object.entries(window.triggers)) {
      const hits = words.filter(w => lower.includes(w)).length;
      if (hits > score) {
        score = hits;
        best = key;
      }
    }
    return best;
  }

  isPraise(input) {
    const lower = input.toLowerCase();
    return ["great", "best", "genius", "smart", "love", "amazing", "tremendous", "winning", "hero"].some(w => lower.includes(w));
  }

  isCritical(input) {
    const lower = input.toLowerCase();
    return ["wrong", "bad", "stupid", "idiot", "fail", "lie", "fake", "dumb", "corrupt"].some(w => lower.includes(w));
  }

  chooseMood(key, input) {
    if (this.isCritical(input) || key === "critical" || key === "rant") return Math.random() < 0.6 ? "rant" : "smug";
    if (this.isPraise(input) || key === "best" || key === "winning") return "happy";
    if (key === "fake") return "smug";
    return "smug";
  }

  playBrainSound(mad = false) {
    try {
      if (!this.audioCtx) this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const ctx = this.audioCtx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      if (mad) {
        osc.frequency.setValueAtTime(320, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.25);
      } else {
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.15);
      }
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (mad ? 0.28 : 0.18));
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + (mad ? 0.3 : 0.2));
    } catch (e) {}
  }

  showFace(mood) {
    const img = this.images[mood] || this.images.neutral;
    this.faceImage = img || null;
    const core = this.term.core;
    if (!core) return;
    core.dirty = true;
    core.flush();
  }

  drawFace(ctx) {
    const image = this.faceImage;
    if (!image || !image.complete || !image.naturalWidth) return;
    const core = this.term.core;
    const cw = core.cellWidth;
    const ch = core.cellHeight;
    const top = (core.rows - 1 - TRUMP_FACE_ROWS) * ch;
    const band = TRUMP_FACE_ROWS * ch;
    const size = Math.floor(band * 0.9);
    const x = Math.round((core.cols * cw - size) / 2);
    const y = top + Math.round((band - size) / 2);
    const radius = 12;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + size, y, x + size, y + size, radius);
    ctx.arcTo(x + size, y + size, x, y + size, radius);
    ctx.arcTo(x, y + size, x, y, radius);
    ctx.arcTo(x, y, x + size, y, radius);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(image, x, y, size, size);
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = "#ff8c00";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + size, y, x + size, y + size, radius);
    ctx.arcTo(x + size, y + size, x, y + size, radius);
    ctx.arcTo(x, y + size, x, y, radius);
    ctx.arcTo(x, y, x + size, y, radius);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  textRows() {
    return this.term.rows - TRUMP_FACE_ROWS - 1;
  }

  wrapText(text) {
    const chars = Array.from(String(text));
    const width = this.term.cols;
    if (!chars.length) return [""];
    const lines = [];
    for (let i = 0; i < chars.length; i += width) lines.push(chars.slice(i, i + width).join(""));
    return lines;
  }

  pushLine(lines, text, fg, bright) {
    this.wrapText(text).forEach((line, index) => {
      lines.push({ text: line, fg: fg, bright: bright && index === 0 });
    });
  }

  transcript() {
    const lines = [];
    if (!this.history.length) {
      this.pushLine(lines, "TRUMP SI: " + (this.greetingLine || ""), 3, true);
      return lines;
    }
    this.history.forEach((turn, index) => {
      if (index) lines.push({ text: "", fg: 7, bright: false });
      this.pushLine(lines, "YOU: " + turn.you, 15, false);
      lines.push({ text: "", fg: 7, bright: false });
      this.pushLine(lines, "TRUMP SI: " + turn.trump, 3, true);
    });
    while (lines.length && lines[lines.length - 1].text === "") lines.pop();
    return lines;
  }

  paint() {
    const lines = this.transcript();
    const room = this.textRows();
    const visible = lines.slice(-room);
    const top = room - visible.length;
    this.term.clear();
    visible.forEach((line, index) => {
      if (!line.text) return;
      this.term.moveTo(0, top + index);
      this.term.setFg(line.fg);
      this.term.setBright(!!line.bright);
      this.term.write(line.text);
    });
    this.term.resetAttr();
    this.term.moveTo(0, this.term.rows - 1);
    this.term.setFg(15);
    this.term.showCursor();
    this.term.write("> " + this.inputBuffer);
    this.term.resetAttr();
  }

  reply(input) {
    const key = this.analyze(input);
    this.mood = this.chooseMood(key, input);
    const mad = this.isCritical(input) || key === "critical" || key === "rant";

    let line;
    const lower = input.toLowerCase();

    if (this.isPraise(input)) {
      line = this.pick(window.responses.best || window.responses.winning);
      this.mood = "happy";
    } else if (this.isCritical(input)) {
      line = this.pick(window.responses.critical || window.responses.rant);
      this.mood = "rant";
    } else if (this.history.length > 1 && (lower.includes("remember") || lower.includes("said") || lower.includes("earlier"))) {
      line = this.pick(window.responses.memory);
      this.mood = "smug";
    } else if (key && window.responses[key]) {
      line = this.pick(window.responses[key]);
      if ((key === "critical" || key === "rant" || key === "fake") && Math.random() < 0.4) {
        line += " " + this.pick(window.responses.rant);
        this.mood = "rant";
      }
    } else {
      if (input.length > 20) {
        line = "Interesting. But actually, " + this.pick(window.responses.fallback);
      } else {
        line = this.pick(window.responses.fallback);
      }
    }

    this.history.push({ you: input, trump: line });
    if (this.history.length > 10) this.history.shift();

    this.playBrainSound(mad);
    this.inputBuffer = "";
    this.showFace(this.mood);
    this.paint();
  }

  start() {
    this.mood = "happy";
    this.greetingLine = this.pick(window.responses.greeting);
    this.inputBuffer = "";
    this.showFace(this.mood);
    this.paint();
  }
}
window.TrumpSI = TrumpSI;

useEffect(() => {
  const container = document.getElementById('game');
  if (!container) return;

  const term = new Glass({
    cols: 72,
    rows: 22,
    title: '🤖 Trump Super Intelligence',
    border: '#ff8c00',
    footer: 'Type a line. Return sends it.'
  });
  container.appendChild(term.wrap);
  term.focus();

  const bot = new TrumpSI(term);

  function onKey(e) {
    if (e.key === "Enter" || e.key === "NumpadEnter") {
      e.preventDefault();
      if (bot.inputBuffer.trim()) bot.reply(bot.inputBuffer.trim());
    } else if (e.key === "Backspace") {
      e.preventDefault();
      const chars = Array.from(bot.inputBuffer);
      if (!chars.length) return;
      chars.pop();
      bot.inputBuffer = chars.join("");
      bot.paint();
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      if (Array.from(bot.inputBuffer).length >= term.cols - 3) return;
      bot.inputBuffer += e.key;
      bot.paint();
    }
  }

  term.onKey(onKey);
  bot.start();

  return () => term.destroy();
});
