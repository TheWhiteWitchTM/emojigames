class Level {
  constructor(depth, width = 38, height = 14) {
    this.depth = depth;
    this.width = width;
    this.height = height;
    this.tiles = Array.from({ length: height }, () => Array(width).fill('#'));
    this.rooms = [];
    this.monsters = [];
    this.items = [];
    this.stairsDown = null;
    this.stairsUp = null;
    this.generate();
  }

  generate() {
    let guard = 0;
    while (this.rooms.length < 6 && guard < 80) {
      guard += 1;
      const w = 5 + Math.floor(Math.random() * 4);
      const h = 3 + Math.floor(Math.random() * 2);
      const x = 1 + Math.floor(Math.random() * (this.width - w - 2));
      const y = 1 + Math.floor(Math.random() * (this.height - h - 2));
      if (this.hits(x, y, w, h)) continue;
      this.carveRoom(x, y, w, h);
      this.rooms.push({ x, y, w, h });
    }
    if (!this.rooms.length) {
      this.carveRoom(2, 2, 10, 5);
      this.rooms.push({ x: 2, y: 2, w: 10, h: 5 });
    }
    for (let i = 1; i < this.rooms.length; i++) this.connect(this.rooms[i - 1], this.rooms[i]);

    const first = this.rooms[0];
    const last = this.rooms[this.rooms.length - 1];
    this.stairsUp = { x: first.x + 1, y: first.y + 1 };
    this.stairsDown = { x: last.x + last.w - 2, y: last.y + last.h - 2 };
    if (this.stairsDown.x === this.stairsUp.x && this.stairsDown.y === this.stairsUp.y) {
      this.stairsDown = { x: last.x + 1, y: last.y + last.h - 2 };
    }
    if (this.depth > 1) this.tiles[this.stairsUp.y][this.stairsUp.x] = '<';
    if (this.depth < 6) this.tiles[this.stairsDown.y][this.stairsDown.x] = '>';
    this.placeMonsters();
    this.placeItems();
  }

  hits(x, y, w, h) {
    return this.rooms.some((room) => x < room.x + room.w + 1 && x + w + 1 > room.x && y < room.y + room.h + 1 && y + h + 1 > room.y);
  }

  carveRoom(x, y, w, h) {
    for (let yy = y; yy < y + h; yy++) {
      for (let xx = x; xx < x + w; xx++) this.tiles[yy][xx] = '.';
    }
  }

  connect(a, b) {
    let x1 = a.x + Math.floor(a.w / 2);
    let y1 = a.y + Math.floor(a.h / 2);
    const x2 = b.x + Math.floor(b.w / 2);
    const y2 = b.y + Math.floor(b.h / 2);
    while (x1 !== x2) {
      if (this.tiles[y1][x1] === '#') this.tiles[y1][x1] = '.';
      x1 += x1 < x2 ? 1 : -1;
    }
    while (y1 !== y2) {
      if (this.tiles[y1][x1] === '#') this.tiles[y1][x1] = '.';
      y1 += y1 < y2 ? 1 : -1;
    }
    if (this.tiles[y1][x1] === '#') this.tiles[y1][x1] = '.';
  }

  nearStart(x, y) {
    if (!this.stairsUp) return false;
    return Math.abs(x - this.stairsUp.x) + Math.abs(y - this.stairsUp.y) < 4;
  }

  placeMonsters() {
    const shallow = ['a', 'b', 'c', 'f', 'h', 'j', 'k', 'l'];
    const deep = ['d', 'e', 'g', 'i'];
    const types = this.depth < 3 ? shallow : shallow.concat(deep);
    const want = 2 + this.depth;
    let placed = 0;
    let guard = 0;
    while (placed < want && guard < 100) {
      guard += 1;
      const pos = this.randomFloor();
      if (!pos || this.nearStart(pos.x, pos.y) || this.getMonsterAt(pos.x, pos.y)) continue;
      this.monsters.push(new Monster(types[Math.floor(Math.random() * types.length)], pos.x, pos.y, this.depth));
      placed += 1;
    }
  }

  placeItems() {
    const want = 2 + Math.floor(this.depth / 2);
    let placed = 0;
    let guard = 0;
    while (placed < want && guard < 80) {
      guard += 1;
      const pos = this.randomFloor();
      if (!pos || this.getItemAt(pos.x, pos.y) || this.getMonsterAt(pos.x, pos.y)) continue;
      this.items.push(new Item(pos.x, pos.y, this.depth));
      placed += 1;
    }
    if (this.depth >= 6) {
      for (let tries = 0; tries < 40; tries++) {
        const pos = this.randomFloor();
        if (!pos || this.getItemAt(pos.x, pos.y) || this.getMonsterAt(pos.x, pos.y)) continue;
        this.items.push({ x: pos.x, y: pos.y, ch: '💎', name: 'Amulet of Yendor', type: 'amulet' });
        break;
      }
    }
  }

  randomFloor() {
    for (let tries = 0; tries < 80; tries++) {
      const x = 1 + Math.floor(Math.random() * (this.width - 2));
      const y = 1 + Math.floor(Math.random() * (this.height - 2));
      if (this.tiles[y][x] === '.') return { x, y };
    }
    return null;
  }

  isWalkable(x, y) {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return false;
    const t = this.tiles[y][x];
    return t === '.' || t === '<' || t === '>';
  }

  getMonsterAt(x, y) {
    return this.monsters.find((m) => m.x === x && m.y === y && m.hp > 0);
  }

  getItemAt(x, y) {
    return this.items.find((i) => i.x === x && i.y === y);
  }
}
