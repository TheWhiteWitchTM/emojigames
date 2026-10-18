# Basic I

The glass is 40 columns by 24 rows. The prompt is READY. The language is BASIC. A program can hold 512 lines. This is a learning machine: the same shape as the old 40-column computers, with lessons built in.

A line with a number is stored. A line without one runs now. The words are the same either way. The lessons, the first hour, and every key are in Getting Started and the Tutorial, on the same page.

## When it wakes

The glass stays black. A pale bar blinks at the top left. Two notes, a fourth apart. Then the sign:

```
         ┌────────────────────┐
         │ **** BASIC I ****  │
         │  LEARN BY TYPING   │
         └────────────────────┘

            40 COLUMN GLASS
               MEMORY 512

           HI. LET US LEARN.
        A NUMBER STORES A LINE.
         A BARE LINE RUNS NOW.
      THE LESSONS ARE IN MODULES.

            512 LINES FREE.
READY.
```

The frame is cyan. The name is white. LEARN BY TYPING is cyan. 40 COLUMN GLASS is faint. The count, and 512 LINES FREE, are the color of a low candle. The waking lines are ash. READY is white. What you type after that is ash, until a program runs.

The page is a desk. ▶️ Play fills the screen with the glass, and it stays there. Escape ends the session and returns to the page. Play opens the glass again. A program that was running has stopped. The lines you stored are still there.

Press a key if the notes stay silent. The browser holds the sound until a key arrives. The mouse is not a device here. The pointer is hidden over the glass, and a click does nothing.

A refusal is red, with a mark in front of the words, and two notes going down. ENOUGH is candle-colored, and those two notes are softer. A line that will not take another character only clicks.

The bezel under the glass names the mood, then the lines in use.

| Bezel | Mood |
| --- | --- |
| WAKING | Still counting |
| READING | Opening a built-in module |
| PICKING | The module list is open. The arrows are its |
| READY n/512 | Waiting for you |
| LINE n | Running that line |
| RUNNING | Running, between lines |
| WAITING | INPUT wants an answer |
| AUTO n | Numbering for you |
| FROZEN | SLEEP is holding still |
| GAZE n | The glass is latched, n lines above the pen |

Under that, the keys. Each one is an emoji, a word, and a function key. They are not buttons. F5 is its, not the browser's reload. The glass is already full screen. Escape ends the session.

| Key | What it does |
| --- | --- |
| 📜 LIST F1 | LIST |
| ▶ RUN F2 | RUN |
| 📘 MODULES F3 | MODULES |
| 🧹 CLS F4 | CLS. The letters go, and so do the lines that had rolled off. The sprites stay |
| ✨ AUTO F5 | AUTO. Again, and the numbering stops |
| 🔢 RENUM F6 | RENUM |
| 🔒 LATCH F7 | Scroll lock. Scroll Lock does this too |
| ⎋ BACK ESC | Ends the session and returns to the page. A program that was running stops |

The bar is quiet while it runs, and while the module list is open. LATCH stays lit while it is latched at READY, at AUTO, and while INPUT waits. While AUTO is numbering, the bar still lists, clears, renumbers, and latches. Typing those words on the numbered line stores them, the way RUN would. The function key does the thing.

## Typing

The pale bar is the caret, and it blinks. It is already blinking while the glass is still black. Backspace, Delete, Left, and Right edit the line. A line holds 255 characters, and one emoji is one. Past that it clicks once and takes no more.

It wakes latched. That is the scroll lock, and the word is LATCH. Lines that roll off the top are kept, 512 of them. Up and Down walk those lines. Page Up and Page Down move a glassful, leaving one row so you can see where you were. Home is the oldest line still kept. End sits on the pen. A key that writes also sits on the pen, so the line you were typing is still there. The bezel says GAZE and how far above the pen you are. Ctrl-Up and Ctrl-Down still recall the last 32 lines you sent.

`LATCH` turns the hold on. `LATCH ON` does that too. `LATCH OFF`, or `LATCH` again, opens the glass. Then Up and Down recall, the way a shell does, and Page Up only clicks. Home and End edit the line. F7 and the Scroll Lock key do what the bare word does, without printing a line. The same hold is on while INPUT waits, so you can walk up and read the question. AUTO keeps it. A program does not. While it runs, the arrows belong to the program, and the glass is text.

While the module list is open, Up and Down move the mark. Home and End jump. Page Up and Page Down move a glassful. Enter loads the name under the mark. Escape returns to the page. If the list was open it closes, and it says `OK. THE MODULES CAN WAIT.` The caret stays dark until the list closes.

