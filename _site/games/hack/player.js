class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.ch = '@';
    this.hp = 20;
    this.maxHp = 20;
    this.str = 16;
    this.gold = 0;
    this.inventory = [];
    this.weapon = null;
    this.armor = null;
  }

  attack(monster) {
    const bonus = this.weapon ? this.weapon.bonus : 0;
    const dmg = 1 + Math.floor(Math.random() * (this.str / 4 + bonus));
    monster.hp -= dmg;
    return dmg;
  }

  pickup(item) {
    if (item.type === 'gold') {
      this.gold += item.amount;
      return `You pick up ${item.amount} gold.`;
    }
    this.inventory.push(item);
    return `You pick up the ${item.name}.`;
  }
}
