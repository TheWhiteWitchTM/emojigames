// BASIC interpreter. PRINT, GOTO, LIST, RUN, NEW.
"use strict";
(function (root) {
  var MAX_LINES = 512;
  var MAX_LINE = 63999;

  function Basic() {
    this.lines = new Map();
    this.currentLine = null;
    this.running = false;
    this.breakRequested = false;
  }

  Basic.prototype.clearAll = function () {
    this.lines.clear();
    this.currentLine = null;
    this.running = false;
    this.breakRequested = false;
  };

  Basic.prototype.addLine = function (num, source) {
    if (num < 0 || num > MAX_LINE) return { type: "error", msg: "LINE NUMBER TOO HIGH" };
    if (this.lines.size >= MAX_LINES && !this.lines.has(num)) {
      return { type: "error", msg: "OUT OF MEMORY" };
    }
    if (!source || !source.trim()) {
      this.lines.delete(num);
    } else {
      this.lines.set(num, source.trim());
    }
    return { type: "ok" };
  };

  Basic.prototype.list = function () {
    var keys = Array.from(this.lines.keys()).sort(function (a, b) { return a - b; });
    var text = keys.map(function (n) { return n + " " + this.lines.get(n); }, this).join("\n");
    return { type: "print", text: text };
  };

  Basic.prototype.run = function () {
    this.running = true;
    this.breakRequested = false;
    var keys = Array.from(this.lines.keys()).sort(function (a, b) { return a - b; });
    if (!keys.length) {
      this.running = false;
      return { type: "ok" };
    }

    var output = [];
    var pc = 0;
    var guard = 0;
    var maxSteps = 10000;

    while (pc < keys.length && guard < maxSteps && !this.breakRequested) {
      guard++;
      var num = keys[pc];
      var src = this.lines.get(num);
      this.currentLine = num;

      var printMatch = src.match(/^PRINT\s+(.*)$/i);
      if (printMatch) {
        var text = printMatch[1].replace(/^["']|["']$/g, "");
        output.push(text);
        pc++;
        continue;
      }

      var gotoMatch = src.match(/^GOTO\s+(\d+)$/i);
      if (gotoMatch) {
        var target = parseInt(gotoMatch[1], 10);
        var idx = keys.indexOf(target);
        if (idx === -1) {
          this.running = false;
          return { type: "error", msg: "UNDEF'D STATEMENT " + target };
        }
        pc = idx;
        continue;
      }

      this.running = false;
      return { type: "error", msg: "SYNTAX ERROR IN " + num };
    }

    this.running = false;
    if (this.breakRequested) {
      return { type: "print", text: output.join("\n") + (output.length ? "\n" : "") + "BREAK" };
    }
    if (guard >= maxSteps) {
      return { type: "print", text: output.join("\n") + (output.length ? "\n" : "") + "TOO MANY STEPS" };
    }
    return { type: "print", text: output.join("\n") };
  };

  Basic.prototype.execLine = function (source) {
    var line = (source || "").trim();
    if (!line) return { type: "ok" };

    var numMatch = line.match(/^(\d+)\s*(.*)$/);
    if (numMatch) {
      return this.addLine(parseInt(numMatch[1], 10), numMatch[2]);
    }

    var upper = line.toUpperCase();
    if (upper === "NEW" || upper === "RESET") {
      this.clearAll();
      return { type: "reset" };
    }
    if (upper === "LIST") return this.list();
    if (upper === "RUN") return this.run();
    if (upper === "CLS") return { type: "cls" };

    var printMatch = line.match(/^PRINT\s+(.*)$/i);
    if (printMatch) {
      var text = printMatch[1].replace(/^["']|["']$/g, "");
      return { type: "print", text: text };
    }

    return { type: "error", msg: "SYNTAX ERROR" };
  };

  root.BASIC = Basic;
})(typeof globalThis !== "undefined" ? globalThis : this);