Enter stores a numbered line, or runs a bare one. A stored line does not print READY. The caret just waits for the next one. An empty Enter at READY prints READY. again.

Escape returns to the page. Ctrl-C stops a program, or a question that is waiting. It says:

```
✋ ENOUGH.
```

From inside a program the line number comes along: `✋ ENOUGH. IN 40`

Paste a block and it takes it one line at a time. Paste into an INPUT and it takes the first line.

## Lines

A line number is an integer from 0 to 63999. The number, then the words. It stores the line. It does not run it. That is the old way, C64 and Apple II, and it kept it. A label, junk, a word it will not run: all of it sits down. It reads it when you say RUN.

```
10 PRINT "WHO?"
20 LABEL MARCO
30 POKE 53280, 0
```

A number with nothing after it deletes that line. Above 63999:

```
🔢 NO. LINES STOP AT 63999.
```

512 stored lines is the wall.

```
🛑 FULL. 512 LINES. STOP.
```

It will store a line it cannot parse. POKE can sit in the program. `10 MARCO` can sit in the program. It fails when the run reaches it.

## At READY

These words work from the prompt. Inside a program they are `🚪 NO. NOT FROM IN HERE.`

| Words | What it does |
| --- | --- |
| LIST | Print the program. The line numbers are yellow |
| LIST n | That line |
| LIST n-m | That range |
| LIST n- | From n through the end |
| LIST -m | From 0 through m |
| RUN | Start at the first line |
| RUN n | Start at the first line numbered n or higher |
| NEW | Wipe the program and the sprites. The glass stays. It says GONE. |
| AUTO | From 10 if the program is empty, otherwise ten past the last line, step 10 |
| AUTO start | From that number, step 10 |
| AUTO start, step | Both. The step has to be at least 1 |
| AUTO OFF | Stop numbering |
| RENUM | Renumber from 10, step 10. RENUMBER is the same word |
| LOAD "NAME" | Load a program kept in this browser. It says LOADED. It does not run it |
| SAVE "NAME" | Keep the program here. It says SAVED. |
| LOAD "module:NAME" | Load a built-in lesson. It does not run it |
| MODULES | Open the lessons. Arrows move. Enter loads. Escape returns to the page |
| UPLOAD | Read a text file. Cancel returns to READY with no speech |
| DOWNLOAD "NAME" | Save NAME.bas. It says TAKE IT. |
| CLS | Clear the glass. The sprites stay |
| HELP | The short list of words |
| LATCH | Toggle the scroll lock |
| LATCH ON | Up walks the lines that rolled off |
| LATCH OFF | Up and Down recall the last 32 lines you sent |

LIST says `RETYPE THE NUMBER. THAT IS THE EDIT.` The number is yellow. The words of the line stay ash. An empty program is `NO LINES.` When there are lines, it ends with `RUN, OR RETYPE A NUMBER.`

RENUM rewrites line numbers in GOTO, GOSUB, RESTORE, a THEN that is only a number, and ON. Labels stay labels. A number that points at no line stays as written. It says RENUMBERED. A renumber that would push a line past 255 characters says 📏 TOO LONG. and leaves the numbers alone.

AUTO prints the next number and waits. What you type is stored under that number, so RUN and AUTO OFF typed there become lines, not commands. An empty line says AUTO OFF. A line it refuses to store keeps the same number.

A file name is a letter, then up to 15 letters, digits, or hyphens. It folds the case. No name:

```
🔖 NAME IT.
```

Nothing there:

```
🌑 NO. IT IS NOT THERE.
```

The lessons are only for reading. A browser that will not open them:

```
📦 IT WOULD NOT OPEN.
```

DOWNLOAD of an empty program says 📭 NOTHING TO RUN. SAVE of an empty program saves an empty program.

## Running

RUN clears the variables, the loops, the calls, the data pointer, the watch, and the sprites. The pen turns green on black for the working. The letters already on the glass stay until CLS, or until they scroll off. What scrolls off is kept until the 512 are full, or until the glass is cleared. While it runs, that memory is not a window. The glass is text, and the arrows belong to the program. When it stops, the pen returns to ash, and the latch is how you walk back up.

A bare GOTO or GOSUB at READY walks into the program and leaves the variables where they sit.

END stops a run and says nothing. STOP does too. An error returns to READY. The variables survive both. The next RUN does not spare them. NEW does not either.

No lines:

```
📭 NOTHING TO RUN.
```

