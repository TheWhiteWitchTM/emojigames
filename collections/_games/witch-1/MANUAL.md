# Witch ][

The glass is 40 columns by 24 rows. The prompt is SPEAK. READY is a word from the machines next door, and she does not keep their hours. The language is WASIC. She has 666 lines of memory, and the dialect next door can sit down.

A line with a number is stored. A line without one runs now. The words are the same either way.

## When she wakes

The glass stays black. A pale bar blinks at the top left, and nothing else is on it. Then she bothers to arrive. The count climbs to 666. The glass says:

```
☾

WITCH ][

THE GLASS IS BLACK.

MEMORY 666

SHE WOKE UP.
THE CIRCLE HOLDS.
WASIC SPEAKS.
BASIC CAN SIT IN THE DARK.

666 LINES FREE.
SPEAK.
```

The moon is a faint purple. The name is white. The line about the glass is faint. The count is the color of a low candle. The line about BASIC is dark red. The rest is ash. SPEAK is white. What you type after that is ash, until a program runs.

Click the glass once if the two notes stay silent. They are low, a fifth apart. The browser holds the sound until a hand arrives.

The bezel under the glass names the mood, then the lines in use.

| Bezel | Mood |
| --- | --- |
| WAKING | Still counting |
| SPEAK n/666 | Waiting for you |
| LINE n | Running that line |
| RUNNING | Running, between lines |
| WAITING | DEMAND wants an answer |
| AUTO n | Numbering for you |
| FROZEN | FREEZE is holding still |

## Typing

The pale bar is the caret, and it blinks. It is already blinking while the glass is still black. Backspace, Delete, the arrows, Home, and End edit the line. Up and Down walk the last 32 lines you sent. A line holds 255 characters. Past that she rings the bell and takes no more.

Enter stores a numbered line, or runs a bare one. An empty Enter at SPEAK prints SPEAK. again.

Escape at SPEAK clears the line you have not sent. Escape while she runs, or while she waits for an answer, stops her. Ctrl-C does that too. She says:

```
ENOUGH.
```

From inside a program the line number comes along: `ENOUGH. IN 40`

Paste a block and she takes it one line at a time. Paste into a DEMAND and she takes the first line.

## Lines

A line number is an integer from 0 to 63999. The number, then the words.

```
10 CHANT "WHO?"
```

A number with nothing after it deletes that line. Above 63999:

```
NO. LINES STOP AT 63999.
```

666 stored lines is the wall.

```
FULL. 666 LINES. STOP.
```

She will store a line she intends to refuse later. PRINT can sit in the program. It fails when she reaches it. She likes to wait.

## At SPEAK

These words work from the prompt. Inside a program they are `NO. NOT FROM IN HERE.`

| Words | What she does |
| --- | --- |
| REVEAL | Print the program, low number first |
| REVEAL n | That line |
| REVEAL n-m | That range |
| REVEAL n- | From n through the end |
| REVEAL -m | From 0 through m |
| OBLITERATE n | Delete line n |
| OBLITERATE n-m | Delete the range. Same open ends as REVEAL |
| RENUMBER | Renumber from 10, step 10 |
| VANISH | Wipe the program, the minions, and the glass |
| AUTO | From 10 if the program is empty, otherwise ten past the last line, step 10 |
| AUTO start | From that number, step 10 |
| AUTO start, step | Both. The step has to be at least 1 |
| AUTO OFF | Stop numbering |
| RUN | Start at the first line |
| RUN n | Start at the first line numbered n or higher |
| SHELF | List the box, then anything sealed in this browser |
| SEAL "NAME" | Keep the program here. She says SEALED. |
| UNSEAL "NAME" | Load it. She says UNSEALED. She does not run it |
| UNSEAL "shelf:NAME" | Load a program from the box |
| UPLOAD | Read a text file. Cancel returns to SPEAK with no speech |
| DOWNLOAD "NAME" | Save NAME.wasic. She says TAKE IT. |
| GRIMOIRE | The short list of words |
| HELP | She says GRIMOIRE. NOT HELP. Then the list. She says it again at the end, because the glass scrolls |

An empty REVEAL prints nothing. OBLITERATE with no range is `NO. SAY IT AGAIN.`

RENUMBER rewrites line numbers in FLYTO, SUMMON, REWIND, a THEN that is only a number, and WHEN. Labels stay labels. A number that points at no line stays as written. She says RENUMBERED.

VANISH says GONE. The variables go with the program.

