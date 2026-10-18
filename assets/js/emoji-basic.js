// Basic Learn. A small BASIC for teaching, run by a virtual machine.
// Line numbers are optional. They exist for GOTO and GOSUB.
"use strict";
(function (root) {
  var KEYWORDS = {
    and: 1, or: 1, not: 1, mod: 1, print: 1, input: 1, cls: 1, dim: 1, let: 1,
    if: 1, then: 1, else: 1, elseif: 1, endif: 1, end: 1, for: 1, to: 1, step: 1,
    next: 1, while: 1, wend: 1, do: 1, loop: 1, until: 1, function: 1, return: 1,
    goto: 1, gosub: 1, stop: 1, rem: 1, help: 1
  };
  var COMMANDS = [
    "PRINT", "INPUT", "CLS", "DIM", "LET", "IF", "FOR", "NEXT", "WHILE", "WEND",
    "DO", "LOOP", "FUNCTION", "RETURN", "GOTO", "GOSUB", "STOP", "END", "REM", "HELP"
  ];
  var HELP = [
    "PRINT shows words and numbers. A semicolon stays on the line. A comma leaves a gap.",
    "INPUT \"Question\"; NAME$ waits for an answer. A number variable asks again if the answer is not a number.",
    "IF test THEN ... ELSE ... END IF. On one line: IF test THEN PRINT \"yes\"",
    "FOR I = 1 TO 10 STEP 2 ... NEXT I",
    "WHILE test ... WEND",
    "DO ... LOOP, or LOOP WHILE test, or LOOP UNTIL test. DO WHILE test ... LOOP works too.",
    "FUNCTION ADD(A, B) ... ADD = A + B ... END FUNCTION",
    "GOTO 100 and GOSUB 100 use a line number. RETURN comes back from GOSUB or leaves a function.",
    "DIM A(10) makes slots 1 through 10. The first slot is 1.",
    "Numbers start at 0. Text starts empty. + is numbers. & joins text.",
    "2D, 3D, and UI draw. 2D.HELP, 3D.HELP, and UI.HELP list the commands.",
    "STOP halts and says so. END finishes quietly. CLS clears the text."
  ].join("\n");

  function BasicError(message, line, basic) {
    this.message = message;
    this.line = line || 0;
    this.basic = basic || 0;
    this.basicError = true;
    this.name = "BasicError";
  }
  BasicError.prototype = Object.create(Error.prototype);

  function format(line, basic, message) {
    var where = "Line " + (line || 1);
    if (basic != null) where += " (program line " + basic + ")";
    return where + ": " + message;
  }

  function failAt(token, message) {
    throw new BasicError(format(token.line, null, message), token.line, 0);
  }

  function digit(c) { return c >= "0" && c <= "9"; }
  function letter(c) { return (c >= "a" && c <= "z") || (c >= "A" && c <= "Z"); }
  function part(c) { return letter(c) || digit(c); }

  function lex(source) {
    var src = String(source).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    var tokens = [];
    var i = 0;
    var line = 1;
    var col = 1;
    var bol = true;
    function ch(n) { return src[i + (n || 0)] || ""; }
    function bump(count) {
      var n = count || 1;
      while (n > 0) {
        if (src[i] === "\n") { line += 1; col = 1; } else col += 1;
        i += 1;
        n -= 1;
      }
    }
    function push(token) {
      tokens.push(token);
      if (token.t !== "nl") bol = false;
    }
    while (i < src.length) {
      var c = ch();
      if (c === " " || c === "\t") { bump(); continue; }
      if (c === "\n") {
        push({ t: "nl", v: "\n", line: line, col: col });
        bump();
        bol = true;
        continue;
      }
      if (c === "'") {
        while (i < src.length && ch() !== "\n") bump();
        push({ t: "rem", v: "'", line: line, col: col });
        continue;
      }
      if ((c === "2" || c === "3") && (ch(1) === "d" || ch(1) === "D") && !part(ch(2))) {
        push({ t: "ident", v: c === "2" ? "2D" : "3D", line: line, col: col });
        bump(2);
        continue;
      }
      if (bol && digit(c)) {
        var start = i;
        var nLine = line;
        var nCol = col;
        while (digit(ch())) bump();
        if (ch() !== "." && ch() !== "e" && ch() !== "E") {
          push({ t: "lineno", v: Number(src.slice(start, i)), line: nLine, col: nCol });
          continue;
        }
        i = start;
        line = nLine;
        col = nCol;
      }
      if (digit(c) || (c === "." && digit(ch(1)))) {
        var nLine2 = line;
        var nCol2 = col;
        var lexeme = "";
        while (digit(ch())) { lexeme += ch(); bump(); }
        if (ch() === ".") { lexeme += "."; bump(); while (digit(ch())) { lexeme += ch(); bump(); } }
        var numeric = Number(lexeme);
        if (!Number.isFinite(numeric)) push({ t: "bad", v: lexeme, line: nLine2, col: nCol2, err: "That number is too big." });
        else push({ t: "number", v: numeric, line: nLine2, col: nCol2 });
        continue;
      }
      if (c === "\"") {
        push(readString());
        continue;
      }
      if (letter(c)) {
        var idLine = line;
        var idCol = col;
        var word = "";
        while (part(ch())) { word += ch(); bump(); }
        if (ch() === "$") { word += "$"; bump(); }
        var folded = word.toUpperCase();
        var key = folded.replace(/\$/g, "").toLowerCase();
        if (!folded.endsWith("$") && KEYWORDS[key]) push({ t: "kw", v: key, line: idLine, col: idCol });
        else push({ t: "ident", v: folded, line: idLine, col: idCol });
        continue;
      }
      if (c === "?") {
        push({ t: "kw", v: "print", line: line, col: col });
        bump();
        continue;
      }
      var two = c + ch(1);
      if (two === "<>" || two === "<=" || two === ">=" || two === "==" || two === "!=" || two === "+=" || two === "-=" || two === "*=" || two === "/=") {
        push({ t: "op", v: two, line: line, col: col });
        bump(2);
        continue;
      }
      if ("+-*/\\^<>=(),;:.&".indexOf(c) >= 0) {
        push({ t: "op", v: c, line: line, col: col });
        bump();
        continue;
      }
      push({ t: "bad", v: c, line: line, col: col, err: "I don't know the symbol " + JSON.stringify(c) + "." });
      bump();
    }
    tokens.push({ t: "eof", v: "", line: line, col: col });
    return tokens;

    function readString() {
      var qLine = line;
      var qCol = col;
      bump();
      var value = "";
      while (i < src.length && ch() !== "\n") {
        if (ch() === "\"") {
          if (ch(1) === "\"") { value += "\""; bump(2); continue; }
          bump();
          return { t: "string", v: value, line: qLine, col: qCol };
        }
        value += ch();
        bump();
      }
      return { t: "bad", v: "\"" + value, line: qLine, col: qCol, err: "This text never ends. Add a quote at the end of the line." };
    }
  }

  function parse(source) {
    var tokens = lex(source);
    var i = 0;
    var basic = null;
    var cont = false;
    var used = {};
    var inline = 0;
    var stmts = [];

    function peek() { return tokens[i]; }
    function at(type, value) {
      var token = peek();
      return token.t === type && (value == null || token.v === value);
    }
    function eat(type, value) {
      if (!at(type, value)) return false;
      i += 1;
      return true;
    }
    function need(type, value, message) {
      if (eat(type, value)) return peek();
      failAt(peek(), message);
    }
    function ended() {
      return at("nl") || at("eof") || at("rem") || at("op", ":") || at("kw", "else") || at("kw", "elseif");
    }
    function lineTarget(token) {
      if (!token) return true;
      if (token.t === "nl" || token.t === "eof" || token.t === "rem") return true;
      if (token.t === "op" && token.v === ":") return true;
      return token.t === "kw" && (token.v === "else" || token.v === "elseif");
    }
    function keep(stmt, token) {
      stmt.line = token.line;
      stmt.basic = basic;
      stmt.cont = cont;
      cont = true;
      stmts.push(stmt);
      return stmt;
    }

    while (!at("eof")) {
      if (eat("nl")) { basic = null; cont = false; continue; }
      if (eat("rem")) continue;
      if (eat("op", ":")) continue;
      if (at("lineno")) {
        var mark = peek();
        if (used[mark.v]) failAt(mark, "Line number " + mark.v + " is already used on line " + used[mark.v] + ". Pick a new number.");
        used[mark.v] = mark.line;
        basic = mark.v;
        cont = false;
        eat("lineno");
        if (at("nl") || at("eof") || at("rem") || at("kw", "rem") || at("op", ":")) {
          keep({ op: "nop" }, mark);
          continue;
        }
      }
      if (at("bad")) failAt(peek(), peek().err);
      parseStmt();
    }
    return stmts;

    function parseStmt() {
      var token = peek();
      if (token.t === "bad") failAt(token, token.err);
      if (at("kw", "print")) return parsePrint();
      if (at("kw", "input")) return parseInput();
      if (at("kw", "cls")) { eat("kw", "cls"); return keep({ op: "cls" }, token); }
      if (at("kw", "stop")) { eat("kw", "stop"); return keep({ op: "stop" }, token); }
      if (at("kw", "help")) { eat("kw", "help"); return keep({ op: "help" }, token); }
      if (at("kw", "dim")) return parseDim();
      if (at("kw", "let")) { eat("kw", "let"); return parseStore(token); }
      if (at("kw", "if")) return parseIf();
      if (at("kw", "elseif") || at("kw", "else")) return parseElse(token);
      if (at("kw", "endif")) { eat("kw", "endif"); return keep({ op: "endif" }, token); }
      if (at("kw", "end")) return parseEnd(token);
      if (at("kw", "for")) return parseFor();
      if (at("kw", "next")) return parseNext();
      if (at("kw", "while")) { eat("kw", "while"); return keep({ op: "while", test: expression() }, token); }
      if (at("kw", "wend")) { eat("kw", "wend"); return keep({ op: "wend" }, token); }
      if (at("kw", "do")) return parseDo(token);
      if (at("kw", "loop")) return parseLoop(token);
      if (at("kw", "function")) return parseFunction(token);
      if (at("kw", "return")) return parseReturn(token);
      if (at("kw", "goto")) return parseJump(token, "goto");
      if (at("kw", "gosub")) return parseJump(token, "gosub");
      if (at("kw", "rem")) { eat("kw", "rem"); while (!at("nl") && !at("eof")) i += 1; return null; }
      if (at("ident")) return parseStore(token);
      if (at("kw")) failAt(token, "I didn't expect " + token.v.toUpperCase() + " here.");
      failAt(token, "A command has to start with a word, such as PRINT, IF, or FOR.");
    }

    function parsePrint() {
      var token = peek();
      eat("kw", "print");
      var items = [];
      if (ended()) return keep({ op: "print", items: items, newline: true }, token);
      while (true) {
        if (at("op", ",") || at("op", ";")) {
          var sep = peek().v;
          eat("op");
          items.push({ expr: null, sep: sep });
          if (ended()) return keep({ op: "print", items: items, newline: false }, token);
          continue;
        }
        var expr = expression();
        if (at("op", ",") || at("op", ";")) {
          var gap = peek().v;
          eat("op");
          items.push({ expr: expr, sep: gap });
          if (ended()) return keep({ op: "print", items: items, newline: false }, token);
          continue;
        }
        items.push({ expr: expr, sep: "" });
        if (!ended()) failAt(peek(), "I expected the end of the line after PRINT. Use : between two commands.");
        return keep({ op: "print", items: items, newline: true }, token);
      }
    }

    function parseInput() {
      var token = peek();
      eat("kw", "input");
      var prompt = null;
      if (at("string")) prompt = eatValue().v;
      if (prompt != null) {
        if (!eat("op", ";") && !eat("op", ",")) failAt(peek(), "Put ; or , between the question and the name. INPUT \"Age\"; A");
      }
      var names = [];
      if (!at("ident")) failAt(peek(), "INPUT needs a name to store the answer. INPUT A$ or INPUT \"Name\"; A$");
      names.push(parseSlot());
      while (eat("op", ",")) {
        if (!at("ident")) failAt(peek(), "I expected another name after the comma.");
        names.push(parseSlot());
      }
      return keep({ op: "input", prompt: prompt, names: names }, token);
    }

    function parseSlot() {
      var name = peek();
      if (!at("ident")) failAt(peek(), "I expected a name.");
      eat("ident");
      if (engineOf(name.v)) failAt(name, name.v + " is a picture tool, not a place to store an answer.");
      if (!eat("op", "(")) return { name: name.v, indexes: null, line: name.line };
      var indexes = [expression()];
      if (eat("op", ",")) indexes.push(expression());
      if (at("op", ",")) failAt(peek(), name.v + " can use one or two indexes.");
      need("op", ")", "I expected ) after the slot.");
      return { name: name.v, indexes: indexes, line: name.line };
    }

    function parseDim() {
      var token = peek();
      eat("kw", "dim");
      var dims = [];
      do {
        if (!at("ident")) failAt(peek(), "DIM needs a name. DIM A(10)");
        var slot = parseSlot();
        if (!slot.indexes) failAt(token, "DIM " + slot.name + "(10) needs the size in parentheses.");
        dims.push(slot);
      } while (eat("op", ","));
      return keep({ op: "dim", dims: dims }, token);
    }

    function parseIf() {
      var token = peek();
      eat("kw", "if");
      var test = expression();
      need("kw", "then", "I expected THEN. IF A > 1 THEN PRINT \"yes\"");
      if (at("number") && lineTarget(tokens[i + 1])) {
        var dest = peek().v;
        eat("number");
        var other = null;
        if (eat("kw", "else")) {
          if (!at("number")) failAt(peek(), "ELSE after a line number needs a line number too. IF A = 1 THEN 100 ELSE 200");
          other = peek().v;
          eat("number");
        }
        if (!ended() && !at("eof")) failAt(peek(), "That line number should end the command.");
        return keep({ op: "ifgoto", test: test, target: dest, other: other }, token);
      }
      if (ended()) {
        if (inline) failAt(token, "Use END IF when a test covers more than one line. One line can be IF A = 1 THEN PRINT \"yes\".");
        return keep({ op: "if", test: test }, token);
      }
      inline += 1;
      var thenStmts = [];
      var elseStmts = [];
      try {
        thenStmts = inlineList();
        if (eat("kw", "else")) elseStmts = inlineList();
      } finally {
        inline -= 1;
      }
      return keep({ op: "ifline", test: test, thenStmts: thenStmts, elseStmts: elseStmts }, token);
    }

    function inlineList() {
      var list = [];
      while (!ended() && !at("eof")) {
        var before = stmts.length;
        var made = parseStmt();
        if (made && (made.op === "if" || made.op === "for" || made.op === "while" || made.op === "do" || made.op === "function")) {
          failAt(peek(), "Start FOR, WHILE, DO, and FUNCTION on their own lines.");
        }
        if (stmts.length > before) list.push(stmts.pop());
        if (!eat("op", ":")) break;
      }
      return list;
    }

    function parseElse(token) {
      if (inline) failAt(token, "On one line, ELSE stays on that line. IF A = 1 THEN PRINT \"yes\" ELSE PRINT \"no\"");
      var elseif = at("kw", "elseif") || (at("kw", "else") && tokens[i + 1] && tokens[i + 1].t === "kw" && tokens[i + 1].v === "if");
      if (elseif) {
        if (at("kw", "elseif")) eat("kw", "elseif");
        else { eat("kw", "else"); eat("kw", "if"); }
        var test = expression();
        need("kw", "then", "I expected THEN after ELSE IF.");
        if (!ended()) failAt(peek(), "Put the commands under ELSE IF, and close the test with END IF.");
        return keep({ op: "elseif", test: test }, token);
      }
      eat("kw", "else");
      if (!ended()) failAt(peek(), "Put the commands under ELSE, and close the test with END IF.");
      return keep({ op: "else" }, token);
    }

    function parseEnd(token) {
      eat("kw", "end");
      if (eat("kw", "if")) return keep({ op: "endif" }, token);
      if (eat("kw", "function")) return keep({ op: "endfunc" }, token);
      return keep({ op: "end" }, token);
    }

    function parseFor() {
      var token = peek();
      eat("kw", "for");
      if (!at("ident")) failAt(peek(), "FOR needs a name. FOR I = 1 TO 10");
      var name = peek();
      eat("ident");
      if (engineOf(name.v)) failAt(name, name.v + " is a picture tool. FOR needs a number name, such as I or X.");
      if (name.v.endsWith("$")) failAt(name, "FOR counts with a number. Use I, not " + name.v + ".");
      need("op", "=", "I expected =. FOR I = 1 TO 10");
      var start = expression();
      need("kw", "to", "I expected TO. FOR I = 1 TO 10");
      var limit = expression();
      var step = null;
      if (eat("kw", "step")) step = expression();
      return keep({ op: "for", name: name.v, start: start, limit: limit, step: step }, token);
    }

    function parseNext() {
      var token = peek();
      eat("kw", "next");
      var name = null;
      if (at("ident")) { name = peek().v; eat("ident"); }
      return keep({ op: "next", name: name }, token);
    }

    function parseDo(token) {
      eat("kw", "do");
      var mode = null;
      var test = null;
      if (at("kw", "while") || at("kw", "until")) {
        mode = peek().v;
        eat("kw");
        test = expression();
      }
      return keep({ op: "do", mode: mode, test: test }, token);
    }

    function parseLoop(token) {
      eat("kw", "loop");
      var mode = null;
      var test = null;
      if (at("kw", "while") || at("kw", "until")) {
        mode = peek().v;
        eat("kw");
        test = expression();
      }
      return keep({ op: "loop", mode: mode, test: test }, token);
    }

    function parseFunction(token) {
      eat("kw", "function");
      if (!at("ident")) failAt(peek(), "FUNCTION needs a name. FUNCTION ADD(A, B)");
      var name = peek();
      eat("ident");
      if (engineOf(name.v)) failAt(name, name.v + " is a picture tool. Give the function another name.");
      need("op", "(", "I expected (. FUNCTION ADD(A, B)");
      var params = [];
      if (!at("op", ")")) {
        do {
          if (!at("ident")) failAt(peek(), "A parameter has to be a name.");
          var param = peek();
          eat("ident");
          if (engineOf(param.v)) failAt(param, param.v + " is a picture tool. Pick another parameter.");
          params.push(param.v);
        } while (eat("op", ","));
      }
      need("op", ")", "I expected ) after the parameters.");
      if (!ended()) failAt(peek(), "The body starts on the next line. Close it with END FUNCTION.");
      return keep({ op: "function", name: name.v, params: params }, token);
    }

    function parseReturn(token) {
      eat("kw", "return");
      var value = startsExpr() ? expression() : null;
      return keep({ op: "return", value: value }, token);
    }

    function parseJump(token, op) {
      eat("kw", op);
      if (!at("number") || Math.floor(peek().v) !== peek().v) failAt(peek(), op.toUpperCase() + " needs a whole line number, such as " + op.toUpperCase() + " 100.");
      var dest = peek().v;
      eat("number");
      return keep({ op: op, target: dest }, token);
    }

    function parseStore(token) {
      var left = postfix(true);
      if (eat("op", "=")) {
        if (left.t === "eng") failAt(token, left.obj + "." + left.method + " is a command. Call it. You cannot store into it.");
        if (left.t !== "var" && left.t !== "index") failAt(token, "You can store into a name or a slot. A = 1 or A(1) = 2.");
        return keep({ op: "let", target: left, value: expression() }, token);
      }
      if (left.t === "eng" || left.t === "call") return keep({ op: "call", target: left }, token);
      var guess = suggest(left.name, COMMANDS);
      failAt(token, "I don't know the word " + left.name + "." + (guess ? " Did you mean " + guess + "?" : " A command looks like PRINT \"hi\"."));
    }

    function startsExpr() {
      return at("number") || at("string") || at("ident") || at("op", "(") || at("op", "-") || at("op", "+") || at("kw", "not");
    }
    function expression() { return orExpr(); }
    function orExpr() {
      var left = andExpr();
      while (eat("kw", "or")) left = { t: "bin", op: "OR", left: left, right: andExpr(), line: left.line };
      return left;
    }
    function andExpr() {
      var left = notExpr();
      while (eat("kw", "and")) left = { t: "bin", op: "AND", left: left, right: notExpr(), line: left.line };
      return left;
    }
    function notExpr() {
      if (at("kw", "not")) {
        var token = peek();
        eat("kw", "not");
        return { t: "not", value: notExpr(), line: token.line };
      }
      return cmpExpr();
    }
    function cmpExpr() {
      var left = concatExpr();
      if (at("op", "=") || at("op", "<>") || at("op", "<") || at("op", ">") || at("op", "<=") || at("op", ">=") || at("op", "==") || at("op", "!=")) {
        var op = peek().v;
        var token = peek();
        eat("op");
        if (op === "==") failAt(token, "BASIC uses one = to compare. You wrote ==.");
        if (op === "!=") failAt(token, "BASIC writes <> when two values differ.");
        var right = concatExpr();
        if (at("op", "=") || at("op", "<>") || at("op", "<") || at("op", ">") || at("op", "<=") || at("op", ">=")) {
          failAt(peek(), "Write one comparison. A < B AND B < C covers two.");
        }
        return { t: "bin", op: op, left: left, right: right, line: token.line };
      }
      return left;
    }
    function concatExpr() {
      var left = addExpr();
      while (eat("op", "&")) left = { t: "bin", op: "&", left: left, right: addExpr(), line: left.line };
      return left;
    }
    function addExpr() {
      var left = mulExpr();
      while (at("op", "+") || at("op", "-")) {
        var op = peek().v;
        var token = peek();
        eat("op");
        left = { t: "bin", op: op, left: left, right: mulExpr(), line: token.line };
      }
      return left;
    }
    function mulExpr() {
      var left = unaryExpr();
      while (at("op", "*") || at("op", "/") || at("op", "\\") || at("kw", "mod")) {
        var token = peek();
        var op = token.t === "kw" ? "MOD" : token.v;
        eat(token.t);
        left = { t: "bin", op: op, left: left, right: unaryExpr(), line: token.line };
      }
      return left;
    }
    function unaryExpr() {
      if (at("op", "+=" ) || at("op", "-=") || at("op", "*=") || at("op", "/=")) {
        failAt(peek(), "BASIC has no " + peek().v + ". Write X = X + 1.");
      }
      if (at("op", "-") || at("op", "+")) {
        var token = peek();
        var op = token.v;
        eat("op");
        var value = unaryExpr();
        if (op === "+") return value;
        return { t: "neg", value: value, line: token.line };
      }
      return powerExpr();
    }
    function powerExpr() {
      var left = atom();
      if (eat("op", "^")) return { t: "bin", op: "^", left: left, right: unaryExpr(), line: left.line };
      return left;
    }
    function postfix(statement) {
      var token = peek();
      if (token.t === "bad") failAt(token, token.err);
      if (!at("ident")) failAt(token, "I expected a name.");
      var name = token.v;
      eat("ident");
      if (eat("op", ".")) {
        if (!at("ident")) failAt(peek(), "I expected a command after the dot. 2D.EMOJI, 3D.BOX, UI.SAY.");
        var method = peek().v;
        var methodLine = peek().line;
        eat("ident");
        var obj = engineOf(name);
        if (!obj) failAt(token, name + " has no dot commands. The picture tools are 2D, 3D, and UI.");
        var paren = at("op", "(");
        var args = readArgs(statement);
        return { t: "eng", obj: obj, method: method.toLowerCase(), args: args, call: statement || paren || args.length > 0, paren: paren, line: methodLine };
      }
      if (at("op", "(")) {
        var args = readArgs(true);
        if (statement && at("op", "=")) return { t: "index", name: name, args: args, line: token.line };
        return { t: "call", name: name, args: args, line: token.line };
      }
      if (statement && startsExpr()) {
        var guess = suggest(name, COMMANDS);
        if (guess) failAt(token, "I don't know the word " + name + ". Did you mean " + guess + "?");
        failAt(peek(), "I expected = or the end of the command. A call uses parentheses, such as " + name + "(1).");
      }
      return { t: "var", name: name, line: token.line };
    }
    function readArgs(allowBare) {
      if (eat("op", "(")) {
        var list = [];
        if (!at("op", ")")) {
          list.push(expression());
          while (eat("op", ",")) list.push(expression());
        }
        need("op", ")", "I expected ) to close the (.");
        return list;
      }
      if (!allowBare || !startsExpr()) return [];
      var bare = [expression()];
      while (eat("op", ",")) bare.push(expression());
      return bare;
    }
    function atom() {
      var token = peek();
      if (token.t === "bad") failAt(token, token.err);
      if (at("number")) { eat("number"); return { t: "num", v: token.v, line: token.line }; }
      if (at("string")) { eat("string"); return { t: "str", v: token.v, line: token.line }; }
      if (at("op", "(")) {
        eat("op", "(");
        var inner = expression();
        need("op", ")", "I expected ) to close the ( from line " + token.line + ".");
        return inner;
      }
      if (at("ident")) return postfix(false);
      if (token.t === "eof") failAt(token, "The line ended early. Finish the command, or close IF, FOR, WHILE, DO, and FUNCTION.");
      failAt(token, "I didn't expect " + (token.v || "this") + " here.");
    }

    function eatValue() {
      var token = peek();
      i += 1;
      return token;
    }
  }

  function engineOf(name) {
    var folded = String(name || "").toLowerCase();
    if (folded === "2d" || folded === "3d" || folded === "ui") return folded;
    return "";
  }

  function suggest(word, names) {
    var best = "";
    var bestD = 3;
    var lower = String(word || "").toLowerCase();
    names.forEach(function (item) {
      var d = distance(lower, item.toLowerCase());
      if (d < bestD) { bestD = d; best = item; }
    });
    return bestD <= 2 ? best : "";
  }

  function distance(a, b) {
    var prev = [];
    var row = [];
    for (var j = 0; j <= b.length; j += 1) prev[j] = j;
    for (var i = 1; i <= a.length; i += 1) {
      row[0] = i;
      for (var k = 1; k <= b.length; k += 1) {
        row[k] = Math.min(row[k - 1] + 1, prev[k] + 1, prev[k - 1] + (a[i - 1] === b[k - 1] ? 0 : 1));
      }
      var swap = prev;
      prev = row;
      row = swap;
    }
    return prev[b.length];
  }

  function resolve(stmts) {
    var out = [];
    var stack = [];
    var loops = [];
    var funcId = 0;
    var nextLoop = 1;
    var functions = {};
    var nextFunc = 1;

    function fail(stmt, message) {
      throw new BasicError(format(stmt.line, stmt.basic, message), stmt.line, stmt.basic || 0);
    }
    function stamp(stmt) {
      stmt.loopIds = loops.slice();
      stmt.funcId = funcId;
      return stmt;
    }
    function emit(stmt) {
      stamp(stmt);
      out.push(stmt);
      return stmt;
    }

    stmts.forEach(function (stmt) {
      if (stmt.op === "if") {
        var opened = emit({ op: "if", test: stmt.test, elseIp: -1, line: stmt.line, basic: stmt.basic, cont: stmt.cont });
        stack.push({ kind: "if", clauses: [opened], exits: [], line: stmt.line, basic: stmt.basic });
        return;
      }
      if (stmt.op === "elseif" || stmt.op === "else" || stmt.op === "endif") {
        var top = stack[stack.length - 1];
        if (!top || top.kind !== "if") fail(stmt, stmt.op === "endif" ? "END IF has no IF." : "ELSE has no IF.");
        if (stmt.op === "else" && top.hasElse) fail(stmt, "This IF already has an ELSE.");
        if (stmt.op === "elseif" && top.hasElse) fail(stmt, "ELSE IF has to come before ELSE.");
        var jump = emit({ op: "jump", to: -1, line: stmt.line, basic: null, cont: true, synthetic: true });
        top.exits.push(out.length - 1);
        if (stmt.op === "elseif" || stmt.op === "else") {
          top.clauses[top.clauses.length - 1].elseIp = out.length;
        }
        if (stmt.op === "elseif") {
          var clause = emit({ op: "if", test: stmt.test, elseIp: -1, line: stmt.line, basic: stmt.basic, cont: stmt.cont });
          top.clauses.push(clause);
          return;
        }
        if (stmt.op === "else") {
          emit({ op: "nop", line: stmt.line, basic: stmt.basic, cont: stmt.cont });
          top.hasElse = true;
          return;
        }
        top.clauses.forEach(function (clause) {
          if (clause.elseIp < 0) clause.elseIp = out.length;
        });
        top.exits.forEach(function (ip) { out[ip].to = out.length; });
        emit({ op: "nop", line: stmt.line, basic: stmt.basic, cont: stmt.cont });
        stack.pop();
        return;
      }
      if (stmt.op === "for") {
        var loopId = nextLoop++;
        var node = emit({ op: "for", name: stmt.name, start: stmt.start, limit: stmt.limit, step: stmt.step, id: loopId, nextIp: -1, line: stmt.line, basic: stmt.basic, cont: stmt.cont });
        loops.push(loopId);
        stack.push({ kind: "for", id: loopId, node: node, name: stmt.name, line: stmt.line, basic: stmt.basic });
        return;
      }
      if (stmt.op === "next") {
        var found = null;
        for (var f = stack.length - 1; f >= 0; f -= 1) if (stack[f].kind === "for") { found = f; break; }
        if (found == null) fail(stmt, "NEXT has no FOR.");
        if (found !== stack.length - 1) fail(stmt, "Close the " + stack[stack.length - 1].kind.toUpperCase() + " from line " + stack[stack.length - 1].line + " before NEXT.");
        var frame = stack.pop();
        if (stmt.name && stmt.name !== frame.name) fail(stmt, "NEXT " + stmt.name + " closed FOR " + frame.name + ", which started on line " + frame.line + ". Write NEXT " + frame.name + ".");
        loops.pop();
        frame.node.nextIp = out.length;
        emit({ op: "next", name: frame.name, forIp: out.indexOf(frame.node), id: frame.id, line: stmt.line, basic: stmt.basic, cont: stmt.cont });
        return;
      }
      if (stmt.op === "while") {
        var whileId = nextLoop++;
        var test = emit({ op: "while", test: stmt.test, endIp: -1, id: whileId, line: stmt.line, basic: stmt.basic, cont: stmt.cont });
        loops.push(whileId);
        stack.push({ kind: "while", id: whileId, node: test, line: stmt.line, basic: stmt.basic });
        return;
      }
      if (stmt.op === "wend") {
        if (!stack.length || stack[stack.length - 1].kind !== "while") fail(stmt, "WEND has no WHILE.");
        var loop = stack.pop();
        loops.pop();
        loop.node.endIp = out.length;
        emit({ op: "wend", whileIp: out.indexOf(loop.node), line: stmt.line, basic: stmt.basic, cont: stmt.cont });
        return;
      }
      if (stmt.op === "do") {
        var doId = nextLoop++;
        var door = emit({ op: "do", mode: stmt.mode, test: stmt.test, loopIp: -1, id: doId, line: stmt.line, basic: stmt.basic, cont: stmt.cont });
        loops.push(doId);
        stack.push({ kind: "do", id: doId, node: door, line: stmt.line, basic: stmt.basic });
        return;
      }
      if (stmt.op === "loop") {
        if (!stack.length || stack[stack.length - 1].kind !== "do") fail(stmt, "LOOP has no DO.");
        var block = stack.pop();
        loops.pop();
        block.node.loopIp = out.length;
        emit({ op: "loop", mode: stmt.mode, test: stmt.test, doIp: out.indexOf(block.node), line: stmt.line, basic: stmt.basic, cont: stmt.cont });
        return;
      }
      if (stmt.op === "function") {
        if (funcId) fail(stmt, "A function cannot sit inside another function.");
        if (loops.length) fail(stmt, "Start a function outside the loop.");
        if (builtinOf(stmt.name)) fail(stmt, stmt.name + " is already built in. Pick another name.");
        if (functions[stmt.name]) fail(stmt, stmt.name + " is already a function, on line " + functions[stmt.name].line + ".");
        var seen = {};
        stmt.params.forEach(function (name) {
          if (name === stmt.name) fail(stmt, name + " is the function's name. Pick another parameter.");
          if (seen[name]) fail(stmt, name + " is in the parameter list twice.");
          if (builtinOf(name)) fail(stmt, name + " is already built in. Pick another parameter.");
          seen[name] = 1;
        });
        var mark = nextFunc++;
        var fn = emit({ op: "function", name: stmt.name, params: stmt.params.slice(), endIp: -1, mark: mark, line: stmt.line, basic: stmt.basic, cont: stmt.cont });
        functions[stmt.name] = fn;
        funcId = mark;
        stack.push({ kind: "function", node: fn, line: stmt.line, basic: stmt.basic });
        return;
      }
      if (stmt.op === "endfunc") {
        if (!stack.length || stack[stack.length - 1].kind !== "function") fail(stmt, "END FUNCTION has no FUNCTION.");
        var owner = stack.pop();
        owner.node.endIp = out.length;
        emit({ op: "endfunc", line: stmt.line, basic: stmt.basic, cont: stmt.cont });
        funcId = 0;
        return;
      }
      emit(stmt);
    });

    if (stack.length) {
      var open = stack[stack.length - 1];
      var closer = { if: "END IF", for: "NEXT", while: "WEND", do: "LOOP", function: "END FUNCTION" }[open.kind];
      fail(open.node || open, "I expected " + closer + " to close the " + open.kind.toUpperCase() + " from line " + open.line + ".");
    }

    var lineMap = {};
    out.forEach(function (stmt, ip) {
      if (stmt.basic == null || stmt.cont || stmt.synthetic) return;
      if (lineMap[stmt.basic] == null) lineMap[stmt.basic] = ip;
    });
    return { code: out, functions: functions, lineMap: lineMap };
  }

  function builtinOf(name) {
    return BUILTINS[name] || null;
  }

  var BUILTINS = {
    ABS: { n: [1, 1], fn: function (a) { return Math.abs(needNum(a, "ABS")); } },
    INT: { n: [1, 1], fn: function (a) { return Math.floor(needNum(a, "INT")); } },
    SGN: { n: [1, 1], fn: function (a) { a = needNum(a, "SGN"); return a < 0 ? -1 : a > 0 ? 1 : 0; } },
    SQR: { n: [1, 1], fn: function (a) { a = needNum(a, "SQR"); if (a < 0) bad("SQR needs 0 or more. You gave " + a + "."); return Math.sqrt(a); } },
    SIN: { n: [1, 1], fn: function (a) { return Math.sin(needNum(a, "SIN") * Math.PI / 180); } },
    COS: { n: [1, 1], fn: function (a) { return Math.cos(needNum(a, "COS") * Math.PI / 180); } },
    TAN: { n: [1, 1], fn: function (a) { return Math.tan(needNum(a, "TAN") * Math.PI / 180); } },
    ATN: { n: [1, 1], fn: function (a) { return Math.atan(needNum(a, "ATN")) * 180 / Math.PI; } },
    RND: { n: [0, 1], fn: function (a) {
      if (a == null) return Math.random();
      a = needNum(a, "RND");
      if (a === 0) return Math.random();
      if (a < 1) bad("RND(n) with n at least 1 gives a whole number from 1 to n. RND(0) gives a decimal from 0 to 1.");
      return 1 + Math.floor(Math.random() * Math.floor(a));
    } },
    LEN: { n: [1, 1], fn: function (a) { return Array.from(needText(a, "LEN")).length; } },
    VAL: { n: [1, 1], fn: function (a) {
      var text = needText(a, "VAL").trim();
      if (text === "" || !Number.isFinite(Number(text))) bad("VAL needs a number written as text. You gave " + JSON.stringify(a) + ".");
      return Number(text);
    } },
    ASC: { n: [1, 1], fn: function (a) {
      var chars = Array.from(needText(a, "ASC"));
      if (!chars.length) bad("ASC needs at least one letter.");
      return chars[0].codePointAt(0);
    } },
    INSTR: { n: [2, 3], fn: function (a, b, c) {
      var start = 1;
      var hay;
      var needle;
      if (c == null) { hay = needText(a, "INSTR"); needle = needText(b, "INSTR"); }
      else { start = needNum(a, "INSTR"); hay = needText(b, "INSTR"); needle = needText(c, "INSTR"); }
      if (start < 1) bad("INSTR starts at letter 1.");
      var chars = Array.from(hay);
      var from = chars.slice(start - 1).join("");
      var at = from.indexOf(needle);
      if (at < 0) return 0;
      return start - 1 + Array.from(from.slice(0, at)).length + 1;
    } },
    TIMER: { n: [0, 0], fn: function () { return timerNow(); } },
    "STR$": { n: [1, 1], str: 1, fn: function (a) { return showNum(needNum(a, "STR$")); } },
    "CHR$": { n: [1, 1], str: 1, fn: function (a) {
      a = needNum(a, "CHR$");
      if (!Number.isInteger(a) || a < 1 || a > 1114111) bad("CHR$ needs a whole number from 1 up. 65 is A.");
      return String.fromCodePoint(a);
    } },
    "LEFT$": { n: [2, 2], str: 1, fn: function (a, b) { return Array.from(needText(a, "LEFT$")).slice(0, countOf(b, "LEFT$")).join(""); } },
    "RIGHT$": { n: [2, 2], str: 1, fn: function (a, b) {
      var chars = Array.from(needText(a, "RIGHT$"));
      var n = countOf(b, "RIGHT$");
      return chars.slice(Math.max(0, chars.length - n)).join("");
    } },
    "MID$": { n: [2, 3], str: 1, fn: function (a, b, c) {
      var chars = Array.from(needText(a, "MID$"));
      var start = needNum(b, "MID$");
      if (!Number.isInteger(start) || start < 1) bad("MID$ starts at letter 1.");
      var end = c == null ? chars.length : start - 1 + countOf(c, "MID$");
      return chars.slice(start - 1, end).join("");
    } },
    "UPPER$": { n: [1, 1], str: 1, fn: function (a) { return needText(a, "UPPER$").toUpperCase(); } },
    "LOWER$": { n: [1, 1], str: 1, fn: function (a) { return needText(a, "LOWER$").toLowerCase(); } }
  };

  var failRuntime = null;
  var timerNow = function () { return 0; };

  function bad(message) { failRuntime(message); }
  function needNum(value, name) {
    if (typeof value !== "number" || !Number.isFinite(value)) bad(name + " needs a number. You gave " + preview(value) + ".");
    return value;
  }
  function needText(value, name) {
    if (typeof value !== "string") bad(name + " needs text. You gave " + preview(value) + ".");
    return value;
  }
  function countOf(value, name) {
    var n = needNum(value, name);
    if (!Number.isInteger(n) || n < 0) bad(name + " needs a whole number of letters, 0 or more.");
    if (n > 10000) bad(name + " keeps the count at 10000 or less.");
    return n;
  }
  function preview(value) {
    if (typeof value === "number") return "the number " + value;
    if (typeof value === "string") return "the text " + JSON.stringify(value.length > 18 ? value.slice(0, 18) + "…" : value);
    return "the wrong kind of value";
  }
  function showNum(n) {
    if (Number.isInteger(n)) return String(n);
    var rounded = Math.round(n * 1e10) / 1e10;
    return String(rounded);
  }

  function highlight(source) {
    var src = String(source);
    var out = [];
    var i = 0;
    var bol = true;
    function ch(n) { return src[i + (n || 0)] || ""; }
    function take(end, kind) {
      if (end <= i) return;
      out.push({ text: src.slice(i, end), kind: kind });
      i = end;
      if (kind !== "plain") bol = false;
    }
    while (i < src.length) {
      var c = ch();
      if (c === " " || c === "\t" || c === "\n" || c === "\r") {
        var start = i;
        var saw = false;
        while (i < src.length && (src[i] === " " || src[i] === "\t" || src[i] === "\n" || src[i] === "\r")) {
          if (src[i] === "\n" || src[i] === "\r") saw = true;
          i += 1;
        }
        out.push({ text: src.slice(start, i), kind: "plain" });
        if (saw) bol = true;
        continue;
      }
      if (c === "'") {
        var quote = i;
        while (quote < src.length && src[quote] !== "\n" && src[quote] !== "\r") quote += 1;
        take(quote, "comment");
        continue;
      }
      if ((c === "2" || c === "3") && (ch(1) === "d" || ch(1) === "D") && !part(ch(2))) {
        take(i + 2, "engine");
        continue;
      }
      if (bol && digit(c)) {
        var n = i;
        while (n < src.length && digit(src[n])) n += 1;
        if (src[n] !== "." && src[n] !== "e" && src[n] !== "E") {
          take(n, "line");
          continue;
        }
      }
      if (digit(c) || (c === "." && digit(ch(1)))) {
        var num = i;
        while (digit(src[num] || "")) num += 1;
        if (src[num] === ".") { num += 1; while (digit(src[num] || "")) num += 1; }
        take(num, "number");
        continue;
      }
      if (c === "\"") {
        var q = i + 1;
        var closed = false;
        while (q < src.length && src[q] !== "\n" && src[q] !== "\r") {
          if (src[q] === "\"" && src[q + 1] === "\"") { q += 2; continue; }
          if (src[q] === "\"") { closed = true; q += 1; break; }
          q += 1;
        }
        take(q, closed ? "string" : "bad");
        continue;
      }
      if (letter(c)) {
        var id = i;
        while (part(src[id] || "")) id += 1;
        var word = src.slice(i, id);
        if (src[id] === "$") {
          take(id + 1, "ident");
          continue;
        }
        if (word.toLowerCase() === "rem") {
          var comment = id;
          while (comment < src.length && src[comment] !== "\n" && src[comment] !== "\r") comment += 1;
          take(comment, "comment");
          continue;
        }
        var folded = word.toLowerCase();
        var kind2 = KEYWORDS[folded] ? "keyword" : (folded === "ui" ? "engine" : "ident");
        if (c === "?") kind2 = "keyword";
        take(id, kind2);
        continue;
      }
      if (c === "?") { take(i + 1, "keyword"); continue; }
      var two = c + ch(1);
      if (two === "<>" || two === "<=" || two === ">=" || two === "==" || two === "!=") {
        take(i + 2, "op");
        continue;
      }
      take(i + 1, "+-*/\\^<>=(),;:.&".indexOf(c) >= 0 ? "op" : "bad");
    }
    return out;
  }

  function execute(program, host) {
    host = host || {};
    var code = program.code;
    var lineMap = program.lineMap;
    var userFns = program.functions;
    var globals = new Map();
    var arrays = new Map();
    var frames = [];
    var loops = [];
    var gosubs = [];
    var buffer = "";
    var steps = 0;
    var current = { line: 1, basic: null };
    var started = Date.now();
    timerNow = function () { return (Date.now() - started) / 1000; };

    function fail(message) {
      if (String(message).indexOf("Line ") === 0) throw new BasicError(message, current.line, current.basic || 0);
      throw new BasicError(format(current.line, current.basic, message), current.line, current.basic || 0);
    }
    failRuntime = fail;

    function checkStop() {
      if (host.stopped && host.stopped()) {
        var err = new Error("Stopped.");
        err.magicStop = true;
        throw err;
      }
    }
    function delay() {
      return new Promise(function (resolve) { setTimeout(resolve, 0); });
    }
    function flush() {
      if (!buffer) return;
      if (typeof host.print === "function") host.print(buffer);
      buffer = "";
    }
    function say(text) {
      buffer += text;
    }
    function newline() {
      if (typeof host.print === "function") host.print(buffer);
      buffer = "";
    }

    function frame() { return frames.length ? frames[frames.length - 1] : null; }
    function isStringName(name) { return name.endsWith("$"); }
    function coerce(name, value) {
      if (isStringName(name)) {
        if (typeof value === "string") return value;
        if (typeof value === "number") return showNum(value);
        fail(name + " holds text. You gave " + preview(value) + ".");
      }
      if (typeof value === "number") return value;
      if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value.trim()))) return Number(value.trim());
      fail(name + " holds a number. You gave " + preview(value) + ".");
    }
    function getVar(name) {
      var local = frame();
      if (local && local.local.has(name)) return local.local.get(name);
      if (globals.has(name)) return globals.get(name);
      return isStringName(name) ? "" : 0;
    }
    function setVar(name, value) {
      if (builtinOf(name)) fail(name + " is a function. It cannot hold a value.");
      if (engineOf(name)) fail(name + " is a picture tool. Call " + name + ".something.");
      var stored = coerce(name, value);
      var local = frame();
      if (local && local.local.has(name)) { local.local.set(name, stored); return; }
      globals.set(name, stored);
    }
    function truth(value) {
      if (typeof value === "string") fail("A test needs a number. 0 is no, and any other number is yes. Compare text with =, for example IF A$ = \"HI\" THEN.");
      if (typeof value !== "number") fail("A test needs a number. 0 is no, and any other number is yes.");
      return value !== 0;
    }
    function asNum(value, op) {
      if (typeof value !== "number") fail(op + " works on numbers. You gave " + preview(value) + "." + (op === "+" ? " Join text with &." : ""));
      return value;
    }

    async function evalExpr(node) {
      if (node.t === "num") return node.v;
      if (node.t === "str") return node.v;
      if (node.t === "var") {
        if (builtinOf(node.name)) return callBuiltin(node.name, []);
        if (userFns[node.name]) fail(node.name + " is a function. Call it with " + node.name + "().");
        return getVar(node.name);
      }
      if (node.t === "not") return truth(await evalExpr(node.value)) ? 0 : 1;
      if (node.t === "neg") return -asNum(await evalExpr(node.value), "-");
      if (node.t === "bin") return evalBin(node);
      if (node.t === "index") return readIndex(node.name, await nums(node.args));
      if (node.t === "call") return callNamed(node.name, await values(node.args));
      if (node.t === "eng") return callEngine(node);
      fail("I could not work out that value.");
    }
    async function values(list) {
      var out = [];
      for (var n = 0; n < list.length; n += 1) out.push(await evalExpr(list[n]));
      return out;
    }
    async function nums(list) {
      var out = [];
      for (var n = 0; n < list.length; n += 1) out.push(asNum(await evalExpr(list[n]), "A slot"));
      return out;
    }
    async function evalBin(node) {
      if (node.op === "AND") {
        var andLeft = await evalExpr(node.left);
        if (!truth(andLeft)) return 0;
        return truth(await evalExpr(node.right)) ? 1 : 0;
      }
      if (node.op === "OR") {
        var orLeft = await evalExpr(node.left);
        if (truth(orLeft)) return 1;
        return truth(await evalExpr(node.right)) ? 1 : 0;
      }
      var left = await evalExpr(node.left);
      var right = await evalExpr(node.right);
      if (node.op === "&") {
        var a = typeof left === "number" ? showNum(left) : needText(left, "&");
        var b = typeof right === "number" ? showNum(right) : needText(right, "&");
        return a + b;
      }
      if (node.op === "=" || node.op === "<>" || node.op === "<" || node.op === ">" || node.op === "<=" || node.op === ">=") {
        if (typeof left !== typeof right || (typeof left !== "number" && typeof left !== "string")) {
          fail("You cannot compare " + preview(left) + " with " + preview(right) + ". Compare two numbers, or two pieces of text.");
        }
        var yes = false;
        if (node.op === "=") yes = left === right;
        else if (node.op === "<>") yes = left !== right;
        else if (node.op === "<") yes = left < right;
        else if (node.op === ">") yes = left > right;
        else if (node.op === "<=") yes = left <= right;
        else yes = left >= right;
        return yes ? 1 : 0;
      }
      left = asNum(left, node.op);
      right = asNum(right, node.op);
      if ((node.op === "/" || node.op === "\\" || node.op === "MOD") && right === 0) {
        fail(node.op === "MOD" ? "The remainder of a division by 0 is not a number." : "Division by zero. The right side was 0.");
      }
      var value;
      if (node.op === "+") value = left + right;
      else if (node.op === "-") value = left - right;
      else if (node.op === "*") value = left * right;
      else if (node.op === "/") value = left / right;
      else if (node.op === "\\") value = Math.trunc(left / right);
      else if (node.op === "MOD") value = left % right;
      else if (node.op === "^") value = Math.pow(left, right);
      else fail("I don't know " + node.op + ".");
      if (typeof value !== "number" || !Number.isFinite(value)) fail("That number got too big.");
      return value;
    }

    function arrayOf(name, rank, create) {
      var found = arrays.get(name);
      if (!found) {
        if (!create) fail("DIM " + name + "(" + (rank === 2 ? "10, 10" : "10") + ") before you use " + name + "( ). Or store into a slot first.");
        found = { rank: rank, sizes: rank === 2 ? [10, 10] : [10], cells: new Map() };
        arrays.set(name, found);
      }
      if (found.rank !== rank) {
        fail(name + " uses " + found.rank + " index" + (found.rank === 1 ? "" : "es") + ". You used " + rank + ".");
      }
      return found;
    }
    function slotKey(args) { return args.join(","); }
    function checkSlots(name, arr, args, writing) {
      args.forEach(function (n, index) {
        if (!Number.isInteger(n)) fail("A slot number has to be a whole number. You used " + n + ".");
        if (n === 0) fail("The first slot of " + name + " is 1, not 0.");
        if (n < 1) fail("Slot numbers start at 1. You used " + n + ".");
        if (n > 1000) fail(name + " stops at 1000 slots.");
        if (n > arr.sizes[index]) {
          if (!writing) fail(name + " goes to " + arr.sizes[index] + ". " + n + " is past the end. DIM a larger size, or store into that slot first.");
          arr.sizes[index] = n;
        }
      });
    }
    function readIndex(name, args) {
      var arr = arrayOf(name, args.length, false);
      checkSlots(name, arr, args, false);
      if (!arr.cells.has(slotKey(args))) return isStringName(name) ? "" : 0;
      return arr.cells.get(slotKey(args));
    }
    function writeIndex(name, args, value) {
      if (builtinOf(name)) fail(name + " is a function. It cannot hold a list.");
      var arr = arrayOf(name, args.length, true);
      checkSlots(name, arr, args, true);
      arr.cells.set(slotKey(args), coerce(name, value));
    }

    function callBuiltin(name, args) {
      var spec = BUILTINS[name];
      if (args.length < spec.n[0] || args.length > spec.n[1]) {
        fail(name + " takes " + (spec.n[0] === spec.n[1] ? spec.n[0] : spec.n[0] + " to " + spec.n[1]) + " values. You gave " + args.length + ".");
      }
      return spec.fn.apply(null, args);
    }
    async function callNamed(name, args) {
      if (builtinOf(name)) return callBuiltin(name, args);
      var fn = userFns[name];
      if (!fn) {
        var indexes = args.map(function (item) { return asNum(item, "A slot"); });
        if (arrays.has(name)) return readIndex(name, indexes);
        var guess = suggest(name, Object.keys(BUILTINS).concat(Object.keys(userFns)));
        if (guess) fail(name + " is not a function. Did you mean " + guess + "?");
        return readIndex(name, indexes);
      }
      if (args.length !== fn.params.length) fail(fn.name + " takes " + fn.params.length + " values. You gave " + args.length + ".");
      if (frames.length > 50) fail("This function called itself too many times. 50 is the limit.");
      var local = new Map();
      fn.params.forEach(function (param, index) { local.set(param, coerce(param, args[index])); });
      local.set(fn.name, isStringName(fn.name) ? "" : 0);
      frames.push({ local: local, name: fn.name, funcId: fn.mark, depth: frames.length + 1 });
      try {
        await runSlice(fn.ip + 1, fn.endIp, true);
      } finally {
        while (loops.length && loops[loops.length - 1].funcDepth === frames.length) loops.pop();
        frames.pop();
      }
      return local.get(fn.name);
    }
    async function callEngine(node) {
      var engines = host.engines || {};
      var obj = engines[node.obj];
      if (!obj) fail(node.obj.toUpperCase() + " is not loaded on this page.");
      var method = node.method;
      var value;
      try { value = obj[method]; }
      catch (err) {
        if (err.magicStop || err.basicError) throw err;
        fail(err.message || "That command failed.");
      }
      if (!node.call) {
        if (typeof value === "function") fail(node.obj.toUpperCase() + "." + method.toUpperCase() + " is a command. Add ().");
        return fromHost(value);
      }
      if (typeof value !== "function") {
        if (!node.paren && !node.args.length) fail(node.obj.toUpperCase() + "." + method.toUpperCase() + " is a value. PRINT it, or call a command such as CLEAR or EMOJI.");
        fail(node.obj.toUpperCase() + " has no " + method.toUpperCase() + ".");
      }
      var args = [];
      for (var n = 0; n < node.args.length; n += 1) args.push(toHost(await evalExpr(node.args[n])));
      var result;
      try { result = await value.apply(obj, args); }
      catch (err) {
        if (err.magicStop || err.basicError) throw err;
        fail(err.message || "That command failed.");
      }
      return fromHost(result);
    }
    function toHost(value) {
      if (typeof value === "number" || typeof value === "string") return value;
      fail("The picture tools take numbers and text. You gave " + preview(value) + ".");
    }
    function fromHost(value) {
      if (value == null) return 0;
      if (typeof value === "boolean") return value ? 1 : 0;
      if (typeof value === "number") {
        if (!Number.isFinite(value)) fail("That number got too big.");
        return value;
      }
      if (typeof value === "string") return value;
      fail("That command gave back something BASIC cannot store.");
    }

    function show(value) {
      if (typeof value === "number") return showNum(value);
      if (typeof value === "string") return value;
      return "";
    }
    function findLine(number) {
      if (!Object.prototype.hasOwnProperty.call(lineMap, number)) {
        fail("There is no line " + number + ". Line numbers are the ones written at the start of a line.");
      }
      var ip = lineMap[number];
      var target = code[ip];
      var have = loops.map(function (item) { return item.id; });
      (target.loopIds || []).forEach(function (id) {
        if (have.indexOf(id) < 0) fail("Line " + number + " is inside a loop. GOTO the FOR, WHILE, or DO, or stay inside the loop.");
      });
      var here = frame();
      if (target.funcId && (!here || here.funcId !== target.funcId)) fail("Line " + number + " is inside a function. Call the function instead of GOTO.");
      if (here && !target.funcId) fail("GOTO would leave the function. Use RETURN.");
      while (loops.length && (target.loopIds || []).indexOf(loops[loops.length - 1].id) < 0) loops.pop();
      return ip;
    }

    async function exec(stmt) {
      current = stmt;
      if (stmt.op === "nop" || stmt.op === "function") {
        if (stmt.op === "function") return { ip: stmt.endIp + 1 };
        return { ip: -1 };
      }
      if (stmt.op === "jump") return { ip: stmt.to };
      if (stmt.op === "print") {
        for (var p = 0; p < stmt.items.length; p += 1) {
          var item = stmt.items[p];
          if (item.expr) say(show(await evalExpr(item.expr)));
          if (item.sep === ",") say("   ");
        }
        if (stmt.newline) newline();
        return { ip: -1 };
      }
      if (stmt.op === "input") {
        flush();
        for (var q = 0; q < stmt.names.length; q += 1) {
          var slot = stmt.names[q];
          var prompt = q === 0 && stmt.prompt != null ? stmt.prompt : slot.name + "? ";
          var indexes = slot.indexes ? await nums(slot.indexes) : null;
          while (true) {
            checkStop();
            var answer = "";
            if (typeof host.input === "function") answer = await host.input(prompt);
            if (answer == null) answer = "";
            answer = String(answer);
            if (isStringName(slot.name)) {
              if (indexes) writeIndex(slot.name, indexes, answer);
              else setVar(slot.name, answer);
              break;
            }
            if (answer.trim() !== "" && Number.isFinite(Number(answer.trim()))) {
              var numeric = Number(answer.trim());
              if (indexes) writeIndex(slot.name, indexes, numeric);
              else setVar(slot.name, numeric);
              break;
            }
            if (typeof host.print === "function") host.print(slot.name + " holds a number. You typed " + JSON.stringify(answer) + ". Try again.");
          }
        }
        return { ip: -1 };
      }
      if (stmt.op === "cls") { buffer = ""; if (typeof host.cls === "function") host.cls(); return { ip: -1 }; }
      if (stmt.op === "help") { flush(); if (typeof host.print === "function") host.print(HELP); return { ip: -1 }; }
      if (stmt.op === "stop") fail("Stopped on purpose. END finishes a program without this message.");
      if (stmt.op === "end") return { end: true };
      if (stmt.op === "dim") {
        for (var d = 0; d < stmt.dims.length; d += 1) {
          var dim = stmt.dims[d];
          if (builtinOf(dim.name)) fail(dim.name + " is a function. DIM needs a new name.");
          var sizes = await nums(dim.indexes);
          sizes.forEach(function (n) {
            if (!Number.isInteger(n) || n < 1 || n > 1000) fail("DIM " + dim.name + " needs a size from 1 to 1000. You used " + n + ".");
          });
          if (arrays.has(dim.name)) fail(dim.name + " already has slots. DIM it once.");
          arrays.set(dim.name, { rank: sizes.length, sizes: sizes, cells: new Map() });
        }
        return { ip: -1 };
      }
      if (stmt.op === "let") {
        var stored = await evalExpr(stmt.value);
        if (stmt.target.t === "index") writeIndex(stmt.target.name, await nums(stmt.target.args), stored);
        else setVar(stmt.target.name, stored);
        return { ip: -1 };
      }
      if (stmt.op === "call") {
        if (stmt.target.t === "eng") await callEngine(stmt.target);
        else await callNamed(stmt.target.name, await values(stmt.target.args));
        return { ip: -1 };
      }
      if (stmt.op === "if") {
        var yes = truth(await evalExpr(stmt.test));
        return { ip: yes ? -1 : stmt.elseIp };
      }
      if (stmt.op === "ifline") {
        var branch = truth(await evalExpr(stmt.test)) ? stmt.thenStmts : stmt.elseStmts;
        for (var b = 0; b < branch.length; b += 1) {
          var step = await exec(branch[b]);
          if (step && (step.goto != null || step.end || step.ret || step.stop)) return step;
          if (step && step.ip >= 0) return step;
        }
        return { ip: -1 };
      }
      if (stmt.op === "ifgoto") {
        if (truth(await evalExpr(stmt.test))) return { goto: findLine(stmt.target) };
        if (stmt.other != null) return { goto: findLine(stmt.other) };
        return { ip: -1 };
      }
      if (stmt.op === "goto") return { goto: findLine(stmt.target) };
      if (stmt.op === "gosub") {
        if (frame()) fail("A function uses RETURN, not GOSUB.");
        return { goto: findLine(stmt.target), gosub: true };
      }
      if (stmt.op === "return") {
        if (frame()) {
          if (stmt.value) frame().local.set(frame().name, coerce(frame().name, await evalExpr(stmt.value)));
          return { ret: true };
        }
        if (!gosubs.length) fail("RETURN has nowhere to go. GOSUB calls a line. A function uses RETURN to hand a value back.");
        return { goto: gosubs.pop() };
      }
      if (stmt.op === "for") {
        var start = asNum(await evalExpr(stmt.start), "FOR");
        var limit = asNum(await evalExpr(stmt.limit), "FOR");
        var step = stmt.step ? asNum(await evalExpr(stmt.step), "STEP") : 1;
        if (step === 0) fail("The step is 0, so the loop would never finish. Use 1, or -1 to count down.");
        setVar(stmt.name, start);
        var skip = (step > 0 && start > limit) || (step < 0 && start < limit);
        loops.push({ id: stmt.id, name: stmt.name, limit: limit, step: step, forIp: stmt.forIp, nextIp: stmt.nextIp, funcDepth: frames.length });
        if (skip) {
          loops.pop();
          return { ip: stmt.nextIp + 1 };
        }
        return { ip: -1 };
      }
      if (stmt.op === "next") {
        var top = null;
        for (var n = loops.length - 1; n >= 0; n -= 1) if (loops[n].id === stmt.id) { top = loops[n]; break; }
        if (!top) fail("NEXT has no FOR.");
        var now = asNum(getVar(stmt.name), "NEXT") + top.step;
        setVar(stmt.name, now);
        var done = (top.step > 0 && now > top.limit) || (top.step < 0 && now < top.limit);
        if (done) {
          while (loops.length && loops[loops.length - 1].id !== stmt.id) loops.pop();
          loops.pop();
          return { ip: -1 };
        }
        return { ip: stmt.forIp + 1 };
      }
      if (stmt.op === "while") {
        if (!truth(await evalExpr(stmt.test))) return { ip: stmt.endIp + 1 };
        loops.push({ id: stmt.id, funcDepth: frames.length });
        return { ip: -1 };
      }
      if (stmt.op === "wend") {
        while (loops.length && loops[loops.length - 1].id !== code[stmt.whileIp].id) loops.pop();
        if (loops.length && loops[loops.length - 1].id === code[stmt.whileIp].id) loops.pop();
        return { ip: stmt.whileIp };
      }
      if (stmt.op === "do") {
        var open = false;
        for (var d = 0; d < loops.length; d += 1) if (loops[d].id === stmt.id) open = true;
        function shut() {
          if (open && loops.length && loops[loops.length - 1].id === stmt.id) loops.pop();
        }
        if (stmt.mode === "while" && !truth(await evalExpr(stmt.test))) {
          shut();
          return { ip: stmt.loopIp + 1 };
        }
        if (stmt.mode === "until" && truth(await evalExpr(stmt.test))) {
          shut();
          return { ip: stmt.loopIp + 1 };
        }
        if (!open) loops.push({ id: stmt.id, funcDepth: frames.length });
        return { ip: -1 };
      }
      if (stmt.op === "loop") {
        var again = true;
        if (stmt.mode === "while") again = truth(await evalExpr(stmt.test));
        if (stmt.mode === "until") again = !truth(await evalExpr(stmt.test));
        if (!again) {
          while (loops.length && loops[loops.length - 1].id !== code[stmt.doIp].id) loops.pop();
          if (loops.length) loops.pop();
          return { ip: -1 };
        }
        return { ip: stmt.doIp };
      }
      if (stmt.op === "endfunc") return { ret: true };
      fail("I could not run this command.");
    }

    async function runSlice(start, end, inside) {
      var ip = start;
      while (ip >= start && ip <= end) {
        checkStop();
        steps += 1;
        if ((steps & 2047) === 0) await delay();
        var stmt = code[ip];
        if (!stmt) break;
        var next = await exec(stmt);
        if (!next) return;
        if (next.end) {
          if (inside) fail("END inside a function leaves the whole program. Use RETURN or END FUNCTION.");
          return;
        }
        if (next.ret) {
          if (!inside) fail("RETURN has nowhere to go.");
          return;
        }
        if (next.goto != null) {
          if (inside && (next.goto < start || next.goto > end)) fail("GOTO would leave the function. Use RETURN.");
          if (next.gosub) gosubs.push(ip + 1);
          ip = next.goto;
          continue;
        }
        ip = next.ip >= 0 ? next.ip : ip + 1;
      }
    }

    // forIp is the index of the FOR instruction. Fill it now that the list is stable.
    code.forEach(function (stmt, ip) {
      if (stmt.op === "for" || stmt.op === "function") stmt.ip = ip;
      if (stmt.op === "for") stmt.forIp = ip;
    });

    if (typeof host.attach === "function") {
      host.attach(function (name) {
        var key = String(name || "").toUpperCase();
        if (userFns[key]) return function () { return null; };
        if (globals.has(key)) return globals.get(key);
        return undefined;
      });
    }

    return (async function () {
      try {
        await runSlice(0, code.length - 1, false);
        flush();
      } catch (err) {
        flush();
        throw err;
      }
    })();
  }

  function compile(source) {
    return resolve(parse(source));
  }

  function run(source, host) {
    return execute(compile(source), host);
  }

  root.EmojiBasic = {
    compile: compile,
    run: run,
    highlight: highlight,
    Error: BasicError
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