No such line:

```
🚫 NO LINE.
```

It runs in short slices, so Ctrl-C still lands and the sprites still move. Escape returns to the page, and a program that was running stops. A complaint from inside a program gains the line: `🚫 NO LINE. IN 40`

## The words

Case does not matter. A colon puts another statement on the line. A name is a letter, then up to 15 letters or digits. A string name ends in `$`. It keeps the whole word.

A name that is already a word of its is refused:

```
🔒 NO. THAT WORD IS TAKEN.
```

A line it cannot parse:

```
❓ NO. SAY IT AGAIN.
```

### REM

The rest of that line is a comment. `'` does the same. It eats the rest, periods and colons included. A note is for the person reading LIST. RUN skips it.

### PRINT

PRINT writes. `?` is PRINT. A comma jumps to the next column that is a multiple of 10. A semicolon stays. A trailing comma or semicolon holds the line open. PRINT alone writes a blank line.

A positive number grows a leading space. A whole number under a billion prints as a whole number. Anything else prints to eight digits, and the very large and the very small go scientific.

TAB(n) and SPC(n) belong only inside PRINT. Column 0 is the left edge. TAB past the right edge starts a new line at column 0.

### INK

INK writes one line through the glass's own color codes. A `{31}` in the string is ink. `31` is dark red. `1;97` is bold white. `38;5;141` is one of the 256. `38;2;232;206;168` is a color mixed on the spot. `2` is faint. A background is `45`, purple. A doubled `{` is one brace. INK with nothing after it writes a blank line. A number where a string belongs is the wrong kind of thing.

`COLORS` in the modules is that sample. A line number changes one.

### INPUT

INPUT N$ waits for a line. INPUT "NAME"; N$ writes `NAME? ` and waits. A comma after the prompt skips the question mark: INPUT "NAME", N$

One variable keeps the whole answer, commas included. Several variables split on commas. The wrong count:

```
🔁 AGAIN.
```

A number variable that did not get a number:

```
🔢 AGAIN. A NUMBER.
```

It asks again until the answer fits, or until Ctrl-C. Escape returns to the page and leaves the question waiting.

### LET

LET A = 1 stores a number. A = 1 stores the same number. Strings and numbers do not change clothes.

```
🎭 NO. WRONG KIND OF THING.
```

A new number name starts at 0. A new string name starts empty.

### GOTO, GOSUB, RETURN, LABEL

GOTO 100 jumps to that line. GOTO START jumps to LABEL START. GO TO is the same jump. The spot has to exist.

GOSUB START calls it. GO SUB is the same call. RETURN comes back. RETURN with nobody waiting:

```
📭 RETURN, AND NOBODY CALLED.
```

Two LABELs with one name:

```
🔖 NO. THAT NAME IS TAKEN.
```

Calls and loops each stop at 32 deep.

```
📚 TOO DEEP.
```

### IF

IF N$ = "" THEN PRINT "LEAVE." : END runs the rest of the line when the test is true. A false test skips the rest of the line. There is no second branch.

IF N = 1 THEN 200 jumps when the test is true, and only when that number is the whole statement. Whatever follows it on the line still belongs to the IF, so a true jump leaves it behind and a false test skips it.

### FOR and NEXT

FOR I = 1 TO 13 counts. NEXT ends the lap. NEXT I names the loop. The body runs once even when the start is already past the end. That is the old way, and it kept it.

STEP may be negative. STEP 0:

```
🚫 STEP OF NOTHING. NO.
```

NEXT I closes the loop named I, and any loop inside it. A new FOR of the same name throws out the old one. NEXT with no FOR:

```
➰ NEXT, AND NOTHING TO NEXT.
```

A string cannot count.

### END and SLEEP

END ends the program. STOP does too. It does not announce either one.

SLEEP waits for a key. SLEEP 500 waits 500 milliseconds. The longest wait is 60000. A key or Escape ends a bare SLEEP. Escape also cuts a timed one, and returns to the page.

### DATA, READ, RESTORE

DATA stores items for READ. An item is a number, a quoted string, or one bare word. A minus may sit in front of a number.

```
10 DATA 3, "CUP", BONE, -1
20 READ N, A$, W$, M
```

The kind has to match the variable. RESTORE starts the pointer over. RESTORE 100, or RESTORE of a label, starts at the first item on or after that line. When the data is spent:

```
📜 OUT OF DATA.
```

### ON

ON N GOTO 10, 20, 30 jumps to the Nth target. The count starts at 1. ON N GOSUB START, LATER calls instead. Outside the list, it walks on to the next statement.

