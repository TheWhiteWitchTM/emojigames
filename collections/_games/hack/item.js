class Item {
  constructor(x, y, depth) {
    this.x = x;
    this.y = y;
    const kinds = [
      { ch: '🗡️', name: 'dagger', type: 'weapon', bonus: 1 },
      { ch: '⚔️', name: 'short sword', type: 'weapon', bonus: 2 },
      { ch: '🛡️', name: 'leather armor', type: 'armor', bonus: 1 },
      { ch: '🛡️', name: 'chain mail', type: 'armor', bonus: 3 },
      { ch: '🧪', name: 'potion of healing', type: 'potion' },
      { ch: '📜', name: 'scroll of identify', type: 'scroll' },
      { ch: '💰', name: 'gold', type: 'gold', amount: 10 + Math.floor(Math.random() * 40) }
    ];
    const k = kinds[Math.floor(Math.random() * kinds.length)];
    Object.assign(this, k);
  }
}
