# Witch I

Witch I is the computer in this repo. Forty columns, twenty-four rows, a line number, and SPEAK. WASIC is the language. The numbers below are the walls. The glass keeps them.

She is kin to the 40-column machines: a line with a number is stored, a line without one runs now, the pen has sixteen colors, and the voice is a square wave. She does not answer to READY.

## The glass

| | |
| --- | --- |
| Columns | 40, numbered 0 through 39 |
| Rows | 24, numbered 0 through 23 |
| Cell | 18 by 24 pixels |
| Bitmap | 720 by 576 pixels |
| Origin | Column 0, row 0 is the top left |
| Pen at waking | Color 7 on 0, ash on black |
| Pen while running | Color 10 on 0, until she stops |

A mark that falls off the glass is ignored. AT clamps onto the glass. The caret is a pale bar and it blinks, including while the glass is still black.

Lines that roll off the top are kept. The wall is 666. Older than that, they are gone. Clearing the glass forgets them. Ctrl-Up and Ctrl-Down recall the last 32 lines even while the glass is latched. At SPEAK, at AUTO, and while DEMAND waits, the glass starts latched: Up and Down walk those lines, Page Up and Page Down move a glassful, Home is the oldest line still kept, and End sits on the pen. `LATCH` turns the hold on. `LATCH OFF` opens it, and then Up and Down recall the last 32 lines sent. F7 and Scroll Lock do what `LATCH` does. While a program runs, the glass is text. The arrows go to the program. The mouse is not a device on this machine.

The pen has sixteen colors, 0 through 15.

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

COLOR outside 0 through 15 is refused.

## Memory

| Wall | Limit | What she says |
| --- | --- | --- |
| Stored lines | 666 | 🛑 FULL. 666 LINES. STOP. |
| Line number | 0 through 63999 | 🔢 NO. LINES STOP AT 63999. |
| Characters on a line | 255, and one emoji is one | 📏 TOO LONG. |
| Characters in a string | 255, counted the same way | 🧵 TOO LONG A STRING. |
| A name | a letter, then up to 15 letters or digits. A string name ends in `$` | ❓ NO. SAY IT AGAIN. |
| A name that is already a word of hers | refused | 🔒 NO. THAT WORD IS TAKEN. |
| The same label twice | refused | 🔖 NO. THAT NAME IS TAKEN. |
| Calls waiting (SUMMON) | 32 | 📚 TOO DEEP. |
| Loops waiting (CURSE) | 32 | 📚 TOO DEEP. |
| A file name | a letter, then up to 15 letters, digits, or hyphens. She folds the case | ❓ NO. SAY IT AGAIN. |

The 255 on a line counts the number and the words together, as typed. RENUMBER that would push a line past 255 leaves the numbers alone.

FRE(n) answers 666 minus the lines stored. The argument is required, numeric, and ignored.

A number that is not finite is 💥 TOO BIG. Dividing by zero, or MOD by zero, is ➗ CUTE. DIVIDE BY NOTHING.

## Arrays

An array has one or two axes. No third axis.

| Wall | Limit |
| --- | --- |
| Biggest index | 2000. DIM A(2000) makes slots 0 through 2000 |
| Cells in one array | 20000 |
| The same array twice, or a use before DIM | 📦 NO. IT HAS NO ROOM. |
| An index outside the array | 📐 NO. OUTSIDE THE ROOM. |

Each array has its own 20000 cells. Two arrays do not share that count.

## The shelf

The programs that ship in the box are files, not a script.

```
collections/_games/witch-1/shelf/<name>.wasic
collections/_games/witch-1/shelf/catalog.txt
```

`SHELF` opens that list on the glass. Up and down move. Enter unseals the name under the mark and does not run it. Escape leaves. `catalog.txt` is the order. A `#` line is a note. A name is a letter, then up to 15 letters, digits, or hyphens.

`UNSEAL "shelf:HELLO-WITCH"` reads `hello-witch.wasic`. She lowercases the name and adds `.wasic`. She does not run it. The shelf is only for reading.

SEAL and UNSEAL without `shelf:` use this browser. UPLOAD and DOWNLOAD use the desk. DOWNLOAD writes `name.wasic`.

| When | What she says |
| --- | --- |
| No name | 🔖 NAME IT. |
| No such program | 🌑 NO. IT IS NOT THERE. |
| The browser or the shelf will not open | 📦 THE BOX IS SHUT. |

While she is fetching, the bezel says READING.

## Minions, keys, and the tune

A minion is an emoji drawn in front of the letters. The cell you name is the center of that cell.

| Wall | Limit |
| --- | --- |
| Living minions | 32. A 33rd is 👻 NO. TOO MANY MINIONS. |
| Size | 1 through 180 pixels. The default is 28. An empty picture becomes ● |
| Touch | the circles overlap. The radius is half the size |
| Meetings that can wait | 8. A ninth is dropped until she services one |
| Keys waiting on LISTEN$ | 32. She only collects them while a program runs |
| Lines remembered by the up arrow | 32 |
| TONE | 20 through 8000 Hz, and 0 through 8000 milliseconds. She waits, so a tune stays in order |
| FREEZE | 0 through 60000 milliseconds |
| CHR$ | codes 0 through 255 |

SEND, COL, ROW, VX, and VY on a minion that is gone: 👻 NO. THAT MINION IS GONE.

## When she refuses

A refusal is red. A mark sits in front of the words. From inside a program the line comes along: `❓ NO. SAY IT AGAIN. IN 40`

The sound is two square notes going down, 440 then 220. The lamp under the glass flashes red.

ENOUGH, from Escape or Ctrl-C, is candle-colored: `✋ ENOUGH.` The two notes are softer, 330 then 247, and the lamp flashes candle.

A line that will not take another character does not refuse in words. She clicks once and drops the rest. That click is not the refusal.

AGAIN, while DEMAND is unsatisfied, is a refusal too. She says so, she rings, and she asks again.

The words, and every sentence she uses when she refuses, are in `collections/_games/witch-1/MANUAL.md`.
