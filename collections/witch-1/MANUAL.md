Meaner version. DEMAND instead of ASK. Messages reduced to short refusals.

```markdown
# Witch I — WASIC

WASIC does not speak BASIC.  
PRINT, GOTO, NEXT and the rest are unknown words.  
They fail.

666 lines. That is all the memory there is.

Runs in the emoji-engine-2d terminal.  
Cell buffer and emoji sprites share the screen.

---

## Boot

```
READY.
```

Line numbers.  
Bare commands run immediately.

---

## Memory

666 lines. Hard stop.

```
FULL. 666 LINES. STOP.
```

No more lines until something is removed.

---

## Editor

| Command | Effect |
|---------|--------|
| REVEAL | Show the program |
| OBLITERATE n | Destroy line n |
| OBLITERATE n-m | Destroy range |
| RENUMBER | Renumber from 10 |
| VANISH | Wipe the program |
| AUTO | Automatic numbering |

---

## Language

### Core

| Command | Meaning |
|---------|---------|
| CHANT | Output |
| DEMAND | Input |
| CONJURE | Assign |
| FLYTO | Jump |
| SUMMON | Call |
| BANISH | Return |
| IF | Conditional |
| CURSE | Start counted loop |
| BREAK | End counted loop |
| MARK name | Label |
| FLYTO name | Jump to label |
| DISPEL | End program |
| FREEZE | Pause |
| WHISPER | Comment |
| OFFERING | Data |
| TAKE | Read data |
| REWIND | Reset data pointer |
| WHEN | Computed jump or call |

### Files

| Command | Effect |
|---------|--------|
| SEAL "name" | Write to local storage |
| UNSEAL "name" | Read from local storage |
| UPLOAD | Browser file upload |
| DOWNLOAD "name" | Browser file download |
| SHELF | List built-ins |
| UNSEAL "shelf:name" | Load built-in |

No name:

```
NAME IT.
```

Success:

```
SEALED.
UNSEALED.
```

Missing:

```
NO.
```

Shelf is read-only.

### Hardware words

Recognized. Useless.

| Word | Response |
|------|----------|
| POKE | NO. |
| PEEK | NO. |
| SYS | NO. |
| WAIT | NO. |
| USR | NO. |
| CALL | NO. |

### Sprites

| Command | Effect |
|---------|--------|
| MINION emoji, x, y, size | Create sprite |
| SEND n, vx, vy | Set velocity |
| WATCH name | Collision handler |
| COLOR fg, bg | Set colors |
| TONE freq, ms | Sound |
| CIRCLE x, y, r | Circle |
| LINE x1, y1, x2, y2 | Line |
| FILL x, y | Fill |
| DESTROY n | Remove sprite |

Sprites are emoji.  
Collision radius is size/2.  
They draw with the cell buffer.

---

## Messages

| Situation | Text |
|-----------|------|
| Unknown word | NO. |
| Missing line | NO LINE. |
| Wrong type | NO. |
| Full | FULL. 666 LINES. STOP. |
| Divide by zero | NO. |
| Missing file | NO. |
| Bad sprite | NO. |

---

## Example

```
10 WHISPER Start
20 CHANT "WHO?"
30 DEMAND "NAME"; N$
40 IF N$ = "" THEN CHANT "LEAVE." : DISPEL
50 CHANT "ENTER "; N$
60 DISPEL
```

Loop:

```
10 CURSE I = 1 TO 13
20 CHANT I
30 BREAK
```

Label:

```
10 MARK start
20 CHANT "AGAIN"
30 FLYTO start
```

---

## Limits

- 666 lines
- 255 characters per line
- BASIC words are unknown
- Shelf is read-only
- SEAL / UNSEAL = local storage
- UPLOAD / DOWNLOAD = browser dialogs

---

**READY.**
```

Copy the block. This is the sharpest version so far. If you remember any exact old command names or joke lines, send them and they go in as-is.
