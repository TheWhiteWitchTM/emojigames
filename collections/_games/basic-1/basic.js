"use strict";
(function (root) {
  var MAX_LINES = 512;
  var MAX_LINE = 63999;

  function Basic() {
    this.lines = new Map();
    this.running = false;
    this.breakRequested = false;
  }

  Basic.prototype.clearAll = function () {
    this.lines.clear();
    this.running = false;
    this.breakRequested = false;
  };

  Basic.prototype.addLine = function (num, source) {
    if (num < 0 || num > MAX_LINE) return { type: "error", msg: "LINE NUMBER TOO HIGH" };
    if (this.lines.size >= MAX_LINES && !this.lines.has(num)) return { type: "error", msg: "OUT OF MEMORY" };
    if (!source || !source.trim()) this.lines.delete(num);
    else this.lines.set(num, source.trim());
    return { type: "ok" };
  };

  Basic.prototype.list = function () {
    var keys = Array.from(this.lines.keys()).sort(function (a, b) { return a - b; });
    return { type: "print", text: keys.map(function (n) { return n + " " + this.lines.get(n); }, this).join("\n") };
  };

  Basic.prototype.run = function () {
    this.running = true;
    this.breakRequested = false;
    var keys = Array.from(this.lines.keys()).sort(function (a, b) { return a - b; });
    if (!keys.length) { this.running = false; return { type: "ok" }; }
    var output = [];
    var pc = 0;
    var guard = 0;
    while (pc < keys.length && guard < 10000 && !this.breakRequested) {
      guard++;
      var num = keys[pc];
      var src = this.lines.get(num);
      var pm = src.match(/^PRINT\s+(.*)$/i);
      if (pm) { output.push(pm[1].replace(/^["']|["']$/g, "")); pc++; continue; }
      var gm = src.match(/^GOTO\s+(\d+)$/i);
      if (gm) {
        var t = parseInt(gm[1], 10);
        var i = keys.indexOf(t);
        if (i === -1) { this.running = false; return { type: "error", msg: "UNDEF'D STATEMENT " + t }; }
        pc = i; continue;
      }
      this.running = false;
      return { type: "error", msg: "SYNTAX ERROR IN " + num };
    }
    this.running = false;
    var text = output.join("\n");
    if (this.breakRequested) text += (text ? "\n" : "") + "BREAK";
    else if (guard >= 10000) text += (text ? "\n" : "") + "TOO MANY STEPS";
    return { type: "print", text: text };
  };

  Basic.prototype.execLine = function (source) {
    var line = (source || "").trim();
    if (!line) return { type: "ok" };
    var nm = line.match(/^(\d+)\s*(.*)$/);
    if (nm) return this.addLine(parseInt(nm[1], 10), nm[2]);
    var u = line.toUpperCase();
    if (u === "NEW" || u === "RESET") { this.clearAll(); return { type: "reset" }; }
    if (u === "LIST") return this.list();
    if (u === "RUN") return this.run();
    if (u === "CLS") return { type: "cls" };
    var pm = line.match(/^PRINT\s+(.*)$/i);
    if (pm) return { type: "print", text: pm[1].replace(/^["']|["']$/g, "") };
    return { type: "error", msg: "SYNTAX ERROR" };
  };

  root.BASIC = Basic;
})(typeof globalThis !== "undefined" ? globalThis : this);