AUTO prints the next number and waits. What you type is stored under that number, so RUN and AUTO OFF typed there become lines, not commands. An empty line says AUTO OFF. A line she refuses to store keeps the same number. From SPEAK, AUTO OFF stops it too. RENUMBER that would push a line past 255 characters says TOO LONG. and leaves the numbers alone.

A file name is a letter, then up to 15 letters, digits, or hyphens. She folds the case. No name:

```
NAME IT.
```

Nothing there:

```
NO. IT IS NOT THERE.
```

The shelf is only for reading. A browser that will not open its box:

```
THE BOX IS SHUT.
```

DOWNLOAD of an empty program says NOTHING TO RUN. SEAL of an empty program seals an empty program. That is your business.

## Running

RUN clears the variables, the loops, the calls, the offering pointer, the watch, and the minions. The pen turns green on black for the working. The letters already on the glass stay until SCRUB, or until they scroll off. When she stops, the pen returns to ash.

A bare FLYTO or SUMMON at SPEAK walks into the program and leaves the variables where they sit.

DISPEL ends a run and says nothing. An error returns to SPEAK. The variables survive both. The next RUN does not spare them. VANISH does not either.

No lines:

```
NOTHING TO RUN.
```

No such line:

```
NO LINE.
```

She runs in short slices, so Escape still lands and the minions still move. A complaint from inside a program gains the line: `NO LINE. IN 40`

## The words

Case does not matter. A colon puts another statement on the line. A name is a letter, then up to 15 letters or digits. A string name ends in `$`. She keeps the whole word.

A name that is already a word of hers is refused:

```
NO. THAT WORD IS TAKEN.
```

A line she cannot parse:

```
NO. SAY IT AGAIN.
```

### WHISPER

The rest of that line is a comment. She eats it, colons included.

### CHANT

CHANT writes. A comma jumps to the next column that is a multiple of 10. A semicolon stays. A trailing comma or semicolon holds the line open. CHANT alone writes a blank line.

A positive number grows a leading space. A whole number under a billion prints as a whole number. Anything else prints to eight digits, and the very large and the very small go scientific.

TAB(n) and SPC(n) belong only inside CHANT. Column 0 is the left edge. TAB past the right edge starts a new line at column 0.

### DEMAND

DEMAND N$ waits for a line. DEMAND "NAME"; N$ writes `NAME? ` and waits. A comma after the prompt skips the question mark: DEMAND "NAME", N$

One variable keeps the whole answer, commas included. Several variables split on commas. The wrong count:

```
AGAIN.
```

A number variable that did not get a number:

```
AGAIN. A NUMBER.
```

She asks again until the answer fits, or until Escape.

### CONJURE

CONJURE A = 1 stores a number. A = 1 stores the same number. Strings and numbers do not change clothes.

```
NO. WRONG KIND OF THING.
```

A new number name starts at 0. A new string name starts empty.

### FLYTO, SUMMON, BANISH, MARK

FLYTO 100 jumps to that line. FLYTO start jumps to MARK start. The spot has to exist.

SUMMON start calls it. BANISH returns. BANISH with nobody waiting:

```
BANISH, AND NOBODY CALLED.
```

Two MARKs with one name:

```
NO. THAT NAME IS TAKEN.
```

Calls and loops each stop at 32 deep.

```
TOO DEEP.
```

### IF

IF N$ = "" THEN CHANT "LEAVE." : DISPEL runs the rest of the line when the test is true. A false test skips the rest of the line. There is no second branch.

IF N = 1 THEN 200 jumps when the test is true, and only when that number is the whole statement. Whatever follows it on the line still belongs to the IF, so a true jump leaves it behind and a false test skips it.

### CURSE and BREAK

CURSE I = 1 TO 13 counts. BREAK ends the lap. The body runs once even when the start is already past the end. That is the old way, and she kept it.

STEP may be negative. STEP 0:

```
STEP OF NOTHING. NO.
```

BREAK I closes the loop named I, and any loop inside it. A new CURSE of the same name throws out the old one. BREAK with no CURSE:

```
BREAK, AND NOTHING TO BREAK.
```

A string cannot count.

### DISPEL and FREEZE

DISPEL ends the program. She does not announce it.

FREEZE waits for a key. FREEZE 500 waits 500 milliseconds. The longest wait is 60000. A key or Escape ends a bare FREEZE. Escape also cuts a timed one.

### OFFERING, TAKE, REWIND

