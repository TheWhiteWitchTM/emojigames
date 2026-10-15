class Monster {
  constructor(letter, x, y, depth) {
    this.letter = letter;
    this.x = x;
    this.y = y;
    const table = {
      a: { name: 'ant', emoji: '🐜', hp: 6, dmg: 2, color: 2 },
      b: { name: 'bat', emoji: '🦇', hp: 4, dmg: 1, color: 7 },
      c: { name: 'centipede', emoji: '🐛', hp: 8, dmg: 2, color: 3 },
      d: { name: 'dragon', emoji: '🐉', hp: 40, dmg: 8, color: 1 },
      e: { name: 'eye', emoji: '👁️', hp: 10, dmg: 3, color: 5 },
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
    const dx = Math.sign(player.x - this.x);
    const dy = Math.sign(player.y - this.y);
    const nx = this.x + dx;
    const ny = this.y + dy;
    if (nx === player.x && ny === player.y) {
      const hit = 1 + Math.floor(Math.random() * this.dmg);
      player.hp -= hit;
      return `${this.emoji} ${this.name} hits you for ${hit}.`;
    } else if (level.isWalkable(nx, ny) && !level.getMonsterAt(nx, ny)) {
      this.x = nx;
      this.y = ny;
    }
    return null;
  }
}
