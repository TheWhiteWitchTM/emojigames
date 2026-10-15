useEffect(() => {
  const container = document.getElementById('game');
  if (!container) return;

  const term = new Terminal({ border: '#39ff14' });
  container.appendChild(term.wrap);
  term.wrap.focus();

  const rooms = {
    forest: {
      name: "Forest",
      desc: "You are in a dark forest. Paths lead in several directions. Tall trees surround you.",
      art: ["   /\\   /\\   ", "  /  \\ /  \\  ", " /    Y    \\ ", "    forest     "],
      exits: { e: "meadow", n: "forest", s: "forest", w: "forest" },
      objects: []
    },
    meadow: {
      name: "Sunny Meadow",
      desc: "You are in a sunny meadow. A large sleeping dragon lies here. It does not like the smell of mud.",
      art: ["    ~~ dragon ~~  ", "   ( sleeping )   ", "      meadow      "],
      exits: { e: "shore", w: "forest" },
      objects: ["dragon"]
    },
    shore: {
      name: "Lake Shore",
      desc: "You are on the shore of a large lake. The water looks deep.",
      art: ["  ~~~~~~~ lake ~~~~~~~ ", "     shore             ", "   [axe]               "],
      exits: { w: "meadow", n: "bog", s: "swamp" },
      objects: ["axe"]
    },
    bog: {
      name: "Quicksand Bog",
      desc: "You are in a quicksand bog. It is dangerous here. Something large is half-submerged.",
      art: ["   mmm quicksand mmm   ", "      [ox]             ", "   sinking...          "],
      exits: { s: "shore" },
      objects: ["ox"]
    },
    swamp: {
      name: "Dismal Swamp",
      desc: "You are in a dismal swamp. Murky water and twisted trees.",
      art: ["  ~~~ swamp ~~~  ", "   murky water   ", "                 "],
      exits: { n: "shore", w: "grove", e: "trees" },
      objects: []
    },
    grove: {
      name: "Hidden Grove",
      desc: "You are in a hidden grove. A good place for things to appear.",
      art: ["   hidden grove   ", "                  ", "                  "],
      exits: { e: "swamp" },
      objects: []
    },
    trees: {
      name: "Tall Trees",
      desc: "You are among tall trees. One large cypress looks climbable. There is a sign and some mud.",
      art: ["    ||| trees |||  ", "   climbable tree  ", "     [mud]         "],
      exits: { w: "swamp", u: "tree" },
      objects: ["mud", "fruit"]
    },
    tree: {
      name: "Top of Tree",
      desc: "You are at the top of a large cypress tree. There is a spider web with something shiny in it.",
      art: ["     spider web     ", "       [keys]       ", "    high up         "],
      exits: { d: "trees" },
      objects: ["keys"]
    },
    stump: {
      name: "Hollow Stump",
      desc: "You are inside a hollow stump. This is the traditional place to store treasures.",
      art: ["   ( hollow stump )  ", "    treasure spot    ", "   [lamp] [bottle]   "],
      exits: { u: "trees", d: "root" },
      objects: ["lamp", "bottle"]
    },
    root: {
      name: "Root Chamber",
      desc: "You are in a root chamber under the stump. Roots twist around a pot.",
      art: ["   root chamber   ", "     [rubies]     ", "                  "],
      exits: { u: "stump", d: "hole" },
      objects: ["rubies"]
    },
    hole: {
      name: "Bottomless Hole",
      desc: "You are at the edge of a bottomless hole. Flint and steel lie nearby.",
      art: ["     O hole O     ", "    bottomless    ", "     [flint]      "],
      exits: { u: "root", d: "hallway" },
      objects: ["flint"]
    },
    hallway: {
      name: "Hallway",
      desc: "You are in a hallway. A locked door blocks the way down.",
      art: ["   ==== door ====  ", "     hallway       ", "                   "],
      exits: { u: "hole", d: "cavern" },
      objects: [],
      locked: true
    },
    cavern: {
      name: "Large Cavern",
      desc: "You are in a large cavern. Passages lead in several directions.",
      art: ["   large cavern   ", "                  ", "                  "],
      exits: { u: "hallway", n: "bees", s: "anteroom", w: "maze" },
      objects: []
    },
    maze: {
      name: "Twisty Maze",
      desc: "You are in a twisty maze of passages. All alike.",
      art: ["    maze walls    ", "   twisty paths   ", "   [rug] [net]    "],
      exits: { n: "maze", s: "maze", e: "maze", w: "cavern" },
      objects: ["rug", "net"]
    },
    bees: {
      name: "Beehive",
      desc: "You are in a beehive. Bees buzz angrily. There is honey.",
      art: ["   BZZ bees BZZ   ", "    [honey]       ", "                  "],
      exits: { s: "cavern" },
      objects: ["honey", "bees"]
    },
    anteroom: {
      name: "Royal Anteroom",
      desc: "You are in a royal anteroom. An empty wine bladder lies here.",
      art: ["  royal anteroom  ", "   [bladder]      ", "                  "],
      exits: { n: "cavern", u: "chamber" },
      objects: ["bladder"]
    },
    chamber: {
      name: "Royal Chamber",
      desc: "You are in the royal chamber. A bricked-up window is set in the wall.",
      art: ["  royal chamber   ", "  [bricked window]", "                  "],
      exits: { d: "anteroom" },
      objects: []
    },
    ledge1: {
      name: "Narrow Ledge",
      desc: "You are on a narrow ledge above a deep chasm. The opposite ledge is visible.",
      art: ["   narrow ledge   ", "     chasm below  ", "                  "],
      exits: { w: "chamber", e: "ledge2" },
      objects: []
    },
    ledge2: {
      name: "Opposite Ledge",
      desc: "You are on the opposite ledge. A black bear blocks the way. A mirror glints.",
      art: ["  opposite ledge  ", "    [bear]        ", "   [mirror]       "],
      exits: { w: "ledge1", e: "throne" },
      objects: ["mirror", "bear"]
    },
    throne: {
      name: "Throne Room",
      desc: "You are in the throne room. A golden crown sits on the throne.",
      art: ["   throne room    ", "    [crown]       ", "                  "],
      exits: { w: "ledge2" },
      objects: ["crown"]
    },
    lava: {
      name: "Lava Stream",
      desc: "A stream of lava blocks the way. Firebricks lie nearby.",
      art: ["  ~~~ lava ~~~   ", "   [bricks]       ", "                  "],
      exits: { n: "cavern" },
      objects: ["bricks"]
    }
  };

  const objects = {
    axe:      { name: "axe",      desc: "a rusty axe", treasure: false },
    ox:       { name: "ox",       desc: "a large blue ox", treasure: true },
    lamp:     { name: "lamp",     desc: "a brass lamp", treasure: false },
    keys:     { name: "keys",     desc: "a set of keys", treasure: false },
    rubies:   { name: "rubies",   desc: "a pot of rubies", treasure: true },
    bottle:   { name: "bottle",   desc: "an empty bottle", treasure: false },
    mud:      { name: "mud",      desc: "some evil-smelling mud", treasure: false },
    flint:    { name: "flint",    desc: "flint and steel", treasure: false },
    honey:    { name: "honey",    desc: "royal honey", treasure: true },
    bees:     { name: "bees",     desc: "a swarm of bees", treasure: false },
    bladder:  { name: "bladder",  desc: "an empty wine bladder", treasure: false },
    dragon:   { name: "dragon",   desc: "a sleeping dragon", treasure: false, static: true },
    mirror:   { name: "mirror",   desc: "a magic mirror", treasure: true },
    crown:    { name: "crown",    desc: "a golden crown", treasure: true },
    rug:      { name: "rug",      desc: "a thick persian rug", treasure: true },
    net:      { name: "net",      desc: "a golden net", treasure: true },
    eggs:     { name: "eggs",     desc: "dragon eggs", treasure: true },
    firestone:{ name: "firestone",desc: "a glowing firestone", treasure: true },
    ring:     { name: "ring",     desc: "a diamond ring", treasure: true },
    bracelet: { name: "bracelet", desc: "a diamond bracelet", treasure: true },
    fruit:    { name: "fruit",    desc: "jeweled fruit", treasure: true },
    fish:     { name: "fish",     desc: "a golden fish", treasure: true },
    bear:     { name: "bear",     desc: "a black bear", treasure: false, static: true },
    bricks:   { name: "bricks",   desc: "firebricks", treasure: false }
  };

  let current = "forest";
  let inventory = [];
  let score = 0;
  let treasures = 0;
  let inputBuffer = "";
  let lampOn = false;
  let windowBlown = false;
  let lavaDammed = false;

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
    print(`Score: ${score}/100   Treasures: ${treasures}/13`, 3);
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
    if (objects[id].treasure) { score += 7; treasures++; }
    print(`You take the ${objects[id].name}.`);
  }

  function drop(id) {
    const idx = inventory.indexOf(id);
    if (idx === -1) return print("You aren't carrying that.");
    inventory.splice(idx, 1);
    rooms[current].objects.push(id);
    if (objects[id].treasure && current === "stump") score += 3;
    print(`You drop the ${objects[id].name}.`);
  }

  function showHelp() {
    print("Commands:", 7);
    print("  LOOK/L  INVENTORY/I  GO <dir>  GET/TAKE  DROP", 2);
    print("  SAY BUNYON  SAY AWAY  RUB LAMP  LIGHT LAMP", 2);
    print("  UNLOCK DOOR  YELL  JUMP  FILL  CATCH  DAM  POUR", 2);
    print("  SCORE  HELP  QUIT", 2);
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
    if (verb === "score") return print(`Score: ${score}/100  Treasures: ${treasures}/13`);
    if (verb === "quit" || verb === "exit") { print("Thanks for playing!"); return; }

    if (verb === "go" || ["n","s","e","w","u","d"].includes(verb)) {
      const dir = verb === "go" ? noun : verb;
      const room = rooms[current];
      if (!room.exits[dir]) return print("You can't go that way.");
      if (room.locked && dir === "d") return print("The door is locked.");
      if (current === "chamber" && dir === "e" && !windowBlown) return print("The window is bricked up.");
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

    if (verb === "say" && noun === "bunyon") {
      if (inventory.includes("axe") && current === "bog") {
        print("A voice booms 'BUNYON!' The ox and axe vanish to the hidden grove!");
        rooms.grove.objects.push("ox", "axe");
        inventory = inventory.filter(i => i !== "axe");
        rooms.bog.objects = rooms.bog.objects.filter(i => i !== "ox");
      } else print("Nothing happens.");
      return;
    }

    if (verb === "say" && noun === "away") {
      if (inventory.includes("rug")) {
        print("The rug lifts you into the air and flies you to the meadow!");
        current = "meadow";
        look();
      } else print("Nothing happens.");
      return;
    }

    if (verb === "rub" && noun === "lamp") {
      if (inventory.includes("lamp")) {
        print("A genie appears! It drops a diamond ring and a diamond bracelet.");
        rooms[current].objects.push("ring", "bracelet");
      } else print("You don't have the lamp.");
      return;
    }

    if (verb === "light" && noun === "lamp") {
      if (inventory.includes("lamp") && inventory.includes("flint")) {
        lampOn = true;
        print("You strike the flint. The lamp is now lit.");
      } else print("You need both the lamp and the flint.");
      return;
    }

    if (verb === "unlock" && noun === "door") {
      if (inventory.includes("keys") && current === "hallway") {
        rooms.hallway.locked = false;
        print("You unlock the door with the keys.");
      } else print("You can't do that.");
      return;
    }

    if (verb === "yell" || verb === "scream") {
      if (current === "ledge2" && rooms.ledge2.objects.includes("bear")) {
        print("You yell! The bear is startled and falls into the chasm.");
        rooms.ledge2.objects = rooms.ledge2.objects.filter(o => o !== "bear");
      } else print("Nothing happens.");
      return;
    }

    if (verb === "jump") {
      if (current === "ledge1") { current = "ledge2"; look(); }
      else if (current === "ledge2") { current = "ledge1"; look(); }
      else print("You can't jump here.");
      return;
    }

    if (verb === "fill" && noun === "bladder") {
      if (inventory.includes("bladder") && current === "swamp") {
        print("You fill the bladder with swamp gas.");
      } else print("You can't fill that here.");
      return;
    }

    if (verb === "light" && noun === "gas") {
      if (current === "chamber" && inventory.includes("bladder")) {
        print("You light the gas! The bladder explodes and blows a hole in the window.");
        windowBlown = true;
        rooms.chamber.exits.e = "ledge1";
        inventory = inventory.filter(i => i !== "bladder");
      } else print("Nothing happens.");
      return;
    }

    if (verb === "dam" && noun === "lava") {
      if (current === "lava" && inventory.includes("bricks")) {
        print("You dam the lava with the bricks. A firestone falls free.");
        lavaDammed = true;
        rooms.lava.objects.push("firestone");
        inventory = inventory.filter(i => i !== "bricks");
      } else print("You can't do that.");
      return;
    }

    if (verb === "pour" && noun === "water") {
      if (lavaDammed && inventory.includes("bottle")) {
        print("You pour water on the hot firestone. It cools enough to take.");
      } else print("Nothing to pour on.");
      return;
    }

    if (verb === "catch" && noun === "fish") {
      if (current === "shore" && inventory.includes("net") && inventory.includes("bottle")) {
        print("You catch a golden fish with the net and put it in the bottle!");
        rooms.shore.objects.push("fish");
      } else print("You need the net and bottle.");
      return;
    }

    if (verb === "get" && noun === "bees") {
      if (current === "bees" && inventory.includes("bottle") && inventory.includes("mud")) {
        print("Protected by the mud, you catch the bees in the bottle.");
        get("bees");
      } else print("The bees sting you! You need mud and a bottle.");
      return;
    }

    if (verb === "drop" && noun === "bees") {
      if (current === "meadow" && inventory.includes("bees")) {
        print("You release the bees! They attack the dragon, which flies away. Dragon eggs are left behind.");
        rooms.meadow.objects = rooms.meadow.objects.filter(o => o !== "dragon");
        rooms.meadow.objects.push("eggs");
        inventory = inventory.filter(i => i !== "bees");
      } else drop("bees");
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
  print("ADVENTURELAND", 10);
  print("Complete classic chain — White Witch Edition", 2);
  print("Collect all 13 *treasures* in the stump. Type HELP.", 7);
  print("");
  look();

  return () => {
    term.wrap.removeEventListener("keydown", onKey);
    term.destroy();
  };
});
