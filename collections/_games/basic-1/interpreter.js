// BASIC. A line-numbered interpreter. Older Witch I names still parse.
"use strict";
(function (root) {
  var MESSAGES = {
    syntax: "❓ NO. SAY IT AGAIN.",
    basic: "🙊 NO. NOT ON THIS MACHINE.",
    peek: "👀 STOP PEEKING.",
    poke: "👉 DON'T POKE ME.",
    sys: "🛑 NO SYS. I WOKE ON MY OWN.",
    wait: "⏳ I DO NOT WAIT ON THAT WIRE.",
    usr: "🪝 USR. I AM NOT A HOOK.",
    call: "📞 DO NOT CALL ME THAT WAY.",
    wire: "🔌 NO. THAT WIRE IS DEAD.",
    noline: "🚫 NO LINE.",
    type: "🎭 NO. WRONG KIND OF THING.",
    full: "🛑 FULL. 512 LINES. STOP.",
    div0: "➗ CUTE. DIVIDE BY NOTHING.",
    sprite: "👻 NO. THAT SPRITE IS GONE.",
    long: "📏 TOO LONG.",
    string: "🧵 TOO LONG A STRING.",
    nofor: "➰ NEXT, AND NOTHING TO NEXT.",
    noreturn: "📭 RETURN, AND NOBODY CALLED.",
    nodata: "📜 OUT OF DATA.",
    redo: "🔁 AGAIN.",
    redonum: "🔢 AGAIN. A NUMBER.",
    big: "💥 TOO BIG.",
    deep: "📚 TOO DEEP.",
    direct: "🚪 NO. NOT FROM IN HERE.",
    empty: "📭 NOTHING TO RUN.",
    step: "🚫 STEP OF NOTHING. NO.",
    dim: "📦 NO. IT HAS NO ROOM.",
    index: "📐 NO. OUTSIDE THE ROOM.",
    many: "👻 NO. TOO MANY SPRITES.",
    taken: "🔒 NO. THAT WORD IS TAKEN.",
    label: "🔖 NO. THAT NAME IS TAKEN.",
    high: "🔢 NO. LINES STOP AT 63999.",
    break: "✋ ENOUGH.",
    nameit: "🔖 NAME IT.",
    missing: "🌑 NO. IT IS NOT THERE.",
    shut: "📦 IT WOULD NOT OPEN."
  };

  var MAX_LINE = 63999;
  var MAX_LINES = 512;
  var MAX_STACK = 32;
  var MAX_CELLS = 20000;
  var MAX_CHARS = 255;
  var MAX_INDEX = 2000;

  function InterpreterFail(code) {
    this.code = code;
    this.message = MESSAGES[code] || "❓ NO.";
    this.name = "InterpreterFail";
  }
  InterpreterFail.prototype = Object.create(Error.prototype);

  function InterpreterBreak() {
    this.message = MESSAGES.break || "ENOUGH.";
    this.name = "InterpreterBreak";
  }
  InterpreterBreak.prototype = Object.create(Error.prototype);

  function InterpreterEnd() {
    this.name = "InterpreterEnd";
  }
  InterpreterEnd.prototype = Object.create(Error.prototype);

  function span(text) { return Array.from(String(text)).length; }
  function fitString(text) {
    if (span(text) > MAX_CHARS) throw new InterpreterFail("string");
    return text;
  }
  function isFail(err) { return err instanceof InterpreterFail || (err && err.name === "InterpreterFail"); }
  function isBreak(err) { return err instanceof InterpreterBreak || (err && err.name === "InterpreterBreak"); }
  function isEnd(err) { return err instanceof InterpreterEnd || (err && err.name === "InterpreterEnd"); }

  var FUNCTIONS = {
    INT: 1, ABS: 1, SQR: 1, SIN: 1, COS: 1, TAN: 1, ATN: 1, LOG: 1, EXP: 1, SGN: 1, RND: 1,
    LEN: 1, VAL: 1, ASC: 1, "STR$": 1, "CHR$": 1, "LEFT$": 1, "RIGHT$": 1, "MID$": 1,
    MOD: 1, COL: 1, ROW: 1, VX: 1, VY: 1, HELD: 1, "LISTEN$": 1, "INKEY$": 1, TICK: 1, FRE: 1,
    MINION: 1, SPRITE: 1, COLS: 1, ROWS: 1, PEEK: 1, USR: 1
  };
  var ZERO_ARG = { "LISTEN$": 1, "INKEY$": 1, TICK: 1, COLS: 1, ROWS: 1 };
  var BASIC_WORDS = { PLOT: 1, DRAW: 1, PSET: 1, PRESET: 1 };
  var WIRE_WORDS = { POKE: 1, PEEK: 1, SYS: 1, WAIT: 1, USR: 1, CALL: 1 };
  var DIRECT_WORDS = {
    REVEAL: 1, OBLITERATE: 1, RENUMBER: 1, RENUM: 1, VANISH: 1, AUTO: 1, MAGIC: 1, SEAL: 1, UNSEAL: 1,
    UPLOAD: 1, DOWNLOAD: 1, SHELF: 1, MODULES: 1, GRIMOIRE: 1, RUN: 1, HELP: 1, LATCH: 1,
    LIST: 1, NEW: 1, LOAD: 1, SAVE: 1
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
    "VEIL", "DIM", "THEN", "TO", "STEP", "AND", "OR", "NOT", "TAB", "SPC",
    "PRINT", "GOTO", "GOSUB", "RETURN", "FOR", "NEXT", "LET", "INPUT", "REM",
    "DATA", "READ", "RESTORE", "END", "STOP", "CLS", "LOCATE", "SOUND", "SLEEP",
    "GET", "SPRITE", "ON", "LABEL", "INK", "GO"].forEach(function (w) {
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
        if (!closed) throw new InterpreterFail("syntax");
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
        if (!Number.isFinite(value)) throw new InterpreterFail("big");
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
        // A remark eats the rest of the line, periods included.
        if (raw === "REM" || raw === "WHISPER") break;
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
      if (ch === "'") break;
      if (ch === "?") {
        tokens.push({ t: "p", v: "?", from: i, to: i + 1 });
        i += 1;
        continue;
      }
      if ("(),;:".indexOf(ch) >= 0) {
        tokens.push({ t: "p", v: ch, from: i, to: i + 1 });
        i += 1;
        continue;
      }
      throw new InterpreterFail("syntax");
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
    if (!t) throw new InterpreterFail("syntax");
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
    if (!Number.isInteger(tok.v) || tok.v < 0) throw new InterpreterFail("syntax");
    if (tok.v > MAX_LINE) throw new InterpreterFail("high");
    return { kind: "line", value: tok.v, from: tok.from, to: tok.to };
  };
  Parser.prototype.nameTarget = function (tok) {
    if (!/^[A-Z][A-Z0-9]{0,15}$/.test(tok.v)) throw new InterpreterFail("syntax");
    if (RESERVED[tok.v]) throw new InterpreterFail("taken");
    return { kind: "name", value: tok.v };
  };
  Parser.prototype.parseTarget = function () {
    var n = this.eat("num");
    if (n) return this.lineTarget(n);
    return this.nameTarget(this.expect("id"));
  };
  Parser.prototype.checkAssign = function (name) {
    if (!/^[A-Z][A-Z0-9]{0,15}\$?$/.test(name)) throw new InterpreterFail("syntax");
    if (RESERVED[name] || FUNCTIONS[name]) throw new InterpreterFail("taken");
  };
  Parser.prototype.parseLvalue = function () {
    var name = this.expect("id");
    this.checkAssign(name.v);
    var dims = null;
    if (this.eat("p", "(")) {
      dims = [this.parseExpr()];
      if (this.eat("p", ",")) dims.push(this.parseExpr());
      if (this.peek() && this.peek().t === "p" && this.peek().v === ",") throw new InterpreterFail("syntax");
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
    if (!bare) throw new InterpreterFail("syntax");
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
    if (pk && pk.t === "p" && pk.v === "?") {
      this.pop();
      return this.parseChant();
    }
    if (!pk || pk.t !== "id") throw new InterpreterFail("syntax");
    var word = pk.v;
    if (WIRE_WORDS[word]) { this.pop(); this.skipRest(); return { op: "wire", word: word }; }
    if (DIRECT_WORDS[word]) { this.pop(); this.skipRest(); return { op: "direct" }; }
    if (BASIC_WORDS[word]) { this.pop(); this.skipRest(); return { op: "basic" }; }
    if (word === "GO") {
      this.pop();
      var go = this.expect("id");
      if (go.v === "TO") return { op: "flyto", target: this.parseTarget() };
      if (go.v === "SUB") return { op: "summon", target: this.parseTarget() };
      throw new InterpreterFail("syntax");
    }
    if (word === "GET") {
      this.pop();
      var got = this.parseLvalue();
      return { op: "assign", name: got.name, dims: got.dims, expr: { op: "call", name: "LISTEN$", args: [] } };
    }
    if (word === "WHISPER" || word === "REM") {
      this.pop();
      this.i = this.tokens.length;
      return { op: "whisper" };
    }
    if (word === "CHANT" || word === "PRINT") { this.pop(); return this.parseChant(); }
    if (word === "VEIL" || word === "INK") {
      this.pop();
      var ink = this.endStmt() ? null : this.parseExpr();
      return { op: "veil", expr: ink };
    }
    if (word === "DEMAND" || word === "INPUT") {
      this.pop();
      var prompt = null;
      var bang = true;
      if (this.peek() && this.peek().t === "str") {
        prompt = this.pop().v;
        if (this.eat("p", ";")) bang = true;
        else if (this.eat("p", ",")) bang = false;
        else throw new InterpreterFail("syntax");
      }
      var vars = [];
      do { vars.push(this.parseLvalue()); } while (this.eat("p", ","));
      return { op: "demand", prompt: prompt, bang: bang, vars: vars };
    }
    if (word === "CONJURE" || word === "LET") { this.pop(); return this.parseAssign(); }
    if (word === "FLYTO" || word === "GOTO") { this.pop(); return { op: "flyto", target: this.parseTarget() }; }
    if (word === "SUMMON" || word === "GOSUB") { this.pop(); return { op: "summon", target: this.parseTarget() }; }
    if (word === "BANISH" || word === "RETURN") { this.pop(); return { op: "banish" }; }
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
    if (word === "CURSE" || word === "FOR") {
      this.pop();
      var cname = this.expect("id");
      this.checkAssign(cname.v);
      if (cname.v.slice(-1) === "$") throw new InterpreterFail("type");
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
    if (word === "BREAK" || word === "NEXT") {
      this.pop();
      var bname = null;
      if (!this.endStmt()) {
        var bid = this.expect("id");
        this.checkAssign(bid.v);
        if (bid.v.slice(-1) === "$") throw new InterpreterFail("type");
        bname = bid.v;
      }
      return { op: "break", name: bname };
    }
    if (word === "MARK" || word === "LABEL") {
      this.pop();
      return { op: "mark", name: this.nameTarget(this.expect("id")).value };
    }
    if (word === "DISPEL" || word === "END" || word === "STOP") { this.pop(); return { op: "dispel" }; }
    if (word === "FREEZE" || word === "SLEEP") {
      this.pop();
      var ms = this.endStmt() ? null : this.parseExpr();
      return { op: "freeze", ms: ms };
    }
    if (word === "OFFERING" || word === "DATA") {
      this.pop();
      if (this.endStmt()) throw new InterpreterFail("syntax");
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
        } else throw new InterpreterFail("syntax");
        if (this.eat("p", ",")) {
          if (this.endStmt()) throw new InterpreterFail("syntax");
          continue;
        }
        break;
      }
      return { op: "data", items: items };
    }
    if (word === "TAKE" || word === "READ") {
      this.pop();
      var takes = [];
      do { takes.push(this.parseLvalue()); } while (this.eat("p", ","));
      return { op: "take", vars: takes };
    }
    if (word === "REWIND" || word === "RESTORE") {
      this.pop();
      var rtarget = this.endStmt() ? null : this.parseTarget();
      return { op: "rewind", target: rtarget };
    }
    if (word === "WHEN" || word === "ON") {
      this.pop();
      var index = this.parseExpr();
      var mode = this.expect("id");
      var jump = mode.v === "SUMMON" || mode.v === "GOSUB";
      var hop = mode.v === "FLYTO" || mode.v === "GOTO";
      if (!jump && !hop) throw new InterpreterFail("syntax");
      var targets = [];
      do { targets.push(this.parseTarget()); } while (this.eat("p", ","));
      return { op: "when", index: index, mode: jump ? "SUMMON" : "FLYTO", targets: targets };
    }
    if (word === "MINION" || word === "SPRITE") { this.pop(); return { op: "minion", args: this.parseArgs(true) }; }
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
    if (word === "TONE" || word === "SOUND") {
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
    if (word === "LOCATE") {
      this.pop();
      var lrow = this.parseExpr();
      this.expect("p", ",");
      var lcol = this.parseExpr();
      return { op: "at", x: lcol, y: lrow };
    }
    if (word === "AT") {
      this.pop();
      var ax = this.parseExpr();
      this.expect("p", ",");
      var ay = this.parseExpr();
      return { op: "at", x: ax, y: ay };
    }
    if (word === "SCRUB" || word === "CLS") { this.pop(); return { op: "scrub" }; }
    if (word === "DIM") {
      this.pop();
      var dims = [];
      do {
        var dname = this.expect("id");
        this.checkAssign(dname.v);
        this.expect("p", "(");
        var ds = [this.parseExpr()];
        if (this.eat("p", ",")) ds.push(this.parseExpr());
        if (this.peek() && this.peek().t === "p" && this.peek().v === ",") throw new InterpreterFail("syntax");
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
      if (this.i === before) throw new InterpreterFail("syntax");
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
    if (!id) throw new InterpreterFail("syntax");
    if (FUNCTIONS[id.v]) {
      var args = [];
      if (this.eat("p", "(")) {
        if (!this.eat("p", ")")) {
          do { args.push(this.parseExpr()); } while (this.eat("p", ","));
          this.expect("p", ")");
        }
      } else if (!ZERO_ARG[id.v]) throw new InterpreterFail("syntax");
      return { op: "call", name: id.v, args: args };
    }
    if (RESERVED[id.v]) throw new InterpreterFail("taken");
    if (!/^[A-Z][A-Z0-9]{0,15}\$?$/.test(id.v)) throw new InterpreterFail("syntax");
    if (this.eat("p", "(")) {
      var ix = [this.parseExpr()];
      if (this.eat("p", ",")) ix.push(this.parseExpr());
      if (this.peek() && this.peek().t === "p" && this.peek().v === ",") throw new InterpreterFail("syntax");
      this.expect("p", ")");
      return { op: "arr", name: id.v, args: ix };
    }
    return { op: "var", name: id.v };
  };

  function num(v) { return { t: "n", v: v }; }
  function str(v) { return { t: "s", v: v }; }
  function asNum(val) {
    if (!val || val.t !== "n" || !Number.isFinite(val.v)) throw new InterpreterFail("type");
    return val.v;
  }
  function asStr(val) {
    if (!val || val.t !== "s") throw new InterpreterFail("type");
    return val.v;
  }
  function formatNumber(n) {
    if (!Number.isFinite(n)) throw new InterpreterFail("big");
    if (Object.is && Object.is(n, -0)) n = 0;
    var body;
    if (Number.isInteger(n) && Math.abs(n) < 1e9) body = String(n);
    else {
      var p = Number(n.toPrecision(8));
      if (!Number.isFinite(p)) throw new InterpreterFail("big");
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

  function Interpreter(host) {
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

  Interpreter.prototype.resetRuntime = function () {
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

  Interpreter.prototype.compile = function (source) {
    return new Parser(source).parseSequence();
  };

  Interpreter.prototype.store = function (lineNo, source) {
    if (!Number.isInteger(lineNo) || lineNo < 0) throw new InterpreterFail("syntax");
    if (lineNo > MAX_LINE) throw new InterpreterFail("high");
    if (!source || !String(source).trim()) {
      this.lines.delete(lineNo);
      this.dirty = true;
      return;
    }
    var clean = String(source).trim();
    if (span(String(lineNo) + " " + clean) > MAX_CHARS) throw new InterpreterFail("long");
    if (!this.lines.has(lineNo) && this.lines.size >= MAX_LINES) throw new InterpreterFail("full");
    this.lines.set(lineNo, clean);
    this.dirty = true;
  };

  Interpreter.prototype.deleteRange = function (from, to) {
    var keys = Array.from(this.lines.keys());
    for (var i = 0; i < keys.length; i += 1) {
      if (keys[i] >= from && keys[i] <= to) this.lines.delete(keys[i]);
    }
    this.dirty = true;
  };

  Interpreter.prototype.clearProgram = function () {
    this.lines = new Map();
    this.prog = [];
    this.labels = {};
    this.data = [];
    this.dirty = false;
    this.resetRuntime();
  };

  Interpreter.prototype.listing = function (from, to) {
    if (from == null) from = 0;
    if (to == null) to = MAX_LINE;
    return Array.from(this.lines.entries())
      .filter(function (pair) { return pair[0] >= from && pair[0] <= to; })
      .sort(function (a, b) { return a[0] - b[0]; })
      .map(function (pair) { return pair[0] + " " + pair[1]; })
      .join("\n");
  };

  Interpreter.prototype.load = function (text) {
    var lines = new Map();
    var raws = String(text).split(/\r?\n/);
    for (var i = 0; i < raws.length; i += 1) {
      var raw = raws[i].replace(/\s+$/, "");
      if (!raw.trim()) continue;
      if (span(raw) > MAX_CHARS) {
        this.currentLine = null;
        throw new InterpreterFail("long");
      }
      var m = raw.match(/^(\d+)\s*(.*)$/);
      if (!m) throw new InterpreterFail("syntax");
      var lineNo = Number(m[1]);
      if (!Number.isInteger(lineNo) || lineNo < 0) throw new InterpreterFail("syntax");
      if (lineNo > MAX_LINE) throw new InterpreterFail("high");
      var source = m[2].trim();
      if (!source) continue;
      if (lines.size >= MAX_LINES && !lines.has(lineNo)) throw new InterpreterFail("full");
      lines.set(lineNo, source);
    }
    this.currentLine = null;
    this.lines = lines;
    this.dirty = true;
  };

  Interpreter.prototype.collectSpans = function (stmt, spans) {
    var add = function (t) { if (t && t.kind === "line") spans.push(t); };
    if (stmt.op === "flyto" || stmt.op === "summon" || stmt.op === "rewind") add(stmt.target);
    if (stmt.op === "if" && stmt.goto) add(stmt.goto);
    if (stmt.op === "when") {
      for (var i = 0; i < stmt.targets.length; i += 1) add(stmt.targets[i]);
    }
  };

  Interpreter.prototype.renumber = function () {
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
      if (span(String(map.get(nums[n])) + " " + out) > MAX_CHARS) throw new InterpreterFail("long");
      next.set(map.get(nums[n]), out);
    }
    this.lines = next;
    this.dirty = true;
  };

  Interpreter.prototype.rebuild = function () {
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
            throw new InterpreterFail("label");
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

  Interpreter.prototype.ensure = function () {
    if (this.dirty) this.rebuild();
  };

  Interpreter.prototype.getVar = function (name) {
    var cur = this.vars.get(name);
    if (cur) return cur.t === "n" ? num(cur.v) : str(cur.v);
    return name.slice(-1) === "$" ? str("") : num(0);
  };
  Interpreter.prototype.setVar = function (name, val) {
    var want = name.slice(-1) === "$" ? "s" : "n";
    if (!val || val.t !== want) throw new InterpreterFail("type");
    if (val.t === "n" && !Number.isFinite(val.v)) throw new InterpreterFail("big");
    if (val.t === "s") fitString(val.v);
    this.vars.set(name, val.t === "n" ? num(val.v) : str(val.v));
  };
  Interpreter.prototype.dimArray = function (name, sizes) {
    if (this.arrays.has(name)) throw new InterpreterFail("dim");
    var dims = [];
    var count = 1;
    for (var i = 0; i < sizes.length; i += 1) {
      var n = Math.floor(asNum(sizes[i]));
      if (n < 0 || n > MAX_INDEX) throw new InterpreterFail("dim");
      dims.push(n);
      count *= n + 1;
      if (count > MAX_CELLS) throw new InterpreterFail("dim");
    }
    var fill = name.slice(-1) === "$" ? "" : 0;
    var data = [];
    for (var c = 0; c < count; c += 1) data.push(fill);
    this.arrays.set(name, { dims: dims, data: data });
  };
  Interpreter.prototype.addr = function (arr, indexes) {
    if (indexes.length !== arr.dims.length) throw new InterpreterFail("syntax");
    var coords = [];
    for (var i = 0; i < indexes.length; i += 1) {
      var n = Math.floor(asNum(indexes[i]));
      if (n < 0 || n > arr.dims[i]) throw new InterpreterFail("index");
      coords.push(n);
    }
    if (coords.length === 1) return coords[0];
    return coords[0] * (arr.dims[1] + 1) + coords[1];
  };
  Interpreter.prototype.readArr = function (name, indexes) {
    var arr = this.arrays.get(name);
    if (!arr) throw new InterpreterFail("dim");
    var raw = arr.data[this.addr(arr, indexes)];
    return name.slice(-1) === "$" ? str(raw) : num(raw);
  };
  Interpreter.prototype.writeArr = function (name, indexes, val) {
    var arr = this.arrays.get(name);
    if (!arr) throw new InterpreterFail("dim");
    var want = name.slice(-1) === "$" ? "s" : "n";
    if (!val || val.t !== want) throw new InterpreterFail("type");
    if (want === "s") fitString(val.v);
    arr.data[this.addr(arr, indexes)] = val.v;
  };
  Interpreter.prototype.assignLvalue = function (lv, val) {
    if (lv.dims) {
      var ix = [];
      for (var i = 0; i < lv.dims.length; i += 1) ix.push(this.eval(lv.dims[i]));
      this.writeArr(lv.name, ix, val);
    } else this.setVar(lv.name, val);
  };

  Interpreter.prototype.eval = function (node) {
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
      default: throw new InterpreterFail("syntax");
    }
  };
  Interpreter.prototype.evalAdd = function (node) {
    var l = this.eval(node.left);
    var r = this.eval(node.right);
    if (l.t === "s" || r.t === "s") {
      if (l.t !== "s" || r.t !== "s") throw new InterpreterFail("type");
      return str(fitString(l.v + r.v));
    }
    var v = l.v + r.v;
    if (!Number.isFinite(v)) throw new InterpreterFail("big");
    return num(v);
  };
  Interpreter.prototype.evalArith = function (node) {
    var a = asNum(this.eval(node.left));
    var b = asNum(this.eval(node.right));
    var v;
    if (node.op === "sub") v = a - b;
    else if (node.op === "mul") v = a * b;
    else if (node.op === "div") {
      if (b === 0) throw new InterpreterFail("div0");
      v = a / b;
    } else {
      if (a < 0 && !Number.isInteger(b)) throw new InterpreterFail("type");
      v = Math.pow(a, b);
    }
    if (!Number.isFinite(v)) throw new InterpreterFail("big");
    return num(v);
  };
  Interpreter.prototype.evalCmp = function (node) {
    var l = this.eval(node.left);
    var r = this.eval(node.right);
    if (l.t !== r.t) throw new InterpreterFail("type");
    var ok = false;
    if (node.cmp === "=") ok = l.v === r.v;
    else if (node.cmp === "<>") ok = l.v !== r.v;
    else if (node.cmp === "<") ok = l.v < r.v;
    else if (node.cmp === ">") ok = l.v > r.v;
    else if (node.cmp === "<=") ok = l.v <= r.v;
    else if (node.cmp === ">=") ok = l.v >= r.v;
    return num(ok ? 1 : 0);
  };
  Interpreter.prototype.call = function (node) {
    var args = [];
    for (var i = 0; i < node.args.length; i += 1) args.push(this.eval(node.args[i]));
    var name = node.name;
    if (name === "INT") { this.arity(args, 1); return num(Math.floor(asNum(args[0]))); }
    if (name === "ABS") { this.arity(args, 1); return num(Math.abs(asNum(args[0]))); }
    if (name === "SQR") {
      this.arity(args, 1);
      var sq = asNum(args[0]);
      if (sq < 0) throw new InterpreterFail("type");
      return num(Math.sqrt(sq));
    }
    if (name === "SIN") { this.arity(args, 1); return this.finiteNum(Math.sin(asNum(args[0]))); }
    if (name === "COS") { this.arity(args, 1); return this.finiteNum(Math.cos(asNum(args[0]))); }
    if (name === "TAN") { this.arity(args, 1); return this.finiteNum(Math.tan(asNum(args[0]))); }
    if (name === "ATN") { this.arity(args, 1); return this.finiteNum(Math.atan(asNum(args[0]))); }
    if (name === "LOG") {
      this.arity(args, 1);
      var lg = asNum(args[0]);
      if (lg <= 0) throw new InterpreterFail("type");
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
      if (!text) throw new InterpreterFail("type");
      return num(text.codePointAt(0));
    }
    if (name === "STR$") { this.arity(args, 1); return str(formatNumber(asNum(args[0]))); }
    if (name === "CHR$") {
      this.arity(args, 1);
      var code = Math.floor(asNum(args[0]));
      if (code < 0 || code > 255) throw new InterpreterFail("syntax");
      return str(String.fromCharCode(code));
    }
    if (name === "LEFT$" || name === "RIGHT$" || name === "MID$") return str(this.strSlice(name, args));
    if (name === "MOD") {
      this.arity(args, 2);
      var aa = asNum(args[0]);
      var bb = asNum(args[1]);
      if (bb === 0) throw new InterpreterFail("div0");
      return num(aa - bb * Math.floor(aa / bb));
    }
    if (name === "COL" || name === "ROW" || name === "VX" || name === "VY") {
      this.arity(args, 1);
      var id = Math.floor(asNum(args[0]));
      var fn = name === "COL" ? this.host.col : name === "ROW" ? this.host.row : name === "VX" ? this.host.vx : this.host.vy;
      var got = fn(id);
      if (got == null || !Number.isFinite(got)) throw new InterpreterFail("sprite");
      return num(got);
    }
    if (name === "HELD") { this.arity(args, 1); return num(this.host.held(asStr(args[0])) ? 1 : 0); }
    if (name === "LISTEN$" || name === "INKEY$") { this.arity(args, 0); return str(String(this.host.inkey() || "")); }
    if (name === "TICK") { this.arity(args, 0); return num(Math.floor(Number(this.host.tick()) || 0)); }
    if (name === "FRE") { this.arity(args, 1); asNum(args[0]); return num(MAX_LINES - this.lines.size); }
    if (name === "COLS") { this.arity(args, 0); return num(this.cols); }
    if (name === "ROWS") { this.arity(args, 0); return num(this.rows); }
    if (name === "MINION" || name === "SPRITE") return num(this.spawn(args));
    if (name === "PEEK") throw new InterpreterFail("peek");
    if (name === "USR") throw new InterpreterFail("usr");
    throw new InterpreterFail("syntax");
  };
  Interpreter.prototype.arity = function (args, n) {
    if (args.length !== n) throw new InterpreterFail("syntax");
  };
  Interpreter.prototype.finiteNum = function (v) {
    if (!Number.isFinite(v)) throw new InterpreterFail("big");
    return num(v);
  };
  Interpreter.prototype.rnd = function (n) {
    if (n < 0) this.seed = (Math.abs(Math.trunc(n)) >>> 0) || 1;
    if (n === 0 && this.haveRnd) return this.lastRnd;
    this.seed = (Math.imul(1664525, this.seed) + 1013904223) >>> 0;
    this.lastRnd = this.seed / 4294967296;
    this.haveRnd = true;
    return this.lastRnd;
  };
  Interpreter.prototype.strSlice = function (name, args) {
    if (name === "MID$") {
      if (args.length !== 2 && args.length !== 3) throw new InterpreterFail("syntax");
    } else this.arity(args, 2);
    var s = glyphs(asStr(args[0]));
    if (name === "LEFT$") {
      var ln = Math.floor(asNum(args[1]));
      if (ln < 0) throw new InterpreterFail("syntax");
      return s.slice(0, ln).join("");
    }
    if (name === "RIGHT$") {
      var rn = Math.floor(asNum(args[1]));
      if (rn < 0) throw new InterpreterFail("syntax");
      return rn === 0 ? "" : s.slice(-rn).join("");
    }
    var start = Math.floor(asNum(args[1]));
    if (start < 1) throw new InterpreterFail("syntax");
    var from = start - 1;
    if (args.length === 2) return s.slice(from).join("");
    var count = Math.floor(asNum(args[2]));
    if (count < 0) throw new InterpreterFail("syntax");
    return s.slice(from, from + count).join("");
  };
  Interpreter.prototype.spawn = function (args) {
    if (args.length < 3 || args.length > 4) throw new InterpreterFail("syntax");
    var emoji = asStr(args[0]);
    var x = asNum(args[1]);
    var y = asNum(args[2]);
    var size = args.length === 4 ? asNum(args[3]) : 28;
    if (!(size >= 1) || size > 180) throw new InterpreterFail("syntax");
    var id = this.host.minion(emoji || "●", x, y, size);
    if (id == null) throw new InterpreterFail("many");
    this.setVar("IT", num(id));
    return id;
  };

  Interpreter.prototype.where = function () {
    return this.currentLine == null ? "" : " IN " + this.currentLine;
  };
  Interpreter.prototype.report = function (err) {
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

  Interpreter.prototype.lineAt = function (index) {
    if (index < 0) {
      if (!this.directStmts) return null;
      return { num: null, stmts: this.directStmts };
    }
    if (index >= this.prog.length) return null;
    return this.prog[index];
  };
  Interpreter.prototype.jumpTo = function (target) {
    if (!target) throw new InterpreterFail("noline");
    if (target.kind === "line") {
      var index = -1;
      for (var i = 0; i < this.prog.length; i += 1) {
        if (this.prog[i].num === target.value) { index = i; break; }
      }
      if (index < 0) throw new InterpreterFail("noline");
      this.pc = { index: index, stmt: 0 };
      return true;
    }
    var spot = this.labels[target.value];
    if (!spot) throw new InterpreterFail("noline");
    this.pc = { index: spot.index, stmt: spot.stmt };
    return true;
  };
  Interpreter.prototype.gosub = function (target) {
    if (this.stack.length >= MAX_STACK) throw new InterpreterFail("deep");
    this.stack.push({ index: this.pc.index, stmt: this.pc.stmt + 1, watch: false });
    return this.jumpTo(target);
  };
  Interpreter.prototype.labelLine = function (name) {
    var spot = this.labels[name];
    if (!spot) throw new InterpreterFail("noline");
    return this.prog[spot.index].num;
  };

  Interpreter.prototype.service = function () {
    if (this.stepLimit != null) {
      this.stepLimit -= 1;
      if (this.stepLimit < 0) throw new InterpreterBreak();
    }
    if (this.breakRequested) throw new InterpreterBreak();
    if (this.pendingHits.length && this.watchName && !this.inWatch) {
      var hit = this.pendingHits.shift();
      this.setVar("HIT", num(hit.a));
      this.setVar("OTHER", num(hit.b));
      if (!this.labels[this.watchName]) throw new InterpreterFail("noline");
      if (this.stack.length >= MAX_STACK) throw new InterpreterFail("deep");
      this.inWatch = true;
      this.stack.push({ index: this.pc.index, stmt: this.pc.stmt, watch: true });
      var spot = this.labels[this.watchName];
      this.pc = { index: spot.index, stmt: spot.stmt };
      return true;
    }
    return false;
  };
  Interpreter.prototype.slice = function () {
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
      if (flag === "break") throw new InterpreterBreak();
    });
  };
  Interpreter.prototype.sleep = function (ms) {
    var self = this;
    var cap = Math.max(0, Math.min(ms, 60000));
    var start = nowMs();
    function step() {
      if (self.breakRequested) throw new InterpreterBreak();
      var left = cap - (nowMs() - start);
      if (left <= 0) return Promise.resolve();
      return new Promise(function (resolve) { setTimeout(resolve, Math.min(30, left)); }).then(step);
    }
    return step();
  };

  Interpreter.prototype.zone = function () {
    var col = this.host.column();
    var next = Math.floor(col / 10) * 10 + 10;
    if (next >= this.cols) this.host.write("\n");
    else this.host.write(" ".repeat(next - col));
  };
  Interpreter.prototype.tab = function (n) {
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
  Interpreter.prototype.execChant = function (stmt) {
    for (var i = 0; i < stmt.items.length; i += 1) {
      var item = stmt.items[i];
      if (item.kind === "comma") { this.zone(); continue; }
      if (item.kind === "semi") continue;
      if (item.kind === "tab") { this.tab(asNum(this.eval(item.expr))); continue; }
      if (item.kind === "spc") {
        var count = Math.floor(asNum(this.eval(item.expr)));
        if (count < 0) throw new InterpreterFail("syntax");
        if (count > 255) count = 255;
        this.host.write(" ".repeat(count));
        continue;
      }
      var val = this.eval(item.expr);
      this.host.write(val.t === "n" ? formatNumber(val.v) : val.v);
    }
    if (stmt.nl) this.host.write("\n");
  };
  Interpreter.prototype.execDemand = function (stmt) {
    var self = this;
    var prompt = "";
    if (stmt.prompt != null) prompt += stmt.prompt;
    if (stmt.bang) prompt += "? ";
    function once() {
      self.host.write(prompt);
      return Promise.resolve(self.host.readLine()).then(function (raw) {
        if (self.breakRequested) throw new InterpreterBreak();
        raw = raw == null ? "" : String(raw);
        var parts = stmt.vars.length === 1 ? [raw] : raw.split(",").map(function (s) { return s.trim(); });
        if (parts.length !== stmt.vars.length) {
          self.report(new InterpreterFail("redo"));
          return once();
        }
        try {
          var values = [];
          for (var k = 0; k < stmt.vars.length; k += 1) {
            var field = parts[k].trim();
            if (stmt.vars[k].name.slice(-1) === "$") values.push(str(field));
            else {
              if (!field || !/^[-+]?(\d+(\.\d*)?|\.\d+)([eE][-+]?\d+)?$/.test(field)) throw new InterpreterFail("redonum");
              var parsed = Number(field);
              if (!Number.isFinite(parsed)) throw new InterpreterFail("redonum");
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
  Interpreter.prototype.plot = function (x, y) {
    if (x < 0 || y < 0 || x >= this.cols || y >= this.rows) return;
    this.host.plot(x, y);
  };
  Interpreter.prototype.draw = function (fn) {
    this.host.begin();
    try { fn(); }
    finally { this.host.end(); }
  };
  Interpreter.prototype.strokeLine = function (x0, y0, x1, y1) {
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
  Interpreter.prototype.strokeCircle = function (cx, cy, r) {
    var self = this;
    this.draw(function () {
      if (r < 0) throw new InterpreterFail("syntax");
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
  Interpreter.prototype.flood = function (x, y) {
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

  Interpreter.prototype.exec = function (stmt) {
    var self = this;
    switch (stmt.op) {
      case "whisper":
      case "mark":
      case "data":
        return false;
      case "chant":
        this.execChant(stmt);
        return false;
      case "veil": {
        var ink = "";
        if (stmt.expr) {
          var painted = this.eval(stmt.expr);
          if (painted.t !== "s") throw new InterpreterFail("type");
          ink = painted.v;
        }
        if (!this.host.veil) throw new InterpreterFail("syntax");
        this.host.veil(ink);
        return false;
      }
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
        if (!frame) throw new InterpreterFail("noreturn");
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
        if (step === 0) throw new InterpreterFail("step");
        if (!Number.isFinite(start + end + step)) throw new InterpreterFail("big");
        for (var i = this.fors.length - 1; i >= 0; i -= 1) {
          if (this.fors[i].name === stmt.name) { this.fors.length = i; break; }
        }
        if (this.fors.length >= MAX_STACK) throw new InterpreterFail("deep");
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
        if (!this.fors.length) throw new InterpreterFail("nofor");
        if (stmt.name) {
          var found = -1;
          for (var b = this.fors.length - 1; b >= 0; b -= 1) {
            if (this.fors[b].name === stmt.name) { found = b; break; }
          }
          if (found < 0) throw new InterpreterFail("nofor");
          this.fors.length = found + 1;
        }
        var loop = this.fors[this.fors.length - 1];
        var next = asNum(this.getVar(loop.name)) + loop.step;
        if (!Number.isFinite(next)) throw new InterpreterFail("big");
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
        throw new InterpreterEnd();
      case "freeze":
        if (stmt.ms) {
          var wait = asNum(this.eval(stmt.ms));
          if (wait < 0 || wait > 60000) throw new InterpreterFail("syntax");
          return this.sleep(wait).then(function () { return false; });
        }
        return Promise.resolve(this.host.waitKey()).then(function () {
          if (self.breakRequested) throw new InterpreterBreak();
          return false;
        });
      case "take":
        for (var t = 0; t < stmt.vars.length; t += 1) {
          if (this.dataPtr >= this.data.length) throw new InterpreterFail("nodata");
          var item = this.data[this.dataPtr];
          this.dataPtr += 1;
          var val = typeof item.value === "number" ? num(item.value) : str(String(item.value));
          if ((stmt.vars[t].name.slice(-1) === "$") !== (val.t === "s")) throw new InterpreterFail("type");
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
        if (ok === false) throw new InterpreterFail("sprite");
        return false;
      }
      case "watch":
        if (!this.labels[stmt.name]) throw new InterpreterFail("noline");
        this.watchName = stmt.name;
        return false;
      case "destroy":
        if (stmt.id == null) this.host.destroy(null);
        else if (this.host.destroy(Math.floor(asNum(this.eval(stmt.id)))) === false) throw new InterpreterFail("sprite");
        return false;
      case "color": {
        var fg = Math.floor(asNum(this.eval(stmt.fg)));
        var bg = stmt.bg ? Math.floor(asNum(this.eval(stmt.bg))) : null;
        if (fg < 0 || fg > 15 || (bg != null && (bg < 0 || bg > 15))) throw new InterpreterFail("syntax");
        this.host.color(fg, bg);
        return false;
      }
      case "tone": {
        var freq = asNum(this.eval(stmt.freq));
        var ms = asNum(this.eval(stmt.ms));
        if (freq < 20 || freq > 8000 || ms < 0 || ms > 8000) throw new InterpreterFail("syntax");
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
      case "basic": throw new InterpreterFail("basic");
      case "wire": {
        var wireWord = String(stmt.word || "").toLowerCase();
        throw new InterpreterFail(MESSAGES[wireWord] ? wireWord : "wire");
      }
      case "fail": throw new InterpreterFail(stmt.code || "syntax");
      case "direct": throw new InterpreterFail("direct");
      default: throw new InterpreterFail("syntax");
    }
  };

  Interpreter.prototype.loop = function () {
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

  Interpreter.prototype.startLoop = function () {
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

  Interpreter.prototype.direct = function (source) {
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

  Interpreter.prototype.run = function (start) {
    var self = this;
    this.resetRuntime();
    try { this.rebuild(); }
    catch (err) {
      this.report(err);
      this.currentLine = null;
      return Promise.resolve();
    }
    if (!this.prog.length) {
      this.report(new InterpreterFail("empty"));
      return Promise.resolve();
    }
    var index = 0;
    if (start != null) {
      index = -1;
      for (var i = 0; i < this.prog.length; i += 1) {
        if (this.prog[i].num >= start) { index = i; break; }
      }
      if (index < 0) {
        this.report(new InterpreterFail("noline"));
        return Promise.resolve();
      }
    }
    if (this.host.starting) this.host.starting();
    this.pc = { index: index, stmt: 0 };
    return this.startLoop().then(function () { self.directStmts = null; });
  };

  // EXORCISE. Statement names move. INT, SIN, RND, and the rest of the sums stay.
  var RENAME = {
    PRINT: "CHANT", GOTO: "FLYTO", GOSUB: "SUMMON", RETURN: "BANISH", FOR: "CURSE",
    LET: "CONJURE", INPUT: "DEMAND", DATA: "OFFERING", READ: "TAKE", RESTORE: "REWIND",
    END: "DISPEL", STOP: "DISPEL", CLS: "SCRUB"
  };
  var BURY = {
    POKE: 1, SYS: 1, WAIT: 1, CALL: 1, SOUND: 1, PLOT: 1, DRAW: 1, PSET: 1, PRESET: 1,
    PAINT: 1, PALETTE: 1, SCREEN: 1, WIDTH: 1, KEY: 1, PLAY: 1, BEEP: 1, OUT: 1,
    OPEN: 1, CLOSE: 1, FIELD: 1, PUT: 1, FILES: 1, KILL: 1, NAME: 1, CHAIN: 1, MERGE: 1,
    COMMON: 1, DEF: 1, DEFINT: 1, DEFSNG: 1, DEFDBL: 1, DEFSTR: 1, RANDOMIZE: 1,
    OPTION: 1, WHILE: 1, WEND: 1, DO: 1, LOOP: 1, SELECT: 1, CASE: 1, FUNCTION: 1,
    SUB: 1, EXIT: 1, DECLARE: 1, CONST: 1, TYPE: 1, SHARED: 1, STATIC: 1, LPRINT: 1,
    WRITE: 1, SWAP: 1, RESUME: 1, ERROR: 1, CLEAR: 1, CONT: 1, AUTO: 1, RENUM: 1,
    NEW: 1, LIST: 1, LOAD: 1, SAVE: 1, LLIST: 1, SYSTEM: 1, SHELL: 1, VIEW: 1,
    WINDOW: 1, PALETTE: 1, IOCTL: 1, ERASE: 1, TROFF: 1, TRON: 1, MOTOR: 1
  };
  var WIRE_STMT = { POKE: 1, SYS: 1, WAIT: 1, CALL: 1 };

  function isLetterCh(ch) { return letter(ch); }
  function isDigitCh(ch) { return digit(ch); }
  function identChar(ch) { return isLetterCh(ch) || isDigitCh(ch) || ch === "$"; }

  function readWordAt(src, i) {
    while (i < src.length && (src[i] === " " || src[i] === "\t")) i += 1;
    var from = i;
    if (i >= src.length || !isLetterCh(src[i])) return { word: "", from: from, to: from };
    i += 1;
    while (i < src.length && (isLetterCh(src[i]) || isDigitCh(src[i]))) i += 1;
    if (src[i] === "$") i += 1;
    return { word: src.slice(from, i).toUpperCase(), from: from, to: i };
  }

  function findKeyword(src, word, from) {
    var want = word.toUpperCase();
    var inStr = false;
    var depth = 0;
    for (var i = from || 0; i < src.length; i += 1) {
      var ch = src[i];
      if (inStr) {
        if (ch === "\"") {
          if (src[i + 1] === "\"") { i += 1; continue; }
          inStr = false;
        }
        continue;
      }
      if (ch === "\"") { inStr = true; continue; }
      if (ch === "(") { depth += 1; continue; }
      if (ch === ")") { if (depth) depth -= 1; continue; }
      if (depth || !isLetterCh(ch)) continue;
      if (i > 0 && identChar(src[i - 1])) continue;
      var got = readWordAt(src, i);
      if (got.word === want) return got.from;
      if (got.to > i) i = got.to - 1;
    }
    return -1;
  }

  function countWord(src, word) {
    var n = 0;
    var at = 0;
    while (at < src.length) {
      var hit = findKeyword(src, word, at);
      if (hit < 0) break;
      n += 1;
      at = hit + word.length;
    }
    return n;
  }

  function statementEnd(src, from) {
    var inStr = false;
    var depth = 0;
    for (var i = from; i < src.length; i += 1) {
      var ch = src[i];
      if (inStr) {
        if (ch === "\"") {
          if (src[i + 1] === "\"") { i += 1; continue; }
          inStr = false;
        }
        continue;
      }
      if (ch === "\"") { inStr = true; continue; }
      if (ch === "(") { depth += 1; continue; }
      if (ch === ")") { if (depth) depth -= 1; continue; }
      if (ch === ":" && depth === 0) return i;
    }
    return src.length;
  }

  function matchParen(src, open) {
    var depth = 0;
    var inStr = false;
    for (var i = open; i < src.length; i += 1) {
      var ch = src[i];
      if (inStr) {
        if (ch === "\"") {
          if (src[i + 1] === "\"") { i += 1; continue; }
          inStr = false;
        }
        continue;
      }
      if (ch === "\"") { inStr = true; continue; }
      if (ch === "(") depth += 1;
      else if (ch === ")") {
        depth -= 1;
        if (depth === 0) return i + 1;
      }
    }
    return -1;
  }

  function splitArgs(body) {
    var args = [];
    var buf = "";
    var inStr = false;
    var depth = 0;
    for (var i = 0; i < body.length; i += 1) {
      var ch = body[i];
      if (inStr) {
        buf += ch;
        if (ch === "\"") {
          if (body[i + 1] === "\"") { buf += "\""; i += 1; continue; }
          inStr = false;
        }
        continue;
      }
      if (ch === "\"") { inStr = true; buf += ch; continue; }
      if (ch === "(") { depth += 1; buf += ch; continue; }
      if (ch === ")") { depth -= 1; buf += ch; continue; }
      if (ch === "," && depth === 0) { args.push(buf); buf = ""; continue; }
      buf += ch;
    }
    if (buf.length || args.length) args.push(buf);
    return args;
  }

  function consumesRest(src, pos) {
    var rest = src.slice(pos);
    var mark = rest.match(/^\s*(['A-Za-z])/);
    if (!mark) return false;
    if (mark[1] === "'") return true;
    var word = readWordAt(rest, 0).word;
    return word === "IF" || word === "REM" || word === "WHISPER";
  }

  function splitConsuming(src) {
    var pieces = [];
    var start = 0;
    var i = 0;
    var inStr = false;
    var depth = 0;
    var consume = consumesRest(src, 0);
    while (i < src.length) {
      var ch = src[i];
      if (inStr) {
        if (ch === "\"") {
          if (src[i + 1] === "\"") { i += 2; continue; }
          inStr = false;
        }
        i += 1;
        continue;
      }
      if (ch === "\"") { inStr = true; i += 1; continue; }
      if (ch === "(") { depth += 1; i += 1; continue; }
      if (ch === ")") { if (depth) depth -= 1; i += 1; continue; }
      if (ch === ":" && depth === 0 && !consume) {
        pieces.push(src.slice(start, i));
        i += 1;
        start = i;
        consume = consumesRest(src, start);
        continue;
      }
      i += 1;
    }
    if (start <= src.length) pieces.push(src.slice(start));
    return pieces;
  }

  function walkBasic(src) {
    var empty = { src: "", wires: 0, buriedAll: false };
    if (!src || !String(src).trim()) return empty;
    var i = 0;
    var out = "";
    var at = true;
    var inStr = false;
    var drops = [];
    var wires = 0;
    var comment = "";
    function finish() {
      var live = out.replace(/(?:\s*:\s*)+$/g, "").trim();
      var notes = drops.slice();
      if (comment) notes.push(comment);
      var text = live;
      if (notes.length) {
        var whisper = "WHISPER " + notes.join(" : ");
        text = live ? live + " : " + whisper : whisper;
      }
      return { src: text.trim(), wires: wires, buriedAll: !live && drops.length > 0 };
    }
    function dropRange(from, to) {
      var chunk = src.slice(from, to).trim();
      if (chunk) drops.push(chunk);
      var head = readWordAt(src, from);
      if (WIRE_STMT[head.word]) wires += 1;
    }
    while (i < src.length) {
      var ch = src[i];
      if (inStr) {
        out += ch;
        if (ch === "\"") {
          if (src[i + 1] === "\"") { out += "\""; i += 2; continue; }
          inStr = false;
        }
        i += 1;
        continue;
      }
      if (ch === "\"") { inStr = true; out += ch; i += 1; at = false; continue; }
      if (at && (ch === " " || ch === "\t")) { out += ch; i += 1; continue; }
      if (at && ch === "'") {
        comment = src.slice(i + 1).trim();
        return finish();
      }
      if (at && ch === "?") {
        var nxt = src[i + 1];
        if (!nxt || nxt === " " || nxt === "\t" || nxt === "\"" || nxt === "," || nxt === ";" || nxt === ":" || nxt === "(") {
          var afterQ = readWordAt(src, i + 1);
          if (afterQ.word === "USING") {
            var qEnd = statementEnd(src, i);
            dropRange(i, qEnd);
            i = qEnd;
            if (src[i] === ":") i += 1;
            at = true;
            continue;
          }
          out += "CHANT";
          i += 1;
          at = false;
          continue;
        }
      }
      if (isLetterCh(ch)) {
        var id = readWordAt(src, i);
        if (at && id.word === "WHISPER") {
          return { src: src.trim(), wires: wires, buriedAll: false };
        }
        if (at && id.word === "REM") {
          comment = src.slice(id.to).trim();
          return finish();
        }
        if (at && id.word === "GO") {
          var step = readWordAt(src, id.to);
          if (step.word === "TO" || step.word === "SUB") {
            out += step.word === "TO" ? "FLYTO" : "SUMMON";
            i = step.to;
            at = false;
            continue;
          }
        }
        if (at && id.word === "NEXT") {
          var nEnd = statementEnd(src, id.to);
          var names = splitArgs(src.slice(id.to, nEnd)).map(function (s) { return s.trim(); }).filter(Boolean);
          out += names.length ? names.map(function (nm) { return "BREAK " + nm; }).join(" : ") : "BREAK";
          i = nEnd;
          at = false;
          continue;
        }
        if (at && (id.word === "PRINT" || id.word === "LPRINT" || id.word === "INPUT")) {
          var look = readWordAt(src, id.to);
          var hashAt = id.to;
          while (hashAt < src.length && (src[hashAt] === " " || src[hashAt] === "\t")) hashAt += 1;
          var hashed = src[hashAt] === "#";
          if (id.word === "LPRINT" || hashed || look.word === "USING") {
            var pEnd = statementEnd(src, i);
            dropRange(i, pEnd);
            i = pEnd;
            if (src[i] === ":") i += 1;
            at = true;
            continue;
          }
          if (id.word === "LINE") { /* unreachable */ }
          out += id.word === "INPUT" ? "DEMAND" : "CHANT";
          i = id.to;
          at = false;
          continue;
        }
        if (at && id.word === "LINE") {
          var lineNext = readWordAt(src, id.to);
          if (lineNext.word === "INPUT") {
            out += "DEMAND";
            i = lineNext.to;
            at = false;
            continue;
          }
          var lineEnd = statementEnd(src, id.to);
          var lineBody = src.slice(id.to, lineEnd).trim();
          var box = /,\s*BF?\b/i.test(lineBody);
          var seg = lineBody.match(/^\(\s*([^)]+)\s*\)\s*-\s*\(\s*([^)]+)\s*\)/);
          if (!box && seg) {
            out += "LINE " + seg[1].trim() + ", " + seg[2].trim();
            i = lineEnd;
            at = false;
            continue;
          }
          if (box || lineBody.charAt(0) === "(" || lineBody.charAt(0) === "-") {
            dropRange(i, lineEnd);
            i = lineEnd;
            if (src[i] === ":") i += 1;
            at = true;
            continue;
          }
        }
        if (at && id.word === "CIRCLE") {
          var cEnd = statementEnd(src, id.to);
          var cBody = src.slice(id.to, cEnd).trim();
          var circ = cBody.match(/^\(\s*([^)]+)\s*\)\s*,\s*([^,]+)/);
          if (circ) {
            var xy = splitArgs(circ[1]);
            if (xy.length >= 2) {
              out += "CIRCLE " + xy[0].trim() + ", " + xy[1].trim() + ", " + circ[2].trim();
              i = cEnd;
              at = false;
              continue;
            }
          }
        }
        if (at && id.word === "LOCATE") {
          var locEnd = statementEnd(src, id.to);
          var locArgs = splitArgs(src.slice(id.to, locEnd)).map(function (s) { return s.trim(); });
          if (locArgs.length === 1 && locArgs[0]) out += "AT 0, " + locArgs[0];
          else if (locArgs.length === 2) out += "AT " + (locArgs[1] || "0") + ", " + (locArgs[0] || "0");
          else dropRange(i, locEnd);
          i = locEnd;
          at = false;
          continue;
        }
        if (at && id.word === "GET") {
          var gEnd = statementEnd(src, id.to);
          var gBody = src.slice(id.to, gEnd).trim();
          var gArgs = (!gBody || gBody.charAt(0) === "(" || gBody.charAt(0) === "#") ? null : splitArgs(gBody);
          var bits = [];
          var gOk = !!gArgs && gArgs.length > 0;
          if (gOk) {
            for (var g = 0; g < gArgs.length; g += 1) {
              var nm = gArgs[g].trim();
              if (!/^[A-Za-z][A-Za-z0-9]*\$?$/.test(nm)) { gOk = false; break; }
              bits.push(nm.slice(-1) === "$" ? nm + " = LISTEN$" : nm + " = VAL(LISTEN$)");
            }
          }
          if (!gOk) dropRange(i, gEnd);
          else out += bits.join(" : ");
          i = gEnd;
          at = false;
          continue;
        }
        if (at && id.word === "SLEEP") {
          var sEnd = statementEnd(src, id.to);
          var sArg = src.slice(id.to, sEnd).trim();
          if (!sArg) out += "FREEZE";
          else if (/^\d+(\.\d+)?$/.test(sArg)) out += "FREEZE " + String(Math.min(60000, Math.round(Number(sArg) * 1000)));
          else out += "FREEZE (" + sArg + ") * 1000";
          i = sEnd;
          at = false;
          continue;
        }
        if (at && id.word === "ON") {
          var oEnd = statementEnd(src, id.to);
          var oBody = src.slice(id.to, oEnd);
          if (/^\s*ERROR\b/i.test(oBody)) {
            dropRange(i, oEnd);
            i = oEnd;
            at = false;
            continue;
          }
          var gsub = findKeyword(oBody, "GOSUB", 0);
          var gto = findKeyword(oBody, "GOTO", 0);
          var mode = "";
          var use = -1;
          var width = 0;
          if (gsub >= 0 && (gto < 0 || gsub < gto)) { use = gsub; width = 5; mode = "SUMMON"; }
          else if (gto >= 0) { use = gto; width = 4; mode = "FLYTO"; }
          if (use < 0) {
            var goAt = findKeyword(oBody, "GO", 0);
            if (goAt >= 0) {
              var second = readWordAt(oBody, goAt + 2);
              if (second.word === "TO") { use = goAt; width = second.to - goAt; mode = "FLYTO"; }
              else if (second.word === "SUB") { use = goAt; width = second.to - goAt; mode = "SUMMON"; }
            }
          }
          if (use < 0 || !mode) dropRange(i, oEnd);
          else {
            var expr = oBody.slice(0, use).trim();
            var targets = oBody.slice(use + width).trim();
            var exprWalk = walkBasic(expr);
            wires += exprWalk.wires;
            out += "WHEN " + exprWalk.src + " " + mode + " " + targets;
          }
          i = oEnd;
          at = false;
          continue;
        }
        if (at && RENAME[id.word]) {
          out += RENAME[id.word];
          i = id.to;
          at = false;
          continue;
        }
        if (at && BURY[id.word]) {
          var bEnd = statementEnd(src, i);
          dropRange(i, bEnd);
          i = bEnd;
          if (src[i] === ":") i += 1;
          at = true;
          continue;
        }
        if (id.word === "INKEY$") {
          out += "LISTEN$";
          i = id.to;
          at = false;
          continue;
        }
        if (id.word === "PEEK" || id.word === "USR") {
          var parenAt = id.to;
          while (parenAt < src.length && (src[parenAt] === " " || src[parenAt] === "\t")) parenAt += 1;
          if (src[parenAt] === "(") {
            var close = matchParen(src, parenAt);
            if (close > parenAt) {
              out += "0";
              i = close;
              wires += 1;
              at = false;
              continue;
            }
          }
        }
        if (id.word === "THEN") {
          out += src.slice(i, id.to);
          i = id.to;
          at = true;
          continue;
        }
        out += src.slice(i, id.to);
        i = id.to;
        at = false;
        continue;
      }
      if (ch === ":") { out += ch; i += 1; at = true; continue; }
      out += ch;
      i += 1;
      if (ch !== " " && ch !== "\t") at = false;
    }
    return finish();
  }

  function pureJump(src) {
    var s = String(src || "").trim();
    return /^\d+$/.test(s) || /^FLYTO\s+\S+$/.test(s);
  }

  function elseSplit(src) {
    if (!/^\s*IF\b/i.test(src)) return null;
    var elseAt = findKeyword(src, "ELSE", 0);
    if (elseAt < 0) return null;
    var before = src.slice(0, elseAt);
    if (countWord(before, "IF") !== 1) return null;
    var lead = src.match(/^\s*IF\b/i)[0].length;
    var thenAt = findKeyword(before, "THEN", 0);
    if (thenAt >= 0) {
      return {
        cond: src.slice(lead, thenAt).trim(),
        thenPart: src.slice(thenAt + 4, elseAt).trim(),
        elsePart: src.slice(elseAt + 4).trim()
      };
    }
    var gotoAt = findKeyword(before, "GOTO", 0);
    if (gotoAt < 0) {
      var goAt = findKeyword(before, "GO", 0);
      if (goAt >= 0 && readWordAt(before, goAt + 2).word === "TO") gotoAt = goAt;
    }
    if (gotoAt < 0) return null;
    return {
      cond: src.slice(lead, gotoAt).trim(),
      thenPart: src.slice(gotoAt, elseAt).trim(),
      elsePart: src.slice(elseAt + 4).trim()
    };
  }

  function buildElse(parts) {
    var cond = walkBasic(parts.cond || "0");
    var thenW = walkBasic(parts.thenPart || "");
    var elseW = walkBasic(parts.elsePart || "");
    var wires = cond.wires + thenW.wires + elseW.wires;
    var elseSrc = elseW.src.trim();
    if (/^\d+$/.test(elseSrc)) elseSrc = "FLYTO " + elseSrc;
    var thenSrc = thenW.src.trim();
    var thenLine;
    var needs = false;
    if (!thenSrc) {
      thenLine = "IF " + cond.src + " THEN FLYTO {{SKIP}}";
      needs = true;
    } else if (pureJump(thenSrc)) thenLine = "IF " + cond.src + " THEN " + thenSrc;
    else {
      thenLine = "IF " + cond.src + " THEN " + thenSrc + " : FLYTO {{SKIP}}";
      needs = true;
    }
    return { thenLine: thenLine, elseSrc: elseSrc, needs: needs, wires: wires };
  }

  function lineFits(num, source) {
    return span(String(num) + " " + source) <= MAX_CHARS;
  }

  function sourceCompiles(source) {
    try { new Parser(source).parseSequence(); return true; }
    catch (err) { return false; }
  }

  function asWhisper(num, original) {
    var body = String(original || "").trim();
    var chars = Array.from(body);
    var src = "WHISPER " + chars.join("");
    while (chars.length && !lineFits(num, src)) {
      chars.pop();
      src = "WHISPER " + chars.join("");
    }
    return src;
  }

  function parseRows(text) {
    var rows = [];
    String(text || "").replace(/^\uFEFF/, "").split(/\r?\n/).forEach(function (raw) {
      var line = raw.replace(/\t/g, " ").replace(/\s+$/, "");
      if (!line.trim()) return;
      var m = line.match(/^\s*(\d+)\s*(.*)$/);
      if (m && m[2].trim() && Number(m[1]) <= MAX_LINE) {
        rows.push({ n: Number(m[1]), src: m[2].trim(), bare: false });
        return;
      }
      rows.push({ n: null, src: line.trim(), bare: true });
    });
    return rows;
  }

  function assignNumbers(rows) {
    var moved = 0;
    var any = false;
    for (var i = 0; i < rows.length; i += 1) if (rows[i].n != null) any = true;
    if (!any) {
      for (var b = 0; b < rows.length; b += 1) {
        rows[b].n = (b + 1) * 10;
        rows[b].bare = true;
      }
      return { numbered: rows.length, moved: 0 };
    }
    var used = {};
    rows.forEach(function (row) { if (row.n != null) used[row.n] = 1; });
    var numbered = 0;
    var prev = -1;
    for (var r = 0; r < rows.length; r += 1) {
      if (rows[r].n != null) { prev = rows[r].n; continue; }
      var nextEx = null;
      for (var k = r + 1; k < rows.length; k += 1) {
        if (rows[k].n != null) { nextEx = rows[k].n; break; }
      }
      var cand = prev + 1;
      var past = false;
      if (nextEx != null && cand >= nextEx) {
        cand = 0;
        Object.keys(used).forEach(function (key) { cand = Math.max(cand, Number(key)); });
        cand += 1;
        past = true;
      }
      while (used[cand]) cand += 1;
      if (cand > MAX_LINE) cand = MAX_LINE;
      rows[r].n = cand;
      rows[r].bare = true;
      used[cand] = 1;
      prev = cand;
      numbered += 1;
      if (past) moved += 1;
    }
    return { numbered: numbered, moved: moved };
  }

  function convertSource(src) {
    var pieces = splitConsuming(src);
    var live = [];
    var notes = [];
    var wires = 0;
    var elseBuild = null;
    function take(walked) {
      if (!walked || !walked.src) return;
      wires += walked.wires;
      if (walked.buriedAll || /^\s*WHISPER\b/i.test(walked.src)) notes.push(walked.src.replace(/^\s*WHISPER\s*/i, ""));
      else live.push(walked.src);
    }
    for (var p = 0; p < pieces.length; p += 1) {
      var piece = pieces[p];
      if (!piece || !piece.trim()) continue;
      var split = elseSplit(piece);
      if (split) {
        elseBuild = buildElse(split);
        wires += elseBuild.wires;
        take(walkBasic(elseBuild.thenLine));
        continue;
      }
      take(walkBasic(piece));
    }
    var text = live.join(" : ");
    if (notes.length) {
      var whisper = "WHISPER " + notes.join(" : ");
      text = text ? text + " : " + whisper : whisper;
    }
    return { src: text.trim(), wires: wires, elseBuild: elseBuild };
  }

  function placeElse(num, nextN, used, built) {
    var slot = num + 1;
    while (used[slot]) slot += 1;
    if (nextN != null && slot >= nextN) return null;
    if (slot > MAX_LINE) return null;
    var pad = null;
    var landing = nextN;
    if (built.needs) {
      if (nextN == null) {
        pad = slot + 1;
        while (used[pad]) pad += 1;
        if (pad > MAX_LINE) return null;
        landing = pad;
      }
    }
    var landingNo = landing == null ? pad : landing;
    var thenLine = built.thenLine.split("{{SKIP}}").join(String(landingNo));
    if (thenLine.indexOf("{{SKIP}}") >= 0) return null;
    used[slot] = 1;
    if (pad != null) used[pad] = 1;
    return { thenLine: thenLine, elseSrc: built.elseSrc, slot: slot, pad: pad, landing: landingNo };
  }

  function exorciseListing(text) {
    var rows = parseRows(text);
    var numbers = assignNumbers(rows);
    var used = {};
    rows.forEach(function (row) { if (row.n != null) used[row.n] = 1; });
    var produced = [];
    var renamed = 0;
    var buried = 0;
    var wires = 0;
    var tight = 0;
    for (var i = 0; i < rows.length; i += 1) {
      var row = rows[i];
      var nextN = null;
      for (var k = i + 1; k < rows.length; k += 1) {
        if (rows[k].n > row.n) { nextN = rows[k].n; break; }
      }
      var original = row.src;
      var built = convertSource(original);
      var slots = null;
      if (built.elseBuild) slots = placeElse(row.n, nextN, used, built.elseBuild);
      var main = built.src;
      var extras = [];
      if (built.elseBuild && slots) {
        main = main.split("{{SKIP}}").join(String(slots.landing));
        extras.push({ n: slots.slot, src: slots.elseSrc });
        if (slots.pad != null) extras.push({ n: slots.pad, src: "WHISPER" });
      } else if (built.elseBuild) main = asWhisper(row.n, original);
      var kind = "same";
      if (main !== original || extras.length) {
        var ok = main && lineFits(row.n, main) && sourceCompiles(main);
        var extrasOk = ok;
        for (var e = 0; e < extras.length; e += 1) {
          if (!lineFits(extras[e].n, extras[e].src) || !sourceCompiles(extras[e].src)) extrasOk = false;
        }
        if (!ok || !extrasOk) {
          if (slots) {
            delete used[slots.slot];
            if (slots.pad != null) delete used[slots.pad];
            slots = null;
          }
          if (sourceCompiles(original) && lineFits(row.n, original)) {
            main = original;
            extras = [];
            kind = "same";
          } else if (!lineFits(row.n, main) && sourceCompiles(main) && lineFits(row.n, original)) {
            main = original;
            extras = [];
            kind = "same";
            tight += 1;
          } else {
            main = asWhisper(row.n, original);
            extras = [];
            kind = "buried";
          }
        } else {
          var wasComment = /^\s*(REM\b|WHISPER\b|')/i.test(original);
          var onlyWhisper = /^\s*WHISPER\b/i.test(main);
          kind = onlyWhisper && !wasComment ? "buried" : "renamed";
          if (main === original && !extras.length) kind = "same";
          else if (main === original && extras.length) kind = "renamed";
        }
      }
      if (kind !== "same") wires += built.wires;
      if (kind === "renamed") renamed += 1;
      if (kind === "buried") buried += 1;
      produced.push({ n: row.n, src: main });
      for (var x = 0; x < extras.length; x += 1) produced.push(extras[x]);
    }
    produced.sort(function (a, b) { return a.n - b.n; });
    var seen = {};
    var finalRows = [];
    for (var f = 0; f < produced.length; f += 1) {
      if (seen[produced[f].n]) continue;
      seen[produced[f].n] = 1;
      if (produced[f].src) finalRows.push(produced[f]);
    }
    var textOut = finalRows.map(function (row) { return row.n + " " + row.src; }).join("\n");
    var changed = renamed + buried + wires + numbers.numbered + numbers.moved + tight > 0;
    return {
      text: textOut,
      renamed: renamed,
      buried: buried,
      wires: wires,
      numbered: numbers.numbered,
      moved: numbers.moved,
      tight: tight,
      changed: changed
    };
  }

  Interpreter.exorcise = exorciseListing;

  root.Interpreter = Interpreter;
  root.InterpreterFail = InterpreterFail;
  root.BASIC_MESSAGES = MESSAGES;
  root.BASIC_LIMITS = {
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
