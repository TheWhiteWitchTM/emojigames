# Manual

Basic Learn runs the program from the top, in the order you typed it. A number at the start of a line is a label for `GOTO` and `GOSUB`. It does not change the order.

The machine does not care about capital letters. `print` and `PRINT` are the same command. `2D`, `3D`, and `UI` are the picture tools.

A colon starts another command on the same line. `LET` is optional. `A = 1` stores.

## Names

`A` holds a number. `A$` holds text. They are different boxes.

A number you have not set is 0. Text you have not set is empty.

`2D`, `3D`, and `UI` are not boxes. Neither is `PRINT`, `SIN`, or any other command in this manual.

## Printing

`PRINT` shows words and numbers. `?` is the same command.

A semicolon stays on the line. A comma leaves three spaces. A bare `PRINT` is a blank line. A trailing `;` or `,` does not move to the next line.

A number prints as itself. There is no space in front.

`+` is numbers. `&` joins text, and a number on either side is allowed.

```
PRINT "Hello, "; NAME$
PRINT "Score "; SCORE
```

## Input

```
INPUT "Your name"; NAME$
INPUT "Age"; A
INPUT A, B$
```

The question has to be text in quotes. Put `;` or `,` between the question and the name. Each name is asked on its own.

A number name asks again when the answer is not a number. A text name accepts anything, including an empty line.

## Tests

`0` is no. Any other number is yes. A test that is text is an error. Compare text with `=`.

```
IF N > 10 THEN PRINT "Bigger."
```

```
IF N > 10 THEN
  PRINT "Bigger."
ELSE IF N = 10 THEN
  PRINT "Ten."
ELSE
  PRINT "Smaller."
END IF
```

`ELSEIF` and `ELSE IF` are the same. A test that covers more than one line needs `THEN` at the end of its line, and `END IF` to close it. `ENDIF` is the same closer.

`IF A = 1 THEN 100` jumps to line 100. `IF A = 1 THEN 100 ELSE 200` jumps one way or the other.

`=` compares inside a test and stores at the start of a command. `==` is not a comparison. `<>` is "they differ." `!=` tells you to write `<>`.

`NOT A = B` means "they differ." `NOT` looks at the comparison. `AND` and `OR` stop early and give 1 or 0. Write `A < B AND B < C` for two comparisons.

`+ - * / \ ^` are numbers. `\` drops the fraction toward 0. `MOD` is the remainder, and it keeps the sign of the left number. `^` is power.

## Loops

```
FOR I = 1 TO 10 STEP 2
  PRINT I
NEXT I
```

`NEXT` can name the loop. A different name says which `FOR` is still open. The end and the step are kept from the moment `FOR` starts. If the step does not head toward the end, the body is skipped. `STEP 0` is an error.

```
WHILE N < 3
  N = N + 1
WEND
```

```
DO
  N = N + 1
LOOP UNTIL N = 3
```

`DO WHILE` and `DO UNTIL` test at the top. `LOOP WHILE` and `LOOP UNTIL` test at the bottom. A bare `LOOP` jumps back to `DO`.

## Functions

```
FUNCTION ADD(A, B)
  ADD = A + B
END FUNCTION
```

The body starts on the next line. `ADD` holds the result. It starts at 0, or empty if the name ends in `$`. `RETURN A + B` stores that and leaves.

Parameters belong to the function. So does the function's own name. Every other name is shared, including the name in a `FOR`. A list is shared too.

Functions do not nest, and a function does not sit inside a loop. `GOSUB` does not run inside a function. `END` does not either. `RETURN` leaves the function.

## Lists

```
DIM A(10)
A(1) = 4
```

Slots run from 1 through the size you wrote. Slot 0 is an error. A slot has to be a whole number. Two indexes are the most.

`DIM` once. The first store, if you never used `DIM`, makes the list. A later store can grow it, up to 1000. Reading past the end is an error. Reading a list that does not exist yet asks you to `DIM` it, or to store into a slot first.

## GOTO and GOSUB

```
10 PRINT "Hi"
20 GOTO 10
```

`GOSUB 100` jumps, and `RETURN` comes back. `GOTO` and `GOSUB` need a line number that you wrote.

A jump into a loop that is not running is an error. A jump into a function is an error. A jump out of a function is an error. A jump out of a loop leaves that loop.

The same line number twice is an error.

## Numbers

Angles are degrees. `SIN(90)` is 1. `COS`, `TAN`, and `ATN` match. `ATN` gives degrees back.

| Call | What it gives |
| --- | --- |
| `ABS(N)` | Drop the sign. |
| `INT(N)` | Round toward the smaller whole number. |
| `SGN(N)` | -1, 0, or 1. |
| `SQR(N)` | Square root. `N` is 0 or more. |
| `SIN(N)` `COS(N)` `TAN(N)` | Sine, cosine, tangent. Degrees. |
| `ATN(N)` | Arc tangent, in degrees. |
| `RND()` | A decimal from 0 up to, but not including, 1. `RND(0)` is the same. |
| `RND(6)` | A whole number from 1 to 6. |
| `TIMER` | Seconds since Run. |

## Text

Letters are counted from 1. An emoji is one letter. `"héllo"` has 5 letters, and letter 2 is `é`.

| Call | What it gives |
| --- | --- |
| `LEN(A$)` | How many letters. |
| `LEFT$(A$, N)` | The first N letters. |
| `RIGHT$(A$, N)` | The last N letters. |
| `MID$(A$, start, N)` | N letters, starting at `start`. Leave off N to keep the rest. |
| `INSTR(A$, B$)` | Where `B$` sits, or 0 if it does not. A third form is `INSTR(start, A$, B$)`. |
| `ASC(A$)` | The code of the first letter. |
| `CHR$(N)` | The letter for that code. 65 is A. |
| `VAL(A$)` | The number written in that text. |
| `STR$(N)` | The number as text. |
| `UPPER$(A$)` `LOWER$(A$)` | Change the letters. |

## 2D

The picture is in pixels. `(0, 0)` is the top left. x goes right. y goes down. `WIDTH` and `HEIGHT` are the size. Read them. Do not set them.

On its own line, parentheses are optional.

```
2D.CLEAR
2D.EMOJI "😀", 80, 120, 64
```

Inside a test or a `PRINT`, use parentheses. `ID = 2D.EMOJI("😀", X, 120, 64)`. `PRINT 2D.WIDTH` reads the size. `WIDTH` is a value, not a command.

Colors are names (`black`, `white`, `red`, `green`, `blue`, `yellow`, `orange`, `purple`, `pink`, `brown`, `gray`, `grey`, `cyan`, `teal`, `navy`, `gold`, `ash`, `cream`, `night`), or `#rgb`, or `#rrggbb`, or a palette number from 0 to 15.

