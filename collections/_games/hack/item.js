class Item {
  constructor(x, y, depth) {
    this.x = x;
    this.y = y;
    const kinds = [
      { ch: '🗡', name: 'dagger', type: 'weapon', bonus: 1 },
      { ch: '⚔', name: 'sword', type: 'weapon', bonus: 3 },
      { ch: '🛡', name: 'buckler', type: 'armor', bonus: 1 },
      { ch: '🛡', name: 'mail', type: 'armor', bonus: 3 },
      { ch: '🧪', name: 'potion', type: 'potion' },
      { ch: '📜', name: 'scroll of blinking', type: 'scroll' },
      { ch: '🍖', name: 'ration', type: 'food' },
      { ch: '💰', name: 'gold', type: 'gold', amount: 8 + Math.floor(Math.random() * 28) + depth * 4 }
    ];
    const k = kinds[Math.floor(Math.random() * kinds.length)];
    Object.assign(this, k);
  }
}