### DIM

DIM A(10) makes slots 0 through 10. DIM B$(3, 4) makes two axes. One or two axes, no more. The biggest index is 2000. One array holds at most 20000 cells.

Ask for the same array twice, or ask for one that was never made:

```
📦 NO. IT HAS NO ROOM.
```

An index outside the array:

```
📐 NO. OUTSIDE THE ROOM.
```

## Older names

You do not need this table to learn. The lessons use the BASIC names.

Witch I speaks WASIC. A listing from that machine still runs here. The words on the right are the old ones.

| BASIC | The other name |
| --- | --- |
| PRINT, and ? | CHANT |
| GOTO, and GO TO | FLYTO |
| GOSUB, and GO SUB | SUMMON |
| RETURN | BANISH |
| FOR | CURSE |
| NEXT | BREAK |
| LET | CONJURE |
| INPUT | DEMAND |
| REM, and ' | WHISPER |
| DATA | OFFERING |
| READ | TAKE |
| RESTORE | REWIND |
| END, and STOP | DISPEL |
| CLS | SCRUB |
| LOCATE row, col | AT col, row |
| SLEEP | FREEZE |
| SOUND | TONE |
| INK | VEIL |
| LABEL | MARK |
| SPRITE | MINION |
| ON n GOTO | WHEN n FLYTO |
| ON n GOSUB | WHEN n SUMMON |
| INKEY$ | LISTEN$ |
| LIST | REVEAL, with no color |
| NEW | VANISH, which also clears the glass |
| LOAD | UNSEAL |
| SAVE | SEAL |
| AUTO | MAGIC |
| RENUM | RENUMBER |
| HELP | GRIMOIRE |

## The sums

The marks are `+ - * / ^`. Power binds tighter than the rest, and it binds to the right, so `2^3^2` is 512. A leading minus sits looser than power, so `-2^2` is -4.

Comparisons are `= <> < > <= >=`. `><` means `<>`. AND is tighter than OR. NOT flips the truth. A comparison, AND, OR, and NOT all answer 1 or 0. Any number but 0 counts as true. AND and OR leave the unused side alone.

A string plus a string joins them. A string holds 255 characters, counted the same way as a line, and one emoji is one. Past that:

```
🧵 TOO LONG A STRING.
```

A string mixed with a number is the wrong kind of thing. Dividing by zero, or MOD by zero:

```
➗ CUTE. DIVIDE BY NOTHING.
```

A result that will not fit:

```
💥 TOO BIG.
```

Quotes wrap a string. Two quotes inside a string are one quote.

## Functions

Parentheses, then the arguments. INKEY$, LISTEN$, TICK, COLS, and ROWS may skip the parentheses.

| Function | Answer |
| --- | --- |
| INT(n) | Toward the more negative side. INT(-1.2) is -2 |
| ABS(n) | Distance from zero |
| SQR(n) | Square root. A negative is the wrong kind of thing |
| SIN COS TAN ATN | Radians |
| LOG(n) | Natural log. Zero and below are the wrong kind |
| EXP(n) | e to that power |
| SGN(n) | -1, 0, or 1 |
| RND(n) | See below |
| LEN(s$) | Characters. One emoji is one |
| VAL(s$) | A number read from the front, or 0 |
| ASC(s$) | The first code. An empty string is the wrong kind |
| STR$(n) | The number as PRINT would write it, leading space included |
| CHR$(n) | The character, codes 0 through 255 |
| LEFT$(s$, n) | The first n characters. Count starts at 1 |
| RIGHT$(s$, n) | The last n |
| MID$(s$, start) | From that character to the end. Start counts from 1 |
| MID$(s$, start, n) | n characters from there |
| MOD(a, b) | The remainder, a - b * INT(a / b) |
| COL(id) ROW(id) | Where that sprite is, in cells |
| VX(id) VY(id) | Its speed, in cells per second |
| HELD(s$) | 1 while that key is down. "ArrowLeft", "a", "A" |
| INKEY$, LISTEN$ | The next key seen while running, or "" |
| TICK | Milliseconds since it woke |
| FRE(n) | 512 minus the lines stored. n is required, numeric, and ignored |
| COLS ROWS | 40 and 24 |
| SPRITE(picture$, x, y) | Make one. Size defaults to 28. The number comes back, and IT is set |
| SPRITE(picture$, x, y, size) | Same, with a size |

