# Tutorial

Boot the machine. Load a lesson, or type these yourself. Run after each one.

## Count

```
FOR I = 1 TO 5
  PRINT I
NEXT I
```

`STEP` changes the jump. `FOR I = 5 TO 1 STEP -1` counts down. `STEP 0` is an error, because that loop would never finish.

`WHILE` tests first. `DO` can run once, then test.

```
N = 0
DO
  N = N + 1
LOOP UNTIL N = 3
```

`DO WHILE N < 3` tests at the top. `LOOP WHILE N < 3` tests at the bottom.

## A list

Slots start at 1. There is no slot 0.

```
DIM BAG$(3)
BAG$(1) = "🌟"
BAG$(2) = "🌙"
BAG$(3) = "🔥"
PRINT BAG$(1)
```

You can skip `DIM` and store into a slot. The first store makes the list. Reading a slot you never stored, and never sized, asks you to `DIM` it.

Two indexes work. `DIM GRID(2, 2)` then `GRID(1, 2) = 7`.

## A function

The name of the function holds what it gives back.

```
FUNCTION ADD(A, B)
  ADD = A + B
END FUNCTION
PRINT ADD(2, 3)
```

`A` and `B` belong to the function. A name you set outside is shared, unless it is a parameter.

`RETURN A + B` leaves at once and gives that value back.

## A face

Coordinates start at the top left. x goes right. y goes down.

```
2D.PAPER "night"
2D.CIRCLE 160, 120, 70, "gold"
2D.CIRCLE 135, 100, 8, "night"
2D.CIRCLE 185, 100, 8, "night"
2D.EMOJI "🙂", 160, 140, 48
```

On its own line, a picture command can skip the parentheses. `EMOJI` is centered on x, y. `CIRCLE` is too. `RECT` and `TEXT` sit on their top left. Each call gives back a number. `CLEAR` forgets those numbers.

## Move it

Hold Right. `2D.WAIT` shows one frame.

```
10 X = 80
20 DO
30 2D.CLEAR
40 ID = 2D.EMOJI("😀", X, 120, 64)
50 IF 2D.KEY("right") THEN X = X + 4
60 2D.WAIT
70 LOOP
```

Stop ends it. The number in front of a line is only a label. The program still runs from the top.

Add a left key on line 50's neighbor:

```
55 IF 2D.KEY("left") THEN X = X - 4
```

Inside `PRINT` or `IF`, a picture command needs parentheses, the way line 40 does.

## Boxes

3D is in world units, not pixels. The eye starts near `(0, 2, 6)`, looking into the screen. Yaw and pitch are degrees.

```
3D.PAPER "night"
3D.BOX 0, 0.5, 0, 2, 1, 2, "orange"
3D.EMOJI "🌟", 0, 2, 0, 0.6
```

`BOX` can be three numbers, or those three plus a color, or x, y, z, width, height, depth, and an optional color. An emoji is pushed out of a solid box when it moves. `NUDGE` sets that movement. `3D.WAIT` applies it.

`SIN` and `COS` take degrees too. `SIN(90)` is 1.

## A window

```
UI.WINDOW "Hello"
UI.LABEL "Pick a color"
UI.PICK "color", "red", "gold", "navy"
UI.FIELD "name", "Your name"
UI.BUTTON "OK"
UI.SHOW
PRINT UI.VALUE("name"); " likes "; UI.VALUE("color")
```

`SHOW` waits. It gives back the button's words. `VALUE` reads a field, a check, or a pick after that.

`UI.SAY`, `UI.ASK`, `UI.CONFIRM`, and `UI.CHOOSE` are the short versions, when you do not want to build the window yourself.

`UI.THEME "linux"` switches the look. `"borland"` is the other one, and it is the start.

## When it breaks

The message names the editor line. If the line has a number, the message names that too.

A word near `PRINT` often says what you were near. `+` on text tells you to use `&`. Division by zero says the right side was 0.

`HELP` prints the commands. `2D.HELP`, `3D.HELP`, and `UI.HELP` print the picture lists. The manual is the same list, written out.
