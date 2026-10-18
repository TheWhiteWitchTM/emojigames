# Getting Started

Magic is a small language. It is Lua, with the sharp corners filed off. Run compiles your program to JavaScript and runs that. The words are colored while you type. A mistake says what to fix, and which line.

2d, 3d, and ui are already in the room. They draw.

You do not install anything. Boot, type, Run.

## Boot

Click **Boot**. The machine fills the screen. Escape brings this page back. The program stays. It is saved in this browser.

**Run** starts the program. **Stop** stops it. Ctrl+Enter (or Cmd+Enter) is Run. Escape is not Stop. Escape leaves the machine.

The lesson menu replaces the program. It asks first if you have typed something of your own.

**JavaScript** shows the program Magic compiled. You can read it. You do not have to.

## Hello

```
print("Hello")
```

Run. The text side says Hello.

A bare string can skip the parentheses:

```
print "Hello"
```

Anything richer needs the parentheses. `print("Hello, " .. name)`. The `..` joins text.

## A name

```
name = "Ada"
print(name)
```

`=` stores. A name you have not set is an error, and the error says so. That is on purpose.

`input` waits for a line under the text.

```
name = input("Your name")
print("Hello, " .. name)
```

## A test

```
n = tonumber(input("A number"))
if n == nil then
  print("That was not a number.")
else if n > 10 then
  print("Bigger than 10.")
else
  print("10 or smaller.")
end
```

`else if` and `elseif` are the same word. `end` closes the test.

Only `false` and `nil` are no. `0` is yes. An empty string is yes. That is the Lua rule, and Magic keeps it.

`not a == b` means "they differ." `not` looks at the comparison, not only at `a`.

## Comments

```
-- a note
--[[
  a longer note
]]
```

`//` at the start of a line is a note. Later in a line, `//` is division that drops the fraction. `#` at the start of a line, with a space after it, is a note. Otherwise `#` is the length.

## What the colors are

Gold is `2d`, `3d`, and `ui`. Blue is a word the language owns, such as `if` and `end`. Green is text. Yellow is a number. Grey is a comment.

Click an error. The machine selects that line.

## Next

The tutorial draws a face, moves it, builds a box, and opens a window. The manual is every word.
