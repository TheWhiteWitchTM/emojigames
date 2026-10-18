# Getting Started

Basic Learn is BASIC for this site. The words are colored while you type. A mistake is a sentence, and it names the line. The picture is the same 2d, 3d, and ui that Magic uses.

Basic I is the other machine. That one is 40 columns, and the prompt is READY. This one is the screen you can draw on.

You do not install anything. Boot, type, Run.

## Boot

Click **Boot**. The machine fills the screen. Escape brings this page back. The program stays. It is saved in this browser.

**Run** starts at the top and goes down. **Stop** stops it. Ctrl+Enter (or Cmd+Enter) is Run. Escape is not Stop. Escape leaves the machine.

The lesson menu replaces the program. It asks first if you have typed something of your own.

## Hello

```
PRINT "Hello"
```

Run. The text side says Hello.

`?` is another way to write `PRINT`.

```
? "Hello"
```

A semicolon stays on the same line. A comma leaves a gap. A bare `PRINT` is a blank line.

## A name

Numbers and text are different names. `A` holds a number. `A$` holds text. They are not the same box.

A number you have not set is 0. Text you have not set is empty.

```
NAME$ = "Ada"
PRINT "Hello, "; NAME$
```

`INPUT` waits under the text.

```
INPUT "Your name"; NAME$
PRINT "Hello, "; NAME$
```

If the name is a number and the answer is not, Basic Learn asks again and says why.

## A test

```
INPUT "A number"; N
IF N = 0 THEN PRINT "Zero or empty."
IF N > 10 THEN
  PRINT "Bigger than 10."
ELSE
  PRINT "10 or smaller."
END IF
```

On one line, `THEN` can hold the command. Across lines, close it with `END IF`.

`0` is no. Any other number is yes. Compare text with `=`. `IF NAME$ = "Ada" THEN`.

`NOT A = B` means "they differ."

## Line numbers

You do not need them. The program runs from the top.

A number at the start of a line is a label. `GOTO 100` and `GOSUB 100` use it. The error shows both the editor line and that label, when you wrote one.

```
10 PRINT "Hi"
20 GOTO 10
```

Stop ends that loop.

`REM` is a comment, and so is `'` .

## What the colors are

A purple number at the start of a line is a line number. Gold is `2D`, `3D`, and `UI`. Blue is a command, such as `PRINT` and `IF`. Green is text. Yellow is a number. Grey is a comment.

The machine does not care about capital letters. `print` and `PRINT` are the same command.

Click an error. The machine selects that line.

## Next

The tutorial counts, draws a face, moves it, builds a box, and opens a window. The manual is every word.
