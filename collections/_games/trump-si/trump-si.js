class TrumpSI {
  constructor(term) {
    this.term = term;
    this.history = [];
    this.mood = "neutral";
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

  chooseMood(key) {
    if (key === "rant" || key === "critical") return Math.random() < 0.6 ? "rant" : "smug";
    if (key === "best" || key === "winning") return "winning";
    if (key === "greeting" || key === "fake") return "happy";
    return "smug";
  }

  reply(input) {
    const key = this.analyze(input);
    this.mood = this.chooseMood(key);

    let line;
    if (key && window.responses[key]) {
      line = this.pick(window.responses[key]);
      if (key === "critical" && Math.random() < 0.45) {
        line = this.pick(window.responses.rant);
        this.mood = "rant";
      }
    } else {
      line = this.pick(window.responses.fallback);
    }

    this.history.push({ you: input, trump: line });
    if (this.history.length > 6) this.history.shift();

    this.redraw(line);
  }

  redraw(latest) {
    window.TrumpFaces.draw(this.term, this.mood);
    this.term.writeln(`\x1b[36mYOU:\x1b[0m ${this.history.at(-1)?.you || ""}`);
    this.term.writeln("");
    this.term.writeln(`\x1b[33;1mTRUMP SI:\x1b[0m ${latest}`);
    this.term.writeln("");
    this.term.write("\x1b[32m> \x1b[0m");
  }

  start() {
    this.mood = "happy";
    window.TrumpFaces.draw(this.term, this.mood);
    this.term.writeln(`\x1b[33;1mTRUMP SI:\x1b[0m ${this.pick(window.responses.greeting)}`);
    this.term.writeln("");
    this.term.write("\x1b[32m> \x1b[0m");
  }
}
window.TrumpSI = TrumpSI;

useEffect(() => {
  const container = document.getElementById('game');
  if (!container) return;

  const term = new Terminal({ border: '#39ff14' });
  container.appendChild(term.wrap);
  term.wrap.focus();

  const bot = new TrumpSI(term);
  bot.start();

  let buffer = "";
  term.onKey(e => {
    if (e.key === "Enter") {
      if (buffer.trim()) {
        bot.reply(buffer.trim());
        buffer = "";
      }
    } else if (e.key === "Backspace") {
      buffer = buffer.slice(0, -1);
    } else if (e.key.length === 1) {
      buffer += e.key;
    }
  });
});