RND(1), or any positive number, draws the next value from 0 up to but not including 1. RND(0) repeats the last draw. RND of a negative number plants a new seed from its absolute whole part. The seed starts at 1. The roll is the usual cheap one: multiply by 1664525, add 1013904223, keep the low 32 bits, divide by 2^32.

A letter in HELD matches either case. INKEY$ keeps the case of the key, and it only collects keys while a program is running. The queue holds 32.

GET A$ stores that same key.

## The glass

Places are cells. The left top is 0, 0. The right bottom is 39, 23. A mark that falls off the glass is ignored.

COLOR fg, bg sets the pen. Leave the bg off and the old background stays. The numbers:

| n | Color | n | Color |
| --- | --- | --- | --- |
| 0 | black | 8 | dark gray |
| 1 | dark red | 9 | red |
| 2 | dark green | 10 | green |
| 3 | brown | 11 | yellow |
| 4 | dark blue | 12 | blue |
| 5 | purple | 13 | pink |
| 6 | teal | 14 | cyan |
| 7 | gray | 15 | white |

It wakes in COLOR 7, 0. Ash on black. READY is written in white. RUN sets the pen to COLOR 10, 0 for the working. When it stops, the ash returns.

CLS clears the letters and sends the caret home. Sprites stay.

LOCATE row, col puts the caret there, row first, clamped onto the glass. AT col, row is column first. LOCATE 23, 0 and AT 0, 23 are the same cell.

CIRCLE x, y, r draws a circle of ●. LINE x1, y1, x2, y2 draws a line of ●. FILL x, y floods connected empty cells with ●, up, down, left, and right. FILL does nothing when the cell is off the glass or already marked.

SOUND freq, ms plays a square note and waits, so a tune stays in order. Frequency runs from 20 to 8000. The wait runs from 0 to 8000 milliseconds. Escape cuts it and returns to the page.

## Sprites

A sprite is an emoji on the same glass, drawn in front of the letters. The cell you name is where it parks, on the center of that cell.

```
SPRITE "👻", 3, 6, 30
```

The size is in pixels, from 1 to 180. Skip it and the size is 28. An empty picture becomes ●. The number starts at 1 and is never reused. IT holds the latest one.

SEND id, vx, vy sets the speed in cells per second. DESTROY id removes one. DESTROY with no number removes every one of them.

Thirty-two living sprites is the house limit.

```
👻 NO. TOO MANY SPRITES.
```

A number that is not alive:

```
👻 NO. THAT SPRITE IS GONE.
```

They touch when the circles overlap. The radius is half the size. WATCH HIT names a LABEL. The moment two sprites start to overlap, it sets HIT and OTHER to their numbers and GOSUBs that label. RETURN comes back to the statement it interrupted. It does not call again until they separate and meet once more. The handler has to RETURN. Forget, and the calls pile up until 📚 TOO DEEP.

## What it refuses

PLOT, DRAW, PSET, and PRESET are stored, and they fail when the run reaches them.

```
🙊 NO. NOT ON THIS MACHINE.
```

These are recognized. It stores them. When it reaches them it complains, because you peeked, poked, or sysed it, and it is not a kernel.

| Word | What it says |
| --- | --- |
| PEEK | 👀 STOP PEEKING. |
| POKE | 👉 DON'T POKE ME. |
| SYS | 🛑 NO SYS. I WOKE ON MY OWN. |
| WAIT | ⏳ I DO NOT WAIT ON THAT WIRE. |
| USR | 🪝 USR. I AM NOT A HOOK. |
| CALL | 📞 DO NOT CALL ME THAT WAY. |

`A = PEEK(1)` is a peek. `POKE 1, 2` is a poke. `SYS 64738` is a sys. Direct or stored, same speech. The leftover wire, if you find one:

```
🔌 NO. THAT WIRE IS DEAD.
```

## The modules

The lessons are files in `modules/`. The extension is `.bas`. `catalog.txt` is the order. A `#` line in that file is a note. MODULES opens the list on the glass. The mark starts on the first name. Up and down move it. Enter loads that name and does not run it. It says `LIST IT. A NUMBER CHANGES A LINE.` Escape says `OK. THE MODULES CAN WAIT.` Anything saved in this browser sits under `YOUR SAVED PROGRAMS`. `LOAD "module:HELLO"` still loads one if you would rather type. Then RUN. It lowercases the name and adds `.bas` itself.