OFFERING stores items for TAKE. An item is a number, a quoted string, or one bare word. A minus may sit in front of a number.

```
10 OFFERING 3, "CUP", BONE, -1
20 TAKE N, A$, W$, M
```

The kind has to match the variable. REWIND starts the pointer over. REWIND 100, or REWIND of a label, starts at the first item on or after that line. When the offering is spent:

```
THE OFFERING IS GONE.
```

### WHEN

WHEN N FLYTO 10, 20, 30 jumps to the Nth target. The count starts at 1. WHEN N SUMMON start, later calls instead. Outside the list, she walks on to the next statement.

### DIM

DIM A(10) makes slots 0 through 10. DIM B$(3, 4) makes two axes. One or two axes, no more. The biggest index is 2000. One array holds at most 20000 cells.

Ask for the same array twice, or ask for one that was never made:

```
NO. IT HAS NO ROOM.
```

An index outside the array:

```
NO. OUTSIDE THE ROOM.
```

## The sums

The marks are `+ - * / ^`. Power binds tighter than the rest, and it binds to the right, so `2^3^2` is 512. A leading minus sits looser than power, so `-2^2` is -4.

Comparisons are `= <> < > <= >=`. `><` means `<>`. AND is tighter than OR. NOT flips the truth. A comparison, AND, OR, and NOT all answer 1 or 0. Any number but 0 counts as true. AND and OR leave the unused side alone.

A string plus a string joins them. A string mixed with a number is the wrong kind of thing. Dividing by zero, or MOD by zero:

```
CUTE. DIVIDE BY NOTHING.
```

A result that will not fit:

```
TOO BIG.
```

Quotes wrap a string. Two quotes inside a string are one quote.

## Functions

Parentheses, then the arguments. LISTEN$, TICK, COLS, and ROWS may skip the parentheses.

| Function | Answer |
| --- | --- |
| INT(n) | Down, toward the pit. INT(-1.2) is -2 |
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
| STR$(n) | The number as CHANT would write it, leading space included |
| CHR$(n) | The character, codes 0 through 255 |
| LEFT$(s$, n) | The first n characters. Count starts at 1 |
| RIGHT$(s$, n) | The last n |
| MID$(s$, start) | From that character to the end. Start counts from 1 |
| MID$(s$, start, n) | n characters from there |
| MOD(a, b) | The remainder, a - b * INT(a / b) |
| COL(id) ROW(id) | Where that minion is, in cells |
| VX(id) VY(id) | Its speed, in cells per second |
| HELD(s$) | 1 while that key is down. "ArrowLeft", "a", "A" |
| LISTEN$ | The next key seen while running, or "" |
| TICK | Milliseconds since she woke |
| FRE(n) | 666 minus the lines stored. n is required, numeric, and ignored |
| COLS ROWS | 40 and 24 |
| MINION(picture$, x, y) | Make one. Size defaults to 28. The number comes back, and IT is set |
| MINION(picture$, x, y, size) | Same, with a size |

RND(1), or any positive number, draws the next value from 0 up to but not including 1. RND(0) repeats the last draw. RND of a negative number plants a new seed from its absolute whole part. The seed starts at 1. The roll is the usual cheap one: multiply by 1664525, add 1013904223, keep the low 32 bits, divide by 2^32.

A letter in HELD matches either case. LISTEN$ keeps the case of the key, and she only collects keys while a program is running. The queue holds 32.

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

She wakes in COLOR 7, 0. Ash on black. SPEAK is written in white. RUN sets the pen to COLOR 10, 0 for the working. When she stops, the ash returns.

SCRUB clears the letters and sends the caret home. Minions stay.

AT col, row puts the caret there, clamped onto the glass.

CIRCLE x, y, r draws a circle of ●. LINE x1, y1, x2, y2 draws a line of ●. FILL x, y floods connected empty cells with ●, up, down, left, and right. FILL does nothing when the cell is off the glass or already marked.

TONE freq, ms plays a square note and waits, so a tune stays in order. Frequency runs from 20 to 8000. The wait runs from 0 to 8000 milliseconds. Escape cuts it.

## Minions

A minion is an emoji on the same glass, drawn in front of the letters. The cell you name is where she parks it, on the center of that cell.

```
MINION "👻", 3, 6, 30
```

The size is in pixels, from 1 to 180. Skip it and the size is 28. An empty picture becomes ●. The number starts at 1 and is never reused. IT holds the latest one.

