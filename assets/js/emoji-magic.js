// Magic. A small language for learning, based on Lua, compiled to JavaScript.
"use strict";
(function (root) {
  var KEYWORDS = {
    and: 1, break: 1, do: 1, else: 1, elseif: 1, end: 1, false: 1, for: 1,
    function: 1, global: 1, if: 1, in: 1, local: 1, nil: 1, not: 1, or: 1,
    repeat: 1, return: 1, step: 1, then: 1, to: 1, true: 1, until: 1, while: 1
  };
  var PREDEFINED = ["2d", "3d", "ui", "print", "input", "type", "tostring", "tonumber", "len", "clock", "math", "str"];
  var CMP = { "==": 1, "~=": 1, "!=": 1, "<": 1, ">": 1, "<=": 1, ">=": 1 };
  var ASSIGN = { "=": 1, "+=": 1, "-=": 1, "*=": 1, "/=": 1 };

  function MagicError(message, line, column) {
    this.message = line ? "Line " + line + ": " + message : message;
    this.line = line || 0;
    this.column = column || 1;
    this.magic = true;
    this.name = "MagicError";
  }
  MagicError.prototype = Object.create(Error.prototype);

  function failAt(token, message) {
    throw new MagicError(message, token.line, token.col);
  }

  function lex(source, trivia) {
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
      if (token.t !== "space" && token.t !== "comment") bol = false;
    }
    while (i < src.length) {
      var c = ch();
      if (c === " " || c === "\t") {
        var startLine = line;
        var startCol = col;
        var start = i;
        while (ch() === " " || ch() === "\t") bump();
        if (trivia) push({ t: "space", v: src.slice(start, i), line: startLine, col: startCol });
        continue;
      }
      if (c === "\n") {
        if (trivia) push({ t: "space", v: "\n", line: line, col: col });
        bump();
        bol = true;
        continue;
      }
      if (c === "-" && ch(1) === "-" && ch(2) === "[" && ch(3) === "[") {
        var cLine = line;
        var cCol = col;
        bump(4);
        var comment = "--[[";
        while (i < src.length && !(ch() === "]" && ch(1) === "]")) {
          comment += ch();
          bump();
        }
        if (i >= src.length) {
          push({ t: "bad", v: comment, line: cLine, col: cCol, err: "This comment never ends. --[[ needs ]] to close it." });
          break;
        }
        comment += "]]";
        bump(2);
        if (trivia) push({ t: "comment", v: comment, line: cLine, col: cCol });
        continue;
      }
      if (c === "-" && ch(1) === "-") {
        var dLine = line;
        var dCol = col;
        var text = "";
        while (i < src.length && ch() !== "\n") { text += ch(); bump(); }
        if (trivia) push({ t: "comment", v: text, line: dLine, col: dCol });
        continue;
      }
      if (c === "/" && ch(1) === "/" && bol) {
        var eLine = line;
        var eCol = col;
        var note = "";
        while (i < src.length && ch() !== "\n") { note += ch(); bump(); }
        if (trivia) push({ t: "comment", v: note, line: eLine, col: eCol });
        continue;
      }
      if (c === "#" && ch(1) === " " && bol) {
        var fLine = line;
        var fCol = col;
        var hash = "";
        while (i < src.length && ch() !== "\n") { hash += ch(); bump(); }
        if (trivia) push({ t: "comment", v: hash, line: fLine, col: fCol });
        continue;
      }
      if (c === "/" && ch(1) === "*") {
        var gLine = line;
        var gCol = col;
        var block = "";
        while (i < src.length && !(ch() === "*" && ch(1) === "/")) {
          block += ch();
          bump();
        }
        if (i >= src.length) {
          push({ t: "bad", v: block, line: gLine, col: gCol, err: "This comment never ends. /* needs */ to close it." });
          break;
        }
        block += "*/";
        bump(2);
        if (trivia) push({ t: "comment", v: block, line: gLine, col: gCol });
        continue;
      }
      if ((c === "2" || c === "3") && (ch(1) === "d" || ch(1) === "D") && !part(ch(2))) {
        push({ t: "ident", v: c === "2" ? "2d" : "3d", line: line, col: col });
        bump(2);
        continue;
      }
      if (digit(c) || (c === "." && digit(ch(1)))) {
        var nLine = line;
        var nCol = col;
        var lexeme = "";
        while (digit(ch())) { lexeme += ch(); bump(); }
        if (ch() === ".") { lexeme += "."; bump(); while (digit(ch())) { lexeme += ch(); bump(); } }
        if (ch() === "e" || ch() === "E") {
          var mark = lexeme + ch();
          var look = 1;
          if (ch(look) === "+" || ch(look) === "-") { mark += ch(look); look += 1; }
          if (digit(ch(look))) {
            lexeme = mark;
            bump(look);
            while (digit(ch())) { lexeme += ch(); bump(); }
          }
        }
        var numeric = Number(lexeme);
        if (!Number.isFinite(numeric)) push({ t: "bad", v: lexeme, line: nLine, col: nCol, err: "That number is too big." });
        else push({ t: "number", v: numeric, raw: lexeme, line: nLine, col: nCol });
        continue;
      }
      if (c === "\"" || c === "'") {
        push(readString(c));
        continue;
      }
      if (c === "[" && ch(1) === "[") {
        var sLine = line;
        var sCol = col;
        bump(2);
        var raw = "";
        while (i < src.length && !(ch() === "]" && ch(1) === "]")) {
          raw += ch();
          bump();
        }
        if (i >= src.length) {
          push({ t: "bad", v: "[[" + raw, line: sLine, col: sCol, err: "This text never ends. [[ needs ]] to close it." });
          break;
        }
        bump(2);
        push({ t: "string", v: raw, line: sLine, col: sCol });
        continue;
      }
      if (letter(c) || c === "_") {
        var idLine = line;
        var idCol = col;
        var id = "";
        while (part(ch())) { id += ch(); bump(); }
        if (KEYWORDS[id]) push({ t: "kw", v: id, line: idLine, col: idCol });
        else push({ t: "ident", v: id, line: idLine, col: idCol });
        continue;
      }
      var two = c + ch(1);
      if (two === "==" || two === "~=" || two === "!=" || two === "<=" || two === ">=" || two === ".." || two === "+=" || two === "-=" || two === "*=" || two === "/=" || two === "//") {
        push({ t: "op", v: two === "!=" ? "~=" : two, line: line, col: col });
        bump(2);
        continue;
      }
      if ("+-*/%^#<>=(){}[],.:;".indexOf(c) >= 0) {
        push({ t: "op", v: c, line: line, col: col });
        bump();
        continue;
      }
      push({ t: "bad", v: c, line: line, col: col, err: "I don't know the symbol " + JSON.stringify(c) + "." });
      bump();
    }
    tokens.push({ t: "eof", v: "", line: line, col: col });
    return tokens;

    function readString(quote) {
      var qLine = line;
      var qCol = col;
      bump();
      var value = "";
      while (i < src.length && ch() !== quote) {
        if (ch() === "\n") {
          return { t: "bad", v: quote + value, line: qLine, col: qCol, err: "This text never ends. Add " + quote + " at the end of the line." };
        }
        if (ch() === "\\") {
          bump();
          var esc = ch();
          if (esc === "n") value += "\n";
          else if (esc === "t") value += "\t";
          else if (esc === "\\" || esc === "\"" || esc === "'") value += esc;
          else return { t: "bad", v: "\\" + esc, line: line, col: col, err: "I don't know \\" + esc + ". Use \\\\n, \\\\t, \\\\\\\\, or a quote." };
          bump();
          continue;
        }
        value += ch();
        bump();
      }
      if (ch() !== quote) return { t: "bad", v: quote + value, line: qLine, col: qCol, err: "This text never ends. Add " + quote + " at the end." };
      bump();
      return { t: "string", v: value, line: qLine, col: qCol };
    }
  }

  function digit(c) { return c >= "0" && c <= "9"; }
  function letter(c) { return (c >= "a" && c <= "z") || (c >= "A" && c <= "Z"); }
  function part(c) { return letter(c) || digit(c) || c === "_"; }

  function parse(source) {
    var tokens = lex(source, false);
    var i = 0;
    var loops = 0;
    function peek() { return tokens[i]; }
    function next() { return tokens[i + 1] || tokens[tokens.length - 1]; }
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
      if (eat(type, value)) return;
      failAt(peek(), message);
    }
    function skipSemi() { while (eat("op", ";")) {} }
    function startsExpr() {
      if (at("number") || at("string") || at("ident")) return true;
      if (at("kw", "nil") || at("kw", "true") || at("kw", "false") || at("kw", "not") || at("kw", "function")) return true;
      return at("op", "(") || at("op", "{") || at("op", "[") || at("op", "-") || at("op", "#");
    }
    function chunk(stop) {
      var body = [];
      skipSemi();
      while (peek().t !== "eof" && !stop()) {
        body.push(statement());
        skipSemi();
      }
      return body;
    }
    function stopBlock() {
      return at("kw", "end") || at("kw", "else") || at("kw", "elseif") || at("kw", "until") || elseIf();
    }
    function elseIf() {
      return at("kw", "else") && next().t === "kw" && next().v === "if";
    }
    function statement() {
      if (peek().t === "bad") failAt(peek(), peek().err);
      if (at("kw", "break")) {
        var broke = peek();
        eat("kw", "break");
        if (!loops) failAt(broke, "break is for a loop. Put it inside while, repeat, or for.");
        return { t: "break", line: broke.line, col: broke.col };
      }
      if (at("kw", "return")) return returnStmt();
      if (at("kw", "do")) return doStmt();
      if (at("kw", "while")) return whileStmt();
      if (at("kw", "repeat")) return repeatStmt();
      if (at("kw", "if")) return ifStmt();
      if (at("kw", "for")) return forStmt();
      if (at("kw", "function")) return funcStmt(false);
      if (at("kw", "local")) return localStmt();
      if (at("kw", "global")) return globalStmt();
      var expr = suffix(atom());
      if (at("op", "=") || at("op", ",") || ASSIGN[peek().v]) return assignStmt(expr, false);
      if (expr.t !== "call") {
        failAt(peek(), "This line does nothing. A call looks like print(\"hi\"). Storing looks like score = 0.");
      }
      if (at("op") && peek().v !== ")" && peek().v !== ",") {
        failAt(peek(), "Put parentheses around the whole value. print(\"Hello, \" .. name)");
      }
      return { t: "expr", expr: expr, line: expr.line, col: expr.col };
    }
    function returnStmt() {
      var token = peek();
      eat("kw", "return");
      var value = startsExpr() ? expression() : null;
      return { t: "return", value: value, line: token.line, col: token.col };
    }
    function doStmt() {
      var token = peek();
      eat("kw", "do");
      var body = chunk(function () { return at("kw", "end"); });
      need("kw", "end", "I expected end to close do from line " + token.line + ".");
      return { t: "do", body: body, line: token.line, col: token.col };
    }
    function whileStmt() {
      var token = peek();
      eat("kw", "while");
      var test = expression();
      need("kw", "do", "I expected do after while. while score < 10 do");
      loops += 1;
      var body = chunk(function () { return at("kw", "end"); });
      loops -= 1;
      need("kw", "end", "I expected end to close while from line " + token.line + ".");
      return { t: "while", test: test, body: body, line: token.line, col: token.col };
    }
    function repeatStmt() {
      var token = peek();
      eat("kw", "repeat");
      loops += 1;
      var body = chunk(function () { return at("kw", "until"); });
      loops -= 1;
      need("kw", "until", "I expected until to close repeat from line " + token.line + ".");
      return { t: "repeat", body: body, test: expression(), line: token.line, col: token.col };
    }
    function ifStmt() {
      var token = peek();
      eat("kw", "if");
      var test = expression();
      need("kw", "then", "I expected then after the test. if score > 10 then");
      var body = chunk(stopBlock);
      var elifs = [];
      while (at("kw", "elseif") || elseIf()) {
        var mark = peek();
        if (elseIf() && !at("kw", "elseif")) { eat("kw", "else"); eat("kw", "if"); }
        else eat("kw", "elseif");
        var elifTest = expression();
        need("kw", "then", "I expected then after else if.");
        elifs.push({ test: elifTest, body: chunk(stopBlock), line: mark.line, col: mark.col });
      }
      var other = null;
      if (eat("kw", "else")) other = chunk(function () { return at("kw", "end"); });
      need("kw", "end", "I expected end to close if from line " + token.line + ".");
      return { t: "if", test: test, body: body, elifs: elifs, other: other, line: token.line, col: token.col };
    }
    function forStmt() {
      var token = peek();
      eat("kw", "for");
      if (!at("ident")) failAt(peek(), "for needs a name. for i = 1 to 10 do");
      var name = peek().v;
      var nameCol = peek().col;
      eat("ident");
      if (eat("kw", "in")) {
        var list = expression();
        need("kw", "do", "I expected do. for item in bag do");
        loops += 1;
        var eachBody = chunk(function () { return at("kw", "end"); });
        loops -= 1;
        need("kw", "end", "I expected end to close for from line " + token.line + ".");
        return { t: "forin", name: name, list: list, body: eachBody, line: token.line, col: token.col };
      }
      need("op", "=", "I expected =. for i = 1 to 10 do");
      var start = expression();
      if (!eat("kw", "to") && !eat("op", ",")) failAt(peek(), "I expected to. for i = 1 to 10 do");
      var limit = expression();
      var step = null;
      if (eat("kw", "step") || eat("op", ",")) step = expression();
      need("kw", "do", "I expected do. for i = 1 to 10 do");
      loops += 1;
      var body = chunk(function () { return at("kw", "end"); });
      loops -= 1;
      need("kw", "end", "I expected end to close for from line " + token.line + ".");
      return { t: "fornum", name: name, start: start, limit: limit, step: step, body: body, line: token.line, col: nameCol };
    }
    function funcStmt(isLocal) {
      var token = peek();
      eat("kw", "function");
      if (at("op", "(")) failAt(peek(), "Give the function a name on this line. function greet(name) ... end. A nameless function is stored: greet = function(name) ... end");
      if (!at("ident")) failAt(peek(), "function needs a name. function greet(name)");
      var name = peek().v;
      eat("ident");
      if (at("op", ".")) failAt(peek(), "Write " + name + ".part = function() ... end");
      var fn = functionExpr(token);
      fn.name = name;
      fn.local = isLocal;
      fn.line = token.line;
      fn.col = token.col;
      fn.t = "func";
      return fn;
    }
    function localStmt() {
      var token = peek();
      eat("kw", "local");
      if (at("kw", "function")) return funcStmt(true);
      if (!at("ident")) failAt(peek(), "local needs a name. local score = 0");
      var names = [peek().v];
      eat("ident");
      while (eat("op", ",")) {
        if (!at("ident")) failAt(peek(), "I expected another name after the comma.");
        names.push(peek().v);
        eat("ident");
      }
      var values = [];
      if (eat("op", "=")) values = exprList();
      return { t: "local", names: names, values: values, line: token.line, col: token.col };
    }
    function globalStmt() {
      var token = peek();
      eat("kw", "global");
      if (!at("ident")) failAt(peek(), "global needs a name. global score");
      var names = [peek().v];
      eat("ident");
      while (eat("op", ",")) {
        if (!at("ident")) failAt(peek(), "I expected another name after the comma.");
        names.push(peek().v);
        eat("ident");
      }
      return { t: "global", names: names, line: token.line, col: token.col };
    }
    function assignStmt(first, fromLocal) {
      var targets = [lvalue(first)];
      while (eat("op", ",")) targets.push(lvalue(suffix(atom())));
      var op = "=";
      if (ASSIGN[peek().v] && peek().v !== "=") {
        if (targets.length !== 1) failAt(peek(), peek().v + " works on one name, not a list of names.");
        op = peek().v;
        eat("op");
      } else need("op", "=", "I expected = so the value has somewhere to go.");
      var values = exprList();
      if (values.length > targets.length) {
        failAt(peek(), "You gave " + values.length + " values and " + targets.length + " names.");
      }
      return { t: "assign", targets: targets, values: values, op: op, local: fromLocal, line: first.line, col: first.col };
    }
    function lvalue(node) {
      if (node.t === "name" || node.t === "field" || node.t === "index") return node;
      failAt(peek(), "You can store into a name, a field, or a slot. name = 1, hero.hp = 3, or bag[1] = \"🗡️\".");
    }
    function exprList() {
      var list = [expression()];
      while (eat("op", ",")) list.push(expression());
      return list;
    }
    function expression() { return orExpr(); }
    function orExpr() {
      var left = andExpr();
      while (eat("kw", "or")) left = { t: "or", left: left, right: andExpr(), line: left.line, col: left.col };
      return left;
    }
    function andExpr() {
      var left = notExpr();
      while (eat("kw", "and")) left = { t: "and", left: left, right: notExpr(), line: left.line, col: left.col };
      return left;
    }
    function notExpr() {
      if (at("kw", "not")) {
        var token = peek();
        eat("kw", "not");
        return { t: "not", value: notExpr(), line: token.line, col: token.col };
      }
      return cmpExpr();
    }
    function cmpExpr() {
      var left = concatExpr();
      if (at("op") && CMP[peek().v]) {
        var op = peek().v;
        var token = peek();
        eat("op");
        var right = concatExpr();
        if (at("op") && CMP[peek().v]) failAt(peek(), "Write one comparison. a < b and b < c covers two.");
        return { t: "cmp", op: op, left: left, right: right, line: token.line, col: token.col };
      }
      return left;
    }
    function concatExpr() {
      var left = addExpr();
      while (eat("op", "..")) left = { t: "cat", left: left, right: addExpr(), line: left.line, col: left.col };
      return left;
    }
    function addExpr() {
      var left = mulExpr();
      while (at("op", "+") || at("op", "-")) {
        var op = peek().v;
        eat("op");
        left = { t: "bin", op: op, left: left, right: mulExpr(), line: left.line, col: left.col };
      }
      return left;
    }
    function mulExpr() {
      var left = unaryExpr();
      while (at("op", "*") || at("op", "/") || at("op", "//") || at("op", "%")) {
        var op = peek().v;
        eat("op");
        left = { t: "bin", op: op, left: left, right: unaryExpr(), line: left.line, col: left.col };
      }
      return left;
    }
    function unaryExpr() {
      if (at("op", "-") || at("op", "#")) {
        var token = peek();
        var op = token.v;
        eat("op");
        return { t: op === "-" ? "neg" : "len", value: unaryExpr(), line: token.line, col: token.col };
      }
      return powerExpr();
    }
    function powerExpr() {
      var left = suffix(atom());
      if (eat("op", "^")) return { t: "bin", op: "^", left: left, right: unaryExpr(), line: left.line, col: left.col };
      return left;
    }
    function atom() {
      var token = peek();
      if (token.t === "bad") failAt(token, token.err);
      if (eat("number")) return { t: "number", v: token.v, line: token.line, col: token.col };
      if (eat("string")) return { t: "string", v: token.v, line: token.line, col: token.col };
      if (eat("kw", "nil")) return { t: "nil", line: token.line, col: token.col };
      if (eat("kw", "true")) return { t: "bool", v: true, line: token.line, col: token.col };
      if (eat("kw", "false")) return { t: "bool", v: false, line: token.line, col: token.col };
      if (at("kw", "function")) {
        eat("kw", "function");
        if (!at("op", "(")) failAt(peek(), "A function in an expression has no name. Write function(x) ... end");
        var fn = functionExpr(token);
        fn.t = "fn";
        return fn;
      }
      if (at("op", "{")) return tableExpr();
      if (at("op", "[")) return listExpr();
      if (eat("op", "(")) {
        var inner = expression();
        need("op", ")", "I expected ) to close the ( from line " + token.line + ".");
        inner.line = token.line;
        return inner;
      }
      if (eat("ident")) return { t: "name", name: token.v, line: token.line, col: token.col };
      if (token.t === "eof") failAt(token, "The program ended before it should. An if, while, for, or function is still open.");
      if (token.t === "kw") failAt(token, "I didn't expect " + token.v + " here.");
      failAt(token, "I didn't expect " + JSON.stringify(token.v || token.raw || "") + " here.");
    }
    function suffix(node) {
      while (true) {
        if (eat("op", ".")) {
          if (!at("ident")) failAt(peek(), "I expected a name after the dot. 2d.emoji, hero.name.");
          var field = peek();
          eat("ident");
          node = { t: "field", object: node, name: field.v, line: field.line, col: field.col };
          continue;
        }
        if (eat("op", "[")) {
          var index = expression();
          need("op", "]", "I expected ] to close the [.");
          node = { t: "index", object: node, index: index, line: node.line, col: node.col };
          continue;
        }
        if (at("op", "(")) {
          node = { t: "call", callee: node, args: args(), line: node.line, col: node.col };
          continue;
        }
        if (at("string") || at("op", "{")) {
          var arg = at("string") ? atom() : tableExpr();
          node = { t: "call", callee: node, args: [arg], line: node.line, col: node.col };
          continue;
        }
        return node;
      }
    }
    function args() {
      var token = peek();
      need("op", "(", "I expected (.");
      var list = [];
      if (!at("op", ")")) {
        list.push(expression());
        while (eat("op", ",")) list.push(expression());
      }
      need("op", ")", "I expected ) to close the ( from line " + token.line + ".");
      return list;
    }
    function tableExpr() {
      var token = peek();
      need("op", "{", "I expected {.");
      var fields = [];
      if (!at("op", "}")) {
        do {
          if (at("op", "}")) break;
          fields.push(field());
        } while (eat("op", ",") || eat("op", ";"));
      }
      need("op", "}", "I expected } to close the { from line " + token.line + ".");
      return { t: "table", fields: fields, line: token.line, col: token.col };
    }
    function listExpr() {
      var token = peek();
      need("op", "[", "I expected [.");
      var fields = [];
      if (!at("op", "]")) {
        do {
          if (at("op", "]")) break;
          fields.push({ list: true, value: expression() });
        } while (eat("op", ","));
      }
      need("op", "]", "I expected ] to close the [ from line " + token.line + ".");
      return { t: "table", fields: fields, line: token.line, col: token.col };
    }
    function field() {
      if (at("ident") && next().t === "op" && next().v === "=") {
        var name = peek();
        eat("ident");
        eat("op", "=");
        return { key: { t: "string", v: name.v, line: name.line, col: name.col }, value: expression() };
      }
      if (eat("op", "[")) {
        var key = expression();
        need("op", "]", "I expected ] after the key.");
        need("op", "=", "I expected = after the key.");
        return { key: key, value: expression() };
      }
      return { list: true, value: expression() };
    }
    function functionExpr(token) {
      need("op", "(", "I expected ( after function.");
      var params = [];
      if (!at("op", ")")) {
        do {
          if (!at("ident")) failAt(peek(), "A parameter has to be a name.");
          params.push(peek().v);
          eat("ident");
        } while (eat("op", ","));
      }
      need("op", ")", "I expected ) after the parameters.");
      var body = chunk(function () { return at("kw", "end"); });
      need("kw", "end", "I expected end to close function from line " + token.line + ".");
      return { t: "fn", params: params, body: body, line: token.line, col: token.col };
    }

    var body = chunk(function () { return false; });
    if (peek().t === "bad") failAt(peek(), peek().err);
    if (peek().t !== "eof") failAt(peek(), "I didn't expect " + (peek().v || "this") + " here.");
    return { t: "chunk", body: body };
  }

  function bind(ast) {
    var nextSlot = 0;
    var globals = {};
    PREDEFINED.forEach(function (name) { globals[name] = 1; });
    collectRoot(ast.body, globals, {});
    takeRootLocals(ast.body, globals);
    var rootMap = {};
    var rootScope = { locals: rootMap, parent: null, slots: [], globals: globals, loops: {} };
    rootScope.hoist = rootScope;
    bindList(ast.body, rootScope);
    ast.slots = values(rootMap);
    return ast;

    function collectRoot(stmts, bag, loops) {
      stmts.forEach(function (stmt) {
        if (stmt.t === "assign") {
          stmt.targets.forEach(function (target) {
            if (target.t === "name" && !loops[target.name]) bag[target.name] = 1;
          });
        } else if (stmt.t === "func" && stmt.name && !stmt.local && !loops[stmt.name]) bag[stmt.name] = 1;
        else if (stmt.t === "fornum" || stmt.t === "forin") {
          var next = copy(loops);
          next[stmt.name] = 1;
          collectRoot(stmt.body, bag, next);
        } else if (stmt.t === "if") {
          collectRoot(stmt.body, bag, loops);
          stmt.elifs.forEach(function (part) { collectRoot(part.body, bag, loops); });
          if (stmt.other) collectRoot(stmt.other, bag, loops);
        } else if (stmt.t === "while" || stmt.t === "do" || stmt.t === "repeat") collectRoot(stmt.body, bag, loops);
      });
    }
    function takeRootLocals(stmts, bag) {
      stmts.forEach(function (stmt) {
        if (stmt.t === "local") stmt.names.forEach(function (name) { delete bag[name]; });
        else if (stmt.t === "func" && stmt.local) delete bag[stmt.name];
        else if (stmt.t === "if") {
          takeRootLocals(stmt.body, bag);
          stmt.elifs.forEach(function (part) { takeRootLocals(part.body, bag); });
          if (stmt.other) takeRootLocals(stmt.other, bag);
        } else if (stmt.t === "while" || stmt.t === "do" || stmt.t === "repeat") takeRootLocals(stmt.body, bag);
        else if (stmt.t === "fornum" || stmt.t === "forin") takeRootLocals(stmt.body, bag);
      });
    }
    function bindList(stmts, scope) {
      stmts.forEach(function (stmt) { bindStmt(stmt, scope); });
    }
    function bindStmt(stmt, scope) {
      if (stmt.t === "local") {
        stmt.names.forEach(function (name) { define(scope, name); });
        stmt.values.forEach(function (value) { bindExpr(value, scope); });
        stmt.refs = stmt.names.map(function (name) { return scope.locals[name]; });
        return;
      }
      if (stmt.t === "global") {
        stmt.names.forEach(function (name) {
          scope.globals[name] = 1;
          var home = scope.hoist || scope;
          if (home.parent) home.locals[name] = { kind: "global", name: name };
          else delete home.locals[name];
        });
        return;
      }
      if (stmt.t === "assign") {
        stmt.targets.forEach(function (target) {
          if (target.t === "name" && !resolveQuiet(target.name, scope)) define(scope, target.name);
        });
        stmt.values.forEach(function (value) { bindExpr(value, scope); });
        stmt.targets.forEach(function (target) { bindTarget(target, scope, false); });
        return;
      }
      if (stmt.t === "func") {
        if (stmt.local || (!scope.globals[stmt.name] && !lookup(stmt.name, scope))) define(scope, stmt.name);
        stmt.ref = resolve(stmt.name, scope, stmt);
        bindFunction(stmt, scope);
        return;
      }
      if (stmt.t === "if") {
        bindExpr(stmt.test, scope);
        bindList(stmt.body, scope);
        stmt.elifs.forEach(function (part) { bindExpr(part.test, scope); bindList(part.body, scope); });
        if (stmt.other) bindList(stmt.other, scope);
        return;
      }
      if (stmt.t === "while") { bindExpr(stmt.test, scope); bindList(stmt.body, scope); return; }
      if (stmt.t === "repeat") { bindList(stmt.body, scope); bindExpr(stmt.test, scope); return; }
      if (stmt.t === "do") { bindList(stmt.body, scope); return; }
      if (stmt.t === "fornum") {
        bindExpr(stmt.start, scope);
        bindExpr(stmt.limit, scope);
        if (stmt.step) bindExpr(stmt.step, scope);
        var slot = nextSlot++;
        stmt.slot = slot;
        var child = childScope(scope);
        child.locals[stmt.name] = { kind: "local", slot: slot, name: stmt.name };
        child.loops = copy(scope.loops || {});
        child.loops[stmt.name] = 1;
        bindList(stmt.body, child);
        return;
      }
      if (stmt.t === "forin") {
        bindExpr(stmt.list, scope);
        var eachSlot = nextSlot++;
        stmt.slot = eachSlot;
        var eachScope = childScope(scope);
        eachScope.locals[stmt.name] = { kind: "local", slot: eachSlot, name: stmt.name };
        bindList(stmt.body, eachScope);
        return;
      }
      if (stmt.t === "expr") bindExpr(stmt.expr, scope);
      if (stmt.t === "return" && stmt.value) bindExpr(stmt.value, scope);
    }
    function bindFunction(fn, scope) {
      var visible = visibleSet(scope);
      var declaredLocal = {};
      var declaredGlobal = {};
      fn.params.forEach(function (name) { declaredLocal[name] = 1; });
      walkDecls(fn.body);
      var locals = copy(declaredLocal);
      walkAssigns(fn.body, {});
      Object.keys(declaredGlobal).forEach(function (name) {
        if (declaredLocal[name]) {
          var both = stmtNamed(fn.body, "global", name) || fn;
          failAt(both, name + " is local and global in this function. Pick one.");
        }
        delete locals[name];
      });
      fn.localMap = {};
      Object.keys(locals).forEach(function (name) {
        fn.localMap[name] = { kind: "local", slot: nextSlot++, name: name };
      });
      fn.slots = Object.keys(fn.localMap).map(function (name) { return fn.localMap[name].slot; });
      var inner = childScope(scope, true);
      inner.slots = fn.slots;
      Object.keys(fn.localMap).forEach(function (name) { inner.locals[name] = fn.localMap[name]; });
      inner.globals = scope.globals;
      Object.keys(declaredGlobal).forEach(function (name) {
        scope.globals[name] = 1;
        inner.locals[name] = { kind: "global", name: name };
      });
      bindList(fn.body, inner);

      function walkDecls(stmts) {
        stmts.forEach(function (stmt) {
          if (stmt.t === "local") stmt.names.forEach(function (name) { declaredLocal[name] = 1; });
          else if (stmt.t === "global") stmt.names.forEach(function (name) { declaredGlobal[name] = 1; });
          else if (stmt.t === "func" && stmt.local) declaredLocal[stmt.name] = 1;
          else if (stmt.t === "fornum" || stmt.t === "forin") walkDecls(stmt.body);
          else walkBlocks(stmt, walkDecls);
        });
      }
      function walkAssigns(stmts, loops) {
        stmts.forEach(function (stmt) {
          if (stmt.t === "fornum" || stmt.t === "forin") {
            var next = copy(loops);
            next[stmt.name] = 1;
            walkAssigns(stmt.body, next);
          } else if (stmt.t === "assign") {
            stmt.targets.forEach(function (target) {
              if (target.t !== "name" || loops[target.name] || declaredGlobal[target.name] || visible[target.name]) return;
              locals[target.name] = 1;
            });
          } else if (stmt.t === "func" && stmt.name && !stmt.local && !loops[stmt.name] && !declaredGlobal[stmt.name] && !visible[stmt.name]) {
            locals[stmt.name] = 1;
          } else walkBlocks(stmt, function (body) { walkAssigns(body, loops); });
        });
      }
    }
    function walkBlocks(stmt, visit) {
      if (stmt.t === "if") {
        visit(stmt.body);
        stmt.elifs.forEach(function (part) { visit(part.body); });
        if (stmt.other) visit(stmt.other);
      } else if (stmt.t === "while" || stmt.t === "do" || stmt.t === "repeat") visit(stmt.body);
    }
    function bindTarget(node, scope) {
      if (node.t === "name") {
        node.ref = resolve(node.name, scope, node);
        return;
      }
      bindExpr(node.object, scope);
      if (node.t === "index") bindExpr(node.index, scope);
    }
    function bindExpr(node, scope) {
      if (!node) return;
      if (node.t === "name") { node.ref = resolve(node.name, scope, node); return; }
      if (node.t === "field") { bindExpr(node.object, scope); return; }
      if (node.t === "index") { bindExpr(node.object, scope); bindExpr(node.index, scope); return; }
      if (node.t === "call") {
        bindExpr(node.callee, scope);
        node.args.forEach(function (arg) { bindExpr(arg, scope); });
        return;
      }
      if (node.t === "fn") { bindFunction(node, scope); return; }
      if (node.t === "table") {
        node.fields.forEach(function (field) {
          if (field.key) bindExpr(field.key, scope);
          bindExpr(field.value, scope);
        });
        return;
      }
      ["left", "right", "value", "test", "start", "limit", "step", "list"].forEach(function (key) {
        if (node[key] && typeof node[key] === "object" && node[key].t) bindExpr(node[key], scope);
      });
    }
    function define(scope, name) {
      var home = scope.hoist || scope;
      if (home.locals[name]) return home.locals[name];
      if (!home.parent && home.globals[name]) return { kind: "global", name: name };
      var ref = { kind: "local", slot: nextSlot++, name: name };
      home.locals[name] = ref;
      if (home.slots) home.slots.push(ref.slot);
      return ref;
    }
    function resolve(name, scope, node) {
      var found = resolveQuiet(name, scope);
      if (found) return found;
      return { kind: "global", name: name };
    }
    function resolveQuiet(name, scope) {
      var current = scope;
      while (current) {
        if (current.locals[name]) return current.locals[name];
        current = current.parent;
      }
      if (scope.globals[name]) return { kind: "global", name: name };
      return null;
    }
    function visibleSet(scope) {
      var bag = copy(scope.globals);
      var current = scope;
      while (current) {
        Object.keys(current.locals).forEach(function (name) { bag[name] = 1; });
        current = current.parent;
      }
      return bag;
    }
    function childScope(scope, fresh) {
      var created = { locals: {}, parent: scope, slots: null, globals: scope.globals, loops: scope.loops || {} };
      created.hoist = fresh ? created : (scope.hoist || scope);
      if (!fresh && scope.slots) created.slots = scope.slots;
      return created;
    }
    function stmtNamed(stmts, type, name) {
      for (var n = 0; n < stmts.length; n += 1) {
        var stmt = stmts[n];
        if (stmt.t === type && stmt.names && stmt.names.indexOf(name) >= 0) return stmt;
        if (stmt.t === "func") continue;
        var bodies = [];
        if (stmt.t === "if") {
          bodies.push(stmt.body);
          stmt.elifs.forEach(function (part) { bodies.push(part.body); });
          if (stmt.other) bodies.push(stmt.other);
        } else if (stmt.body) bodies.push(stmt.body);
        for (var b = 0; b < bodies.length; b += 1) {
          var found = stmtNamed(bodies[b], type, name);
          if (found) return found;
        }
      }
      return null;
    }
    function lookup(name, scope) { return resolveQuiet(name, scope); }
  }

  function copy(obj) {
    var out = {};
    Object.keys(obj).forEach(function (key) { out[key] = obj[key]; });
    return out;
  }
  function values(map) {
    return Object.keys(map).map(function (key) { return map[key].slot; });
  }

  function generate(ast) {
    var water = 0;
    var max = 0;
    var lines = [];
    var indent = 1;
    function alloc() {
      var id = water;
      water += 1;
      if (water > max) max = water;
      return id;
    }
    function free(id) { if (id === water - 1) water -= 1; }
    function emit(text) { lines.push(repeat("  ", indent) + text); }
    function block(fn) { indent += 1; fn(); indent -= 1; }
    emit("return async function() {");
    block(function () {
      emit("var __t = [];");
      if (ast.slots.length) emit("var " + ast.slots.map(function (slot) { return "l" + slot + " = __unset"; }).join(", ") + ";");
      ast.body.forEach(genStmt);
    });
    emit("};");
    return lines.join("\n");

    function genStmt(stmt) {
      water = 0;
      emit("// line " + stmt.line);
      emit("await __tick(" + stmt.line + ");");
      if (stmt.t === "break") { emit("break;"); return; }
      if (stmt.t === "return") {
        if (!stmt.value) { emit("return __nil;"); return; }
        var ret = genExpr(stmt.value);
        emit("return __t[" + ret + "];");
        return;
      }
      if (stmt.t === "expr") { free(genExpr(stmt.expr)); return; }
      if (stmt.t === "assign") return genAssign(stmt);
      if (stmt.t === "local") return genLocal(stmt);
      if (stmt.t === "global") return;
      if (stmt.t === "func") return genFuncStore(stmt);
      if (stmt.t === "do") { stmt.body.forEach(genStmt); return; }
      if (stmt.t === "if") return genIf(stmt);
      if (stmt.t === "while") {
        emit("while (true) {");
        block(function () {
          emit("await __tick(" + stmt.line + ");");
          var test = genExpr(stmt.test);
          emit("if (!__truth(__t[" + test + "])) break;");
          free(test);
          stmt.body.forEach(genStmt);
        });
        emit("}");
        return;
      }
      if (stmt.t === "repeat") {
        emit("while (true) {");
        block(function () {
          stmt.body.forEach(genStmt);
          emit("await __tick(" + stmt.line + ");");
          var until = genExpr(stmt.test);
          emit("if (__truth(__t[" + until + "])) break;");
          free(until);
        });
        emit("}");
        return;
      }
      if (stmt.t === "fornum") return genForNum(stmt);
      if (stmt.t === "forin") return genForIn(stmt);
    }
    function genIf(stmt) {
      openTest(stmt.test, stmt.line);
      block(function () { stmt.body.forEach(genStmt); });
      stmt.elifs.forEach(function (part) {
        emit("} else {");
        openTest(part.test, part.line);
        block(function () { part.body.forEach(genStmt); });
      });
      if (stmt.other) {
        emit("} else {");
        block(function () { stmt.other.forEach(genStmt); });
        emit("}");
      } else emit("}");
      stmt.elifs.forEach(function () { emit("}"); });
    }
    function openTest(test, line) {
      emit("await __tick(" + line + ");");
      var id = genExpr(test);
      emit("if (__truth(__t[" + id + "])) {");
      free(id);
    }
    function genForNum(stmt) {
      var start = genExpr(stmt.start);
      var limit = genExpr(stmt.limit);
      var step = stmt.step ? genExpr(stmt.step) : null;
      var id = stmt.slot;
      emit("var __s" + id + " = __t[" + start + "];");
      emit("var __e" + id + " = __t[" + limit + "];");
      emit("var __p" + id + " = " + (step == null ? "1" : "__t[" + step + "]") + ";");
      emit("__checkFor(__s" + id + ", __e" + id + ", __p" + id + ");");
      emit("var __n" + id + " = __forCount(__s" + id + ", __e" + id + ", __p" + id + ");");
      emit("for (var __k" + id + " = 0; __k" + id + " < __n" + id + "; __k" + id + "++) {");
      block(function () {
        emit("let l" + id + " = __s" + id + " + __k" + id + " * __p" + id + ";");
        stmt.body.forEach(genStmt);
      });
      emit("}");
    }
    function genForIn(stmt) {
      var list = genExpr(stmt.list);
      var id = stmt.slot;
      emit("var __a" + id + " = __items(__t[" + list + "]);");
      emit("for (var __k" + id + " = 0; __k" + id + " < __a" + id + ".length; __k" + id + "++) {");
      block(function () {
        emit("let l" + id + " = __a" + id + "[__k" + id + "];");
        stmt.body.forEach(genStmt);
      });
      emit("}");
    }
    function genLocal(stmt) {
      stmt.names.forEach(function (name, index) {
        var ref = stmt.refs[index];
        if (!stmt.values[index]) {
          emit(place(ref) + " = __nil;");
          return;
        }
        var value = genExpr(stmt.values[index]);
        emit(place(ref) + " = __t[" + value + "];");
        free(value);
      });
    }
    function genAssign(stmt) {
      if (stmt.op !== "=") return genCompound(stmt);
      var temps = stmt.values.map(genExpr);
      stmt.targets.forEach(function (target, index) {
        var value = temps[index];
        if (value == null) {
          writeTarget(target, "__nil");
          return;
        }
        writeTarget(target, "__t[" + value + "]");
      });
      temps.forEach(free);
    }
    function genCompound(stmt) {
      var target = stmt.targets[0];
      var op = stmt.op.slice(0, -1);
      if (target.t === "name") {
        var current = genReadRef(target.ref, target.name, target.line);
        var extra = genExpr(stmt.values[0]);
        var next = alloc();
        emit("__t[" + next + "] = __bin(" + JSON.stringify(op) + ", __t[" + current + "], __t[" + extra + "]);");
        storeName(target, "__t[" + next + "]");
        return;
      }
      var obj = genExpr(target.object);
      var key = target.t === "field" ? JSON.stringify(target.name) : "__t[" + genExpr(target.index) + "]";
      var holdObj = alloc();
      var holdKey = alloc();
      emit("__t[" + holdObj + "] = __t[" + obj + "];");
      emit("__t[" + holdKey + "] = " + key + ";");
      var old = alloc();
      emit("__t[" + old + "] = __getk(__t[" + holdObj + "], __t[" + holdKey + "]);");
      var extraValue = genExpr(stmt.values[0]);
      var combined = alloc();
      emit("__t[" + combined + "] = __bin(" + JSON.stringify(op) + ", __t[" + old + "], __t[" + extraValue + "]);");
      emit("__setk(__t[" + holdObj + "], __t[" + holdKey + "], __t[" + combined + "]);");
    }
    function genFuncStore(stmt) {
      var temp = genFunction(stmt);
      if (stmt.ref && stmt.ref.kind === "local") emit(place(stmt.ref) + " = __t[" + temp + "];");
      else emit("__set(" + JSON.stringify(stmt.name) + ", __t[" + temp + "]);");
    }
    function genFunction(fn) {
      var id = alloc();
      var outerWater = water;
      var params = fn.params.map(function (_name, index) { return "p" + index; }).join(", ");
      emit("__t[" + id + "] = __fn(async function(" + params + ") {");
      block(function () {
        emit("var __t = [];");
        if (fn.slots && fn.slots.length) emit("var " + fn.slots.map(function (slot) { return "l" + slot + " = __unset"; }).join(", ") + ";");
        fn.params.forEach(function (name, index) {
          var ref = fn.localMap[name];
          emit("l" + ref.slot + " = p" + index + " === undefined ? __nil : p" + index + ";");
        });
        water = 0;
        fn.body.forEach(genStmt);
      });
      emit("}, " + fn.params.length + ");");
      water = outerWater;
      return id;
    }
    function genExpr(node) {
      if (node.t === "number") return literal(String(node.v));
      if (node.t === "string") return literal(JSON.stringify(node.v));
      if (node.t === "bool") return literal(node.v ? "true" : "false");
      if (node.t === "nil") return literal("__nil");
      if (node.t === "name") return genReadRef(node.ref, node.name, node.line);
      if (node.t === "field" || node.t === "index") {
        var obj = genExpr(node.object);
        var key = node.t === "field" ? JSON.stringify(node.name) : null;
        var keyTemp = node.t === "index" ? genExpr(node.index) : null;
        var out = alloc();
        emit("__t[" + out + "] = __getk(__t[" + obj + "], " + (key != null ? key : "__t[" + keyTemp + "]") + ");");
        free(obj);
        if (keyTemp != null) free(keyTemp);
        return out;
      }
      if (node.t === "call") {
        var callee = genExpr(node.callee);
        var args = node.args.map(genExpr);
        var out = alloc();
        emit("__t[" + out + "] = await __call(__t[" + callee + "], [" + args.map(function (arg) { return "__t[" + arg + "]"; }).join(", ") + "]);");
        args.forEach(free);
        free(callee);
        return out;
      }
      if (node.t === "fn") return genFunction(node);
      if (node.t === "table") {
        var parts = node.fields.map(function (field) {
          if (field.list) return "{ list: true, v: __t[" + genExpr(field.value) + "] }";
          return "{ k: __t[" + genExpr(field.key) + "], v: __t[" + genExpr(field.value) + "] }";
        });
        return literal("__table([" + parts.join(", ") + "])");
      }
      if (node.t === "or" || node.t === "and") {
        var left = genExpr(node.left);
        var out = alloc();
        emit("__t[" + out + "] = __t[" + left + "];");
        emit("if (" + (node.t === "or" ? "!" : "") + "__truth(__t[" + out + "])) {");
        block(function () {
          var right = genExpr(node.right);
          emit("__t[" + out + "] = __t[" + right + "];");
          free(right);
        });
        emit("}");
        free(left);
        return out;
      }
      if (node.t === "not" || node.t === "neg" || node.t === "len") {
        var value = genExpr(node.value);
        var out = alloc();
        var op = node.t === "not" ? "__not" : node.t === "neg" ? "__neg" : "__len";
        emit("__t[" + out + "] = " + op + "(__t[" + value + "]);");
        free(value);
        return out;
      }
      if (node.t === "cmp" || node.t === "bin" || node.t === "cat") {
        var a = genExpr(node.left);
        var b = genExpr(node.right);
        var out = alloc();
        var op = node.t === "cat" ? ".." : node.op;
        emit("__t[" + out + "] = __bin(" + JSON.stringify(op) + ", __t[" + a + "], __t[" + b + "]);");
        free(a);
        free(b);
        return out;
      }
      failAt(node, "I could not compile this part.");
    }
    function genReadRef(ref, name, line) {
      var out = alloc();
      if (ref && ref.kind === "local") emit("__t[" + out + "] = __defined(l" + ref.slot + ", " + JSON.stringify(name) + ");");
      else emit("__t[" + out + "] = __get(" + JSON.stringify(name) + ");");
      return out;
    }
    function storeName(target, code) {
      if (target.ref && target.ref.kind === "local") emit("l" + target.ref.slot + " = " + code + ";");
      else emit("__set(" + JSON.stringify(target.name) + ", " + code + ");");
    }
    function writeTarget(target, code) {
      if (target.t === "name") {
        storeName(target, code);
        return;
      }
      var obj = genExpr(target.object);
      var key = target.t === "field" ? JSON.stringify(target.name) : "__t[" + genExpr(target.index) + "]";
      emit("__setk(__t[" + obj + "], " + key + ", " + code + ");");
    }
    function place(ref) {
      if (ref && ref.kind === "local") return "l" + ref.slot;
      return "__missing";
    }
    function literal(code) {
      var id = alloc();
      emit("__t[" + id + "] = " + code + ";");
      return id;
    }
  }

  function repeat(text, count) {
    var out = "";
    for (var i = 0; i < count; i += 1) out += text;
    return out;
  }

  function compile(source) {
    var ast = parse(source);
    bind(ast);
    var js = "var __tick = __rt.tick, __get = __rt.get, __set = __rt.set, __getk = __rt.getk, __setk = __rt.setk, __call = __rt.call, __bin = __rt.bin, __not = __rt.not, __neg = __rt.neg, __len = __rt.len, __truth = __rt.truth, __table = __rt.table, __items = __rt.items, __fn = __rt.fn, __defined = __rt.defined, __nil = __rt.nil, __unset = __rt.unset, __forCount = __rt.forCount, __checkFor = __rt.checkFor;\n" + generate(ast) + "\n//# sourceURL=magic-program.js\n";
    var factory;
    try {
      factory = new Function("__rt", js);
    } catch (err) {
      throw new MagicError("The program compiled, then JavaScript rejected it. " + err.message, 0, 1);
    }
    return {
      js: js,
      run: function (host) {
        var rt = runtime(host);
        return factory(rt)();
      }
    };
  }

  function runtime(host) {
    host = host || {};
    var line = 1;
    var ticks = 0;
    var env = new Map();
    var nil = { magic: "nil" };
    var unset = { magic: "unset" };
    var started = Date.now();

    function fail(message) {
      throw new MagicError(message, line, 1);
    }
    function isNil(value) { return value === nil || value == null; }
    function isHost(value) { return !!(value && value.__host); }
    function isTable(value) { return !!(value && !value.__host && value.magic === "table"); }
    function isFn(value) { return !!(value && !value.__host && value.magic === "function"); }

    function describe(value) {
      if (isNil(value)) return "nil";
      if (typeof value === "number") return "the number " + value;
      if (typeof value === "string") return "the text " + JSON.stringify(value.length > 18 ? value.slice(0, 18) + "…" : value);
      if (typeof value === "boolean") return value ? "true" : "false";
      if (isTable(value)) return "a list";
      if (isFn(value) || typeof value === "function") return "a function";
      if (isHost(value)) return "the " + (value.__name || "tool");
      return "the wrong kind of value";
    }
    function numbers(op, a, b) {
      if (typeof a === "number" && typeof b === "number") return;
      var hint = op === "+" ? " Join text with .." : "";
      fail(op + " works on numbers. " + describe(a) + " and " + describe(b) + " are not both numbers." + hint);
    }
    function bin(op, a, b) {
      if (op === "..") {
        if ((typeof a === "number" || typeof a === "string") && (typeof b === "number" || typeof b === "string")) return String(a) + String(b);
        fail(".. joins text. " + describe(a) + " and " + describe(b) + " cannot be joined.");
      }
      if (op === "==") return (isNil(a) && isNil(b)) || a === b;
      if (op === "~=") return !((isNil(a) && isNil(b)) || a === b);
      if (CMP[op]) {
        if (typeof a === "number" && typeof b === "number") {
          if (op === "<") return a < b;
          if (op === ">") return a > b;
          if (op === "<=") return a <= b;
          return a >= b;
        }
        if (typeof a === "string" && typeof b === "string") {
          if (op === "<") return a < b;
          if (op === ">") return a > b;
          if (op === "<=") return a <= b;
          return a >= b;
        }
        fail("You cannot compare " + describe(a) + " with " + describe(b) + " using " + op + ".");
      }
      numbers(op, a, b);
      if (op === "/" || op === "//" || op === "%") {
        if (b === 0) fail(op === "%" ? "The remainder of a division by 0 is not a number." : "Division by zero. The right side was 0.");
      }
      var value;
      if (op === "+") value = a + b;
      else if (op === "-") value = a - b;
      else if (op === "*") value = a * b;
      else if (op === "/") value = a / b;
      else if (op === "//") value = Math.floor(a / b);
      else if (op === "%") value = a % b;
      else if (op === "^") value = Math.pow(a, b);
      else fail("I don't know the symbol " + op + ".");
      if (typeof value !== "number" || !Number.isFinite(value)) fail("That number got too big.");
      return value;
    }

    function lengthOf(value) {
      if (typeof value === "string") return Array.from(value).length;
      if (!isTable(value)) fail("# needs text or a list. You gave " + describe(value) + ".");
      var max = 0;
      value.map.forEach(function (_item, key) {
        if (typeof key === "number" && key > max && Math.floor(key) === key) max = key;
      });
      return max;
    }

    function toJS(value) {
      if (isNil(value)) return null;
      if (typeof value === "number" || typeof value === "string" || typeof value === "boolean") return value;
      if (isHost(value)) return value;
      if (isFn(value)) {
        return async function () {
          var args = Array.prototype.map.call(arguments, fromJS);
          return toJS(await value.fn.apply(null, args));
        };
      }
      if (isTable(value)) {
        var keys = Array.from(value.map.keys());
        var list = keys.every(function (key) { return typeof key === "number" && key >= 1 && Math.floor(key) === key; });
        if (list) {
          var out = [];
          var n = lengthOf(value);
          for (var i = 1; i <= n; i += 1) out.push(toJS(value.map.has(i) ? value.map.get(i) : nil));
          return out;
        }
        var obj = {};
        value.map.forEach(function (item, key) { obj[String(key)] = toJS(item); });
        return obj;
      }
      if (typeof value === "function") return value;
      return null;
    }
    function fromJS(value) {
      if (value == null) return nil;
      if (typeof value === "number") {
        if (!Number.isFinite(value)) fail("That number got too big.");
        return value;
      }
      if (typeof value === "string" || typeof value === "boolean") return value;
      if (isTable(value) || isFn(value) || isHost(value)) return value;
      if (typeof value === "function") {
        return { magic: "function", fn: async function () {
          var args = Array.prototype.map.call(arguments, toJS);
          return fromJS(await value.apply(null, args));
        } };
      }
      if (Array.isArray(value)) {
        var table = { magic: "table", map: new Map() };
        value.forEach(function (item, index) { table.map.set(index + 1, fromJS(item)); });
        return table;
      }
      return value;
    }
    function show(value) {
      var js = toJS(value);
      if (js == null) return "nil";
      if (typeof js === "string") return js;
      if (typeof js === "number") return String(js);
      if (typeof js === "boolean") return js ? "true" : "false";
      if (typeof js === "function") return "function";
      if (Array.isArray(js)) return js.map(function (item) { return show(fromJS(item)); }).join(" ");
      if (js && js.__host) return js.__name || "object";
      if (typeof js === "object") {
        return Object.keys(js).slice(0, 8).map(function (key) { return key + "=" + show(fromJS(js[key])); }).join(" ");
      }
      return String(js);
    }

    function install(name, value) { env.set(name, value); }
    if (host.engines) {
      install("2d", host.engines["2d"]);
      install("3d", host.engines["3d"]);
      install("ui", host.engines.ui);
    }
    install("print", { magic: "function", fn: async function () {
      if (typeof host.print === "function") host.print(Array.prototype.map.call(arguments, show).join(" "));
      return nil;
    } });
    install("input", { magic: "function", fn: async function (prompt) {
      if (typeof host.input !== "function") fail("input needs a person at the keyboard.");
      var asked = isNil(prompt) ? "" : show(prompt);
      var answer = await host.input(asked);
      return answer == null ? "" : String(answer);
    } });
    install("type", { magic: "function", fn: async function (value) {
      if (isNil(value)) return "nil";
      if (typeof value === "number") return "number";
      if (typeof value === "string") return "string";
      if (typeof value === "boolean") return "boolean";
      if (isTable(value)) return "table";
      if (isFn(value)) return "function";
      if (isHost(value)) return "object";
      return "object";
    } });
    install("tostring", { magic: "function", fn: async function (value) { return show(value); } });
    install("tonumber", { magic: "function", fn: async function (value) {
      if (typeof value === "number") return value;
      if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value.trim()))) return Number(value.trim());
      return nil;
    } });
    install("len", { magic: "function", fn: async function (value) { return lengthOf(value); } });
    install("clock", { magic: "function", fn: async function () { return (Date.now() - started) / 1000; } });
    install("math", mathHost());
    install("str", strHost());
    if (typeof host.attach === "function") {
      host.attach(function (name) {
        var value = env.get(name);
        if (value == null || value === unset || value === nil) return undefined;
        return toJS(value);
      });
    }

    function mathHost() {
      function deg(value, name) {
        if (typeof value !== "number") fail("math." + name + " needs a number of degrees. You gave " + describe(value) + ".");
        return value * Math.PI / 180;
      }
      return {
        __host: true,
        __name: "math",
        abs: function (n) { return Math.abs(needNum(n, "math.abs")); },
        floor: function (n) { return Math.floor(needNum(n, "math.floor")); },
        ceil: function (n) { return Math.ceil(needNum(n, "math.ceil")); },
        sqrt: function (n) {
          n = needNum(n, "math.sqrt");
          if (n < 0) fail("math.sqrt needs 0 or more. You gave " + n + ".");
          return Math.sqrt(n);
        },
        sin: function (n) { return Math.sin(deg(needNum(n, "math.sin"), "sin")); },
        cos: function (n) { return Math.cos(deg(needNum(n, "math.cos"), "cos")); },
        tan: function (n) { return Math.tan(deg(needNum(n, "math.tan"), "tan")); },
        atan: function (n) { return Math.atan(needNum(n, "math.atan")) * 180 / Math.PI; },
        min: function (a, b) { return Math.min(needNum(a, "math.min"), needNum(b, "math.min")); },
        max: function (a, b) { return Math.max(needNum(a, "math.max"), needNum(b, "math.max")); },
        pi: Math.PI,
        random: function (a, b) {
          if (a == null) return Math.random();
          a = needNum(a, "math.random");
          if (b == null) {
            if (a < 1) fail("math.random(n) counts from 1 to n. n has to be at least 1.");
            return 1 + Math.floor(Math.random() * Math.floor(a));
          }
          b = needNum(b, "math.random");
          var lo = Math.ceil(Math.min(a, b));
          var hi = Math.floor(Math.max(a, b));
          return lo + Math.floor(Math.random() * (hi - lo + 1));
        }
      };
    }
    function needNum(value, method) {
      if (typeof value !== "number" || !Number.isFinite(value)) fail(method + " needs a number. You gave " + describe(value) + ".");
      return value;
    }
    function strHost() {
      return {
        __host: true,
        __name: "str",
        lower: function (s) { return needText(s, "str.lower").toLowerCase(); },
        upper: function (s) { return needText(s, "str.upper").toUpperCase(); },
        len: function (s) { return Array.from(needText(s, "str.len")).length; },
        sub: function (s, i, j) {
          var chars = Array.from(needText(s, "str.sub"));
          var start = needNum(i, "str.sub") - 1;
          var end = j == null ? chars.length : needNum(j, "str.sub");
          if (start < 0) start = 0;
          return chars.slice(start, end).join("");
        },
        find: function (s, part) {
          var hay = needText(s, "str.find");
          var needle = needText(part, "str.find");
          var at = hay.indexOf(needle);
          return at < 0 ? null : Array.from(hay.slice(0, at)).length + 1;
        },
        rep: function (s, n) {
          n = needNum(n, "str.rep");
          if (n < 0 || n > 10000) fail("str.rep keeps the count between 0 and 10000.");
          return needText(s, "str.rep").repeat(Math.floor(n));
        }
      };
    }
    function needText(value, method) {
      if (typeof value !== "string") fail(method + " needs text. You gave " + describe(value) + ".");
      return value;
    }

    function suggest(name) {
      var best = "";
      var bestD = 3;
      PREDEFINED.forEach(function (item) {
        var d = edit(name, item);
        if (d < bestD) { bestD = d; best = item; }
      });
      return bestD <= 2 ? best : "";
    }
    function edit(a, b) {
      var prev = [];
      var row = [];
      for (var j = 0; j <= b.length; j += 1) prev[j] = j;
      for (var i = 1; i <= a.length; i += 1) {
        row[0] = i;
        for (var k = 1; k <= b.length; k += 1) {
          row[k] = Math.min(row[k - 1] + 1, prev[k] + 1, prev[k - 1] + (a[i - 1] === b[k - 1] ? 0 : 1));
        }
        var swap = prev; prev = row; row = swap;
      }
      return prev[b.length];
    }

    return {
      nil: nil,
      unset: unset,
      tick: async function (n) {
        line = n;
        if (host.stopped && host.stopped()) {
          var stop = new Error("Stopped.");
          stop.magicStop = true;
          throw stop;
        }
        ticks += 1;
        if ((ticks & 2047) === 0) await new Promise(function (resolve) { setTimeout(resolve, 0); });
      },
      get: function (name) {
        if (!env.has(name) || env.get(name) === unset) {
          var guess = suggest(name);
          if (guess && guess !== name) fail(name + " has no value yet. Did you mean " + guess + "?");
          fail(name + " has no value yet. Set it first, for example " + name + " = 0.");
        }
        return env.get(name);
      },
      set: function (name, value) { env.set(name, value); },
      defined: function (value, name) {
        if (value === unset) fail(name + " has no value yet. Set it first, for example " + name + " = 0.");
        return value;
      },
      getk: function (obj, key) {
        if (isNil(obj)) fail("You cannot look inside nil.");
        if (isTable(obj)) {
          if (key === 0 && !obj.map.has(0) && obj.map.has(1)) fail("Index 0 is not the first item. The first item is 1.");
          return obj.map.has(key) ? obj.map.get(key) : nil;
        }
        if (typeof obj === "string") {
          if (typeof key !== "number") fail("A letter number has to be a number. The first letter is 1.");
          if (key === 0) fail("The first letter is 1, not 0.");
          var chars = Array.from(obj);
          if (key < 1 || key > chars.length) return nil;
          return chars[key - 1];
        }
        if (isHost(obj)) {
          var prop = typeof key === "string" ? key : String(key);
          var value;
          try { value = obj[prop]; }
          catch (err) {
            if (err.magic || err.magicStop) throw err;
            fail(err.message);
          }
          if (typeof value === "function") return value.bind(obj);
          if (value === undefined) fail((obj.__name || "This") + " has no " + prop + ".");
          return fromJS(value);
        }
        fail("You cannot look up " + describe(key) + " on " + describe(obj) + ".");
      },
      setk: function (obj, key, value) {
        if (isTable(obj)) {
          if (isNil(value)) obj.map.delete(key);
          else obj.map.set(key, value);
          return;
        }
        if (typeof obj === "string") fail("Text cannot be changed letter by letter. Make new text with ..");
        if (isHost(obj)) fail((obj.__name || "This") + " is a tool. Call it. You cannot store a field on it.");
        fail("You cannot store into " + describe(obj) + ".");
      },
      call: async function (fn, args) {
        if (isFn(fn)) return fn.fn.apply(null, args);
        if (typeof fn === "function") {
          try {
            return fromJS(await fn.apply(null, args.map(toJS)));
          } catch (err) {
            if (err.magic || err.magicStop) throw err;
            fail(err.message || "That call failed.");
          }
        }
        fail("You cannot call " + describe(fn) + ". Only a function can be called.");
      },
      bin: bin,
      not: function (value) { return isNil(value) || value === false; },
      neg: function (value) {
        if (typeof value !== "number") fail("- works on a number. You gave " + describe(value) + ".");
        return -value;
      },
      len: lengthOf,
      truth: function (value) { return !isNil(value) && value !== false; },
      table: function (items) {
        var table = { magic: "table", map: new Map() };
        var n = 1;
        items.forEach(function (item) {
          if (item.list) { table.map.set(n, item.v); n += 1; }
          else table.map.set(item.k, item.v);
        });
        return table;
      },
      items: function (value) {
        if (typeof value === "string") return Array.from(value);
        if (!isTable(value)) fail("for ... in walks a list or text. You gave " + describe(value) + ".");
        var out = [];
        var n = lengthOf(value);
        for (var i = 1; i <= n; i += 1) out.push(value.map.has(i) ? value.map.get(i) : nil);
        return out;
      },
      fn: function (inner, arity) {
        return {
          magic: "function",
          fn: async function () {
            var args = Array.prototype.slice.call(arguments);
            while (args.length < arity) args.push(nil);
            try {
              return await inner.apply(null, args);
            } catch (err) {
              if (err.magic || err.magicStop) throw err;
              fail(err.message || "That function failed.");
            }
          }
        };
      },
      forCount: function (start, end, step) {
        if (typeof start !== "number" || typeof end !== "number" || typeof step !== "number") {
          fail("A for loop counts with numbers. Check the start, the end, and the step.");
        }
        if (step === 0) fail("The step is 0, so the loop would never finish. Use 1, or -1 to count down.");
        if (step > 0 && start > end) return 0;
        if (step < 0 && start < end) return 0;
        var n = Math.floor((end - start) / step + 1e-9) + 1;
        return n < 0 ? 0 : n;
      },
      checkFor: function (start, end, step) {
        if (typeof start !== "number" || typeof end !== "number" || typeof step !== "number") {
          fail("A for loop counts with numbers. Check the start, the end, and the step.");
        }
        if (step === 0) fail("The step is 0, so the loop would never finish. Use 1, or -1 to count down.");
      }
    };
  }

  // Coloring walks the original text and only slices it. Joining the pieces
  // has to equal the editor, including quotes, escapes, and Windows newlines.
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
        var sawBreak = false;
        while (i < src.length && (src[i] === " " || src[i] === "\t" || src[i] === "\n" || src[i] === "\r")) {
          if (src[i] === "\n" || src[i] === "\r") sawBreak = true;
          i += 1;
        }
        out.push({ text: src.slice(start, i), kind: "plain" });
        if (sawBreak) bol = true;
        continue;
      }
      if (c === "-" && ch(1) === "-" && ch(2) === "[" && ch(3) === "[") {
        var long = i + 4;
        while (long < src.length && !(src[long] === "]" && src[long + 1] === "]")) long += 1;
        take(long >= src.length ? src.length : long + 2, long >= src.length ? "bad" : "comment");
        continue;
      }
      if (c === "-" && ch(1) === "-") {
        var dash = i;
        while (dash < src.length && src[dash] !== "\n" && src[dash] !== "\r") dash += 1;
        take(dash, "comment");
        continue;
      }
      if (c === "/" && ch(1) === "/" && bol) {
        var slash = i;
        while (slash < src.length && src[slash] !== "\n" && src[slash] !== "\r") slash += 1;
        take(slash, "comment");
        continue;
      }
      if (c === "#" && ch(1) === " " && bol) {
        var hash = i;
        while (hash < src.length && src[hash] !== "\n" && src[hash] !== "\r") hash += 1;
        take(hash, "comment");
        continue;
      }
      if (c === "/" && ch(1) === "*") {
        var block = i + 2;
        while (block < src.length && !(src[block] === "*" && src[block + 1] === "/")) block += 1;
        take(block >= src.length ? src.length : block + 2, block >= src.length ? "bad" : "comment");
        continue;
      }
      if ((c === "\"" || c === "'")) {
        var q = i + 1;
        var closed = false;
        while (q < src.length && src[q] !== "\n" && src[q] !== "\r") {
          if (src[q] === "\\") { q += 2; continue; }
          if (src[q] === c) { closed = true; q += 1; break; }
          q += 1;
        }
        take(q, closed ? "string" : "bad");
        continue;
      }
      if (c === "[" && ch(1) === "[") {
        var raw = i + 2;
        while (raw < src.length && !(src[raw] === "]" && src[raw + 1] === "]")) raw += 1;
        take(raw >= src.length ? src.length : raw + 2, raw >= src.length ? "bad" : "string");
        continue;
      }
      if ((c === "2" || c === "3") && (ch(1) === "d" || ch(1) === "D") && !part(ch(2))) {
        take(i + 2, "engine");
        continue;
      }
      if (digit(c) || (c === "." && digit(ch(1)))) {
        var n = i;
        while (digit(src[n] || "")) n += 1;
        if (src[n] === ".") { n += 1; while (digit(src[n] || "")) n += 1; }
        if (src[n] === "e" || src[n] === "E") {
          var look = n + 1;
          if (src[look] === "+" || src[look] === "-") look += 1;
          if (digit(src[look] || "")) {
            n = look;
            while (digit(src[n] || "")) n += 1;
          }
        }
        take(n, "number");
        continue;
      }
      if (letter(c) || c === "_") {
        var id = i;
        while (part(src[id] || "")) id += 1;
        var word = src.slice(i, id);
        var kind = "ident";
        if (word === "ui" || word === "UI") kind = "engine";
        else if (KEYWORDS[word] || PREDEFINED.indexOf(word) >= 0) kind = "keyword";
        take(id, kind);
        continue;
      }
      var two = c + ch(1);
      if (two === "==" || two === "~=" || two === "!=" || two === "<=" || two === ">=" || two === ".." || two === "+=" || two === "-=" || two === "*=" || two === "/=" || two === "//") {
        take(i + 2, "op");
        continue;
      }
      if ("+-*/%^#<>=(){}[],.:;".indexOf(c) >= 0) {
        take(i + 1, "op");
        continue;
      }
      take(i + 1, "bad");
    }
    return out;
  }

  root.EmojiMagic = {
    compile: compile,
    run: function (source, host) { return compile(source).run(host); },
    highlight: highlight,
    Error: MagicError
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
