  reply(input) {
    const key = this.analyze(input);
    this.mood = this.chooseMood(key);

    let line;
    const lower = input.toLowerCase();

    // Simple memory echo
    if (this.history.length > 1 && (lower.includes("remember") || lower.includes("said") || lower.includes("earlier"))) {
      line = this.pick(window.responses.memory);
      this.mood = "smug";
    } else if (key && window.responses[key]) {
      line = this.pick(window.responses[key]);
      // Occasional chain for longer feel
      if ((key === "critical" || key === "rant" || key === "fake") && Math.random() < 0.4) {
        line += " " + this.pick(window.responses.rant);
        this.mood = "rant";
      }
    } else {
      // Slightly smarter fallback that acknowledges the input
      if (input.length > 20) {
        line = "Interesting. But actually, " + this.pick(window.responses.fallback);
      } else {
        line = this.pick(window.responses.fallback);
      }
    }

    this.history.push({ you: input, trump: line });
    if (this.history.length > 10) this.history.shift();

    this.playBrainSound();
    this.redraw(line);
  }