SEND id, vx, vy sets the speed in cells per second. DESTROY id removes one. DESTROY with no number removes every one of them.

Thirty-two living minions is the house limit.

```
NO. TOO MANY MINIONS.
```

A number that is not alive:

```
NO. THAT MINION IS GONE.
```

They touch when the circles overlap. The radius is half the size. WATCH hit names a MARK. The moment two minions start to overlap, she sets HIT and OTHER to their numbers and SUMMONs that label. BANISH returns to the statement she interrupted. She does not call again until they separate and meet once more. The handler has to BANISH. Forget, and the calls pile up until TOO DEEP.

## What she refuses

These are stored, and they fail when she reaches them.

```
NO. SHE DOES NOT SPEAK THAT.
```

PRINT GOTO GOSUB RETURN FOR NEXT LET INPUT REM DATA READ RESTORE END STOP NEW LIST LOAD SAVE CLS LOCATE SOUND PLOT DRAW SLEEP GET

These are recognized, and the wire is dead.

```
NO. THAT WIRE IS DEAD.
```

POKE PEEK SYS WAIT USR CALL

## The box

SHELF prints the names. UNSEAL "shelf:GUESS" loads one. Then RUN.

HELLO asks a name and pretends that once was enough.

```
10 SCRUB
20 CHANT "STATE YOUR NAME."
30 DEMAND N$
40 IF N$ = "" THEN CHANT "SHY. FINE. LEAVE." : DISPEL
50 CHANT "HELLO, "; N$; "."
60 CHANT "I WILL NOT SAY IT TWICE."
70 DISPEL
```

GUESS wants 1 to 100 and comments on the route.

```
10 SCRUB
20 CHANT "A NUMBER. 1 TO 100."
30 CONJURE S = INT(RND(1) * 100) + 1
40 CONJURE T = 0
50 MARK AGAIN
60 T = T + 1
70 DEMAND "GUESS"; G
80 IF G = S THEN FLYTO YES
90 IF G < S THEN CHANT "HIGHER. OBVIOUSLY." : FLYTO AGAIN
100 CHANT "LOWER. DO KEEP UP."
110 FLYTO AGAIN
120 MARK YES
130 CHANT "YES."; T; " TRIES. ADORABLE."
140 DISPEL
```

DICE rolls from one to twelve bones.

```
10 SCRUB
20 DEMAND "HOW MANY BONES"; N
30 IF N < 1 OR N > 12 THEN CHANT "BETWEEN 1 AND 12." : FLYTO 20
40 CURSE I = 1 TO N
50 CONJURE R = INT(RND(1) * 6) + 1
60 CHANT "BONE"; I; ":"; R
70 BREAK
80 CHANT "THAT IS ALL THE FATE YOU GET."
90 DISPEL
```

OMEN reads three lines and sends you home.

```
10 SCRUB
20 OFFERING "THE CUP IS EMPTY.", "SHE COUNTS THE KNIVES.", "A DOOR OPENS IN THE WALL.", "NOTHING ANSWERS. THAT IS AN ANSWER."
30 CHANT "THREE OMENS. DO NOT BLINK."
40 CURSE I = 1 TO 3
50 TAKE A$
60 CHANT I; ". "; A$
70 BREAK
80 CHANT "GO HOME."
90 DISPEL
```

CIRCLES draws, beeps, and calls it art.

```
10 SCRUB
20 COLOR 10, 0
30 CURSE R = 2 TO 10 STEP 2
40 CIRCLE 20, 12, R
50 TONE 200 + R * 40, 20
60 BREAK
70 COLOR 11, 0
80 LINE 0, 12, 39, 12
90 LINE 20, 0, 20, 23
100 AT 0, 23
110 CHANT "THERE. ART.";
120 DISPEL
```

MINIONS puts a ghost and a bat on the glass. Escape stops them. HIT is the collision's variable. The label HIT is a different thing, and she can tell.

