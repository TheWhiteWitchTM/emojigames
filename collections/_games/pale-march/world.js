// Pale March. Places, bestiary, and the one heading the 3D field uses.
// yaw 0 faces world -Z. forward matches EmojiEngine3D.Canvas.forward.
// right(0) is +X. A right turn decreases yaw, so forward(-PI/2) is +X.
(function (root) {
  "use strict";

  const SITES = [
    {
      id: "hold",
      name: "Pale Hold",
      emoji: "🏰",
      x: 800,
      y: 540,
      blurb: "The fire is pale, and it stays lit.",
      battleLine: ""
    },
    {
      id: "wood",
      name: "Whisper Wood",
      emoji: "🌲",
      x: 260,
      y: 220,
      blurb: "Sister Bramble. Thorns, and ash hounds.",
      battleLine: "Sister Bramble opened a seal for the wounded. The host ate the wood anyway."
    },
    {
      id: "stair",
      name: "The Salt Stair",
      emoji: "⛰️",
      x: 1340,
      y: 220,
      blurb: "Captain Vellum, and a lantern that lies.",
      battleLine: "Captain Vellum sold his name for a lantern that makes the host look like men."
    },
    {
      id: "choir",
      name: "The Burned Choir",
      emoji: "🕯️",
      x: 260,
      y: 900,
      blurb: "The Archivist, in the house that was yours.",
      battleLine: "The stacks still file the living. This was your house."
    },
    {
      id: "barrow",
      name: "The Barrow Kings",
      emoji: "🪦",
      x: 1340,
      y: 900,
      blurb: "Queen Yarrow, a crown, and a knight in chains.",
      battleLine: "Queen Yarrow woke the old crowns. A knight is on a chain. The throne is empty."
    },
    {
      id: "gate",
      name: "The Unlit Gate",
      emoji: "🌑",
      x: 800,
      y: 140,
      blurb: "King Hollow. He is writing your name.",
      battleLine: ""
    }
  ];

  const BY_ID = {};
  SITES.forEach(function (site) { BY_ID[site.id] = site; });

  const SEALS = ["wood", "stair", "choir", "barrow"];

  const KINDS = {
    hound: { emoji: "🐺", name: "Ash hound", hp: 2, speed: 5.1, dmg: 1, wait: 0.85, reach: 1.05, color: "#3c4148" },
    sergeant: { emoji: "🪖", name: "Ash sergeant", hp: 3, speed: 3.35, dmg: 1, wait: 0.95, reach: 1.15, color: "#4a4038" },
    priest: { emoji: "🕯️", name: "Cinder priest", hp: 2, speed: 2.7, dmg: 1, wait: 1.1, reach: 1.05, ranged: true, prefer: 8.2, boltEvery: 2.15, color: "#5a3a30" },
    wight: { emoji: "🪦", name: "Banner-wight", hp: 5, speed: 2.15, dmg: 1, wait: 1.15, reach: 1.25, color: "#3a3a44" },
    bramble: { emoji: "🌿", name: "Sister Bramble", hp: 8, speed: 3.15, dmg: 1, wait: 0.72, reach: 1.2, boss: true, color: "#2c4034" },
    vellum: { emoji: "🛡️", name: "Captain Vellum", hp: 9, speed: 3.5, dmg: 2, wait: 0.88, reach: 1.25, boss: true, color: "#d5d2c8" },
    archivist: { emoji: "📜", name: "The Archivist", hp: 8, speed: 2.5, dmg: 1, wait: 1, reach: 1.1, ranged: true, prefer: 7.4, boltEvery: 1.7, boss: true, color: "#4a342c" },
    yarrow: { emoji: "👑", name: "Queen Yarrow", hp: 11, speed: 2.7, dmg: 2, wait: 0.82, reach: 1.3, boss: true, color: "#5a4a32" },
    hollow: { emoji: "🌑", name: "King Hollow", hp: 14, speed: 2.85, dmg: 2, wait: 0.78, reach: 1.3, ranged: true, prefer: 6.5, boltEvery: 2.4, boss: true, color: "#2a2c34" }
  };

  const WAVES = {
    wood: [["hound", "hound", "hound", "hound"], ["bramble"]],
    stair: [["sergeant", "sergeant", "sergeant", "priest"], ["vellum", "sergeant"]],
    choir: [["wight", "wight", "wight"], ["archivist", "priest"]],
    barrow: [["wight", "wight", "sergeant", "sergeant"], ["yarrow"]],
    gate: [["priest", "priest", "sergeant", "sergeant"], ["hollow", "wight"]]
  };

  const GROUND = {
    wood: "#243028",
    stair: "#3a3c44",
    choir: "#3a2c2a",
    barrow: "#2e2c36",
    gate: "#1a1c26"
  };

  const CHOICES = {
    wood: {
      prompt: "Bramble is down. The thorns are still listening.",
      a: { id: "bound", label: "Bind her shade", detail: "She walks with you. The wood goes quiet." },
      b: { id: "laid", label: "Lay her down", detail: "You close her eyes. Your vitae holds one more, for good." }
    },
    stair: {
      prompt: "The lantern is still lit in his hand. It shows faces that are not there.",
      a: { id: "lantern", label: "Take the lantern", detail: "First Frost bites harder." },
      b: { id: "broken", label: "Break it", detail: "The host walks slower when it cannot see itself." }
    },
    choir: {
      prompt: "A page moves. Something small is living in the margin.",
      a: { id: "spared", label: "Spare the page", detail: "Moth crawls out. She steals a spell back for you." },
      b: { id: "burned", label: "Burn the stacks", detail: "White Wake learns the choir's anger." }
    },
    barrow: {
      prompt: "The crown is in the dirt between you and Sir Pell.",
      a: { id: "refused", label: "Refuse the throne", detail: "Pell keeps the oath he still has. He walks at your side." },
      b: { id: "taken", label: "Take the crown", detail: "Your vitae thickens. The gate answers with another wight." }
    }
  };

  const COMPANIONS = {
    shade: { emoji: "👻", name: "Bramble's shade", hint: "Her chill slows the host around you." },
    pell: { emoji: "⚔️", name: "Sir Pell", hint: "He takes the front and he can fall. The oath survives it." },
    moth: { emoji: "🧚", name: "Moth", hint: "She borrows First Frost and throws it back." }
  };

  const RELICS = {
    lantern: { name: "Vellum's lantern", hint: "First Frost deals one more." },
    banner: { name: "The broken lantern", hint: "The host is slower." },
    page: { name: "A burned page", hint: "White Wake is wider and meaner." },
    crown: { name: "Yarrow's crown", hint: "Two more vitae. The gate keeps an extra wight." }
  };

  const ENDINGS = {
    mercy: {
      title: "The name kept",
      text: "The Coin shows a pale edge. Quill says your name aloud, and the marches keep it. King Hollow has nothing left to write."
    },
    throne: {
      title: "The crowned witch",
      text: "You sit the barrow for what is left of the night. The host kneels. Winter does not leave. It takes your orders."
    },
    ash: {
      title: "The shut house",
      text: "The seals shut like doors in a house with nobody left to live in it. The Unlit starves. So does the wood. Quill stays."
    },
    road: {
      title: "The long walk home",
      text: "Four seals and a gate. You walk back to Pale Hold. The marches remember the shape of you, not a throne."
    },
    name: {
      title: "The finished name",
      text: "Three pages. King Hollow finishes your name. The grimoire closes on its own, and the fire at Pale Hold goes out."
    }
  };

  const OPENING = [
    "The Ash Choir kept five seals so the Unlit could not finish rising.",
    "They burned the other witches and left you the last page, the owl, and the title.",
    "You are the White Witch. King Hollow is writing your true name into the gate. Close the four marches before he finishes it."
  ];

  function site(id) {
    return BY_ID[id] || null;
  }

  function forward(yaw) {
    return { x: -Math.sin(yaw), y: 0, z: -Math.cos(yaw) };
  }

  function right(yaw) {
    const ahead = forward(yaw);
    return { x: -ahead.z, y: 0, z: ahead.x };
  }

  function yawToward(dx, dz) {
    return Math.atan2(-dx, -dz);
  }

  function turnYaw(yaw, input, rate, dt) {
    let next = yaw;
    if (input.left) next += rate * dt;
    if (input.right) next -= rate * dt;
    return next;
  }

  function velocity(yaw, input, speed) {
    let f = (input.forward ? 1 : 0) - (input.back ? 1 : 0);
    let s = (input.strafeRight ? 1 : 0) - (input.strafeLeft ? 1 : 0);
    const mag = Math.hypot(f, s);
    if (mag > 1) {
      f /= mag;
      s /= mag;
    }
    const ahead = forward(yaw);
    const side = right(yaw);
    return {
      vx: (ahead.x * f + side.x * s) * speed,
      vz: (ahead.z * f + side.z * s) * speed
    };
  }

  function obstacles(id) {
    if (id === "wood") {
      return [
        { x: -6.2, z: 2, w: 1.15, d: 1.15, h: 2.8, color: "#1e3328" },
        { x: 6.2, z: 2, w: 1.15, d: 1.15, h: 3.1, color: "#1e3328" },
        { x: -5.4, z: -6.5, w: 1.05, d: 1.05, h: 2.4, color: "#264033" },
        { x: 5.4, z: -6.5, w: 1.05, d: 1.05, h: 2.6, color: "#264033" },
        { x: 0, z: -1.5, w: 1.3, d: 1.3, h: 2.2, color: "#3e4a40" }
      ];
    }
    if (id === "stair") {
      return [
        { x: -6.5, z: 3, w: 7, d: 1.1, h: 1.8, color: "#6a6e78" },
        { x: 6.5, z: -4, w: 7, d: 1.1, h: 1.8, color: "#5c6068" }
      ];
    }
    if (id === "choir") {
      return [
        { x: -7, z: 1, w: 1.2, d: 6, h: 2.2, color: "#4a342c" },
        { x: 7, z: 1, w: 1.2, d: 6, h: 2.2, color: "#3a2a26" }
      ];
    }
    if (id === "barrow") {
      const stones = [];
      for (let i = 0; i < 8; i += 1) {
        const a = i / 8 * Math.PI * 2;
        const z = -Math.cos(a) * 7;
        if (z > 4) continue;
        stones.push({
          x: Math.sin(a) * 7,
          z: z,
          w: 1.15,
          d: 1.15,
          h: 2.4,
          color: "#3a3844"
        });
      }
      return stones;
    }
    return [
      { x: -5, z: -2, w: 1.4, d: 1.4, h: 3.6, color: "#2a2c34" },
      { x: 5, z: -2, w: 1.4, d: 1.4, h: 3.6, color: "#2a2c34" }
    ];
  }

  function waveList(id, extraWight) {
    const waves = WAVES[id].map(function (wave) { return wave.slice(); });
    if (id === "gate" && extraWight) waves[1].push("wight");
    return waves;
  }

  root.PaleWorld = {
    SITES: SITES,
    SEALS: SEALS,
    KINDS: KINDS,
    CHOICES: CHOICES,
    COMPANIONS: COMPANIONS,
    RELICS: RELICS,
    ENDINGS: ENDINGS,
    OPENING: OPENING,
    GROUND: GROUND,
    site: site,
    forward: forward,
    right: right,
    yawToward: yawToward,
    turnYaw: turnYaw,
    velocity: velocity,
    obstacles: obstacles,
    waveList: waveList
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
