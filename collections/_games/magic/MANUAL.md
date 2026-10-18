# Manual

Magic compiles to JavaScript. The file extension, if you keep one, is `.magic`. The machine on this page stores the program for you.

A program is statements. A newline is a space, so a line can break inside an expression. `f` and then `(` on the next line is still a call.

## Names

A name you assign is created in the nearest scope. At the top of the program, that name is shared. Inside a function, a new name belongs to the function, unless it already exists outside, or it is one of the built-in names, or you mark it `global`.

`local` always makes a new name. `for` names belong to the loop. They are gone after `end`.

`score = score + 1` reads the same name it stores. If that name is new and still empty, that is an error. Set it first.

Built-in names: `2d`, `3d`, `ui`, `print`, `input`, `type`, `tostring`, `tonumber`, `len`, `clock`, `math`, `str`.

## Values

Numbers, text, `true`, `false`, `nil`, lists, and functions.

Only `false` and `nil` are no. `0` is yes. `""` is yes.

`+ - * / // % ^` are numbers. `//` drops the fraction. `..` joins text, and a number on either side is allowed. `+` will not join text.

Comparisons are `==`, `~=` or `!=`, `<`, `>`, `<=`, `>=`. One comparison at a time. Write `a < b and b < c` for two.

`and` and `or` stop early. `not` is looser than a comparison, so `not a == b` means "not equal."

`#` is the length. For a list, that is the highest slot number, and holes count. For text, it is the number of letters, and an emoji is one letter.

## Tests and loops

```
if test then
  -- yes
else if other then
  -- or
else
  -- no
end
```

```
while test do
end

repeat
until test

for i = 1 to 10 step 2 do
end

for item in list do
end
```

`for i = 1, 10` is the same as `to`. A third number is the step. `break` leaves the innermost loop. `do ... end` is a block and is not a loop.

## Functions

```
function greet(name)
  return "Hello, " .. name
end
```

Or store one: `greet = function(name) ... end`.

One `return`. Extra arguments are ignored. Missing ones are `nil`.

`print "hi"` and `f{ a = 1 }` are calls with one argument. Any other call uses parentheses.

## Lists

```
bag = {"🗡️", "🧪"}
hero = { name = "Ada", hp = 3 }
```

Slots start at 1. `bag[0]` is an error when slot 1 exists. A missing field is `nil`, not an error. Text cannot be changed letter by letter. Build new text with `..`.

`type` returns `"nil"`, `"number"`, `"string"`, `"boolean"`, `"table"`, `"function"`, or `"object"`. `2d` is an object. `{}` is a table.

## math and str

Angles are degrees. `math.sin(90)` is 1. `math.cos`, `math.tan`, and `math.atan` match. `atan` gives degrees back.

`math.abs`, `floor`, `ceil`, `sqrt`, `min`, `max`, `pi`.

`math.random()` is from 0 up to, but not including, 1. `math.random(n)` is a whole number from 1 to n. `math.random(a, b)` is a whole number from a to b, both ends included.

`str.lower`, `upper`, `len`, `rep`. `str.sub(text, start, end)` and `str.find` start at 1. The end of `sub` is included.

`clock()` is seconds since Run.

## 2d

The picture is in pixels. `(0, 0)` is the top left. x goes right. y goes down. `width` and `height` are the size. Read them. Do not set them.

Colors are names (`black`, `white`, `red`, `green`, `blue`, `yellow`, `orange`, `purple`, `pink`, `brown`, `gray`, `grey`, `cyan`, `teal`, `navy`, `gold`, `ash`, `cream`, `night`), or `#rgb`, or `#rrggbb`, or a palette number from 0 to 15.

