# Tutorial

Boot the machine. Load a lesson, or type these yourself. Run after each one.

## Repeat

```
for i = 1 to 5 do
  print(i)
end
```

`for i = 5 to 1 step -1` counts down. `step 0` is an error, because that loop would never finish.

`while` tests first. `repeat` runs once, then tests.

```
n = 0
repeat
  n = n + 1
until n == 3
```

`break` leaves the loop it is inside.

## A list

Lists start at 1. There is no slot 0.

```
bag = {"🌟", "🌙", "🔥"}
print(bag[1])
print(#bag)
for item in bag do
  print(item)
end
```

A hole still counts. `{10, nil, 30}` has length 3.

A name inside the braces is a field.

```
hero = { name = "Ada", hp = 3 }
hero.hp = hero.hp + 1
```

`#` on text is the number of letters. `str.sub` and `str.find` also start at 1. `"héllo"[2]` is `é`.

## A function

```
function greet(name)
  return "Hello, " .. name
end
print(greet("Ada"))
```

A name you set at the top of the program is shared. A name you set inside a function belongs to that function, unless it already existed outside, or you write `global`.

`local` forces a new name, even if an outer one exists.

```
score = 1
function bump()
  local score = 5
  score = score + 1
  return score
end
```

`bump()` returns 6. The outer score is still 1.

## A face

Coordinates start at the top left. x goes right. y goes down.

```
2d.paper("night")
2d.circle(160, 120, 70, "gold")
2d.circle(135, 100, 8, "night")
2d.circle(185, 100, 8, "night")
2d.emoji("🙂", 160, 140, 48)
```

`emoji` is centered on x, y. `circle` is too. `rect` and `text` sit on their top left. Each call gives back a number. `clear` forgets those numbers.

## Move it

Hold a key. `2d.wait()` shows one frame. This loop is the whole game.

```
x = 80
while true do
  if 2d.key("right") then x = x + 4 end
  if 2d.key("left") then x = x - 4 end
  2d.clear()
  2d.emoji("😀", x, 120, 64)
  2d.wait()
end
```

Stop ends it. There is a second shape, if you would rather name the steps:

```
x = 80
function update()
  if 2d.key("right") then x = x + 4 end
  if 2d.key("left") then x = x - 4 end
end
function draw()
  2d.clear()
  2d.emoji("😀", x, 120, 64)
end
2d.run()
```

`2d.run()` calls `update`, then `draw`, then waits, forever.

## Boxes

3d is in world units, not pixels. The eye starts near `(0, 2, 6)`, looking into the screen. Yaw and pitch are degrees.

```
3d.paper("night")
3d.box(0, 0.5, 0, 2, 1, 2, "orange")
3d.emoji("🌟", 0, 2, 0, 0.6)
```

`box` can be three numbers, or those three plus a color, or x, y, z, width, height, depth, and an optional color. An emoji is pushed out of a solid box when it moves. `nudge` sets that movement. `3d.wait()` or `3d.run()` applies it.

`math.sin` and `math.cos` take degrees too. `math.sin(90)` is 1.

## A window

```
ui.window("Hello")
ui.label("Pick a color")
ui.pick("color", "red", "gold", "navy")
ui.field("name", "Your name")
ui.button("OK")
ui.show()
print(ui.value("name") .. " likes " .. ui.value("color"))
```

`show` waits. It gives back the button's label, or nothing if the window is closed. `value` reads a field, a check, or a pick after that.

`ui.say`, `ui.ask`, `ui.confirm`, and `ui.choose` are the short versions, when you do not want to build the window yourself.

`ui.theme("linux")` switches the look. `"borland"` is the other one, and it is the start.

## When it breaks

The message names the line. A misspelled `print` often says what you were near. `+` on text tells you to use `..`. Division by zero says the right side was 0.

`help()` inside a program prints the commands for 2d, 3d, or ui. `2d.help()` is the picture list. The manual is the same list, written out.
