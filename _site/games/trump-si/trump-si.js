class TrumpSI {
  constructor(term) {
    this.term = term;
    this.history = [];
    this.mood = "neutral";
    this.inputBuffer = "";
    this.faceMap = {
      happy: "1.jpg",
      smug: "2.jpg",
      rant: "3.jpg",
      winning: "4.jpg",
      neutral: "5.jpg"
    };
    this.audioCtx = null;
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
    let img = document.getElementById("trump-face");
    if (!img) {
      img = document.createElement("img");
      img.id = "trump-face";
      img.alt = "";
      img.style.cssText = "height:64px;width:64px;object-fit:cover;border-radius:10px;border:2px solid #ff8c00;box-shadow:0 0 10px #ff8c00;";
      if (this.term.headerMiddle) this.term.headerMiddle.appendChild(img);
    }
    img.src = this.faceMap[mood] || this.faceMap.neutral;
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
    this.redraw(line);
  }

  redraw(latest) {
    this.showFace(this.mood);
    this.term.clear();
    this.term.moveTo(0, 1);
    this.term.setFg(15);
    this.term.write("YOU: ");
    this.term.resetAttr();
    this.term.writeln(this.history.at(-1)?.you || "");
    this.term.writeln("");
    this.term.setFg(3);
    this.term.setBright(true);
    this.term.write("TRUMP SI: ");
    this.term.resetAttr();
    this.term.setFg(3);
    this.term.writeln(latest);
    this.term.resetAttr();
    this.term.writeln("");
    this.term.setFg(15);
    this.term.showCursor();
    this.term.write("> ");
    this.term.resetAttr();
    this.inputBuffer = "";
  }

  start() {
    this.mood = "happy";
    this.showFace(this.mood);
    this.term.clear();
    this.term.moveTo(0, 1);
    this.term.setFg(3);
    this.term.setBright(true);
    this.term.write("TRUMP SI: ");
    this.term.resetAttr();
    this.term.setFg(3);
    this.term.writeln(this.pick(window.responses.greeting));
    this.term.resetAttr();
    this.term.writeln("");
    this.term.setFg(15);
    this.term.showCursor();
    this.term.write("> ");
    this.term.resetAttr();
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
      if (bot.inputBuffer.length) {
        bot.inputBuffer = bot.inputBuffer.slice(0, -1);
        term.write("\b");
      }
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      bot.inputBuffer += e.key;
      term.setFg(15);
      term.write(e.key);
      term.resetAttr();
    }
  }

  term.onKey(onKey);
  bot.start();

  return () => term.destroy();
});
