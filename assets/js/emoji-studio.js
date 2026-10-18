// Shared learning machine for Magic and Basic Learn.
// The editor, the errors, the text, and the picture sit in one screen.
"use strict";
(function (root) {
  function open(options) {
    options = options || {};
    var mount = options.root;
    if (!mount) return null;
    var runtime = options.language === "basic" ? root.EmojiBasic : root.EmojiMagic;
    var lessons = options.lessons || [];
    var storageKey = options.storageKey || "";
    var running = false;
    var stopped = false;
    var saveTimer = 0;
    var askWait = null;

    mount.textContent = "";
    var studio = el("div", "studio");
    studio.tabIndex = 0;
    var bar = el("div", "studio-bar");
    var runButton = button("Run", "studio-run");
    var stopButton = button("Stop", "studio-stop");
    stopButton.disabled = true;
    var lessonLabel = el("label", "studio-lesson");
    lessonLabel.appendChild(document.createTextNode("Lesson "));
    var lessonPick = document.createElement("select");
    lessons.forEach(function (lesson, index) {
      var choice = document.createElement("option");
      choice.value = String(index);
      choice.textContent = lesson.name;
      lessonPick.appendChild(choice);
    });
    if (!lessons.length) lessonPick.hidden = true;
    lessonLabel.appendChild(lessonPick);
    var loadButton = button("Load lesson", "studio-load");
    if (!lessons.length) loadButton.hidden = true;
    var clearButton = button("Clear text", "studio-clear");
    var jsButton = button("JavaScript", "studio-js");
    if (!options.showJs) jsButton.hidden = true;
    bar.appendChild(runButton);
    bar.appendChild(stopButton);
    bar.appendChild(lessonLabel);
    bar.appendChild(loadButton);
    bar.appendChild(clearButton);
    bar.appendChild(jsButton);

    var main = el("div", "studio-main");
    var edit = el("div", "studio-edit");
    var gutter = el("pre", "studio-gutter");
    gutter.setAttribute("aria-hidden", "true");
    var sheet = el("div", "studio-sheet");
    var paint = el("pre", "studio-paint");
    paint.setAttribute("aria-hidden", "true");
    var code = document.createElement("textarea");
    code.className = "studio-code";
    code.spellcheck = false;
    code.autocomplete = "off";
    code.autocapitalize = "off";
    code.setAttribute("aria-label", (options.title || "Program") + " editor");
    sheet.appendChild(paint);
    sheet.appendChild(code);
    edit.appendChild(gutter);
    edit.appendChild(sheet);

    var side = el("div", "studio-side");
    var error = el("div", "studio-error");
    error.hidden = true;
    error.setAttribute("role", "status");
    var jsView = el("pre", "studio-jsview");
    jsView.hidden = true;
    var output = el("div", "studio-out");
    output.setAttribute("aria-live", "polite");
    var form = document.createElement("form");
    form.className = "studio-ask";
    form.hidden = true;
    var prompt = el("label", "studio-prompt");
    var words = document.createElement("span");
    var field = document.createElement("input");
    field.type = "text";
    field.autocomplete = "off";
    prompt.appendChild(words);
    prompt.appendChild(field);
    var ok = button("Ok", "studio-ok");
    ok.type = "submit";
    form.appendChild(prompt);
    form.appendChild(ok);
    var stage = el("div", "studio-stage");
    stage.tabIndex = -1;
    side.appendChild(error);
    side.appendChild(jsView);
    side.appendChild(output);
    side.appendChild(form);
    side.appendChild(stage);
    main.appendChild(edit);
    main.appendChild(side);
    studio.appendChild(bar);
    studio.appendChild(main);
    mount.appendChild(studio);

    var session = root.EmojiBridge.mount(stage);
    session.print = function (text) { write(text); };

    function el(tag, className) {
      var node = document.createElement(tag);
      node.className = className;
      return node;
    }
    function button(text, className) {
      var node = document.createElement("button");
      node.type = "button";
      node.className = className;
      node.textContent = text;
      return node;
    }

    function savedSource() {
      if (!storageKey) return "";
      try {
        var raw = root.localStorage.getItem(storageKey);
        if (!raw) return "";
        var data = JSON.parse(raw);
        return data && typeof data.source === "string" ? data.source : "";
      } catch (err) {
        return "";
      }
    }
    function save() {
      if (!storageKey) return;
      root.clearTimeout(saveTimer);
      saveTimer = root.setTimeout(function () {
        try {
          root.localStorage.setItem(storageKey, JSON.stringify({ source: code.value }));
        } catch (err) { /* a full disk can refuse the save */ }
      }, 250);
    }

    function paintNow() {
      var source = code.value;
      var parts;
      try {
        parts = runtime.highlight(source);
      } catch (err) {
        parts = [{ text: source, kind: "plain" }];
      }
      paint.textContent = "";
      parts.forEach(function (part) {
        if (!part.text) return;
        var span = document.createElement("span");
        if (part.kind && part.kind !== "plain") span.className = "st-" + part.kind;
        span.textContent = part.text;
        paint.appendChild(span);
      });
      paint.appendChild(document.createTextNode("\u200b"));
      var count = source.length ? source.split("\n").length : 1;
      var numbers = [];
      for (var n = 1; n <= count; n += 1) numbers.push(String(n));
      gutter.textContent = numbers.join("\n");
      syncScroll();
    }
    function syncScroll() {
      paint.scrollTop = code.scrollTop;
      paint.scrollLeft = code.scrollLeft;
      gutter.scrollTop = code.scrollTop;
    }

    function write(text) {
      String(text == null ? "" : text).split("\n").forEach(function (line) {
        var row = document.createElement("div");
        row.textContent = line;
        output.appendChild(row);
        while (output.childNodes.length > 500) output.removeChild(output.firstChild);
      });
      output.scrollTop = output.scrollHeight;
    }
    function clearText() {
      output.textContent = "";
    }
    function showError(message, line) {
      if (!message) {
        error.hidden = true;
        error.textContent = "";
        error.removeAttribute("data-line");
        return;
      }
      error.hidden = false;
      error.textContent = message;
      if (line) error.setAttribute("data-line", String(line));
      else error.removeAttribute("data-line");
    }
    function selectLine(line) {
      if (!line || line < 1) return;
      var source = code.value;
      var at = 0;
      var current = 1;
      while (current < line && at < source.length) {
        var next = source.indexOf("\n", at);
        if (next < 0) break;
        at = next + 1;
        current += 1;
      }
      var end = source.indexOf("\n", at);
      if (end < 0) end = source.length;
      code.focus();
      code.setSelectionRange(at, end);
      code.scrollTop = Math.max(0, (line - 3) * 22);
      syncScroll();
    }

    function ask(text) {
      return new Promise(function (resolve) {
        if (askWait) askWait("");
        askWait = resolve;
        words.textContent = text || "Type, then press Ok.";
        field.value = "";
        form.hidden = false;
        field.focus();
      });
    }
    function finishAsk(value) {
      form.hidden = true;
      var resolve = askWait;
      askWait = null;
      if (resolve) resolve(value);
    }

    function setRunning(flag) {
      running = flag;
      runButton.disabled = flag;
      stopButton.disabled = !flag;
      code.readOnly = flag;
      loadButton.disabled = flag;
      if (flag) stage.focus();
    }

    async function run() {
      if (running || !runtime) return;
      finishAsk(null);
      stopped = false;
      showError("");
      jsView.hidden = true;
      session.reset();
      session.print = function (text) { write(text); };
      setRunning(true);
      var source = code.value;
      var host = {
        print: write,
        input: ask,
        cls: clearText,
        stopped: function () { return stopped; },
        engines: session.api,
        attach: function (lookup) { session.lookup = lookup; }
      };
      try {
        await runtime.run(source, host);
      } catch (err) {
        if (err && err.magicStop) showError("Stopped.");
        else showError((err && err.message) || "The program stopped.", err && err.line);
        if (err && err.line) selectLine(err.line);
      } finally {
        finishAsk(null);
        stopped = false;
        setRunning(false);
      }
    }
    function stop() {
      if (!running && !askWait) {
        session.halt();
        return;
      }
      stopped = true;
      session.halt();
      finishAsk(null);
    }
    function showJs() {
      if (!root.EmojiMagic || options.language === "basic") return;
      try {
        jsView.textContent = root.EmojiMagic.compile(code.value).js;
        jsView.hidden = false;
        showError("");
      } catch (err) {
        jsView.hidden = true;
        showError((err && err.message) || "That program did not compile.", err && err.line);
        if (err && err.line) selectLine(err.line);
      }
    }
    function loadLesson() {
      if (running) return;
      var lesson = lessons[Number(lessonPick.value)];
      if (!lesson) return;
      if (code.value && code.value !== lesson.code) {
        if (!root.confirm("Replace the program with this lesson?")) return;
      }
      code.value = lesson.code;
      paintNow();
      save();
      showError("");
    }

    var stored = savedSource();
    if (stored) code.value = stored;
    else if (lessons[0]) code.value = lessons[0].code;
    paintNow();

    code.addEventListener("input", function () { paintNow(); save(); });
    code.addEventListener("scroll", syncScroll);
    code.addEventListener("keydown", function (event) {
      if (event.key === "Tab") {
        event.preventDefault();
        var start = code.selectionStart;
        var end = code.selectionEnd;
        code.setRangeText("  ", start, end, "end");
        paintNow();
        save();
        return;
      }
      if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        run();
      }
    });
    runButton.addEventListener("click", run);
    stopButton.addEventListener("click", stop);
    clearButton.addEventListener("click", clearText);
    loadButton.addEventListener("click", loadLesson);
    jsButton.addEventListener("click", showJs);
    error.addEventListener("click", function () {
      var line = Number(error.getAttribute("data-line") || 0);
      if (line) selectLine(line);
    });
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      finishAsk(field.value);
    });
    root.addEventListener("resize", function () { session.resize(); });

    var desk = root.GameDesk;
    if (desk) {
      var previousClose = desk.onClose;
      var previousOpen = desk.onOpen;
      desk.onClose = function () {
        stop();
        if (typeof previousClose === "function") previousClose();
      };
      desk.onOpen = function () {
        if (typeof previousOpen === "function") previousOpen();
        session.resize();
      };
    }
    return { session: session, run: run, stop: stop };
  }

  root.EmojiStudio = { open: open };
})(typeof globalThis !== "undefined" ? globalThis : this);
