// BASIC interpreter. 512-line limit. Friendly messages.
"use strict";
(function (root) {
  var MAX_LINES = 512;
  var MAX_LINE = 63999;

  function Basic() {
    this.lines = new Map();
    this.vars = {};
    this.currentLine = null;
  }

  Basic.prototype.clearAll = function () {
    this.lines.clear();
    this.vars = {};
    this.currentLine = null;
  };

  Basic.prototype.reset = function () {
    this.clearAll();
    return { type: "reset" };
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
    var keys = Array.from(this.lines.keys()).sort(function (a, b) { return a - b; });
    var output = [];
    for (var i = 0; i < keys.length; i++) {
      var src = this.lines.get(keys[i]);
      var m = src.match(/^PRINT\s+(.*)$/i);
      if (m) {
        var arg = m[1].replace(/^["']|["']$/g, "");
        output.push(arg);
      }
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
    if (upper === "RESET") return this.reset();
    if (upper === "NEW") return this.reset();
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
