  function paintWelcome() {
    term.clear();
    term.color(15, 0);

    term.cursor.row = 2;
    term.cursor.col = 8;
    term.write("**** BASIC I ****");

    term.cursor.row = 4;
    term.cursor.col = 16;
    term.write("  ^_^  ");
    term.cursor.row = 5;
    term.cursor.col = 16;
    term.write(" (o o) ");
    term.cursor.row = 6;
    term.cursor.col = 16;
    term.write("  > <  ");

    term.cursor.row = 8;
    term.cursor.col = 10;
    term.write("512 LINES FREE");

    term.cursor.row = 10;
    term.cursor.col = 0;
    term.write("READY.\n");

    term.dirty = true;
    term.flush();

    setStatus();
  }
