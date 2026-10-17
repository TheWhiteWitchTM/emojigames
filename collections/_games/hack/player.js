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
    if (item.type === 'amulet') return 'You take the Amulet of Yendor.';
    this.inventory.push(item);
    if (item.type === 'weapon' && (!this.weapon || item.bonus > this.weapon.bonus)) {
      this.weapon = item;
      return `You wield the ${item.name}.`;
    }
    if (item.type === 'armor' && (!this.armor || item.bonus > this.armor.bonus)) {
      this.armor = item;
      return `You wear the ${item.name}.`;
    }
    return `You pick up the ${item.name}.`;
  }
}
