function handleLine(raw) {
  if (!basic) return;
  var result = basic.execLine(raw);
  if (result.type === "reset" || result.type === "cls") {
    paintWelcome();
    return;
  }
  if (result.type === "print") {
    term.color(15, 6);
    if (result.text) term.write(result.text + "\n");
    term.color(7, 6);
    writeReady();
    return;
  }
  if (result.type === "error") {
    term.color(9, 6);
    term.write(result.msg + "\n");
    term.color(7, 6);
    writeReady();
    return;
  }
  writeReady();
}
