useEffect(() => {
  const container = document.getElementById('game');
  if (!container) return;

  const term = new Terminal({ border: '#39ff14' });
  container.appendChild(term.wrap);
  term.wrap.focus();

  const rooms = {
    flat: {
      name: "London Flat",
      desc: "You are in a London flat. A window looks out over the street. A bookcase stands against one wall.",
      art: ["  London flat   ", "   [bookcase]   ", "   [window]     "],
      exits: { e: "street" },
      objects: ["book"]
    },
    street: {
      name: "Street",
      desc: "You are on a London street. A taxi waits nearby.",
      art: ["   street       ", "   [taxi]       ", "                "],
      exits: { w: "flat", e: "dock" },
      objects: []
    },
    dock: {
      name: "Dock",
      desc: "You are at the docks. A ship is moored here. A parrot sits on a crate.",
      art: ["    docks       ", "  [ship] [parrot]", "                "],
      exits: { w: "street", e: "ship", s: "island" },
      objects: ["parrot"]
    },
    ship: {
      name: "Pirate Ship",
      desc: "You are on the deck of a pirate ship. The hold is below. A rusty anchor lies here.",
      art: ["  pirate ship   ", "   [anchor]     ", "                "],
      exits: { w: "dock", d: "hold" },
      objects: ["anchor"]
    },
    hold: {
      name: "Ship's Hold",
      desc: "You are in the ship's hold. It is dark and smells of rum. A chest sits in the corner.",
      art: ["   ship's hold  ", "    [chest]     ", "                "],
      exits: { u: "ship" },
      objects: ["chest"]
    },
    island: {
      name: "Tropical Island",
      desc: "You are on a tropical island. Palm trees sway. A path leads inland. A bottle lies in the sand.",
      art: ["  tropical isle ", "   [bottle]     ", "   palm trees   "],
      exits: { n: "dock", e: "jungle", s: "beach" },
      objects: ["bottle"]
    },
    jungle: {
      name: "Dense Jungle",
      desc: "You are in dense jungle. Vines hang everywhere. Something glints in the undergrowth.",
      art: ["  dense jungle  ", "   [machete]    ", "                "],
      exits: { w: "island", e: "clearing" },
      objects: ["machete"]
    },
    clearing: {
      name: "Clearing",
      desc: "You are in a clearing. A large rock has strange markings. A cave mouth yawns nearby.",
      art: ["   clearing     ", "  [rock] [cave] ", "                "],
      exits: { w: "jungle", e: "cave" },
      objects: ["map"]
    },
    cave: {
      name: "Pirate Cave",
      desc: "You are in a pirate cave. Treasure glints in the torchlight. A skeleton guards a chest.",
      art: ["  pirate cave   ", "  [treasure]    ", "  [skeleton]    "],
      exits: { w: "clearing" },
      objects: ["treasure", "skeleton"]
    },
    beach: {
      name: "Sandy Beach",
      desc: "You are on a sandy beach. Waves crash. A small boat is pulled up on the sand.",
      art: ["  sandy beach   ", "   [boat]       ", "                "],
      exits: { n: "island" },
      objects: ["boat"]
    }
  };

  const objects = {
    book:     { name: "book",     desc: "a dusty book about pirates", treasure: false },
    parrot:   { name: "parrot",   desc: "a colorful parrot", treasure: false },
    anchor:   { name: "anchor",   desc: "a rusty anchor", treasure: false },
    chest:    { name: "chest",    desc: "a locked chest", treasure: false },
    bottle:   { name: "bottle",   desc: "an empty bottle", treasure: false },
    machete:  { name: "machete",  desc: "a sharp machete", treasure: false },
    map:      { name: "map",      desc: "a treasure map", treasure: false },
    treasure: { name: "treasure", desc: "a chest of pirate gold", treasure: true },
    skeleton: { name: "skeleton", desc: "a pirate skeleton", treasure: false, static: true },
    boat:     { name: "boat",     desc: "a small rowboat", treasure: false },
    rum:      { name: "rum",      desc: "a bottle of rum", treasure: false },
    key:      { name: "key",      desc: "a rusty key", treasure: false },
    jewels:   { name: "jewels",   desc: "a bag of jewels", treasure: true },
    coins:    { name: "coins",    desc: "a pile of gold coins", treasure: true }
  };

  let current = "flat";
  let inventory = [];
  let score = 0;
  let treasures = 0;
  let inputBuffer = "";
  let chestOpen = false;
  let parrotFriendly = false;

  function print(text, color = 2) {
    term.setFg(color);
    term.writeln(text);
    term.resetAttr();
  }

  function drawArt(art) {
    if (!art) return;
    term.setFg(10);
    art.forEach(line => term.writeln("  " + line));
    term.resetAttr();
    term.writeln("");
  }

  function look() {
    const room = rooms[current];
    term.clear();
    drawArt(room.art);
    print(`=== ${room.name.toUpperCase()} ===`, 10);
    print(room.desc, 2);

    const here = room.objects.filter(id => objects[id] && !objects[id].static);
    if (here.length) {
      print("You see:", 7);
      here.forEach(id => {
        const obj = objects[id];
        print(`  ${obj.desc}${obj.treasure ? " *" : ""}`, obj.treasure ? 11 : 7);
      });
    }

    const exits = Object.keys(room.exits).map(d => d.toUpperCase()).join(", ");
    print(`Exits: ${exits}`, 6);
    print(`Score: ${score}/100   Treasures: ${treasures}/3`, 3);
    term.writeln("");
    term.write("> ");
    inputBuffer = "";
  }

  function get(id) {
    const room = rooms[current];
    const idx = room.objects.indexOf(id);
    if (idx === -1) return print("You don't see that here.");
    if (objects[id]?.static) return print("You can't take that.");
    room.objects.splice(idx, 1);
    inventory.push(id);
    if (objects[id].treasure) { score += 25; treasures++; }
    print(`You take the ${objects[id].name}.`);
  }

  function drop(id) {
    const idx = inventory.indexOf(id);
    if (idx === -1) return print("You aren't carrying that.");
    inventory.splice(idx, 1);
    rooms[current].objects.push(id);
    print(`You drop the ${objects[id].name}.`);
  }

  function showHelp() {
    print("Commands:", 7);
    print("  LOOK/L  INVENTORY/I  GO <dir>  GET/TAKE  DROP", 2);
    print("  READ  OPEN  SAY  CLIMB  BOARD  FILL  SCORE  HELP  QUIT", 2);
  }

  function handle(input) {
    const parts = input.trim().toLowerCase().split(/\s+/);
    const verb = parts[0];
    const noun = parts[1];

    if (!verb) return;
    if (verb === "help" || verb === "?") return showHelp();
    if (verb === "look" || verb === "l") return look();
    if (verb === "inventory" || verb === "i") {
      if (!inventory.length) return print("You are carrying nothing.");
      print("You are carrying:");
      inventory.forEach(id => print(`  ${objects[id].desc}`));
      return;
    }
    if (verb === "score") return print(`Score: ${score}/100  Treasures: ${treasures}/3`);
    if (verb === "quit" || verb === "exit") { print("Yo ho ho and a bottle of rum!"); return; }

    if (verb === "go" || ["n","s","e","w","u","d"].includes(verb)) {
      const dir = verb === "go" ? noun : verb;
      const room = rooms[current];
      if (!room.exits[dir]) return print("You can't go that way.");
      current = room.exits[dir];
      return look();
    }

    if (verb === "get" || verb === "take") {
      if (!noun) return print("Get what?");
      const id = Object.keys(objects).find(k => objects[k].name.includes(noun) || k === noun);
      if (!id) return print("I don't see that.");
      return get(id);
    }

    if (verb === "drop") {
      if (!noun) return print("Drop what?");
      const id = inventory.find(k => objects[k].name.includes(noun) || k === noun);
      if (!id) return print("You aren't carrying that.");
      return drop(id);
    }

    if (verb === "read" && noun === "book") {
      if (inventory.includes("book") || rooms[current].objects.includes("book")) {
        print("The book says: 'Pieces of eight! The parrot knows the way.'");
      } else print("You don't have the book.");
      return;
    }

    if (verb === "read" && noun === "map") {
      if (inventory.includes("map")) {
        print("The map shows an X on the island. 'Beware the skeleton.'");
      } else print("You don't have the map.");
      return;
    }

    if (verb === "say" && (noun === "pieces" || noun === "eight")) {
      if (current === "dock" || inventory.includes("parrot")) {
        print("The parrot squawks: 'Pieces of eight! Follow me to the cave!'");
        parrotFriendly = true;
      } else print("Nothing happens.");
      return;
    }

    if (verb === "open" && noun === "chest") {
      if (current === "hold" && inventory.includes("key")) {
        print("You unlock the chest. Inside is a bag of jewels!");
        rooms.hold.objects.push("jewels");
        chestOpen = true;
      } else if (current === "cave") {
        print("The skeleton's chest is already open. Gold coins spill out.");
        rooms.cave.objects.push("coins");
      } else print("You can't open that.");
      return;
    }

    if (verb === "board" && noun === "ship") {
      if (current === "dock") {
        current = "ship";
        look();
      } else print("There's no ship here.");
      return;
    }

    if (verb === "fill" && noun === "bottle") {
      if (inventory.includes("bottle") && current === "beach") {
        print("You fill the bottle with seawater. Not very useful.");
      } else print("You can't fill that here.");
      return;
    }

    print("I don't understand. Type HELP.");
  }

  function onKey(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      term.writeln("");
      handle(inputBuffer);
      inputBuffer = "";
      term.write("> ");
    } else if (e.key === "Backspace") {
      e.preventDefault();
      if (inputBuffer.length) {
        inputBuffer = inputBuffer.slice(0, -1);
        term.write("\b");
      }
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      inputBuffer += e.key;
      term.write(e.key);
    }
  }

  term.wrap.addEventListener("keydown", onKey);

  term.clear();
  print("PIRATE ADVENTURE", 10);
  print("Scott Adams #2 — White Witch Edition", 2);
  print("Find the treasures. Type HELP. Pieces of eight!", 7);
  print("");
  look();

  return () => {
    term.wrap.removeEventListener("keydown", onKey);
    term.destroy();
  };
});