| Call | What it does |
| --- | --- |
| `CLEAR color` | Wipe the picture. The color is optional. |
| `PAPER color` | Change the background. Leave the pictures. |
| `EMOJI picture, x, y, size` | Draw an emoji, centered. Gives a number. |
| `TEXT words, x, y, size, color` | Draw words from the top left. |
| `RECT x, y, width, height, color` | A filled rectangle. |
| `CIRCLE x, y, radius, color` | A filled circle, centered. |
| `LINE x1, y1, x2, y2, color` | A line. |
| `MOVE number, x, y` | Put that picture at a new point. |
| `NUDGE number, vx, vy` | Move it by this much on every `WAIT`. |
| `DROP number` | Remove one picture. |
| `CAMERA x, y` | Put this world point at the top left. |
| `FOLLOW number` | Keep that picture centered. `FOLLOW` with nothing lets go. |
| `KEY("left")` | 1 while that key is held. `left`, `right`, `up`, `down`, `space`, or a letter. |
| `TOUCH a, b` | 1 when two pictures overlap. |
| `WAIT` | Show the picture and pause for one frame. |
| `BEEP frequency, milliseconds` | A short square note. |
| `HELP` | Print this list. |

`CLEAR` removes the pictures and their numbers. The paper starts as night, `#1c2430`.

`KEY` also knows `enter`, `esc`, `shift`, `ctrl`, and `alt`.

## 3D

World units. The eye starts at `(0, 2, 6)`. Yaw and pitch are degrees. Yaw 0 looks into the screen.

An emoji that moves is pushed out of a solid box.

| Call | What it does |
| --- | --- |
| `CLEAR color` | Remove every solid. The color is optional. |
| `PAPER color` | Change the sky. Leave the solids. |
| `CAMERA x, y, z, yaw, pitch` | Place the eye. Yaw and pitch are degrees. |
| `LOOK x, y, z` | Point the eye at this point. |
| `BOX x, y, z, width, height, depth, color` | A solid box. Three numbers, or those plus a color, or the full size. Gives a number. |
| `EMOJI picture, x, y, z, size` | An emoji that faces you. Gives a number. |
| `MOVE number, x, y, z` | Put that solid at a new point. |
| `NUDGE number, vx, vy, vz` | Move it on every `WAIT`. |
| `TURN number, degrees` | Spin it around up. |
| `DROP number` | Remove one solid. |
| `FOLLOW number` | Keep the eye behind that solid. |
| `KEY("left")` | 1 while that key is held. |
| `TOUCH a, b` | 1 when two solids are close. |
| `WAIT` | Show the scene and pause for one frame. |
| `BEEP frequency, milliseconds` | A short square note. |
| `HELP` | Print this list. |

If this browser cannot draw 3D, the error says so. 2D and UI still work.

## UI

`THEME "borland"` or `THEME "linux"`. Borland is the start.

| Call | What it does |
| --- | --- |
| `SAY "Hello"` | A small window. Waits until Ok. |
| `ASK "Your name"` | A question. Gives the text, or empty if they close it. |
| `CONFIRM "Quit?"` | Yes or No. Gives 1 or 0. |
| `CHOOSE "Pick", "red", "green"` | A list. Gives the chosen text, or 0 if they close it. |
| `WINDOW "Title"` | Start a form. |
| `LABEL "Score"` | One line. |
| `NOTE "A longer sentence."` | Wrapped words. |
| `BUTTON "OK"` | A button. `SHOW` gives its label. |
| `FIELD "name", "Your name"` | A line they can type in. |
| `CHECK "sound", "Sound on"` | A box they can tick. `VALUE` reads 1 or 0. |
| `PICK "color", "red", "green"` | A list inside the form. |
| `SHOW` | Open the form and wait. Gives the button's words, or 0 if they close it. |
| `VALUE "name"` | Read a field, a check, or a pick after `SHOW`. |
| `HELP` | Print this list. |

The first button is the one Enter presses. Escape does not close the window. Escape leaves the machine. Stop closes the window and stops the program.

A true or false result from the picture tools becomes 1 or 0. Nothing becomes 0.

## Comments and the rest

`REM` is a comment, through the end of the line. `'` is the same. A comment can sit after a line number, and that line is still a label.

`CLS` clears the text side. `HELP` prints a short command list.

`STOP` halts and says so. `END` finishes quietly. `END` inside a function is an error.

An error looks like `Line 4: ...` . If that line has a number, it also says `program line 40`. Click the message. The machine selects that line.