HELLO asks your name. COUNT counts to 10. GUESS wants 1 to 100. DICE rolls from one to twelve. QUIZ reads three questions. CIRCLES draws. BOUNCE puts a star and a ball on the glass. KEYS prints the key you press. SCALE plays eight notes. CAT walks the glass and turns at the edges. COLORS paints with the sixteen pens, and with ink mixed on the spot.

## Three that have to run

A question:

```
10 REM Start
20 PRINT "WHO?"
30 INPUT "NAME"; N$
40 IF N$ = "" THEN PRINT "LEAVE." : END
50 PRINT "ENTER "; N$
60 END
```

A count:

```
10 FOR I = 1 TO 13
20 PRINT I
30 NEXT I
```

A label:

```
10 LABEL START
20 PRINT "AGAIN"
30 GOTO START
```

The third one does not stop. Ctrl-C is the door. Escape returns to the page.

## What it says

| When | Text |
| --- | --- |
| It cannot parse it | ❓ NO. SAY IT AGAIN. |
| PLOT or DRAW | 🙊 NO. NOT ON THIS MACHINE. |
| PEEK | 👀 STOP PEEKING. |
| POKE | 👉 DON'T POKE ME. |
| SYS | 🛑 NO SYS. I WOKE ON MY OWN. |
| WAIT | ⏳ I DO NOT WAIT ON THAT WIRE. |
| USR | 🪝 USR. I AM NOT A HOOK. |
| CALL | 📞 DO NOT CALL ME THAT WAY. |
| No such line | 🚫 NO LINE. |
| Wrong kind of value | 🎭 NO. WRONG KIND OF THING. |
| Line 513 | 🛑 FULL. 512 LINES. STOP. |
| Divide by zero | ➗ CUTE. DIVIDE BY NOTHING. |
| Dead sprite | 👻 NO. THAT SPRITE IS GONE. |
| Line longer than 255 | 📏 TOO LONG. |
| String longer than 255 | 🧵 TOO LONG A STRING. |
| NEXT with no FOR | ➰ NEXT, AND NOTHING TO NEXT. |
| RETURN with no GOSUB | 📭 RETURN, AND NOBODY CALLED. |
| READ past the end | 📜 OUT OF DATA. |
| Wrong number of answers | 🔁 AGAIN. |
| Answer was not a number | 🔢 AGAIN. A NUMBER. |
| The math overflowed | 💥 TOO BIG. |
| More than 32 calls or loops | 📚 TOO DEEP. |
| Editor words inside a program | 🚪 NO. NOT FROM IN HERE. |
| RUN with no program | 📭 NOTHING TO RUN. |
| STEP 0 | 🚫 STEP OF NOTHING. NO. |
| DIM refused, or no such array | 📦 NO. IT HAS NO ROOM. |
| Index outside the array | 📐 NO. OUTSIDE THE ROOM. |
| A 33rd sprite | 👻 NO. TOO MANY SPRITES. |
| A name that is already a word | 🔒 NO. THAT WORD IS TAKEN. |
| A label used twice | 🔖 NO. THAT NAME IS TAKEN. |
| Line number past 63999 | 🔢 NO. LINES STOP AT 63999. |
| Escape or Ctrl-C | ✋ ENOUGH. |
| SAVE with no name | 🔖 NAME IT. |
| SAVE worked | SAVED. |
| LOAD worked | LOADED. |
| No such program | 🌑 NO. IT IS NOT THERE. |
| The browser would not open | 📦 IT WOULD NOT OPEN. |
| RENUM worked | RENUMBERED. |
| NEW | GONE. |
| DOWNLOAD | TAKE IT. |
| Left AUTO | AUTO OFF. |

READY.

## Limits, in one place

Witch I is a different machine. Its walls are in `SYSTEM.md`. These are the walls on this one.

- 512 lines in a program. FRE(0) is how many are left.
- 512 lines kept after they roll off the top. CLS forgets them.
- 255 characters on a typed line, and 255 in a string. One emoji is one.
- Line numbers 0 through 63999.
- Names are the whole word, up to 16 letters and digits, then `$` if it is a string.
- File names add hyphens, and stop at 16 characters.
- 32 loops, 32 calls, 32 living sprites, 32 remembered lines, 32 keys waiting, 8 meetings waiting.
- One or two axes. Each array holds at most 20000 cells. Indexes run 0 through 2000.
- The lessons are a folder of `.bas` files, and that folder is only for reading. MODULES opens them. SAVE and LOAD without `module:` use this browser. UPLOAD and DOWNLOAD use the computer you are sitting at.
- Sprites are emoji. The touch radius is half the size. They share the glass with the letters, and they are drawn in front.