```
10 SCRUB
20 AT 0, 0
30 CHANT "TWO OF THEM. ESC STOPS IT.";
40 CONJURE A = MINION("👻", 3, 6, 30)
50 CONJURE B = MINION("🦇", 30, 16, 30)
60 SEND A, 10, 4
70 SEND B, -8, -3
80 WATCH HIT
90 MARK LOOP
100 IF (COL(A) <= 1 AND VX(A) < 0) OR (COL(A) >= 36 AND VX(A) > 0) THEN SEND A, -VX(A), VY(A)
110 IF (ROW(A) <= 2 AND VY(A) < 0) OR (ROW(A) >= 21 AND VY(A) > 0) THEN SEND A, VX(A), -VY(A)
120 IF (COL(B) <= 1 AND VX(B) < 0) OR (COL(B) >= 36 AND VX(B) > 0) THEN SEND B, -VX(B), VY(B)
130 IF (ROW(B) <= 2 AND VY(B) < 0) OR (ROW(B) >= 21 AND VY(B) > 0) THEN SEND B, VX(B), -VY(B)
140 FREEZE 20
150 FLYTO LOOP
160 MARK HIT
170 SEND HIT, -VX(HIT), -VY(HIT)
180 SEND OTHER, -VX(OTHER), -VY(OTHER)
190 TONE 480, 20
200 BANISH
```

KEYS prints the key you press. Q leaves.

```
10 SCRUB
20 AT 0, 0
30 CHANT "PRESS KEYS. Q LEAVES.";
40 MARK LOOP
50 K$ = LISTEN$()
60 IF K$ = "Q" OR K$ = "q" THEN DISPEL
70 IF K$ <> "" THEN AT 2, 2 : CHANT K$; "   ";
80 FREEZE 20
90 FLYTO LOOP
```

## Three that have to run

A question:

```
10 WHISPER Start
20 CHANT "WHO?"
30 DEMAND "NAME"; N$
40 IF N$ = "" THEN CHANT "LEAVE." : DISPEL
50 CHANT "ENTER "; N$
60 DISPEL
```

A count:

```
10 CURSE I = 1 TO 13
20 CHANT I
30 BREAK
```

A label:

```
10 MARK start
20 CHANT "AGAIN"
30 FLYTO start
```

The third one does not stop. Escape is the door.

## What she says

| When | Text |
| --- | --- |
| She cannot parse it | NO. SAY IT AGAIN. |
| A BASIC word | NO. SHE DOES NOT SPEAK THAT. |
| POKE and the other dead wires | NO. THAT WIRE IS DEAD. |
| No such line | NO LINE. |
| Wrong kind of value | NO. WRONG KIND OF THING. |
| Line 667 | FULL. 666 LINES. STOP. |
| Divide by zero | CUTE. DIVIDE BY NOTHING. |
| Dead minion | NO. THAT MINION IS GONE. |
| Line longer than 255 | TOO LONG. |
| BREAK with no CURSE | BREAK, AND NOTHING TO BREAK. |
| BANISH with no SUMMON | BANISH, AND NOBODY CALLED. |
| TAKE past the end | THE OFFERING IS GONE. |
| Wrong number of answers | AGAIN. |
| Answer was not a number | AGAIN. A NUMBER. |
| The math overflowed | TOO BIG. |
| More than 32 calls or loops | TOO DEEP. |
| Editor words inside a program | NO. NOT FROM IN HERE. |
| RUN with no program | NOTHING TO RUN. |
| STEP 0 | STEP OF NOTHING. NO. |
| DIM refused, or no such array | NO. IT HAS NO ROOM. |
| Index outside the array | NO. OUTSIDE THE ROOM. |
| A 33rd minion | NO. TOO MANY MINIONS. |
| A name that is already a word | NO. THAT WORD IS TAKEN. |
| A label used twice | NO. THAT NAME IS TAKEN. |
| Line number past 63999 | NO. LINES STOP AT 63999. |
| Escape or Ctrl-C | ENOUGH. |
| SEAL with no name | NAME IT. |
| SEAL worked | SEALED. |
| UNSEAL worked | UNSEALED. |
| No such program | NO. IT IS NOT THERE. |
| The browser refused the box | THE BOX IS SHUT. |
| RENUMBER worked | RENUMBERED. |
| VANISH | GONE. |
| DOWNLOAD | TAKE IT. |
| Left AUTO | AUTO OFF. |

SPEAK.

## Limits, in one place

- 666 lines.
- 255 characters on a typed line.
- Line numbers 0 through 63999.
- Names are the whole word, up to 16 letters and digits, then `$` if it is a string.
- File names add hyphens, and stop at 16 characters.
- 32 loops, 32 calls, 32 living minions, 32 remembered lines, 32 keys waiting.
- One array, at most 20000 cells, indexes 0 through 2000.
- The shelf is read-only. SEAL and UNSEAL use this browser. UPLOAD and DOWNLOAD use the desk.
- Sprites are emoji. The touch radius is half the size. They share the glass with the letters, and they are drawn in front.
