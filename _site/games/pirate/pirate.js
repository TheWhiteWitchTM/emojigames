useEffect(() => {
  const container = document.getElementById('game');
  if (!container) return;

  const term = new Glass({
    cols: 80,
    rows: 24,
    title: '🏴‍☠️ Pirate Adventure',
    border: '#39ff14',
    footer: 'LOOK  INVENTORY  GO  GET  DROP  SAY  HELP  RESTART'
  });
  container.appendChild(term.wrap);
  term.focus();

  const rooms = {
    flat: {
      name: "London Flat",
      desc: "You are in a London flat. A window looks out over the street. A bookcase stands against one wall.",
      art: ["🏠 London.", "📚 A bookcase. 🪟 A window."],
      exits: { e: "street" },
      objects: ["book"]
    },
    street: {
      name: "Street",
      desc: "You are on a London street. A taxi waits nearby.",
      art: ["🚕 A taxi waits."],
      exits: { w: "flat", e: "dock" },
      objects: []
    },
    dock: {
      name: "Dock",
      desc: "You are at the docks. A ship is moored here. A parrot sits on a crate.",
      art: ["⚓ Docks.", "🚢 A ship. 🦜 A parrot."],
      exits: { w: "street", e: "ship", s: "island" },
      objects: ["parrot"]
    },
    ship: {
      name: "Pirate Ship",
      desc: "You are on the deck of a pirate ship. The hold is below. A rusty anchor lies here.",
      art: ["☠ The deck.", "⚓ A rusty anchor."],
      exits: { w: "dock", d: "hold" },
      objects: ["anchor"]
    },
    hold: {
      name: "Ship's Hold",
      desc: "You are in the ship's hold. It is dark and smells of rum. A chest sits in the corner.",
      art: ["📦 The hold.", "🧰 A chest."],
      exits: { u: "ship" },
      objects: ["chest"]
    },
    island: {
      name: "Tropical Island",
      desc: "You are on a tropical island. Palm trees sway. A path leads inland. A bottle lies in the sand.",
      art: ["🌴 🌴 🌴", "🍾 A bottle in the sand."],
      exits: { n: "dock", e: "jungle", s: "beach" },
      objects: ["bottle"]
    },
    jungle: {
      name: "Dense Jungle",
      desc: "You are in dense jungle. Vines hang everywhere. Something glints in the undergrowth.",
      art: ["🌴 Dense jungle.", "🔪 A machete."],
      exits: { w: "island", e: "clearing" },
      objects: ["machete"]
    },
    clearing: {
      name: "Clearing",
      desc: "You are in a clearing. A large rock has strange markings. A cave mouth yawns nearby.",
      art: ["🌿 A clearing.", "🪨 A rock. 🕳 A cave."],
      exits: { w: "jungle", e: "cave" },
      objects: ["map"]
    },
    cave: {
      name: "Pirate Cave",
      desc: "You are in a pirate cave. Treasure glints in the torchlight. A skeleton guards a chest.",
      art: ["🕳 The cave.", "💰 Treasure. 💀 A skeleton."],
      exits: { w: "clearing" },
      objects: ["treasure", "skeleton"]
    },
    beach: {
      name: "Sandy Beach",
      desc: "You are on a sandy beach. Waves crash. A small boat is pulled up on the sand.",
      art: ["🏖 Sand.", "🚣 A boat."],
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
  let mode = "intro";
  const roomSeed = JSON.parse(JSON.stringify(rooms));
  const HOME = ["treasure", "jewels", "coins"];

  function atHome() {
    return HOME.every(id => rooms.flat.objects.includes(id));
  }

  function showIntro() {
    mode = "intro";
    inputBuffer = "";
    term.paintCard({
      kicker: "pieces of eight",
      title: "PIRATE ADVENTURE",
      lines: [
        "Leave the London flat. Find the island. Bring the gold home.",
        "Three treasures belong back in the flat.",
        "The parrot knows the words. HELP lists the rest."
      ],
      foot: "Press Return"
    });
    term.tone(349, 0.08);
    setTimeout(() => term.tone(440, 0.1), 140);
  }

  function showEnd(kind, line, detail) {
    mode = "end";
    inputBuffer = "";
    const title = kind === "win" ? "THE FLAT IS RICH" : kind === "dead" ? "YOU DIED" : "YOU TURN BACK";
    term.paintCard({
      title: title,
      fg: kind === "win" ? 11 : kind === "dead" ? 9 : 7,
      lines: [line, detail, "Score " + score],
      foot: "Press R"
    });
    if (kind === "win") {
      term.tone(523, 0.1);
      setTimeout(() => term.tone(659, 0.12), 140);
      setTimeout(() => term.tone(784, 0.16), 280);
    } else if (kind === "dead") term.tone(80, 0.4);
    else term.tone(220, 0.1);
  }

  function begin() {
    mode = "play";
    Object.keys(rooms).forEach(key => {
      rooms[key].objects = roomSeed[key].objects.slice();
      rooms[key].exits = Object.assign({}, roomSeed[key].exits);
    });
    current = "flat";
    inventory = [];
    score = 0;
    treasures = 0;
    inputBuffer = "";
    chestOpen = false;
    parrotFriendly = false;
    look();
    term.showCursor();
    term.write("> ");
    term.tone(330, 0.05);
  }

  function checkWin() {
    if (mode === "play" && atHome()) {
      showEnd("win", "The gold, the jewels, and the coins are home.", "London looks different with a fortune in the flat.");
    }
  }

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
    print(`Score: ${score}    Home: ${HOME.filter(id => rooms.flat.objects.includes(id)).length}/3`, 3);
    term.writeln("");
    inputBuffer = "";
  }

  function get(id) {
    const room = rooms[current];
    const idx = room.objects.indexOf(id);
    if (idx === -1) return print("You don't see that here.");
    if (objects[id]?.static) return print("You can't take that.");
    if (current === "cave" && rooms.cave.objects.includes("skeleton") && !parrotFriendly && (id === "treasure" || id === "coins")) {
      showEnd("dead", "The skeleton runs you through.", "The parrot knows the words.");
      return;
    }
    room.objects.splice(idx, 1);
    inventory.push(id);
    if (objects[id].treasure) { score += 25; treasures++; }
    print(`You take the ${objects[id].name}.`);
    term.tone(540, 0.06);
  }

  function drop(id) {
    const idx = inventory.indexOf(id);
    if (idx === -1) return print("You aren't carrying that.");
    inventory.splice(idx, 1);
    rooms[current].objects.push(id);
    print(`You drop the ${objects[id].name}.`);
    term.tone(300, 0.05);
    checkWin();
  }

  function showHelp() {
    print("Commands:", 7);
    print("  LOOK/L  INVENTORY/I  GO <dir>  GET/TAKE  DROP", 2);
    print("  READ  OPEN  SAY  CLIMB  BOARD  FILL  SCORE  HELP  RESTART  QUIT", 2);
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
    if (verb === "score") return print(`Score: ${score}    Home: ${HOME.filter(id => rooms.flat.objects.includes(id)).length}/3`);
    if (verb === "restart") return begin();
    if (verb === "quit" || verb === "exit") {
      showEnd("leave", "You turn back before the gold is home.", "The flat is quiet.");
      return;
    }
    if (verb === "swim") {
      showEnd("dead", "You swim until the water wins.", "The boat was the sensible way.");
      return;
    }

    if (verb === "go" || ["n","s","e","w","u","d"].includes(verb)) {
      const dir = verb === "go" ? noun : verb;
      const room = rooms[current];
      if (!room.exits[dir]) return print("You can't go that way.");
      current = room.exits[dir];
      term.tone(220, 0.03);
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
        if (rooms.cave.objects.includes("skeleton") && !parrotFriendly) {
          showEnd("dead", "The skeleton will not share the chest.", "Say the words the book taught you.");
          return;
        }
        print("The skeleton's chest is already open. Gold coins spill out.");
        if (!rooms.cave.objects.includes("coins")) rooms.cave.objects.push("coins");
        term.tone(480, 0.08);
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
    if (mode === "intro") {
      if (isReturn(e.key) || isRestart(e.key)) begin();
      return;
    }
    if (mode === "end") {
      if (isRestart(e.key)) begin();
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      term.writeln("");
      handle(inputBuffer);
      inputBuffer = "";
      if (mode === "play") {
        term.showCursor();
        term.write("> ");
      }
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

  term.onKey(onKey);

  showIntro();

  return () => term.destroy();
});
