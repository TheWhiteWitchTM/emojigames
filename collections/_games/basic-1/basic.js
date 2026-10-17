"use strict";
(function (root) {
  function Basic() {
    this.lines = new Map();
  }
  Basic.prototype.clearAll = function () { this.lines.clear(); };
  Basic.prototype.addLine = function (n, s) {
    if (!s || !s.trim()) this.lines.delete(n);
    else this.lines.set(n, s.trim());
    return { type: "ok" };
  };
  Basic.prototype.list = function () {
    var k = Array.from(this.lines.keys()).sort(function (a, b) { return a - b; });
    return { type: "print", text: k.map(function (n) { return n + " " + this.lines.get(n); }, this).join("\n") };
  };
  Basic.prototype.run = function () {
    var k = Array.from(this.lines.keys()).sort(function (a, b) { return a - b; });
    var out = [];
    var pc = 0;
    var g = 0;
    while (pc < k.length && g < 5000) {
      g++;
      var src = this.lines.get(k[pc]);
      var pm = src.match(/^PRINT\s+(.*)$/i);
      if (pm) { out.push(pm[1].replace(/^["']|["']$/g, "")); pc++; continue; }
      var gm = src.match(/^GOTO\s+(\d+)$/i);
      if (gm) {
        var t = parseInt(gm[1], 10);
        var i = k.indexOf(t);
        if (i < 0) return { type: "error", msg: "UNDEF'D STATEMENT" };
        pc = i; continue;
      }
      return { type: "error", msg: "SYNTAX ERROR" };
    }
    return { type: "print", text: out.join("\n") };
  };
  Basic.prototype.execLine = function (src) {
    var line = (src || "").trim();
    if (!line) return { type: "ok" };
    var nm = line.match(/^(\d+)\s*(.*)$/);
    if (nm) return this.addLine(+nm[1], nm[2]);
    var u = line.toUpperCase();
    if (u === "LIST") return this.list();
    if (u === "RUN") return this.run();
    if (u === "NEW" || u === "RESET") { this.clearAll(); return { type: "reset" }; }
    if (u === "CLS") return { type: "cls" };
    var pm = line.match(/^PRINT\s+(.*)$/i);
    if (pm) return { type: "print", text: pm[1].replace(/^["']|["']$/g, "") };
    return { type: "error", msg: "SYNTAX ERROR" };
  };
  root.BASIC = Basic;
})(typeof globalThis !== "undefined" ? globalThis : this);
