// Classic Elite universe: eight galaxies, 256 systems, from the published
// three-word twist. Prices are tenths of a credit. Fuel is tenths of a light year.
(function (root) {
  "use strict";

  const BASE = [0x5A4A, 0x0248, 0xB753];
  const PAIRS = "ABOUSEITILETSTONLONUTHNO..LEXEGEZACEBISOUSESARMAINDIREA.ERATENBERALAVETIEDORQUANTEISRION";
  const PAIRS1 = 24;

  const GOV = ["Anarchy", "Feudal", "Multi-gov", "Dictatorship", "Communist", "Confederacy", "Democracy", "Corporate State"];
  const ECON = ["Rich Industrial", "Average Industrial", "Poor Industrial", "Mainly Industrial", "Mainly Agricultural", "Rich Agricultural", "Average Agricultural", "Poor Agricultural"];
  const STATURE = ["Large", "Fierce", "Small"];
  const COLOR = ["Green", "Red", "Yellow", "Blue", "Black", "Harmless"];
  const TRAIT = ["Slimy", "Bug-Eyed", "Horned", "Bony", "Fat", "Furry"];
  const SPECIES = ["Rodents", "Frogs", "Lizards", "Lobsters", "Birds", "Humanoids", "Felines", "Insects"];

  const GOODS = [
    { name: "Food",         base: 0x13, grad: -0x02, quant: 0x06, mask: 0x01, unit: "t" },
    { name: "Textiles",     base: 0x14, grad: -0x01, quant: 0x0A, mask: 0x03, unit: "t" },
    { name: "Radioactives", base: 0x41, grad: -0x03, quant: 0x02, mask: 0x07, unit: "t" },
    { name: "Slaves",       base: 0x28, grad: -0x05, quant: 0xE2, mask: 0x1F, unit: "t" },
    { name: "Liquor/Wines", base: 0x53, grad: -0x05, quant: 0xFB, mask: 0x0F, unit: "t" },
    { name: "Luxuries",     base: 0xC4, grad:  0x08, quant: 0x36, mask: 0x03, unit: "t" },
    { name: "Narcotics",    base: 0xEB, grad:  0x1D, quant: 0x08, mask: 0x78, unit: "t" },
    { name: "Computers",    base: 0x9A, grad:  0x0E, quant: 0x38, mask: 0x03, unit: "t" },
    { name: "Machinery",    base: 0x75, grad:  0x06, quant: 0x28, mask: 0x07, unit: "t" },
    { name: "Alloys",       base: 0x4E, grad:  0x01, quant: 0x11, mask: 0x1F, unit: "t" },
    { name: "Firearms",     base: 0x7C, grad:  0x0D, quant: 0x1D, mask: 0x07, unit: "t" },
    { name: "Furs",         base: 0xB0, grad: -0x09, quant: 0xDC, mask: 0x3F, unit: "t" },
    { name: "Minerals",     base: 0x20, grad: -0x01, quant: 0x35, mask: 0x03, unit: "t" },
    { name: "Gold",         base: 0x61, grad: -0x01, quant: 0x42, mask: 0x07, unit: "kg" },
    { name: "Platinum",     base: 0xAB, grad: -0x02, quant: 0x37, mask: 0x1F, unit: "kg" },
    { name: "Gem-Stones",   base: 0x2D, grad: -0x01, quant: 0xFA, mask: 0x0F, unit: "g" },
    { name: "Alien Items",  base: 0x35, grad:  0x0F, quant: 0xC0, mask: 0x07, unit: "t" }
  ];

  // Prices are whole credits. Tech is the number shown on the system screen (1–15).
  const EQUIPMENT = [
    { id: "missile",  name: "Missile",              price: 30,   tech: 1,  kind: "missile" },
    { id: "bay",      name: "Large Cargo Bay",      price: 400,  tech: 1,  kind: "fit" },
    { id: "ecm",      name: "ECM System",           price: 600,  tech: 2,  kind: "fit" },
    { id: "pulse",    name: "Pulse Laser",          price: 400,  tech: 3,  kind: "laser" },
    { id: "beam",     name: "Beam Laser",           price: 1000, tech: 4,  kind: "laser" },
    { id: "scoop",    name: "Fuel Scoops",          price: 525,  tech: 5,  kind: "fit" },
    { id: "mining",   name: "Mining Laser",         price: 800,  tech: 6,  kind: "laser" },
    { id: "pod",      name: "Escape Pod",           price: 1000, tech: 6,  kind: "fit" },
    { id: "bomb",     name: "Energy Bomb",          price: 900,  tech: 7,  kind: "fit" },
    { id: "energy",   name: "Extra Energy Unit",    price: 1500, tech: 8,  kind: "fit" },
    { id: "docking",  name: "Docking Computers",    price: 1500, tech: 9,  kind: "fit" },
    { id: "military", name: "Military Laser",       price: 6000, tech: 10, kind: "laser" },
    { id: "galdrive", name: "Galactic Hyperdrive",  price: 5000, tech: 10, kind: "fit" }
  ];

  const RATINGS = [
    [0, "Harmless"],
    [8, "Mostly Harmless"],
    [16, "Poor"],
    [32, "Average"],
    [64, "Above Average"],
    [128, "Competent"],
    [512, "Dangerous"],
    [2560, "Deadly"],
    [6400, "Elite"]
  ];

  const DESC = [
    ["fabled", "notable", "well known", "famous", "noted"],
    ["very", "mildly", "most", "reasonably", ""],
    ["ancient", "\x95", "great", "vast", "pink"],
    ["\x9E \x9D plantations", "mountains", "\x9C", "\x94 forests", "oceans"],
    ["shyness", "silliness", "mating traditions", "loathing of \x86", "love for \x86"],
    ["food blenders", "tourists", "poetry", "discos", "\x8E"],
    ["talking tree", "crab", "bat", "lobst", "\xB2"],
    ["beset", "plagued", "ravaged", "cursed", "scourged"],
    ["\x96 civil war", "\x9B \x98 \x99s", "a \x9B disease", "\x96 earthquakes", "\x96 solar activity"],
    ["its \x83 \x84", "the \xB1 \x98 \x99", "its inhabitants' \x9A \x85", "\xA1", "its \x8D \x8E"],
    ["juice", "brandy", "water", "brew", "gargle blasters"],
    ["\xB2", "\xB1 \x99", "\xB1 \xB2", "\xB1 \x9B", "\x9B \xB2"],
    ["fabulous", "exotic", "hoopy", "unusual", "exciting"],
    ["cuisine", "night life", "casinos", "sit coms", " \xA1 "],
    ["\xB0", "The planet \xB0", "The world \xB0", "This planet", "This world"],
    ["n unremarkable", " boring", " dull", " tedious", " revolting"],
    ["planet", "world", "place", "little planet", "dump"],
    ["wasp", "moth", "grub", "ant", "\xB2"],
    ["poet", "arts graduate", "yak", "snail", "slug"],
    ["tropical", "dense", "rain", "impenetrable", "exuberant"],
    ["funny", "weird", "unusual", "strange", "peculiar"],
    ["frequent", "occasional", "unpredictable", "dreadful", "deadly"],
    ["\x82 \x81 for \x8A", "\x82 \x81 for \x8A and \x8A", "\x88 by \x89", "\x82 \x81 for \x8A but \x88 by \x89", "a\x90 \x91"],
    ["\x9B", "mountain", "edible", "tree", "spotted"],
    ["\x9F", "\xA0", "\x87oid", "\x93", "\x92"],
    ["ancient", "exceptional", "eccentric", "ingrained", "\x95"],
    ["killer", "deadly", "evil", "lethal", "vicious"],
    ["parking meters", "dust clouds", "ice bergs", "rock formations", "volcanoes"],
    ["plant", "tulip", "banana", "corn", "\xB2weed"],
    ["\xB2", "\xB1 \xB2", "\xB1 \x9B", "inhabitant", "\xB1 \xB2"],
    ["shrew", "beast", "bison", "snake", "wolf"],
    ["leopard", "cat", "monkey", "goat", "fish"],
    ["\x8C \x8B", "\xB1 \x9F \xA2", "its \x8D \xA0 \xA2", "\xA3 \xA4", "\x8C \x8B"],
    ["meat", "cutlet", "steak", "burgers", "soup"],
    ["ice", "mud", "Zero-G", "vacuum", "\xB1 ultra"],
    ["hockey", "cricket", "karate", "polo", "tennis"]
  ];

  function u16(n) {
    return n & 0xFFFF;
  }
  function rot8(x) {
    const v = x & 255;
    return ((v << 1) | (v >> 7)) & 255;
  }
  function twistWord(x) {
    return (rot8(x >> 8) << 8) | rot8(x & 255);
  }
  function tweak(s) {
    const sum = u16(s[0] + s[1] + s[2]);
    s[0] = s[1];
    s[1] = s[2];
    s[2] = sum;
  }
  function nextGalaxy(s) {
    s[0] = twistWord(s[0]);
    s[1] = twistWord(s[1]);
    s[2] = twistWord(s[2]);
  }

  function makesystem(s) {
    const w0 = s[0], w1 = s[1], w2 = s[2];
    const x = (w1 >> 8) & 255;
    const y = (w0 >> 8) & 255;
    const gov = (w1 >> 3) & 7;
    let economy = (w0 >> 8) & 7;
    if (gov <= 1) economy = economy | 2;
    let tech = ((w1 >> 8) & 3) + (economy ^ 7);
    tech += gov >> 1;
    if (gov & 1) tech += 1;
    const population = 4 * tech + economy + gov + 1;
    const productivity = ((economy ^ 7) + 3) * (gov + 4) * population * 8;
    const radius = 256 * (((w2 >> 8) & 15) + 11) + x;
    const goat = {
      a: w1 & 255,
      b: (w1 >> 8) & 255,
      c: w2 & 255,
      d: (w2 >> 8) & 255
    };
    const longName = (w0 & 64) !== 0;
    const chars = [];
    for (let i = 0; i < 4; i += 1) {
      const pair = 2 * ((s[2] >> 8) & 31);
      tweak(s);
      chars.push(PAIRS[PAIRS1 + pair], PAIRS[PAIRS1 + pair + 1]);
    }
    let name = (longName ? chars : chars.slice(0, 6)).join("").replace(/\./g, "");
    const human = (goat.c & 0x80) === 0;
    const adj1 = (goat.d >> 2) & 3;
    const adj2 = (goat.d >> 5) & 7;
    const adj3 = (x ^ y) & 7;
    const speciesType = (adj3 + (goat.d & 3)) & 7;
    let species = "Human Colonials";
    if (!human) {
      const bits = [];
      if (adj1 < 3) bits.push(STATURE[adj1]);
      if (adj2 < 6) bits.push(COLOR[adj2]);
      if (adj3 < 6) bits.push(TRAIT[adj3]);
      bits.push(SPECIES[speciesType]);
      species = bits.join(" ");
    }
    return {
      x, y, gov, economy, tech, population, productivity, radius,
      goat, name, human, species,
      craters: (tech & 2) !== 0
    };
  }

  function buildGalaxy(index) {
    const s = BASE.slice();
    for (let g = 1; g < index; g += 1) nextGalaxy(s);
    const systems = [];
    for (let i = 0; i < 256; i += 1) systems.push(makesystem(s));
    return systems;
  }

  let cache = null;
  function galaxies() {
    if (!cache) {
      cache = [];
      for (let g = 1; g <= 8; g += 1) cache.push(buildGalaxy(g));
    }
    return cache;
  }

  function distance(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.round(4 * Math.sqrt(dx * dx + (dy * dy) / 4));
  }

  function genMarket(fluct, system) {
    const quantity = [];
    const price = [];
    for (let i = 0; i < GOODS.length; i += 1) {
      const good = GOODS[i];
      const product = system.economy * good.grad;
      const changing = fluct & good.mask;
      let q = (good.quant + changing - product) & 0xFF;
      if (q & 0x80) q = 0;
      quantity.push(q & 0x3F);
      let p = (good.base + changing + product) & 0xFF;
      price.push(p * 4);
    }
    quantity[16] = 0;
    return { fluct, quantity, price };
  }

  function genRnd(seed) {
    let x = (seed.a * 2) & 0xFF;
    let a = x + seed.c;
    if (seed.a > 127) a += 1;
    seed.a = a & 0xFF;
    seed.c = x;
    a = (a / 256) | 0;
    x = seed.b;
    a = (a + x + seed.d) & 0xFF;
    seed.b = a;
    seed.d = x;
    return a;
  }

  function describe(system) {
    const seed = { a: system.goat.a, b: system.goat.b, c: system.goat.c, d: system.goat.d };
    const name = system.name;
    function lowerRest(word) {
      return word.charAt(0) + word.slice(1).toLowerCase();
    }
    function ian(word) {
      let core = "";
      for (let i = 0; i < word.length; i += 1) {
        const ch = word.charAt(i);
        const last = i === word.length - 1;
        if (!last || (ch !== "E" && ch !== "I")) core += i === 0 ? ch : ch.toLowerCase();
      }
      return core + "ian";
    }
    function randomName() {
      const len = genRnd(seed) & 3;
      let out = "";
      for (let i = 0; i <= len; i += 1) {
        const x = genRnd(seed) & 0x3e;
        let p1 = PAIRS.charAt(x);
        let p2 = PAIRS.charAt(x + 1);
        if (p1 !== ".") {
          if (i) p1 = p1.toLowerCase();
          out += p1;
        }
        if (p2 !== ".") {
          if (i || p1 !== ".") p2 = p2.toLowerCase();
          out += p2;
        }
      }
      return out;
    }
    function expand(source) {
      let out = "";
      for (let i = 0; i < source.length; i += 1) {
        const c = source.charCodeAt(i);
        if (c < 0x80) {
          out += source.charAt(i);
          continue;
        }
        if (c <= 0xA4) {
          const rnd = genRnd(seed);
          const pick = (rnd >= 0x33) + (rnd >= 0x66) + (rnd >= 0x99) + (rnd >= 0xCC);
          out += expand(DESC[c - 0x81][pick]);
          continue;
        }
        if (c === 0xB0) out += lowerRest(name);
        else if (c === 0xB1) out += ian(name);
        else if (c === 0xB2) out += randomName();
      }
      return out;
    }
    let text = expand("\x8F is \x97.");
    text = text.replace(/\s+/g, " ").replace(/\s+\./g, ".").trim();
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  function ratingName(kills) {
    let name = RATINGS[0][1];
    for (let i = 0; i < RATINGS.length; i += 1) {
      if (kills >= RATINGS[i][0]) name = RATINGS[i][1];
    }
    return name;
  }
  function ratingIndex(kills) {
    let index = 0;
    for (let i = 0; i < RATINGS.length; i += 1) {
      if (kills >= RATINGS[i][0]) index = i;
    }
    return index;
  }
  function legalName(legal) {
    if (legal <= 0) return "Clean";
    if (legal < 50) return "Offender";
    return "Fugitive";
  }
  function illegal(good, gov) {
    if (good === 3 || good === 6) return gov >= 5;
    if (good === 10) return gov >= 6;
    return false;
  }
  function techShown(system) {
    return system.tech + 1;
  }
  function findByPrefix(systems, prefix, from) {
    const p = prefix.toUpperCase();
    let best = -1;
    let bestD = 1e9;
    for (let i = 0; i < systems.length; i += 1) {
      if (systems[i].name.indexOf(p) !== 0) continue;
      const d = from ? distance(systems[i], from) : 0;
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    return best;
  }
  function neighbors(systems, index, maxTenths) {
    const here = systems[index];
    const list = [];
    for (let i = 0; i < systems.length; i += 1) {
      const d = i === index ? 0 : distance(here, systems[i]);
      if (d <= maxTenths) list.push({ index: i, distance: d });
    }
    list.sort(function (a, b) { return a.distance - b.distance; });
    return list;
  }
  function cashText(tenths) {
    const sign = tenths < 0 ? "-" : "";
    const v = Math.abs(tenths);
    return sign + Math.floor(v / 10) + "." + (v % 10) + " CR";
  }
  function fuelText(tenths) {
    return (tenths / 10).toFixed(1) + " LY";
  }
  function lyText(tenths) {
    return (tenths / 10).toFixed(1);
  }
  function priceText(tenths) {
    return (tenths / 10).toFixed(1);
  }

  const LAVE = 7;
  const MAX_FUEL = 70;
  const FUEL_COST = 2;

  const api = {
    GOODS, EQUIPMENT, GOV, ECON, RATINGS, LAVE, MAX_FUEL, FUEL_COST,
    galaxies, buildGalaxy, distance, genMarket, describe,
    ratingName, ratingIndex, legalName, illegal, techShown,
    findByPrefix, neighbors, cashText, fuelText, lyText, priceText
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.EliteGalaxy = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
