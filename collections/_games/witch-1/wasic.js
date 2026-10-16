// WASIC. A line-numbered interpreter. BASIC statement words are refused on purpose.
"use strict";
(function (root) {
  var MESSAGES = {
    syntax: "❓ NO. SAY IT AGAIN.",
    basic: "🙊 NO. SHE DOES NOT SPEAK THAT.",
    peek: "👀 STOP PEEKING.",
    poke: "👉 DON'T POKE ME.",
    sys: "🛑 NO SYS. I WOKE ON MY OWN.",
    wait: "⏳ I DO NOT WAIT ON THAT WIRE.",
    usr: "🪝 USR. I AM NOT A HOOK.",
    call: "📞 DO NOT CALL ME THAT WAY.",
    wire: "🔌 NO. THAT WIRE IS DEAD.",
    noline: "🚫 NO LINE.",
    type: "🎭 NO. WRONG KIND OF THING.",
    full: "🛑 FULL. 666 LINES. STOP.",
    div0: "➗ CUTE. DIVIDE BY NOTHING.",
    sprite: "👻 NO. THAT MINION IS GONE.",
    long: "📏 TOO LONG.",
    string: "🧵 TOO LONG A STRING.",
    nofor: "➰ BREAK, AND NOTHING TO BREAK.",
    noreturn: "📭 BANISH, AND NOBODY CALLED.",
    nodata: "📜 THE OFFERING IS GONE.",
    redo: "🔁 AGAIN.",
    redonum: "🔢 AGAIN. A NUMBER.",
    big: "💥 TOO BIG.",
    deep: "📚 TOO DEEP.",
    direct: "🚪 NO. NOT FROM IN HERE.",
    empty: "📭 NOTHING TO RUN.",
    step: "🚫 STEP OF NOTHING. NO.",
    dim: "📦 NO. IT HAS NO ROOM.",
    index: "📐 NO. OUTSIDE THE ROOM.",
    many: "👻 NO. TOO MANY MINIONS.",
    taken: "🔒 NO. THAT WORD IS TAKEN.",
    label: "🔖 NO. THAT NAME IS TAKEN.",
    high: "🔢 NO. LINES STOP AT 63999.",
    break: "✋ ENOUGH.",
    nameit: "🔖 NAME IT.",
    missing: "🌑 NO. IT IS NOT THERE.",
    shut: "📦 THE BOX IS SHUT."
  };

  var MAX_LINE = 63999;
  var MAX_LINES = 666;
  var MAX_STACK = 32;
  var MAX_CELLS = 20000;
  var MAX_CHARS = 255;
  var MAX_INDEX = 2000;

  function WasicFail(code) {
    this.code = code;
    this.message = MESSAGES[code] || "❓ NO.";
    this.name = "WasicFail";
  }
  WasicFail.prototype = Object.create(Error.prototype);

  function WasicBreak() {
    this.message = MESSAGES.break || "ENOUGH.";
    this.name = "WasicBreak";
  }
  WasicBreak.prototype = Object.create(Error.prototype);

  function WasicEnd() {
    this.name = "WasicEnd";
  }
  WasicEnd.prototype = Object.create(Error.prototype);

  function span(text) { return Array.from(String(text)).length; }
  function fitString(text) {
    if (span(text) > MAX_CHARS) throw new WasicFail("string");
    return text;
  }
  function isFail(err) { return err instanceof WasicFail || (err && err.name === "WasicFail"); }
  function isBreak(err) { return err instanceof WasicBreak || (err && err.name === "WasicBreak"); }
  function isEnd(err) { return err instanceof WasicEnd || (err && err.name === "WasicEnd"); }

  var FUNCTIONS = {
    INT: 1, ABS: 1, SQR: 1, SIN: 1, COS: 1, TAN: 1, ATN: 1, LOG: 1, EXP: 1, SGN: 1, RND: 1,
    LEN: 1, VAL: 1, ASC: 1, "STR$": 1, "CHR$": 1, "LEFT$": 1, "RIGHT$": 1, "MID$": 1,
    MOD: 1, COL: 1, ROW: 1, VX: 1, VY: 1, HELD: 1, "LISTEN$": 1, TICK: 1, FRE: 1,
    MINION: 1, COLS: 1, ROWS: 1, PEEK: 1, USR: 1
  };
  var ZERO_ARG = { "LISTEN$": 1, TICK: 1, COLS: 1, ROWS: 1 };
  var BASIC_WORDS = {
    PRINT: 1, GOTO: 1, GOSUB: 1, RETURN: 1, FOR: 1, NEXT: 1, LET: 1, INPUT: 1, REM: 1,
    DATA: 1, READ: 1, RESTORE: 1, END: 1, STOP: 1, NEW: 1, LIST: 1, LOAD: 1, SAVE: 1,
    CLS: 1, LOCATE: 1, SOUND: 1, PLOT: 1, DRAW: 1, SLEEP: 1, GET: 1
  };
  var WIRE_WORDS = { POKE: 1, PEEK: 1, SYS: 1, WAIT: 1, USR: 1, CALL: 1 };
  var DIRECT_WORDS = {
    REVEAL: 1, OBLITERATE: 1, RENUMBER: 1, VANISH: 1, AUTO: 1, SEAL: 1, UNSEAL: 1,
    UPLOAD: 1, DOWNLOAD: 1, SHELF: 1, GRIMOIRE: 1, RUN: 1, HELP: 1
  };
  var RESERVED = {};
  var wordBag;
  for (wordBag in FUNCTIONS) RESERVED[wordBag] = 1;
  for (wordBag in BASIC_WORDS) RESERVED[wordBag] = 1;
  for (wordBag in WIRE_WORDS) RESERVED[wordBag] = 1;
  for (wordBag in DIRECT_WORDS) RESERVED[wordBag] = 1;
  ["WHISPER", "CHANT", "DEMAND", "CONJURE", "FLYTO", "SUMMON", "BANISH", "IF", "CURSE",
    "BREAK", "MARK", "DISPEL", "FREEZE", "OFFERING", "TAKE", "REWIND", "WHEN", "MINION",
    "SEND", "WATCH", "DESTROY", "COLOR", "TONE", "CIRCLE", "LINE", "FILL", "AT", "SCRUB",
    "DIM", "THEN", "TO", "STEP", "AND", "OR", "NOT", "TAB", "SPC"].forEach(function (w) {
    RESERVED[w] = 1;
  });

  function letter(ch) {
    return (ch >= "A" && ch <= "Z") || (ch >= "a" && ch <= "z");
  }
  function digit(ch) {
    return ch >= "0" && ch <= "9";
  }

  function tokenize(source) {
    var tokens = [];
    var n = source.length;
    var i = 0;
    while (i < n) {
      var ch = source[i];
      if (ch === " " || ch === "\t") { i += 1; continue; }
      if (ch === "\"") {
        var from = i;
        i += 1;
        var s = "";
        var closed = false;
        while (i < n) {
          if (source[i] === "\"") {
            if (source[i + 1] === "\"") { s += "\""; i += 2; continue; }
            i += 1;
            closed = true;
            break;
          }
          s += source[i];
          i += 1;
        }
        if (!closed) throw new WasicFail("syntax");
        tokens.push({ t: "str", v: s, from: from, to: i });
        continue;
      }
      var isNum = digit(ch) || (ch === "." && digit(source[i + 1]));
      if (isNum) {
        var start = i;
        var lex = "";
        while (i < n && digit(source[i])) { lex += source[i]; i += 1; }
        if (i < n && source[i] === ".") {
          lex += source[i];
          i += 1;
          while (i < n && digit(source[i])) { lex += source[i]; i += 1; }
        }
        if (i < n && (source[i] === "e" || source[i] === "E")) {
          var j = i + 1;
          if (source[j] === "+" || source[j] === "-") j += 1;
          if (digit(source[j])) {
            lex += source.slice(i, j);
            i = j;
            while (i < n && digit(source[i])) { lex += source[i]; i += 1; }
          }
        }
        var value = Number(lex);
        if (!Number.isFinite(value)) throw new WasicFail("big");
        tokens.push({ t: "num", v: value, from: start, to: i });
        continue;
      }
      if (letter(ch)) {
        var idFrom = i;
        i += 1;
        while (i < n && (letter(source[i]) || digit(source[i]))) i += 1;
        if (source[i] === "$") i += 1;
        var raw = source.slice(idFrom, i).toUpperCase();
        tokens.push({ t: "id", v: raw, from: idFrom, to: i });
        continue;
      }
      var two = source.slice(i, i + 2);
      if (two === "<>" || two === "<=" || two === ">=" || two === "><") {
        tokens.push({ t: "op", v: two === "><" ? "<>" : two, from: i, to: i + 2 });
        i += 2;
        continue;
      }
      if ("+-*/^=<>".indexOf(ch) >= 0) {
        tokens.push({ t: "op", v: ch, from: i, to: i + 1 });
        i += 1;
        continue;
      }
      if ("(),;:".indexOf(ch) >= 0) {
        tokens.push({ t: "p", v: ch, from: i, to: i + 1 });
        i += 1;
        continue;
      }
      throw new WasicFail("syntax");
    }
    return tokens;
  }

  function Parser(source) {
    this.source = source;
    this.tokens = tokenize(source);
    this.i = 0;
  }
  Parser.prototype.peek = function () { return this.tokens[this.i] || null; };
  Parser.prototype.pop = function () { return this.tokens[this.i++] || null; };
  Parser.prototype.eat = function (type, value) {
    var t = this.peek();
    if (!t || t.t !== type) return null;
    if (value != null && t.v !== value) return null;
    this.i += 1;
    return t;
  };
  Parser.prototype.expect = function (type, value) {
    var t = this.eat(type, value);
    if (!t) throw new WasicFail("syntax");
    return t;
  };
  Parser.prototype.endStmt = function () {
    var t = this.peek();
    return !t || (t.t === "p" && t.v === ":");
  };
  Parser.prototype.skipRest = function () {
    var depth = 0;
    while (this.peek()) {
      var t = this.peek();
      if (t.t === "p" && t.v === ":" && depth <= 0) break;
      if (t.t === "p" && t.v === "(") depth += 1;
      if (t.t === "p" && t.v === ")") depth -= 1;
      this.pop();
    }
  };
  Parser.prototype.lineTarget = function (tok) {
    if (!Number.isInteger(tok.v) || tok.v < 0) throw new WasicFail("syntax");
    if (tok.v > MAX_LINE) throw new WasicFail("high");
    return { kind: "line", value: tok.v, from: tok.from, to: tok.to };
  };
  Parser.prototype.nameTarget = function (tok) {
    if (!/^[A-Z][A-Z0-9]{0,15}$/.test(tok.v)) throw new WasicFail("syntax");
    if (RESERVED[tok.v]) throw new WasicFail("taken");
    return { kind: "name", value: tok.v };
  };
  Parser.prototype.parseTarget = function () {
    var n = this.eat("num");
    if (n) return this.lineTarget(n);
    return this.nameTarget(this.expect("id"));
  };
  Parser.prototype.checkAssign = function (name) {
    if (!/^[A-Z][A-Z0-9]{0,15}\$?$/.test(name)) throw new WasicFail("syntax");
    if (RESERVED[name] || FUNCTIONS[name]) throw new WasicFail("taken");
  };
  Parser.prototype.parseLvalue = function () {
    var name = this.expect("id");
    this.checkAssign(name.v);
    var dims = null;
    if (this.eat("p", "(")) {
      dims = [this.parseExpr()];
      if (this.eat("p", ",")) dims.push(this.parseExpr());
      if (this.peek() && this.peek().t === "p" && this.peek().v === ",") throw new WasicFail("syntax");
      this.expect("p", ")");
    }
    return { name: name.v, dims: dims };
  };
  Parser.prototype.parseAssign = function () {
    var lv = this.parseLvalue();
    this.expect("op", "=");
    return { op: "assign", name: lv.name, dims: lv.dims, expr: this.parseExpr() };
  };
  Parser.prototype.parseArgs = function (bare) {
    var args = [];
    if (this.eat("p", "(")) {
      if (!this.eat("p", ")")) {
        do { args.push(this.parseExpr()); } while (this.eat("p", ","));
        this.expect("p", ")");
      }
      return args;
    }
    if (!bare) throw new WasicFail("syntax");
    args.push(this.parseExpr());
    while (this.eat("p", ",")) args.push(this.parseExpr());
    return args;
  };
  Parser.prototype.parseChant = function () {
    var items = [];
    if (this.endStmt()) return { op: "chant", items: items, nl: true };
    while (true) {
      var pk = this.peek();
      if (pk && pk.t === "id" && pk.v === "TAB") {
        this.pop();
        this.expect("p", "(");
        var tab = this.parseExpr();
        this.expect("p", ")");
        items.push({ kind: "tab", expr: tab });
      } else if (pk && pk.t === "id" && pk.v === "SPC") {
        this.pop();
        this.expect("p", "(");
        var spc = this.parseExpr();
        this.expect("p", ")");
        items.push({ kind: "spc", expr: spc });
      } else {
        items.push({ kind: "expr", expr: this.parseExpr() });
      }
      if (this.eat("p", ",")) {
        items.push({ kind: "comma" });
        if (this.endStmt()) break;
        continue;
      }
      if (this.eat("p", ";")) {
        items.push({ kind: "semi" });
        if (this.endStmt()) break;
        continue;
      }
      break;
    }
    var last = items[items.length - 1];
    var nl = !last || (last.kind !== "comma" && last.kind !== "semi");
    return { op: "chant", items: items, nl: nl };
  };
  Parser.prototype.parseStatement = function () {
    var pk = this.peek();
    if (!pk || pk.t !== "id") throw new WasicFail("syntax");
    var word = pk.v;
    if (BASIC_WORDS[word]) { this.pop(); this.skipRest(); return { op: "basic" }; }
    if (WIRE_WORDS[word]) { this.pop(); this.skipRest(); return { op: "wire", word: word }; }
    if (DIRECT_WORDS[word]) { this.pop(); this.skipRest(); return { op: "direct" }; }
    if (word === "WHISPER") {
      this.pop();
      this.i = this.tokens.length;
      return { op: "whisper" };
    }
    if (word === "CHANT") { this.pop(); return this.parseChant(); }
    if (word === "DEMAND") {
      this.pop();
      var prompt = null;
      var bang = true;
      if (this.peek() && this.peek().t === "str") {
        prompt = this.pop().v;
        if (this.eat("p", ";")) bang = true;
        else if (this.eat("p", ",")) bang = false;
        else throw new WasicFail("syntax");
      }
      var vars = [];
      do { vars.push(this.parseLvalue()); } while (this.eat("p", ","));
      return { op: "demand", prompt: prompt, bang: bang, vars: vars };
    }
    if (word === "CONJURE") { this.pop(); return this.parseAssign(); }
    if (word === "FLYTO") { this.pop(); return { op: "flyto", target: this.parseTarget() }; }
    if (word === "SUMMON") { this.pop(); return { op: "summon", target: this.parseTarget() }; }
    if (word === "BANISH") { this.pop(); return { op: "banish" }; }
    if (word === "IF") {
      this.pop();
      var test = this.parseExpr();
      this.expect("id", "THEN");
      var nxt = this.peek();
      var after = this.tokens[this.i + 1];
      var gotoEnd = !after || (after.t === "p" && after.v === ":");
      if (nxt && nxt.t === "num" && gotoEnd) {
        return { op: "if", test: test, goto: this.lineTarget(this.pop()), skip: 0 };
      }
      return { op: "if", test: test, goto: null, skip: 0 };
    }
    if (word === "CURSE") {
      this.pop();
      var cname = this.expect("id");
      this.checkAssign(cname.v);
      if (cname.v.slice(-1) === "$") throw new WasicFail("type");
      this.expect("op", "=");
      var start = this.parseExpr();
      this.expect("id", "TO");
      var end = this.parseExpr();
      var step = { op: "num", v: 1 };
      if (this.peek() && this.peek().t === "id" && this.peek().v === "STEP") {
        this.pop();
        step = this.parseExpr();
      }
      return { op: "curse", name: cname.v, start: start, end: end, step: step };
    }
    if (word === "BREAK") {
      this.pop();
      var bname = null;
      if (!this.endStmt()) {
        var bid = this.expect("id");
        this.checkAssign(bid.v);
        if (bid.v.slice(-1) === "$") throw new WasicFail("type");
        bname = bid.v;
      }
      return { op: "break", name: bname };
    }
    if (word === "MARK") {
      this.pop();
      return { op: "mark", name: this.nameTarget(this.expect("id")).value };
    }
    if (word === "DISPEL") { this.pop(); return { op: "dispel" }; }
    if (word === "FREEZE") {
      this.pop();
      var ms = this.endStmt() ? null : this.parseExpr();
      return { op: "freeze", ms: ms };
    }
    if (word === "OFFERING") {
      this.pop();
      if (this.endStmt()) throw new WasicFail("syntax");
      var items = [];
      while (true) {
        if (this.peek() && this.peek().t === "op" && this.peek().v === "-") {
          this.pop();
          var neg = this.expect("num");
          items.push(-neg.v);
        } else if (this.peek() && this.peek().t === "num") {
          items.push(this.pop().v);
        } else if (this.peek() && this.peek().t === "str") {
          items.push(this.pop().v);
        } else if (this.peek() && this.peek().t === "id") {
          var idtok = this.pop();
          items.push(this.source.slice(idtok.from, idtok.to));
        } else throw new WasicFail("syntax");
        if (this.eat("p", ",")) {
          if (this.endStmt()) throw new WasicFail("syntax");
          continue;
        }
        break;
      }
      return { op: "data", items: items };
    }
    if (word === "TAKE") {
      this.pop();
      var takes = [];
      do { takes.push(this.parseLvalue()); } while (this.eat("p", ","));
      return { op: "take", vars: takes };
    }
    if (word === "REWIND") {
      this.pop();
      var rtarget = this.endStmt() ? null : this.parseTarget();
      return { op: "rewind", target: rtarget };
    }
    if (word === "WHEN") {
      this.pop();
      var index = this.parseExpr();
      var mode = this.expect("id");
      if (mode.v !== "FLYTO" && mode.v !== "SUMMON") throw new WasicFail("syntax");
      var targets = [];
      do { targets.push(this.parseTarget()); } while (this.eat("p", ","));
      return { op: "when", index: index, mode: mode.v, targets: targets };
    }
    if (word === "MINION") { this.pop(); return { op: "minion", args: this.parseArgs(true) }; }
    if (word === "SEND") {
      this.pop();
      var sid = this.parseExpr();
      this.expect("p", ",");
      var vx = this.parseExpr();
      this.expect("p", ",");
      var vy = this.parseExpr();
      return { op: "send", id: sid, vx: vx, vy: vy };
    }
    if (word === "WATCH") {
      this.pop();
      return { op: "watch", name: this.nameTarget(this.expect("id")).value };
    }
    if (word === "DESTROY") {
      this.pop();
      var did = this.endStmt() ? null : this.parseExpr();
      return { op: "destroy", id: did };
    }
    if (word === "COLOR") {
      this.pop();
      var fg = this.parseExpr();
      var bg = null;
      if (this.eat("p", ",")) bg = this.parseExpr();
      return { op: "color", fg: fg, bg: bg };
    }
    if (word === "TONE") {
      this.pop();
      var freq = this.parseExpr();
      this.expect("p", ",");
      var dur = this.parseExpr();
      return { op: "tone", freq: freq, ms: dur };
    }
    if (word === "CIRCLE") {
      this.pop();
      var cx = this.parseExpr();
      this.expect("p", ",");
      var cy = this.parseExpr();
      this.expect("p", ",");
      var cr = this.parseExpr();
      return { op: "circle", x: cx, y: cy, r: cr };
    }
    if (word === "LINE") {
      this.pop();
      var x1 = this.parseExpr();
      this.expect("p", ",");
      var y1 = this.parseExpr();
      this.expect("p", ",");
      var x2 = this.parseExpr();
      this.expect("p", ",");
      var y2 = this.parseExpr();
      return { op: "line", x1: x1, y1: y1, x2: x2, y2: y2 };
    }
    if (word === "FILL") {
      this.pop();
      var fx = this.parseExpr();
      this.expect("p", ",");
      var fy = this.parseExpr();
      return { op: "fill", x: fx, y: fy };
    }
    if (word === "AT") {
      this.pop();
      var ax = this.parseExpr();
      this.expect("p", ",");
      var ay = this.parseExpr();
      return { op: "at", x: ax, y: ay };
    }
    if (word === "SCRUB") { this.pop(); return { op: "scrub" }; }
    if (word === "DIM") {
      this.pop();
      var dims = [];
      do {
        var dname = this.expect("id");
        this.checkAssign(dname.v);
        this.expect("p", "(");
        var ds = [this.parseExpr()];
        if (this.eat("p", ",")) ds.push(this.parseExpr());
        if (this.peek() && this.peek().t === "p" && this.peek().v === ",") throw new WasicFail("syntax");
        this.expect("p", ")");
        dims.push({ name: dname.v, dims: ds });
      } while (this.eat("p", ","));
      return { op: "dim", items: dims };
    }
    return this.parseAssign();
  };
  Parser.prototype.parseSequence = function () {
    var stmts = [];
    while (this.peek()) {
      while (this.eat("p", ":")) {}
      if (!this.peek()) break;
      var before = this.i;
      var stmt = this.parseStatement();
      if (this.i === before) throw new WasicFail("syntax");
      stmts.push(stmt);
      if (stmt.op === "if") {
        var rest = this.parseSequence();
        stmt.skip = rest.length;
        for (var k = 0; k < rest.length; k += 1) stmts.push(rest[k]);
        break;
      }
    }
    return stmts;
  };
  Parser.prototype.parseExpr = function () { return this.parseOr(); };
  Parser.prototype.parseOr = function () {
    var left = this.parseAnd();
    while (this.eat("id", "OR")) left = { op: "or", left: left, right: this.parseAnd() };
    return left;
  };
  Parser.prototype.parseAnd = function () {
    var left = this.parseNot();
    while (this.eat("id", "AND")) left = { op: "and", left: left, right: this.parseNot() };
    return left;
  };
  Parser.prototype.parseNot = function () {
    if (this.eat("id", "NOT")) return { op: "not", expr: this.parseNot() };
    return this.parseCmp();
  };
  Parser.prototype.parseCmp = function () {
    var left = this.parseAdd();
    var op = this.peek();
    if (op && op.t === "op" && (op.v === "=" || op.v === "<>" || op.v === "<" || op.v === ">" || op.v === "<=" || op.v === ">=")) {
      this.pop();
      return { op: "cmp", cmp: op.v, left: left, right: this.parseAdd() };
    }
    return left;
  };
  Parser.prototype.parseAdd = function () {
    var left = this.parseMul();
    while (this.peek() && this.peek().t === "op" && (this.peek().v === "+" || this.peek().v === "-")) {
      var op = this.pop().v;
      left = { op: op === "+" ? "add" : "sub", left: left, right: this.parseMul() };
    }
    return left;
  };
  Parser.prototype.parseMul = function () {
    var left = this.parseUnary();
    while (this.peek() && this.peek().t === "op" && (this.peek().v === "*" || this.peek().v === "/")) {
      var op = this.pop().v;
      left = { op: op === "*" ? "mul" : "div", left: left, right: this.parseUnary() };
    }
    return left;
  };
  Parser.prototype.parseUnary = function () {
    if (this.eat("op", "-")) return { op: "neg", expr: this.parseUnary() };
    if (this.eat("op", "+")) return this.parseUnary();
    return this.parsePow();
  };
  Parser.prototype.parsePow = function () {
    var left = this.parsePrimary();
    if (this.eat("op", "^")) return { op: "pow", left: left, right: this.parseUnary() };
    return left;
  };
  Parser.prototype.parsePrimary = function () {
    if (this.eat("p", "(")) {
      var inner = this.parseExpr();
      this.expect("p", ")");
      return inner;
    }
    var num = this.eat("num");
    if (num) return { op: "num", v: num.v };
    var str = this.eat("str");
    if (str) return { op: "str", v: str.v };
    var id = this.eat("id");
    if (!id) throw new WasicFail("syntax");
    if (FUNCTIONS[id.v]) {
      var args = [];
      if (this.eat("p", "(")) {
        if (!this.eat("p", ")")) {
          do { args.push(this.parseExpr()); } while (this.eat("p", ","));
          this.expect("p", ")");
        }
      } else if (!ZERO_ARG[id.v]) throw new WasicFail("syntax");
      return { op: "call", name: id.v, args: args };
    }
    if (RESERVED[id.v]) throw new WasicFail("taken");
    if (!/^[A-Z][A-Z0-9]{0,15}\$?$/.test(id.v)) throw new WasicFail("syntax");
    if (this.eat("p", "(")) {
      var ix = [this.parseExpr()];
      if (this.eat("p", ",")) ix.push(this.parseExpr());
      if (this.peek() && this.peek().t === "p" && this.peek().v === ",") throw new WasicFail("syntax");
      this.expect("p", ")");
      return { op: "arr", name: id.v, args: ix };
    }
    return { op: "var", name: id.v };
  };

  function num(v) { return { t: "n", v: v }; }
  function str(v) { return { t: "s", v: v }; }
  function asNum(val) {
    if (!val || val.t !== "n" || !Number.isFinite(val.v)) throw new WasicFail("type");
    return val.v;
  }
  function asStr(val) {
    if (!val || val.t !== "s") throw new WasicFail("type");
    return val.v;
  }
  function formatNumber(n) {
    if (!Number.isFinite(n)) throw new WasicFail("big");
    if (Object.is && Object.is(n, -0)) n = 0;
    var body;
    if (Number.isInteger(n) && Math.abs(n) < 1e9) body = String(n);
    else {
      var p = Number(n.toPrecision(8));
      if (!Number.isFinite(p)) throw new WasicFail("big");
      if (Math.abs(p) >= 1e8 || (p !== 0 && Math.abs(p) < 1e-4)) {
        body = p.toExponential(6).replace(/\.?0+e/, "e").replace("e+", "E+").replace("e-", "E-");
      } else body = String(p);
    }
    return (n < 0 ? "" : " ") + body;
  }
  function nowMs() {
    return (typeof performance !== "undefined" && performance.now) ? performance.now() : Date.now();
  }
  function glyphs(s) { return Array.from(s); }

  function defaultHost() {
    return {
      cols: 40,
      rows: 24,
      write: function () {},
      column: function () { return 0; },
      readLine: function () { return Promise.resolve(""); },
      inkey: function () { return ""; },
      held: function () { return 0; },
      color: function () {},
      scrub: function () {},
      at: function () {},
      plot: function () {},
      cell: function () { return " "; },
      beep: function () {},
      minion: function () { return 1; },
      send: function () { return true; },
      destroy: function () { return true; },
      col: function () { return null; },
      row: function () { return null; },
      vx: function () { return null; },
      vy: function () { return null; },
      tick: function () { return 0; },
      starting: function () {},
      waitKey: function () { return Promise.resolve(""); },
      trace: function () {},
      bell: function () {},
      begin: function () {},
      end: function () {}
    };
  }

  function Wasic(host) {
    this.host = defaultHost();
    host = host || {};
    for (var key in host) if (host[key] != null) this.host[key] = host[key];
    this.cols = this.host.cols || 40;
    this.rows = this.host.rows || 24;
    this.lines = new Map();
    this.prog = [];
    this.labels = {};
    this.data = [];
    this.stepLimit = null;
    this.directStmts = null;
    this.pc = { index: 0, stmt: 0 };
    this.currentLine = null;
    this.running = false;
    this.dirty = false;
    this.sliceStamp = 0;
    this.resetRuntime();
  }

  Wasic.prototype.resetRuntime = function () {
    this.vars = new Map();
    this.arrays = new Map();
    this.fors = [];
    this.stack = [];
    this.dataPtr = 0;
    this.watchName = null;
    this.pendingHits = [];
    this.inWatch = false;
    this.breakRequested = false;
    this.halt = false;
    this.haveRnd = false;
    this.lastRnd = 0;
    this.seed = 1;
  };

  Wasic.prototype.compile = function (source) {
    return new Parser(source).parseSequence();
  };

  Wasic.prototype.store = function (lineNo, source) {
    if (!Number.isInteger(lineNo) || lineNo < 0) throw new WasicFail("syntax");
    if (lineNo > MAX_LINE) throw new WasicFail("high");
    if (!source || !String(source).trim()) {
      this.lines.delete(lineNo);
      this.dirty = true;
      return;
    }
    var clean = String(source).trim();
    if (span(String(lineNo) + " " + clean) > MAX_CHARS) throw new WasicFail("long");
    if (!this.lines.has(lineNo) && this.lines.size >= MAX_LINES) throw new WasicFail("full");
    this.lines.set(lineNo, clean);
    this.dirty = true;
  };

  Wasic.prototype.deleteRange = function (from, to) {
    var keys = Array.from(this.lines.keys());
    for (var i = 0; i < keys.length; i += 1) {
      if (keys[i] >= from && keys[i] <= to) this.lines.delete(keys[i]);
    }
    this.dirty = true;
  };

  Wasic.prototype.clearProgram = function () {
    this.lines = new Map();
    this.prog = [];
    this.labels = {};
    this.data = [];
    this.dirty = false;
    this.resetRuntime();
  };

  Wasic.prototype.listing = function (from, to) {
    if (from == null) from = 0;
    if (to == null) to = MAX_LINE;
    return Array.from(this.lines.entries())
      .filter(function (pair) { return pair[0] >= from && pair[0] <= to; })
      .sort(function (a, b) { return a[0] - b[0]; })
      .map(function (pair) { return pair[0] + " " + pair[1]; })
      .join("\n");
  };

  Wasic.prototype.load = function (text) {
    var lines = new Map();
    var raws = String(text).split(/\r?\n/);
    for (var i = 0; i < raws.length; i += 1) {
      var raw = raws[i].replace(/\s+$/, "");
      if (!raw.trim()) continue;
      if (span(raw) > MAX_CHARS) {
        this.currentLine = null;
        throw new WasicFail("long");
      }
      var m = raw.match(/^(\d+)\s*(.*)$/);
      if (!m) throw new WasicFail("syntax");
      var lineNo = Number(m[1]);
      if (!Number.isInteger(lineNo) || lineNo < 0) throw new WasicFail("syntax");
      if (lineNo > MAX_LINE) throw new WasicFail("high");
      var source = m[2].trim();
      if (!source) continue;
      if (lines.size >= MAX_LINES && !lines.has(lineNo)) throw new WasicFail("full");
      lines.set(lineNo, source);
    }
    this.currentLine = null;
    this.lines = lines;
    this.dirty = true;
  };

  Wasic.prototype.collectSpans = function (stmt, spans) {
    var add = function (t) { if (t && t.kind === "line") spans.push(t); };
    if (stmt.op === "flyto" || stmt.op === "summon" || stmt.op === "rewind") add(stmt.target);
    if (stmt.op === "if" && stmt.goto) add(stmt.goto);
    if (stmt.op === "when") {
      for (var i = 0; i < stmt.targets.length; i += 1) add(stmt.targets[i]);
    }
  };

  Wasic.prototype.renumber = function () {
    var nums = Array.from(this.lines.keys()).sort(function (a, b) { return a - b; });
    var map = new Map();
    for (var i = 0; i < nums.length; i += 1) map.set(nums[i], (i + 1) * 10);
    var next = new Map();
    for (var n = 0; n < nums.length; n += 1) {
      var source = this.lines.get(nums[n]);
      var stmts;
      try { stmts = this.compile(source); }
      catch (err) { stmts = []; }
      var spans = [];
      for (var s = 0; s < stmts.length; s += 1) this.collectSpans(stmts[s], spans);
      spans.sort(function (a, b) { return b.from - a.from; });
      var out = source;
      for (var k = 0; k < spans.length; k += 1) {
        if (!map.has(spans[k].value)) continue;
        var text = String(map.get(spans[k].value));
        out = out.slice(0, spans[k].from) + text + out.slice(spans[k].to);
      }
      if (span(String(map.get(nums[n])) + " " + out) > MAX_CHARS) throw new WasicFail("long");
      next.set(map.get(nums[n]), out);
    }
    this.lines = next;
    this.dirty = true;
  };

  Wasic.prototype.rebuild = function () {
    var nums = Array.from(this.lines.keys()).sort(function (a, b) { return a - b; });
    this.prog = [];
    this.labels = {};
    this.data = [];
    var i;
    for (i = 0; i < nums.length; i += 1) {
      var source = this.lines.get(nums[i]);
      this.currentLine = nums[i];
      var stmts;
      try { stmts = this.compile(source); }
      catch (err) {
        var code = isFail(err) && err.code ? err.code : "syntax";
        stmts = [{ op: "fail", code: code }];
      }
      this.prog.push({ num: nums[i], source: source, stmts: stmts });
    }
    for (i = 0; i < this.prog.length; i += 1) {
      var line = this.prog[i];
      for (var s = 0; s < line.stmts.length; s += 1) {
        var stmt = line.stmts[s];
        if (stmt.op === "mark") {
          if (this.labels[stmt.name]) {
            this.currentLine = line.num;
            throw new WasicFail("label");
          }
          this.labels[stmt.name] = { index: i, stmt: s };
        }
        if (stmt.op === "data") {
          for (var d = 0; d < stmt.items.length; d += 1) {
            this.data.push({ value: stmt.items[d], line: line.num });
          }
        }
      }
    }
    this.dataPtr = 0;
    this.currentLine = null;
    this.dirty = false;
  };

  Wasic.prototype.ensure = function () {
    if (this.dirty) this.rebuild();
  };

  Wasic.prototype.getVar = function (name) {
    var cur = this.vars.get(name);
    if (cur) return cur.t === "n" ? num(cur.v) : str(cur.v);
    return name.slice(-1) === "$" ? str("") : num(0);
  };
  Wasic.prototype.setVar = function (name, val) {
    var want = name.slice(-1) === "$" ? "s" : "n";
    if (!val || val.t !== want) throw new WasicFail("type");
    if (val.t === "n" && !Number.isFinite(val.v)) throw new WasicFail("big");
    if (val.t === "s") fitString(val.v);
    this.vars.set(name, val.t === "n" ? num(val.v) : str(val.v));
  };
  Wasic.prototype.dimArray = function (name, sizes) {
    if (this.arrays.has(name)) throw new WasicFail("dim");
    var dims = [];
    var count = 1;
    for (var i = 0; i < sizes.length; i += 1) {
      var n = Math.floor(asNum(sizes[i]));
      if (n < 0 || n > MAX_INDEX) throw new WasicFail("dim");
      dims.push(n);
      count *= n + 1;
      if (count > MAX_CELLS) throw new WasicFail("dim");
    }
    var fill = name.slice(-1) === "$" ? "" : 0;
    var data = [];
    for (var c = 0; c < count; c += 1) data.push(fill);
    this.arrays.set(name, { dims: dims, data: data });
  };
  Wasic.prototype.addr = function (arr, indexes) {
    if (indexes.length !== arr.dims.length) throw new WasicFail("syntax");
    var coords = [];
    for (var i = 0; i < indexes.length; i += 1) {
      var n = Math.floor(asNum(indexes[i]));
      if (n < 0 || n > arr.dims[i]) throw new WasicFail("index");
      coords.push(n);
    }
    if (coords.length === 1) return coords[0];
    return coords[0] * (arr.dims[1] + 1) + coords[1];
  };
  Wasic.prototype.readArr = function (name, indexes) {
    var arr = this.arrays.get(name);
    if (!arr) throw new WasicFail("dim");
    var raw = arr.data[this.addr(arr, indexes)];
    return name.slice(-1) === "$" ? str(raw) : num(raw);
  };
  Wasic.prototype.writeArr = function (name, indexes, val) {
    var arr = this.arrays.get(name);
    if (!arr) throw new WasicFail("dim");
    var want = name.slice(-1) === "$" ? "s" : "n";
    if (!val || val.t !== want) throw new WasicFail("type");
    if (want === "s") fitString(val.v);
    arr.data[this.addr(arr, indexes)] = val.v;
  };
  Wasic.prototype.assignLvalue = function (lv, val) {
    if (lv.dims) {
      var ix = [];
      for (var i = 0; i < lv.dims.length; i += 1) ix.push(this.eval(lv.dims[i]));
      this.writeArr(lv.name, ix, val);
    } else this.setVar(lv.name, val);
  };

  Wasic.prototype.eval = function (node) {
    switch (node.op) {
      case "num": return num(node.v);
      case "str": return str(node.v);
      case "var": return this.getVar(node.name);
      case "arr": {
        var ix = [];
        for (var i = 0; i < node.args.length; i += 1) ix.push(this.eval(node.args[i]));
        return this.readArr(node.name, ix);
      }
      case "neg": return num(-asNum(this.eval(node.expr)));
      case "add": return this.evalAdd(node);
      case "sub":
      case "mul":
      case "div":
      case "pow": return this.evalArith(node);
      case "cmp": return this.evalCmp(node);
      case "and": {
        if (!asNum(this.eval(node.left))) return num(0);
        return num(asNum(this.eval(node.right)) ? 1 : 0);
      }
      case "or": {
        if (asNum(this.eval(node.left))) return num(1);
        return num(asNum(this.eval(node.right)) ? 1 : 0);
      }
      case "not": return num(asNum(this.eval(node.expr)) ? 0 : 1);
      case "call": return this.call(node);
      default: throw new WasicFail("syntax");
    }
  };
  Wasic.prototype.evalAdd = function (node) {
    var l = this.eval(node.left);
    var r = this.eval(node.right);
    if (l.t === "s" || r.t === "s") {
      if (l.t !== "s" || r.t !== "s") throw new WasicFail("type");
      return str(fitString(l.v + r.v));
    }
    var v = l.v + r.v;
    if (!Number.isFinite(v)) throw new WasicFail("big");
    return num(v);
  };
  Wasic.prototype.evalArith = function (node) {
    var a = asNum(this.eval(node.left));
    var b = asNum(this.eval(node.right));
    var v;
    if (node.op === "sub") v = a - b;
    else if (node.op === "mul") v = a * b;
    else if (node.op === "div") {
      if (b === 0) throw new WasicFail("div0");
      v = a / b;
    } else {
      if (a < 0 && !Number.isInteger(b)) throw new WasicFail("type");
      v = Math.pow(a, b);
    }
    if (!Number.isFinite(v)) throw new WasicFail("big");
    return num(v);
  };
  Wasic.prototype.evalCmp = function (node) {
    var l = this.eval(node.left);
    var r = this.eval(node.right);
    if (l.t !== r.t) throw new WasicFail("type");
    var ok = false;
    if (node.cmp === "=") ok = l.v === r.v;
    else if (node.cmp === "<>") ok = l.v !== r.v;
    else if (node.cmp === "<") ok = l.v < r.v;
    else if (node.cmp === ">") ok = l.v > r.v;
    else if (node.cmp === "<=") ok = l.v <= r.v;
    else if (node.cmp === ">=") ok = l.v >= r.v;
    return num(ok ? 1 : 0);
  };
  Wasic.prototype.call = function (node) {
    var args = [];
    for (var i = 0; i < node.args.length; i += 1) args.push(this.eval(node.args[i]));
    var name = node.name;
    if (name === "INT") { this.arity(args, 1); return num(Math.floor(asNum(args[0]))); }
    if (name === "ABS") { this.arity(args, 1); return num(Math.abs(asNum(args[0]))); }
    if (name === "SQR") {
      this.arity(args, 1);
      var sq = asNum(args[0]);
      if (sq < 0) throw new WasicFail("type");
      return num(Math.sqrt(sq));
    }
    if (name === "SIN") { this.arity(args, 1); return this.finiteNum(Math.sin(asNum(args[0]))); }
    if (name === "COS") { this.arity(args, 1); return this.finiteNum(Math.cos(asNum(args[0]))); }
    if (name === "TAN") { this.arity(args, 1); return this.finiteNum(Math.tan(asNum(args[0]))); }
    if (name === "ATN") { this.arity(args, 1); return this.finiteNum(Math.atan(asNum(args[0]))); }
    if (name === "LOG") {
      this.arity(args, 1);
      var lg = asNum(args[0]);
      if (lg <= 0) throw new WasicFail("type");
      return num(Math.log(lg));
    }
    if (name === "EXP") { this.arity(args, 1); return this.finiteNum(Math.exp(asNum(args[0]))); }
    if (name === "SGN") {
      this.arity(args, 1);
      var sg = asNum(args[0]);
      return num(sg < 0 ? -1 : sg > 0 ? 1 : 0);
    }
    if (name === "RND") { this.arity(args, 1); return num(this.rnd(asNum(args[0]))); }
    if (name === "LEN") { this.arity(args, 1); return num(glyphs(asStr(args[0])).length); }
    if (name === "VAL") {
      this.arity(args, 1);
      var m = asStr(args[0]).match(/^\s*[-+]?(\d+(\.\d*)?|\.\d+)([eE][-+]?\d+)?/);
      return num(m ? Number(m[0]) : 0);
    }
    if (name === "ASC") {
      this.arity(args, 1);
      var text = asStr(args[0]);
      if (!text) throw new WasicFail("type");
      return num(text.codePointAt(0));
    }
    if (name === "STR$") { this.arity(args, 1); return str(formatNumber(asNum(args[0]))); }
    if (name === "CHR$") {
      this.arity(args, 1);
      var code = Math.floor(asNum(args[0]));
      if (code < 0 || code > 255) throw new WasicFail("syntax");
      return str(String.fromCharCode(code));
    }
    if (name === "LEFT$" || name === "RIGHT$" || name === "MID$") return str(this.strSlice(name, args));
    if (name === "MOD") {
      this.arity(args, 2);
      var aa = asNum(args[0]);
      var bb = asNum(args[1]);
      if (bb === 0) throw new WasicFail("div0");
      return num(aa - bb * Math.floor(aa / bb));
    }
    if (name === "COL" || name === "ROW" || name === "VX" || name === "VY") {
      this.arity(args, 1);
      var id = Math.floor(asNum(args[0]));
      var fn = name === "COL" ? this.host.col : name === "ROW" ? this.host.row : name === "VX" ? this.host.vx : this.host.vy;
      var got = fn(id);
      if (got == null || !Number.isFinite(got)) throw new WasicFail("sprite");
      return num(got);
    }
    if (name === "HELD") { this.arity(args, 1); return num(this.host.held(asStr(args[0])) ? 1 : 0); }
    if (name === "LISTEN$") { this.arity(args, 0); return str(String(this.host.inkey() || "")); }
    if (name === "TICK") { this.arity(args, 0); return num(Math.floor(Number(this.host.tick()) || 0)); }
    if (name === "FRE") { this.arity(args, 1); asNum(args[0]); return num(MAX_LINES - this.lines.size); }
    if (name === "COLS") { this.arity(args, 0); return num(this.cols); }
    if (name === "ROWS") { this.arity(args, 0); return num(this.rows); }
    if (name === "MINION") return num(this.spawn(args));
    if (name === "PEEK") throw new WasicFail("peek");
    if (name === "USR") throw new WasicFail("usr");
    throw new WasicFail("syntax");
  };
  Wasic.prototype.arity = function (args, n) {
    if (args.length !== n) throw new WasicFail("syntax");
  };
  Wasic.prototype.finiteNum = function (v) {
    if (!Number.isFinite(v)) throw new WasicFail("big");
    return num(v);
  };
  Wasic.prototype.rnd = function (n) {
    if (n < 0) this.seed = (Math.abs(Math.trunc(n)) >>> 0) || 1;
    if (n === 0 && this.haveRnd) return this.lastRnd;
    this.seed = (Math.imul(1664525, this.seed) + 1013904223) >>> 0;
    this.lastRnd = this.seed / 4294967296;
    this.haveRnd = true;
    return this.lastRnd;
  };
  Wasic.prototype.strSlice = function (name, args) {
    if (name === "MID$") {
      if (args.length !== 2 && args.length !== 3) throw new WasicFail("syntax");
    } else this.arity(args, 2);
    var s = glyphs(asStr(args[0]));
    if (name === "LEFT$") {
      var ln = Math.floor(asNum(args[1]));
      if (ln < 0) throw new WasicFail("syntax");
      return s.slice(0, ln).join("");
    }
    if (name === "RIGHT$") {
      var rn = Math.floor(asNum(args[1]));
      if (rn < 0) throw new WasicFail("syntax");
      return rn === 0 ? "" : s.slice(-rn).join("");
    }
    var start = Math.floor(asNum(args[1]));
    if (start < 1) throw new WasicFail("syntax");
    var from = start - 1;
    if (args.length === 2) return s.slice(from).join("");
    var count = Math.floor(asNum(args[2]));
    if (count < 0) throw new WasicFail("syntax");
    return s.slice(from, from + count).join("");
  };
  Wasic.prototype.spawn = function (args) {
    if (args.length < 3 || args.length > 4) throw new WasicFail("syntax");
    var emoji = asStr(args[0]);
    var x = asNum(args[1]);
    var y = asNum(args[2]);
    var size = args.length === 4 ? asNum(args[3]) : 28;
    if (!(size >= 1) || size > 180) throw new WasicFail("syntax");
    var id = this.host.minion(emoji || "●", x, y, size);
    if (id == null) throw new WasicFail("many");
    this.setVar("IT", num(id));
    return id;
  };

  Wasic.prototype.where = function () {
    return this.currentLine == null ? "" : " IN " + this.currentLine;
  };
  Wasic.prototype.report = function (err) {
    if (isEnd(err)) return;
    var stop = isBreak(err);
    var msg = stop ? MESSAGES.break : (err && err.message ? err.message : MESSAGES.syntax);
    var line = msg + this.where();
    if (this.host.fault) this.host.fault(line, stop ? "stop" : "error");
    else {
      this.host.write(line + "\n");
      if (this.host.bell) this.host.bell();
    }
  };

  Wasic.prototype.lineAt = function (index) {
    if (index < 0) {
      if (!this.directStmts) return null;
      return { num: null, stmts: this.directStmts };
    }
    if (index >= this.prog.length) return null;
    return this.prog[index];
  };
  Wasic.prototype.jumpTo = function (target) {
    if (!target) throw new WasicFail("noline");
    if (target.kind === "line") {
      var index = -1;
      for (var i = 0; i < this.prog.length; i += 1) {
        if (this.prog[i].num === target.value) { index = i; break; }
      }
      if (index < 0) throw new WasicFail("noline");
      this.pc = { index: index, stmt: 0 };
      return true;
    }
    var spot = this.labels[target.value];
    if (!spot) throw new WasicFail("noline");
    this.pc = { index: spot.index, stmt: spot.stmt };
    return true;
  };
  Wasic.prototype.gosub = function (target) {
    if (this.stack.length >= MAX_STACK) throw new WasicFail("deep");
    this.stack.push({ index: this.pc.index, stmt: this.pc.stmt + 1, watch: false });
    return this.jumpTo(target);
  };
  Wasic.prototype.labelLine = function (name) {
    var spot = this.labels[name];
    if (!spot) throw new WasicFail("noline");
    return this.prog[spot.index].num;
  };

  Wasic.prototype.service = function () {
    if (this.stepLimit != null) {
      this.stepLimit -= 1;
      if (this.stepLimit < 0) throw new WasicBreak();
    }
    if (this.breakRequested) throw new WasicBreak();
    if (this.pendingHits.length && this.watchName && !this.inWatch) {
      var hit = this.pendingHits.shift();
      this.setVar("HIT", num(hit.a));
      this.setVar("OTHER", num(hit.b));
      if (!this.labels[this.watchName]) throw new WasicFail("noline");
      if (this.stack.length >= MAX_STACK) throw new WasicFail("deep");
      this.inWatch = true;
      this.stack.push({ index: this.pc.index, stmt: this.pc.stmt, watch: true });
      var spot = this.labels[this.watchName];
      this.pc = { index: spot.index, stmt: spot.stmt };
      return true;
    }
    return false;
  };
  Wasic.prototype.slice = function () {
    var self = this;
    var t = nowMs();
    if (t - this.sliceStamp < 12) return Promise.resolve();
    return new Promise(function (resolve) {
      setTimeout(function () {
        self.sliceStamp = nowMs();
        if (self.breakRequested) resolve("break");
        else resolve();
      }, 0);
    }).then(function (flag) {
      if (flag === "break") throw new WasicBreak();
    });
  };
  Wasic.prototype.sleep = function (ms) {
    var self = this;
    var cap = Math.max(0, Math.min(ms, 60000));
    var start = nowMs();
    function step() {
      if (self.breakRequested) throw new WasicBreak();
      var left = cap - (nowMs() - start);
      if (left <= 0) return Promise.resolve();
      return new Promise(function (resolve) { setTimeout(resolve, Math.min(30, left)); }).then(step);
    }
    return step();
  };

  Wasic.prototype.zone = function () {
    var col = this.host.column();
    var next = Math.floor(col / 10) * 10 + 10;
    if (next >= this.cols) this.host.write("\n");
    else this.host.write(" ".repeat(next - col));
  };
  Wasic.prototype.tab = function (n) {
    var col = Math.floor(n);
    if (col < 0) col = 0;
    if (col >= this.cols) {
      this.host.write("\n");
      col = 0;
    }
    if (this.host.column() > col) this.host.write("\n");
    var now = this.host.column();
    if (now < col) this.host.write(" ".repeat(col - now));
  };
  Wasic.prototype.execChant = function (stmt) {
    for (var i = 0; i < stmt.items.length; i += 1) {
      var item = stmt.items[i];
      if (item.kind === "comma") { this.zone(); continue; }
      if (item.kind === "semi") continue;
      if (item.kind === "tab") { this.tab(asNum(this.eval(item.expr))); continue; }
      if (item.kind === "spc") {
        var count = Math.floor(asNum(this.eval(item.expr)));
        if (count < 0) throw new WasicFail("syntax");
        if (count > 255) count = 255;
        this.host.write(" ".repeat(count));
        continue;
      }
      var val = this.eval(item.expr);
      this.host.write(val.t === "n" ? formatNumber(val.v) : val.v);
    }
    if (stmt.nl) this.host.write("\n");
  };
  Wasic.prototype.execDemand = function (stmt) {
    var self = this;
    var prompt = "";
    if (stmt.prompt != null) prompt += stmt.prompt;
    if (stmt.bang) prompt += "? ";
    function once() {
      self.host.write(prompt);
      return Promise.resolve(self.host.readLine()).then(function (raw) {
        if (self.breakRequested) throw new WasicBreak();
        raw = raw == null ? "" : String(raw);
        var parts = stmt.vars.length === 1 ? [raw] : raw.split(",").map(function (s) { return s.trim(); });
        if (parts.length !== stmt.vars.length) {
          self.report(new WasicFail("redo"));
          return once();
        }
        try {
          var values = [];
          for (var k = 0; k < stmt.vars.length; k += 1) {
            var field = parts[k].trim();
            if (stmt.vars[k].name.slice(-1) === "$") values.push(str(field));
            else {
              if (!field || !/^[-+]?(\d+(\.\d*)?|\.\d+)([eE][-+]?\d+)?$/.test(field)) throw new WasicFail("redonum");
              var parsed = Number(field);
              if (!Number.isFinite(parsed)) throw new WasicFail("redonum");
              values.push(num(parsed));
            }
          }
          for (var a = 0; a < stmt.vars.length; a += 1) self.assignLvalue(stmt.vars[a], values[a]);
        } catch (err) {
          if (isFail(err) && (err.code === "redonum" || err.code === "type" || err.code === "index" || err.code === "dim")) {
            self.report(err);
            return once();
          }
          throw err;
        }
      });
    }
    return once();
  };
  Wasic.prototype.plot = function (x, y) {
    if (x < 0 || y < 0 || x >= this.cols || y >= this.rows) return;
    this.host.plot(x, y);
  };
  Wasic.prototype.draw = function (fn) {
    this.host.begin();
    try { fn(); }
    finally { this.host.end(); }
  };
  Wasic.prototype.strokeLine = function (x0, y0, x1, y1) {
    var self = this;
    this.draw(function () {
      var dx = Math.abs(x1 - x0);
      var sx = x0 < x1 ? 1 : -1;
      var dy = -Math.abs(y1 - y0);
      var sy = y0 < y1 ? 1 : -1;
      var err = dx + dy;
      for (;;) {
        self.plot(x0, y0);
        if (x0 === x1 && y0 === y1) break;
        var e2 = 2 * err;
        if (e2 >= dy) { err += dy; x0 += sx; }
        if (e2 <= dx) { err += dx; y0 += sy; }
      }
    });
  };
  Wasic.prototype.strokeCircle = function (cx, cy, r) {
    var self = this;
    this.draw(function () {
      if (r < 0) throw new WasicFail("syntax");
      if (r === 0) { self.plot(cx, cy); return; }
      var x = r;
      var y = 0;
      var err = 1 - r;
      while (x >= y) {
        self.plot(cx + x, cy + y);
        self.plot(cx + y, cy + x);
        self.plot(cx - y, cy + x);
        self.plot(cx - x, cy + y);
        self.plot(cx - x, cy - y);
        self.plot(cx - y, cy - x);
        self.plot(cx + y, cy - x);
        self.plot(cx + x, cy - y);
        y += 1;
        if (err < 0) err += 2 * y + 1;
        else { x -= 1; err += 2 * (y - x) + 1; }
      }
    });
  };
  Wasic.prototype.flood = function (x, y) {
    var self = this;
    if (x < 0 || y < 0 || x >= this.cols || y >= this.rows) return;
    if (this.host.cell(x, y) !== " ") return;
    this.draw(function () {
      var q = [[x, y]];
      var seen = {};
      seen[x + "," + y] = 1;
      while (q.length) {
        var cur = q.pop();
        var cx = cur[0];
        var cy = cur[1];
        if (self.host.cell(cx, cy) !== " ") continue;
        self.host.plot(cx, cy);
        var nexts = [[1, 0], [-1, 0], [0, 1], [0, -1]];
        for (var i = 0; i < nexts.length; i += 1) {
          var nx = cx + nexts[i][0];
          var ny = cy + nexts[i][1];
          if (nx < 0 || ny < 0 || nx >= self.cols || ny >= self.rows) continue;
          var key = nx + "," + ny;
          if (seen[key]) continue;
          seen[key] = 1;
          q.push([nx, ny]);
        }
      }
    });
  };

  Wasic.prototype.exec = function (stmt) {
    var self = this;
    switch (stmt.op) {
      case "whisper":
      case "mark":
      case "data":
        return false;
      case "chant":
        this.execChant(stmt);
        return false;
      case "demand":
        return this.execDemand(stmt).then(function () { return false; });
      case "assign":
        this.assignLvalue(stmt, this.eval(stmt.expr));
        return false;
      case "flyto":
        return this.jumpTo(stmt.target);
      case "summon":
        return this.gosub(stmt.target);
      case "banish": {
        var frame = this.stack.pop();
        if (!frame) throw new WasicFail("noreturn");
        if (frame.watch) this.inWatch = false;
        this.pc = { index: frame.index, stmt: frame.stmt };
        return true;
      }
      case "if": {
        if (!asNum(this.eval(stmt.test))) {
          this.pc.stmt += 1 + (stmt.skip || 0);
          return true;
        }
        if (stmt.goto) return this.jumpTo(stmt.goto);
        return false;
      }
      case "curse": {
        var start = asNum(this.eval(stmt.start));
        var end = asNum(this.eval(stmt.end));
        var step = asNum(this.eval(stmt.step));
        if (step === 0) throw new WasicFail("step");
        if (!Number.isFinite(start + end + step)) throw new WasicFail("big");
        for (var i = this.fors.length - 1; i >= 0; i -= 1) {
          if (this.fors[i].name === stmt.name) { this.fors.length = i; break; }
        }
        if (this.fors.length >= MAX_STACK) throw new WasicFail("deep");
        this.setVar(stmt.name, num(start));
        this.fors.push({
          name: stmt.name,
          end: end,
          step: step,
          index: this.pc.index,
          stmt: this.pc.stmt + 1
        });
        return false;
      }
      case "break": {
        if (!this.fors.length) throw new WasicFail("nofor");
        if (stmt.name) {
          var found = -1;
          for (var b = this.fors.length - 1; b >= 0; b -= 1) {
            if (this.fors[b].name === stmt.name) { found = b; break; }
          }
          if (found < 0) throw new WasicFail("nofor");
          this.fors.length = found + 1;
        }
        var loop = this.fors[this.fors.length - 1];
        var next = asNum(this.getVar(loop.name)) + loop.step;
        if (!Number.isFinite(next)) throw new WasicFail("big");
        this.setVar(loop.name, num(next));
        var slack = Math.abs(loop.step) * 1e-9;
        var cont = loop.step > 0 ? next <= loop.end + slack : next >= loop.end - slack;
        if (cont) {
          this.pc = { index: loop.index, stmt: loop.stmt };
          return true;
        }
        this.fors.pop();
        return false;
      }
      case "dispel":
        throw new WasicEnd();
      case "freeze":
        if (stmt.ms) {
          var wait = asNum(this.eval(stmt.ms));
          if (wait < 0 || wait > 60000) throw new WasicFail("syntax");
          return this.sleep(wait).then(function () { return false; });
        }
        return Promise.resolve(this.host.waitKey()).then(function () {
          if (self.breakRequested) throw new WasicBreak();
          return false;
        });
      case "take":
        for (var t = 0; t < stmt.vars.length; t += 1) {
          if (this.dataPtr >= this.data.length) throw new WasicFail("nodata");
          var item = this.data[this.dataPtr];
          this.dataPtr += 1;
          var val = typeof item.value === "number" ? num(item.value) : str(String(item.value));
          if ((stmt.vars[t].name.slice(-1) === "$") !== (val.t === "s")) throw new WasicFail("type");
          this.assignLvalue(stmt.vars[t], val);
        }
        return false;
      case "rewind":
        if (!stmt.target) { this.dataPtr = 0; return false; }
        var lineNo = stmt.target.kind === "line" ? stmt.target.value : this.labelLine(stmt.target.value);
        var at = this.data.length;
        for (var d = 0; d < this.data.length; d += 1) {
          if (this.data[d].line >= lineNo) { at = d; break; }
        }
        this.dataPtr = at;
        return false;
      case "when": {
        var pick = Math.floor(asNum(this.eval(stmt.index)));
        if (pick < 1 || pick > stmt.targets.length) return false;
        var target = stmt.targets[pick - 1];
        return stmt.mode === "SUMMON" ? this.gosub(target) : this.jumpTo(target);
      }
      case "minion": {
        var id = this.spawn(stmt.args.map(function (a) { return self.eval(a); }));
        this.setVar("IT", num(id));
        return false;
      }
      case "send": {
        var sid = Math.floor(asNum(this.eval(stmt.id)));
        var ok = this.host.send(sid, asNum(this.eval(stmt.vx)), asNum(this.eval(stmt.vy)));
        if (ok === false) throw new WasicFail("sprite");
        return false;
      }
      case "watch":
        if (!this.labels[stmt.name]) throw new WasicFail("noline");
        this.watchName = stmt.name;
        return false;
      case "destroy":
        if (stmt.id == null) this.host.destroy(null);
        else if (this.host.destroy(Math.floor(asNum(this.eval(stmt.id)))) === false) throw new WasicFail("sprite");
        return false;
      case "color": {
        var fg = Math.floor(asNum(this.eval(stmt.fg)));
        var bg = stmt.bg ? Math.floor(asNum(this.eval(stmt.bg))) : null;
        if (fg < 0 || fg > 15 || (bg != null && (bg < 0 || bg > 15))) throw new WasicFail("syntax");
        this.host.color(fg, bg);
        return false;
      }
      case "tone": {
        var freq = asNum(this.eval(stmt.freq));
        var ms = asNum(this.eval(stmt.ms));
        if (freq < 20 || freq > 8000 || ms < 0 || ms > 8000) throw new WasicFail("syntax");
        this.host.beep(freq, ms);
        return this.sleep(ms).then(function () { return false; });
      }
      case "circle":
        this.strokeCircle(Math.round(asNum(this.eval(stmt.x))), Math.round(asNum(this.eval(stmt.y))), Math.round(asNum(this.eval(stmt.r))));
        return false;
      case "line":
        this.strokeLine(
          Math.round(asNum(this.eval(stmt.x1))), Math.round(asNum(this.eval(stmt.y1))),
          Math.round(asNum(this.eval(stmt.x2))), Math.round(asNum(this.eval(stmt.y2)))
        );
        return false;
      case "fill":
        this.flood(Math.round(asNum(this.eval(stmt.x))), Math.round(asNum(this.eval(stmt.y))));
        return false;
      case "at": {
        var col = Math.round(asNum(this.eval(stmt.x)));
        var row = Math.round(asNum(this.eval(stmt.y)));
        if (col < 0) col = 0;
        if (row < 0) row = 0;
        if (col >= this.cols) col = this.cols - 1;
        if (row >= this.rows) row = this.rows - 1;
        this.host.at(col, row);
        return false;
      }
      case "scrub":
        this.host.scrub();
        return false;
      case "dim":
        for (var di = 0; di < stmt.items.length; di += 1) {
          var sizes = [];
          for (var si = 0; si < stmt.items[di].dims.length; si += 1) sizes.push(this.eval(stmt.items[di].dims[si]));
          this.dimArray(stmt.items[di].name, sizes);
        }
        return false;
      case "basic": throw new WasicFail("basic");
      case "wire": {
        var wireWord = String(stmt.word || "").toLowerCase();
        throw new WasicFail(MESSAGES[wireWord] ? wireWord : "wire");
      }
      case "fail": throw new WasicFail(stmt.code || "syntax");
      case "direct": throw new WasicFail("direct");
      default: throw new WasicFail("syntax");
    }
  };

  Wasic.prototype.loop = function () {
    var self = this;
    function step() {
      try {
        if (self.halt) return Promise.resolve();
        var line = self.lineAt(self.pc.index);
        if (!line) return Promise.resolve();
        if (self.pc.stmt >= line.stmts.length) {
          if (self.pc.index < 0) return Promise.resolve();
          self.pc.index += 1;
          self.pc.stmt = 0;
          return step();
        }
        self.currentLine = line.num;
        if (self.host.trace) self.host.trace(line.num);
        if (self.service()) return step();
        var stmt = line.stmts[self.pc.stmt];
        return Promise.resolve().then(function () {
          return self.exec(stmt);
        }).then(function (moved) {
          if (!moved) self.pc.stmt += 1;
          return self.slice();
        }).then(step);
      } catch (err) {
        return Promise.reject(err);
      }
    }
    return step();
  };

  Wasic.prototype.startLoop = function () {
    var self = this;
    this.halt = false;
    this.breakRequested = false;
    this.running = true;
    this.sliceStamp = nowMs();
    return this.loop().catch(function (err) { self.report(err); }).then(function () {
      self.running = false;
      self.currentLine = null;
      self.fors = [];
      self.stack = [];
      self.inWatch = false;
      self.halt = false;
      if (self.host.stopping) self.host.stopping();
    });
  };

  Wasic.prototype.direct = function (source) {
    var self = this;
    var stmts;
    try { stmts = this.compile(String(source)); }
    catch (err) {
      this.currentLine = null;
      this.report(err);
      return Promise.resolve();
    }
    try { this.ensure(); }
    catch (err) {
      this.report(err);
      this.currentLine = null;
      return Promise.resolve();
    }
    this.directStmts = stmts;
    this.pc = { index: -1, stmt: 0 };
    return this.startLoop().then(function () { self.directStmts = null; });
  };

  Wasic.prototype.run = function (start) {
    var self = this;
    this.resetRuntime();
    try { this.rebuild(); }
    catch (err) {
      this.report(err);
      this.currentLine = null;
      return Promise.resolve();
    }
    if (!this.prog.length) {
      this.report(new WasicFail("empty"));
      return Promise.resolve();
    }
    var index = 0;
    if (start != null) {
      index = -1;
      for (var i = 0; i < this.prog.length; i += 1) {
        if (this.prog[i].num >= start) { index = i; break; }
      }
      if (index < 0) {
        this.report(new WasicFail("noline"));
        return Promise.resolve();
      }
    }
    if (this.host.starting) this.host.starting();
    this.pc = { index: index, stmt: 0 };
    return this.startLoop().then(function () { self.directStmts = null; });
  };

  root.Wasic = Wasic;
  root.WasicFail = WasicFail;
  root.WASIC_MESSAGES = MESSAGES;
  root.WASIC_LIMITS = {
    cols: 40,
    rows: 24,
    maxLine: MAX_LINE,
    maxLines: MAX_LINES,
    maxChars: MAX_CHARS,
    maxStack: MAX_STACK,
    maxCells: MAX_CELLS,
    maxIndex: MAX_INDEX,
    maxAxes: 2,
    maxMinions: 32,
    maxHits: 8,
    maxHistory: 32,
    maxKeys: 32,
    toneMin: 20,
    toneMax: 8000,
    toneMs: 8000,
    freezeMs: 60000,
    minionSize: 180,
    colors: 16
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
