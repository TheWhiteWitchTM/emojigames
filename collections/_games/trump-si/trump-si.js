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

  showFace(mood) {
    let img = document.getElementById("trump-face");
    if (!img) {
      img = document.createElement("img");
      img.id = "trump-face";
      img.style.cssText = `
        position: absolute;
        top: 36px;
        left: 50%;
        transform: translateX(-50%);
        width: 130px;
        height: 130px;
        object-fit: cover;
        border-radius: 14px;
        border: 3px solid #ff8c00;
        box-shadow: 0 0 12px #ff8c00;
        z-index: 10;
        pointer-events: none;
      `;
      this.term.wrap.style.position = "relative";
      this.term.wrap.appendChild(img);
    }
    const file = this.faceMap[mood] || this.faceMap.neutral;
    img.src = "/emojigames/games/trump-si/" + file;
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
    this.showFace(this.mood);
    this.term.clear();
    this.term.moveTo(0, 11);
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
    this.term.write("> ");
    this.term.resetAttr();
    this.inputBuffer = "";
  }

  start() {
    this.mood = "happy";
    this.showFace(this.mood);
    this.term.clear();
    this.term.moveTo(0, 11);
    this.term.setFg(3);
    this.term.setBright(true);
    this.term.write("TRUMP SI: ");
    this.term.resetAttr();
    this.term.setFg(3);
    this.term.writeln(this.pick(window.responses.greeting));
    this.term.resetAttr();
    this.term.writeln("");
    this.term.setFg(15);
    this.term.write("> ");
    this.term.resetAttr();
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
      term.setFg(15);
      term.write(e.key);
      term.resetAttr();
    }
  }

  term.wrap.addEventListener("keydown", onKey);
});
