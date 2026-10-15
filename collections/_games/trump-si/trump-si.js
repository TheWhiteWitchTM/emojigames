class TrumpSI {
  constructor(term) {
    this.term = term;
    this.history = [];
    this.mood = "neutral";
    this.inputBuffer = "";
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
    this.inputBuffer = "";
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

  function onKey(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (bot.inputBuffer.trim()) {
        bot.reply(bot.inputBuffer.trim());
      }
    } else if (e.key === "Backspace") {
      e.preventDefault();
      if (bot.inputBuffer.length) {
        bot.inputBuffer = bot.inputBuffer.slice(0, -1);
        term.write("\b");
      }
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      bot.inputBuffer += e.key;
      term.write(e.key);
    }
  }

  term.wrap.addEventListener("keydown", onKey);
});
