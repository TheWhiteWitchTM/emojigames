# Tutorial

A slow walk. Type what you see. The lines are short because the glass is 40 columns wide.

Boot first. Wait until it says READY. The bezel should say READY 0/512. No lines stored, and room for 512.

## 1. A line that runs now

```
PRINT "HELLO"
```

Press Enter. There is no number, so it runs immediately. The glass says HELLO, then READY again.

Try a sum the same way:

```
PRINT 2 + 2
```

It prints 4, with a space in front. Positive numbers do that, so a column of them lines up.

## 2. Store the lines

```
10 PRINT "HELLO"
20 PRINT "I AM LEARNING"
```

A stored line does not print READY. The caret just waits. That means it kept the line.

```
LIST
RUN
```

LIST shows both lines. The numbers are yellow. RUN prints both sentences.

`REM` is a note. Add one:

```
5 REM MY FIRST PROGRAM.
LIST
RUN
```

The note shows up in LIST. RUN skips it. A period in a note is fine. The computer eats the rest of that line.

## 3. Change one line

Retype line 20:

```
20 PRINT "I AM GETTING BETTER"
LIST
RUN
```

Line 10 is untouched. Only 20 changed. On these machines you edit by typing the number again. There is no other editor, and that is the lesson.

Delete line 10. Type the number and nothing else:

```
10
LIST
RUN
```

Only the second sentence remains.

## 4. Ask a question

```
NEW
10 PRINT "HI."
20 INPUT "YOUR NAME"; N$
30 PRINT "NICE TO MEET YOU, "; N$
RUN
```

`NEW` clears the old lines. It says GONE.

Type your name at the question and press Enter. `INPUT` waits. The question mark is added for you. `N$` is text, because of the dollar sign. A name without `$` is a number.

Run it again and press Enter without a name. It still says hello, with a blank in the middle. You can teach it to notice:

```
25 IF N$ = "" THEN PRINT "NO NAME YET." : END
RUN
```

A true `IF` runs the rest of that line. A false one skips the rest. `END` stops the program before line 30.

## 5. Count

```
NEW
10 FOR I = 1 TO 5
20 PRINT I
30 NEXT I
RUN
```

`FOR` counts. `NEXT` sends it back until `I` passes 5. The body runs, then the count steps.

Change the 5 to 12 and run it again. Then make line 20 louder:

```
20 PRINT "NUMBER "; I
```

The semicolon stays on the same line, so the word and the number sit together.

## 6. Pick up a lesson

You have the idea. The modules are the same kind of program, written so you can read them.

```
MODULES
```

The arrows move. Home and End jump. Put the mark on HELLO and press Enter.

The glass loads it and does not run it. It says to list it.

```
LIST
```

Read the notes. Then:

```
RUN
```

Tell it your name. When it finishes, change a word. Line 50 is the greeting. Retype it:

```
50 PRINT "HEY. I AM BASIC I."
RUN
```

Your sentence, its program. That is the point of loading without running.

`LOAD "module:HELLO"` is the same load if the list is in the way.

## 7. Walk the rest when you want

Each module is one idea. Stay with a module until you can say what it did.

**COUNT.** `FOR` and `NEXT`, and a note on each number. Change the 10.

**GUESS.** The computer picks a number from 1 to 100 with `RND`. You guess. `IF` says higher or lower. It will not stop until you get it, or until Ctrl-C.

**DICE.** Ask it for a few rolls, from 1 to 12. `INT` and `RND` make a face from 1 to 6. Each face really is one in six. The pictures are the faces.

**QUIZ.** Three questions live in `DATA`. `READ` takes them out in order. Answer with a number. A wrong answer shows the one from the data. Change a question and its answer, then run it again.

**CIRCLES.** A loop draws rings. `STEP 2` skips every other size. Two `LINE`s cross in the middle.

**BOUNCE.** A star and a ball move on their own. When one hits an edge, it turns around. When they meet, they turn around and beep. Escape or Ctrl-C sends them home.

**KEYS.** Press keys. The glass names the one you pressed. Q quits.

**SCALE.** Eight notes, C to C. `DATA` holds the pitch and the letter. `SOUND` plays the pitch and waits, so the tune stays in order. The number is hertz.

**CAT.** One sprite. `SPRITE` puts the cat on the glass. `SEND` gives it a speed. At the edge it turns around and chirps. Escape stops it.

**COLORS.** The pens are 0 through 15. `COLOR` picks one. `INK` can also ask for a bold white, a green, one of 256 colors, or a color mixed from red, green, and blue. Change a number. Run it again.

## 8. Keep something of your own

When a program is yours:

```
SAVE "MINE"
```

It stays in this browser. Open MODULES and it is listed under YOUR SAVED PROGRAMS.

```
LOAD "MINE"
DOWNLOAD "MINE"
```

DOWNLOAD writes `mine.bas` to your computer. UPLOAD reads a text file of numbered lines back onto the glass.

A name is a letter, then letters, digits, or hyphens. Fifteen after the first letter is the wall. HELLO is a fine name. So is MY-CAT.

## 9. When you are stuck

- Ctrl-C if it is still running.
- LIST if you forgot what you typed.
- NEW if you want a clean page. SAVE first if you liked it.
- A red line names the problem. `IN 40` means line 40. Retype that line.
- `HELP` prints the short list of words.

The manual is the long version. It has every word, the sixteen colors, the sprites, and what each red line means.

Change the lessons. Break one on purpose. Run it. That is how a line starts to make sense.
