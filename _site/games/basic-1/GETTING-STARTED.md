# Getting Started

Basic I is a small computer that lives in this page. It is for kids, for people who miss the old machines, and for anyone who wants to see how a program is made.

You do not install anything. You do not make an account. You boot it, you type, and it answers.

It is the same shape as a Commodore 64 or an Apple II. A line with a number is kept. A line without a number runs now. The glass is 40 columns wide and 24 rows tall, because those machines were about that size. It can hold 512 lines. That is the whole computer.

## Boot

Click **Boot**. The glass fills the screen. Two notes play, the memory counts up to 512, and then the prompt says:

```
READY.
```

READY means it is waiting for you.

Escape brings this page back. Boot again and the lines you stored are still there. A program that was running has stopped.

If the notes stay quiet, press any key. A browser holds its sound until you do that.

The mouse is not part of this computer. The pointer hides over the glass, and a click does nothing. You drive it from the keyboard, the way the old ones worked.

## Two kinds of line

Type this and press Enter:

```
PRINT "HI"
```

There is no number, so it runs now. The glass says HI, then READY.

Now give the same idea a number:

```
10 PRINT "HI"
```

Press Enter. Nothing says HI yet. Line 10 is stored. The number is the line's name.

```
RUN
```

RUN starts at the smallest number. Now it says HI.

That is the trick. You can stack lines, change one, and run the stack again.

```
10 PRINT "HI"
20 PRINT "I AM LEARNING"
LIST
RUN
```

LIST shows what is stored. The numbers are yellow. The words stay the color of ash.

## Change a line

Type the same number again with new words. The old line is replaced.

```
20 PRINT "I LIKE THIS"
RUN
```

Line 10 is still there. Only line 20 changed.

A number with nothing after it deletes that line.

```
10
LIST
```

`NEW` wipes the whole program. The glass stays. It says GONE.

## The built-in modules

You do not have to start from a blank glass. Eleven lessons shipped with the computer. They are modules. You pick one.

Press F3, or type:

```
MODULES
```

A list opens on the glass.

- The up and down arrows move the mark.
- Enter loads the lesson under the mark. It does not run it. That is on purpose, so you can read it first.
- Escape leaves the list. The glass says the modules can wait.

Then:

```
LIST
RUN
```

LIST shows the lines. A line that starts with `REM` is a note to you. The computer skips notes. The note tells you what the lesson is for.

`LOAD "module:HELLO"` loads the same lesson if you would rather type the name.

The lessons, in order:

| Module | What it teaches |
| --- | --- |
| HELLO | Print, color, and a question |
| COUNT | `FOR` and `NEXT` |
| GUESS | `IF`, and a secret number |
| DICE | A fair roll, `INT` and `RND` |
| QUIZ | `DATA` and `READ` |
| CIRCLES | Rings and lines |
| BOUNCE | Two pictures that move |
| KEYS | The key you just pressed |
| SCALE | Eight notes |
| CAT | A picture that walks |
| COLORS | The pens, and mixed ink |

Your own programs can sit in the same list. `SAVE "MINE"` keeps one in this browser. The next time you open MODULES, it is under YOUR SAVED PROGRAMS. `LOAD "MINE"` brings it back. `DOWNLOAD "MINE"` saves `mine.bas` on your computer. `UPLOAD` reads a text file back in.

## Keys under the glass

Each one is a picture, a word, and a function key. They are not buttons. F5 belongs to this computer, not to the browser's reload.

| Key | What it does |
| --- | --- |
| LIST F1 | Show the program |
| RUN F2 | Start at the top |
| MODULES F3 | Open the lessons |
| CLS F4 | Clear the glass. Sprites stay |
| AUTO F5 | Number the next lines for you. Press it again to stop |
| RENUM F6 | Renumber the program from 10 |
| LATCH F7 | Hold the glass so you can read what rolled off |
| FULL F11 | Fill the screen. F11 again returns to this page |
| BACK ESC | Return to this page. A running program stops |

The bezel on the left tells you the mood, then how many lines are stored, out of 512. READY 0/512 means the program is empty.

## If it will not stop

Ctrl-C stops a program. The glass says:

```
✋ ENOUGH.
```

Escape stops it too, and brings this page back.

GUESS, BOUNCE, KEYS, and CAT wait on you, or walk until you stop them. That is normal. Ctrl-C is the door.

## Reading what rolled away

The glass is only 24 rows tall. Lines that roll off the top are kept. 512 of them. Clearing the glass forgets those, too.

It wakes with the hold on. That word is `LATCH`.

- Up and Down walk the lines that rolled away.
- Page Up and Page Down move a screen, and leave one row so you can see where you were.
- Home is the oldest line still kept.
- End sits where you type.

The bezel says GAZE and how far above the pen you are. A key that writes also sits you back on the pen, so the line you were typing is still there.

`LATCH OFF` opens the hold. Then Up and Down recall the last 32 lines you sent, the way a shell does. `LATCH` turns the hold back on. Scroll Lock does the same thing as F7.

While a program runs, the arrows belong to the program. When it stops, the hold is how you walk back up and read.

## What the colors mean

A red line is the computer asking for another look. It is not a scolding. The mark in front of the words is a hint. Two notes go down.

`ENOUGH` is the color of a candle, and those two notes are softer.

A line that will not take another character only clicks. A line holds 255 characters. One emoji counts as one.

## What to open next

The tutorial walks the first hour, one small program at a time. Start there if the prompt is new.

The manual is every word this computer knows. You do not need it on the first day. It is there when a lesson makes you curious.
