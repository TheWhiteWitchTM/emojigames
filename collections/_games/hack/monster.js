class Monster {
  constructor(letter, x, y, depth) {
    this.letter = letter;
    this.x = x;
    this.y = y;
    const table = {
      a: { name: 'ant', emoji: '🐜', hp: 6, dmg: 2, color: 2 },
      b: { name: 'bat', emoji: '🦇', hp: 4, dmg: 1, color: 7 },
      c: { name: 'centipede', emoji: '🐛', hp: 8, dmg: 2, color: 3 },
      d: { name: 'dragon', emoji: '🐉', hp: 28, dmg: 7, color: 1 },
      e: { name: 'eye', emoji: '👁', hp: 10, dmg: 3, color: 5 },
      f: { name: 'fungus', emoji: '🍄', hp: 12, dmg: 1, color: 2 },
      g: { name: 'gnome', emoji: '🧙', hp: 10, dmg: 3, color: 6 },
      h: { name: 'hobbit', emoji: '🧝', hp: 8, dmg: 2, color: 3 },
      i: { name: 'imp', emoji: '😈', hp: 9, dmg: 3, color: 4 },
      j: { name: 'jackal', emoji: '🐕', hp: 7, dmg: 2, color: 3 },
      k: { name: 'kobold', emoji: '👺', hp: 8, dmg: 2, color: 3 },
      l: { name: 'leprechaun', emoji: '🍀', hp: 6, dmg: 1, color: 10 }
    };
    const stats = table[letter] || { name: 'monster', emoji: '👾', hp: 8, dmg: 2, color: 1 };
    this.name = stats.name;
    this.emoji = stats.emoji;
    this.ch = stats.emoji;
    this.hp = stats.hp + depth;
    this.maxHp = this.hp;
    this.dmg = stats.dmg + Math.floor(depth / 2);
    this.color = stats.color;
  }

  act(level, player) {
    if (this.hp <= 0) return null;
    const dist = Math.max(Math.abs(player.x - this.x), Math.abs(player.y - this.y));
    let dx = 0;
    let dy = 0;
    if (dist <= 8) {
      dx = Math.sign(player.x - this.x);
      dy = Math.sign(player.y - this.y);
    } else if (Math.random() < 0.45) {
      const opts = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      const pick = opts[Math.floor(Math.random() * opts.length)];
      dx = pick[0];
      dy = pick[1];
    } else {
      return null;
    }
    const steps = dx && dy ? [[dx, dy], [dx, 0], [0, dy]] : [[dx, dy]];
    for (let i = 0; i < steps.length; i++) {
      const sx = steps[i][0];
      const sy = steps[i][1];
      if (!sx && !sy) continue;
      const nx = this.x + sx;
      const ny = this.y + sy;
      if (nx === player.x && ny === player.y) {
        const soak = player.armor ? player.armor.bonus : 0;
        const hit = Math.max(0, 1 + Math.floor(Math.random() * this.dmg) - soak);
        player.hp -= hit;
        if (!hit) return '🛡 Your armor turns the ' + this.name + '.';
        return this.emoji + ' The ' + this.name + ' hits you for ' + hit + '.';
      }
      if (level.isWalkable(nx, ny) && !level.getMonsterAt(nx, ny)) {
        this.x = nx;
        this.y = ny;
        return null;
      }
    }
    return null;
  }
}