| Call | What it does |
| --- | --- |
| `clear(color)` | Wipe the picture. The color is optional. |
| `paper(color)` | Change the background. Leave the pictures. |
| `emoji(picture, x, y, size)` | Draw an emoji, centered. Gives a number. |
| `text(words, x, y, size, color)` | Draw words from the top left. |
| `rect(x, y, width, height, color)` | A filled rectangle. |
| `circle(x, y, radius, color)` | A filled circle, centered. |
| `line(x1, y1, x2, y2, color)` | A line. |
| `move(number, x, y)` | Put that picture at a new point. |
| `nudge(number, vx, vy)` | Move it by this much on every `wait` or `run`. |
| `drop(number)` | Remove one picture. |
| `camera(x, y)` | Put this world point at the top left. |
| `follow(number)` | Keep that picture centered. `follow()` lets go. |
| `key("left")` | Yes while that key is held. `left`, `right`, `up`, `down`, `space`, or a letter. Also `enter`, `esc`, `shift`, `ctrl`, and `alt`. |
| `touch(a, b)` | Yes when two pictures overlap. |
| `wait()` | Show the picture and pause for one frame. |
| `run()` | Call `update()` and `draw()` every frame. |
| `beep(frequency, milliseconds)` | A short square note. |
| `help()` | Print this list. |

`clear` removes the pictures and their numbers. The paper starts as night, `#1c2430`.

## 3d

World units. The eye starts at `(0, 2, 6)`. Yaw and pitch are degrees. Yaw 0 looks into the screen.

An emoji that moves is pushed out of a solid box.

| Call | What it does |
| --- | --- |
| `clear(color)` | Remove every solid. The color is optional. |
| `paper(color)` | Change the sky. Leave the solids. |
| `camera(x, y, z, yaw, pitch)` | Place the eye. Yaw and pitch are degrees. |
| `look(x, y, z)` | Point the eye at this point. |
| `box(x, y, z, width, height, depth, color)` | A solid box. Three numbers, or those plus a color, or the full size. Gives a number. |
| `emoji(picture, x, y, z, size)` | An emoji that faces you. Gives a number. |
| `move(number, x, y, z)` | Put that solid at a new point. |
| `nudge(number, vx, vy, vz)` | Move it on every `wait` or `run`. |
| `turn(number, degrees)` | Spin it around up. |
| `drop(number)` | Remove one solid. |
| `follow(number)` | Keep the eye behind that solid. |
| `key("left")` | Yes while that key is held. `left`, `right`, `up`, `down`, `space`, or a letter. Also `enter`, `esc`, `shift`, `ctrl`, and `alt`. |
| `touch(a, b)` | Yes when two solids are close. |
| `wait()` | Show the scene and pause for one frame. |
| `run()` | Call `update()` and `draw()` every frame. |
| `beep(frequency, milliseconds)` | A short square note. |
| `help()` | Print this list. |

If this browser cannot draw 3d, the error says so. 2d and ui still work.

## ui

`theme("borland")` or `theme("linux")`. Borland is the start.

| Call | What it does |
| --- | --- |
| `say("Hello")` | A small window. Waits until Ok. |
| `ask("Your name")` | A question. Gives the text, or `""` if they close it. |
| `confirm("Quit?")` | Yes or No. Gives `true` or `false`. |
| `choose("Pick", "red", "green")` | A list. Gives the chosen text, or nothing. |
| `window("Title")` | Start a form. |
| `label("Score")` | One line. |
| `note("A longer sentence.")` | Wrapped words. |
| `button("OK", fn)` | A button. `show` gives its label. The function is optional. |
| `field("name", "Your name")` | A line they can type in. |
| `check("sound", "Sound on")` | A box they can tick. |
| `pick("color", "red", "green")` | A list inside the form. A Magic list works too. |
| `show()` | Open the form and wait. Gives the button label, or nothing. |
| `value("name")` | Read a field, a check, or a pick after `show`. |
| `help()` | Print this list. |

The first button is the one Enter presses. Escape does not close the window. Escape leaves the machine. Stop closes the window and stops the program.

## Comments

`--` to the end of the line. `--[[ ... ]]` across lines. `/* ... */` across lines. A line that starts with `//` is a comment. A line that starts with `#` and a space is a comment.

`//` elsewhere is floor division. `#` elsewhere is length.
