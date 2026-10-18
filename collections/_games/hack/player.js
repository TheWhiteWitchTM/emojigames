class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.ch = '🧙';
    this.hp = 22;
    this.maxHp = 22;
    this.str = 16;
    this.gold = 0;
    this.inventory = [];
    this.weapon = null;
    this.armor = null;
  }

  attack(monster) {
    const bonus = this.weapon ? this.weapon.bonus : 0;
    const dmg = 1 + Math.floor(Math.random() * (this.str / 4 + bonus)) + bonus;
    monster.hp -= dmg;
    return dmg;
  }

  pickup(item) {
    if (item.type === 'gold') {
      this.gold += item.amount;
      return '💰 ' + item.amount + ' gold.';
    }
    if (item.type === 'amulet') return '💎 You take the Amulet of Yendor.';
    if (item.type === 'food') {
      this.hp = Math.min(this.maxHp, this.hp + 4);
      return '🍖 You eat a ration. It helps.';
    }
    this.inventory.push(item);
    if (item.type === 'weapon' && (!this.weapon || item.bonus > this.weapon.bonus)) {
      this.weapon = item;
      return '🗡 You wield the ' + item.name + '.';
    }
    if (item.type === 'armor' && (!this.armor || item.bonus > this.armor.bonus)) {
      this.armor = item;
      return '🛡 You wear the ' + item.name + '.';
    }
    return item.ch + ' You pick up the ' + item.name + '.';
  }
}
