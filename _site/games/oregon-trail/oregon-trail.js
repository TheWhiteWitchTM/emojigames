// Terminal homage to the 1985 Apple II Oregon Trail.
// Segment lengths are the MECC trail, Independence to the Willamette.

const OT = {
  black: 0, red: 1, green: 2, yellow: 3, blue: 4, magenta: 5, cyan: 6, white: 7,
  gray: 8, bred: 9, bgreen: 10, byellow: 11, bblue: 12, bmagenta: 13, bcyan: 14, bwhite: 15
};

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const STORAGE_KEY = 'emojigames-oregon-top-ten';

const PROFESSIONS = {
  banker: { label: 'a banker from Boston', money: 160000, mult: 1, place: 'Boston' },
  carpenter: { label: 'a carpenter from Ohio', money: 80000, mult: 2, place: 'Ohio' },
  farmer: { label: 'a farmer from Illinois', money: 40000, mult: 3, place: 'Illinois' }
};

const DISEASES = [
  { id: 'dysentery', say: 'dysentery', min: 4, max: 10, kill: 0.22 },
  { id: 'cholera', say: 'cholera', min: 3, max: 8, kill: 0.32 },
  { id: 'typhoid', say: 'typhoid', min: 5, max: 12, kill: 0.24 },
  { id: 'measles', say: 'measles', min: 4, max: 9, kill: 0.08 },
  { id: 'fever', say: 'a fever', min: 3, max: 7, kill: 0.12 },
  { id: 'exhaustion', say: 'exhaustion', min: 2, max: 6, kill: 0.12 },
  { id: 'broken arm', say: 'a broken arm', min: 8, max: 16, kill: 0.03 },
  { id: 'broken leg', say: 'a broken leg', min: 10, max: 20, kill: 0.05 },
  { id: 'snakebite', say: 'a snakebite', min: 3, max: 8, kill: 0.2 }
];

const COMMON = [
  { id: 'kansas', name: 'the Kansas River crossing', miles: 102, kind: 'river', terrain: 'prairie', ferry: 500, width: 620, depthBase: 2.6 },
  { id: 'bigblue', name: 'the Big Blue River crossing', miles: 83, kind: 'river', terrain: 'prairie', ferry: 0, width: 250, depthBase: 2.0 },
  { id: 'kearney', name: 'Fort Kearney', miles: 119, kind: 'fort', terrain: 'plains', markup: 0.25 },
  { id: 'chimney', name: 'Chimney Rock', miles: 250, kind: 'landmark', terrain: 'plains' },
  { id: 'laramie', name: 'Fort Laramie', miles: 86, kind: 'fort', terrain: 'plains', markup: 0.5 },
  { id: 'indrock', name: 'Independence Rock', miles: 190, kind: 'landmark', terrain: 'foothills' },
  { id: 'southpass', name: 'South Pass', miles: 102, kind: 'split', terrain: 'mountain', split: 'south' }
];

const VIA_BRIDGER = [
  { id: 'bridger', name: 'Fort Bridger', miles: 125, kind: 'fort', terrain: 'mountain', markup: 0.75 },
  { id: 'soda', name: 'Soda Springs', miles: 162, kind: 'landmark', terrain: 'mountain' }
];

const VIA_GREEN = [
  { id: 'green', name: 'the Green River crossing', miles: 57, kind: 'river', terrain: 'desert', ferry: 0, width: 400, depthBase: 3.6 },
  { id: 'soda', name: 'Soda Springs', miles: 144, kind: 'landmark', terrain: 'mountain' }
];

const AFTER_SODA = [
  { id: 'hall', name: 'Fort Hall', miles: 57, kind: 'fort', terrain: 'mountain', markup: 1 },
  { id: 'snake', name: 'the Snake River crossing', miles: 182, kind: 'river', terrain: 'desert', ferry: 0, width: 1000, depthBase: 5.4, guide: true },
  { id: 'boise', name: 'Fort Boise', miles: 114, kind: 'fort', terrain: 'desert', markup: 1.25 },
  { id: 'blue', name: 'the Blue Mountains', miles: 160, kind: 'split', terrain: 'mountain', split: 'blue' }
];

const VIA_WALLA = [
  { id: 'walla', name: 'Fort Walla Walla', miles: 55, kind: 'fort', terrain: 'forest', markup: 1.5 },
  { id: 'dalles', name: 'The Dalles', miles: 120, kind: 'split', terrain: 'forest', split: 'dalles' }
];

const VIA_DALLES_SHORT = [
  { id: 'dalles', name: 'The Dalles', miles: 125, kind: 'split', terrain: 'mountain', split: 'dalles' }
];

const BARLOW = [
  { id: 'willamette', name: 'the Willamette Valley', miles: 100, kind: 'end', terrain: 'mountain' }
];

const SEED_BOARD = [
  { name: 'Jesse Applegate', score: 7520 },
  { name: 'James Nesmith', score: 6840 },
  { name: 'Peter Burnett', score: 6100 },
  { name: 'Medorem Crawford', score: 5400 },
  { name: 'Joel Palmer', score: 4980 },
  { name: 'Abigail Scott', score: 4210 },
  { name: 'Francis Parkman', score: 3900 },
  { name: 'Narcissa Whitman', score: 3360 },
  { name: 'William Barlow', score: 2740 },
  { name: 'Ezra Meeker', score: 2100 }
];

const TALK = {
  independence: [
    'Independence is the last town that sells at a fair price. After this, every fort costs more.',
    'A woman at the spring says March is cold and July is late. She left in April last time and buried two oxen in the snow.'
  ],
  kansas: [
    'The Kansas is the first real crossing. A ferry sits upstream when the water is up.',
    'A rider says the river falls if you wait out a dry spell, and rises again after rain.'
  ],
  bigblue: [
    'There is no ferry on the Big Blue. People ford it when they can see the bottom.',
    'Mud on the far bank has swallowed a wheel or two this week.'
  ],
  kearney: [
    'Fort Kearney is the first government post. Prices are already a quarter over Independence.',
    'The clerk says the grass is decent into the Platte valley, and poor if you drive the oxen too hard.'
  ],
  chimney: [
    'Chimney Rock has been in sight for days. Travelers scratch their names into the stone and keep walking.',
    'A boy says the easy prairie is behind you. Fort Laramie is the next place to buy anything.'
  ],
  laramie: [
    'Fort Laramie is a trading post, not a charity. From here the miles come slower.',
    'Someone carving a name says Independence Rock by the Fourth of July means you are on time.'
  ],
  indrock: [
    'Independence Rock. Parties that pass here after the Fourth of July start to look over their shoulders at the snow.',
    'The Sweetwater is cold and the wind does not stop. South Pass is the way through the mountains.'
  ],
  southpass: [
    'South Pass is a broad saddle, not a cliff. The road divides on the far side.',
    'Fort Bridger means a store and extra miles. The Green River is shorter and has no store, and the crossing is its own problem.'
  ],
  bridger: [
    'Fort Bridger will sell you what the mountains have not already taken. It will not be cheap.',
    'A trader says Soda Springs is strange water and then Fort Hall, and then the Snake.'
  ],
  green: [
    'The Green is a desert river. It does not care that you saved miles by coming this way.',
    'There is no ferry. Float the wagon, or wait, or regret the shortcut.'
  ],
  soda: [
    'The water at Soda Springs bubbles out of the ground. It will not cure dysentery.',
    'Fort Hall is not far. After that the Snake River country turns dry.'
  ],
  hall: [
    'Fort Hall is the last comfortable trading post before the Snake. People argue here about the guide at the crossing.',
    'A man with one ox says the Snake is wide, deep, and uninterested in your plans.'
  ],
  snake: [
    'The Snake stays deep. A guide who knows the ford is worth clothing.',
    'Caulking the wagon can work. Fording it, at six feet, is how wagons become driftwood.'
  ],
  boise: [
    'Fort Boise. The Blue Mountains are the last wall between you and the Columbia.',
    'Prices here are ugly. Snow in those mountains is uglier.'
  ],
  blue: [
    'The Blue Mountains divide the road. Fort Walla Walla can resupply you. The cutoff does not.',
    'If the peaks are already white, you are late.'
  ],
  walla: [
    'Fort Walla Walla is the last store. The Dalles is the last choice.',
    'The Barlow Road takes a toll and climbs. The Columbia takes a raft and a steady hand.'
  ],
  dalles: [
    'The Dalles. The Barlow toll road is five dollars and a hundred mountain miles. The river is free and full of rocks.',
    'A boatman says the channel is on the right, and missing it costs food, not the whole journey.'
  ],
  road: [
    'A passing wagon says fill the pot when health turns fair, and do not wait for very poor.',
    'Someone’s ox died yesterday. They will trade a wheel for food if you look prosperous.',
    'The graves get closer together when the water is bad.',
    'Hunt on a day you can spare. A hundred pounds is all the wagon will take back from a good shot.',
    'Steady and filling is how families arrive. Grueling and bare bones is how names get carved.'
  ]
};

const LEARN = [
  [
    'It is 1848. The wagon road runs from Independence, Missouri, to the Willamette Valley in Oregon, a little over two thousand miles.',
    'The road is a chain of landmarks. Rivers, forts, and rocks that parties used as a calendar. Between them the days are weather, grass, and whatever breaks.'
  ],
  [
    'A banker from Boston starts with $1600. The score at the end stands as it is.',
    'A carpenter from Ohio starts with $800, and the score is doubled. A farmer from Illinois starts with $400, and the score is tripled.',
    'Nothing is scored unless you reach the valley. A living party in good health is worth more than a wagon full of leftovers.'
  ],
  [
    'At Matt’s General Store a yoke is two oxen and costs $40. He recommends three yoke. Food is twenty cents a pound. The wagon holds 2000 pounds.',
    'Clothing is $10 a set. Bullets come in boxes of 20 for $2. A spare wheel, axle, or tongue is $10.',
    'Forts raise the price as you go west. A quarter more at Fort Kearney. Two and a half times Matt’s price at Fort Walla Walla.'
  ],
  [
    'Steady, strenuous, and grueling are half, three quarters, and all of the day’s miles. Four healthy oxen on the plains, steady, cover about twenty miles. Past Fort Laramie the country is slower, and a hard day tops out near twenty-four.',
    'Filling rations are three pounds a person a day, meager two, bare bones one. Hunting spends the day. Each shot is one bullet. You can carry 100 pounds back.'
  ],
  [
    'Every river has a depth and a width. Under about two and a half feet, people ford. Deeper than that, they caulk the wagon and float it, or pay a ferry where a ferry exists.',
    'The Kansas has a ferry. The Big Blue does not. At the Snake, a guide will take three sets of clothing to lead the wagon across.',
    'South Pass splits. Fort Bridger is longer and has a store. The Green River is shorter and has a crossing instead. From the Blue Mountains, Fort Walla Walla can still sell you supplies. The cutoff cannot. At The Dalles the Barlow Road costs $5. The Columbia is a raft.'
  ],
  [
    'Cholera, dysentery, typhoid, measles, fever, exhaustion, a broken bone, a snake. Rest and full meals pull a party back from poor health. Pushing through very poor health is how the tombstones get names.',
    'Snow in the mountains does not care about the schedule. Leave in July and the Blue Mountains may already be white.',
    'Ctrl-S toggles the sound. Q on the trail menu abandons the journey.'
  ]
];

function cloneStop(stop) {
  return Object.assign({}, stop);
}

function emptyPending() {
  return { yoke: 0, food: 0, clothing: 0, boxes: 0, wheels: 0, axles: 0, tongues: 0 };
}

function daysInMonth(month, year) {
  if (month === 2) {
    const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    return leap ? 29 : 28;
  }
  return [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
}

function formatMoney(cents) {
  const sign = cents < 0 ? '-' : '';
  const n = Math.abs(Math.round(cents));
  const dollars = Math.floor(n / 100);
  const frac = String(n % 100).padStart(2, '0');
  return sign + '$' + dollars + '.' + frac;
}

function loadBoard() {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return null;
    return data
      .filter(row => row && typeof row.name === 'string' && typeof row.score === 'number')
      .slice(0, 10)
      .map(row => ({ name: row.name, score: row.score }));
  } catch (err) {
    return null;
  }
}

function healthNameOf(health, living) {
  if (!living) return 'dead';
  if (health >= 80) return 'good';
  if (health >= 55) return 'fair';
  if (health >= 30) return 'poor';
  return 'very poor';
}

function tally(state) {
  const living = state.members.filter(member => member.alive).length;
  const band = healthNameOf(state.health, living);
  const per = { good: 500, fair: 400, poor: 300, 'very poor': 200, dead: 0 }[band];
  const people = per * living;
  const wagon = 50;
  const ox = 4 * state.oxen;
  const parts = 2 * (state.wheels + state.axles + state.tongues);
  const clothes = 2 * state.clothing;
  const ammo = Math.floor(state.bullets / 50);
  const food = Math.floor(state.food / 25);
  const cash = Math.floor((state.cents / 100) / 5);
  const sub = people + wagon + ox + parts + clothes + ammo + food + cash;
  const mult = (PROFESSIONS[state.profession] || { mult: 1 }).mult;
  return { people, wagon, ox, parts, clothes, ammo, food, cash, sub, mult, total: sub * mult, band, living };
}

class OregonGame {
  constructor(term) {
    this.term = term;
    this.sound = true;
    this.audio = null;
    this.board = loadBoard() || SEED_BOARD.map(row => ({ name: row.name, score: row.score }));
    this.timer = null;
    this.unsub = term.onKey(event => this.onKey(event));
    this.initState();
    this.showSplash();
  }

  showSplash() {
    this.clearTimer();
    this.cls();
    this.term.fill(0, 0, 80, 24, ' ', OT.bcyan, OT.blue);
    this.center(7, 'THE OREGON TRAIL', OT.byellow, OT.blue);
    this.center(9, 'Independence, Missouri, to the Willamette Valley', OT.bwhite, OT.blue);
    this.center(11, '1848', OT.bcyan, OT.blue);
    this.center(16, 'Press Return', OT.byellow, OT.blue);
    this.center(18, 'R starts the trail', OT.white, OT.blue);
    this.phase = 'splash';
    this.done();
    this.beep(392, 0.08);
    setTimeout(() => this.beep(523, 0.12), 150);
  }

  destroy() {
    this.clearTimer();
    if (this.unsub) this.unsub();
  }

  initState() {
    this.clearTimer();
    this.profession = null;
    this.members = [];
    this.nameIndex = 0;
    this.month = 3;
    this.day = 1;
    this.year = 1848;
    this.cents = 0;
    this.oxen = 0;
    this.hurtOx = 0;
    this.food = 0;
    this.clothing = 0;
    this.bullets = 0;
    this.wheels = 0;
    this.axles = 0;
    this.tongues = 0;
    this.health = 100;
    this.pace = 'steady';
    this.rations = 'filling';
    this.weather = { name: 'warm', speed: 1, cold: false, snow: false, heat: false, rain: false, block: false, grass: true, blockText: '' };
    this.totalMiles = 0;
    this.into = 0;
    this.trail = COMMON.map(cloneStop);
    this.here = { id: 'independence', name: 'Independence, Missouri', kind: 'town', terrain: 'prairie' };
    this.pending = emptyPending();
    this.shopMarkup = 0;
    this.shopTitle = "Matt's General Store";
    this.shopPlace = 'Independence, Missouri';
    this.broken = null;
    this.badWater = 0;
    this.hungry = 0;
    this.note = '';
    this.departed = false;
    this.hunt = null;
    this.raft = null;
    this.river = null;
    this.lastScore = null;
    this.madeTop = false;
    this.buffer = '';
    this.phase = 'boot';
    this.menuFn = null;
    this.onEnter = null;
    this.onPause = null;
    this.onYes = null;
    this.onNo = null;
    this.allowQuit = false;
  }

  rand() {
    return Math.random();
  }

  clearTimer() {
    if (this.timer) {
      clearTimeout(this.timer);
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  beep(freq, duration, type) {
    if (!this.sound || !this.term || typeof this.term.tone !== 'function') return;
    this.term.tone(freq, duration, type);
  }

  toggleSound() {
    this.sound = !this.sound;
    if (this.sound) this.beep(660, 0.07);
    if (this.phase === 'hunt' || this.phase === 'raft' || this.phase === 'travel') return;
    this.at(2, 22, (this.sound ? 'Sound on' : 'Sound off').padEnd(16, ' '), OT.byellow);
    this.term.render();
  }

  onKey(event) {
    const key = event.key;
    if (event.ctrlKey && (key === 's' || key === 'S')) {
      event.preventDefault();
      this.toggleSound();
      return;
    }
    if (key === 'Enter' || key === ' ') event.preventDefault();
    if (this.phase === 'splash') {
      if (key === 'Enter' || key === 'NumpadEnter') this.showTitle();
      else if (key === 'r' || key === 'R') this.showProfession(true);
      return;
    }
    if (this.phase === 'hunt') return this.huntKey(event);
    if (this.phase === 'raft') return this.raftKey(event);
    if (this.phase === 'travel') {
      if (key === 'Enter' || key === ' ') this.stopTravel = true;
      return;
    }
    if (this.phase === 'line') return this.lineKey(event);
    if (this.phase === 'yn') return this.ynKey(event);
    if (this.phase === 'pause') {
      if (key === 'Enter' || key === ' ') {
        const next = this.onPause;
        this.onPause = null;
        if (next) next();
      }
      return;
    }
    if (this.phase === 'over') {
      if (key === 'Enter' || key === 'r' || key === 'R') this.showProfession(true);
      return;
    }
    if (this.phase === 'menu') {
      if (key === 'Enter' && this.onEnter) {
        this.onEnter();
        return;
      }
      if ((key === 'q' || key === 'Q') && this.allowQuit) {
        this.confirmAbandon();
        return;
      }
      const n = parseInt(key, 10);
      if (n >= 1 && n <= 9 && this.menuFn) this.menuFn(n);
    }
  }

  cls() {
    this.term.beginFrame();
    this.term.clear();
    this.term.resetAttr();
    this.menuFn = null;
    this.onEnter = null;
    this.allowQuit = false;
  }

  done() {
    if (this.phase === 'line') this.term.showCursor();
    else this.term.hideCursor();
    this.term.endFrame();
  }

  at(x, y, text, fg, bg) {
    if (y < 0 || y >= this.term.rows) return;
    let s = String(text);
    let col = x;
    if (col < 0) {
      s = s.slice(-col);
      col = 0;
    }
    if (col >= this.term.cols || !s) return;
    if (col + s.length > this.term.cols) s = s.slice(0, this.term.cols - col);
    this.term.setFg(fg == null ? OT.green : fg);
    this.term.setBg(bg == null ? OT.black : bg);
    this.term.writeAt(col, y, s);
  }

  center(y, text, fg, bg) {
    const s = String(text).slice(0, this.term.cols);
    const x = Math.max(0, Math.floor((this.term.cols - s.length) / 2));
    this.at(x, y, s, fg, bg);
  }

  footer(text) {
    this.at(0, 23, String(text).slice(0, 80).padEnd(80, ' '), OT.gray, OT.black);
  }

  wrap(text, width) {
    const limit = width || 74;
    const words = String(text).split(/\s+/).filter(Boolean);
    const lines = [];
    let cur = '';
    words.forEach(word => {
      const piece = word.length > limit ? word.slice(0, limit) : word;
      if (!cur) cur = piece;
      else if (cur.length + 1 + piece.length <= limit) cur += ' ' + piece;
      else {
        lines.push(cur);
        cur = piece;
      }
    });
    if (cur) lines.push(cur);
    return lines;
  }

  pause(lines, then) {
    this.cls();
    if (this.members.length) this.statusBlock();
    let y = this.members.length ? 6 : 2;
    lines.forEach(line => {
      this.wrap(line, 74).forEach(part => {
        if (y <= 20) this.at(3, y++, part, OT.white);
      });
      y++;
    });
    this.at(3, 21, 'Press RETURN', OT.byellow);
    this.footer('Ctrl-S toggles sound');
    this.phase = 'pause';
    this.onPause = then;
    this.done();
  }

  present(events, then) {
    if (!events || !events.length) {
      then();
      return;
    }
    const event = events[0];
    const rest = events.slice(1);
    const next = () => this.present(rest, then);
    if (event.kind === 'youdied') this.showYouDied(event, next);
    else if (event.kind === 'tomb') this.showTomb(event, next);
    else this.pause(event.lines || [''], next);
  }

  dateStr() {
    return MONTHS[this.month - 1] + ' ' + this.day + ', ' + this.year;
  }

  living() {
    return this.members.filter(member => member.alive);
  }

  livingCount() {
    return this.living().length;
  }

  healthName() {
    return healthNameOf(this.health, this.livingCount());
  }

  healthColor() {
    const name = this.healthName();
    if (name === 'good') return OT.bgreen;
    if (name === 'fair') return OT.byellow;
    if (name === 'poor') return OT.bmagenta;
    return OT.bred;
  }

  nextStop() {
    return this.trail[0] || null;
  }

  terrain() {
    const next = this.nextStop();
    if (next && next.terrain) return next.terrain;
    if (this.here && this.here.terrain) return this.here.terrain;
    return 'prairie';
  }

  rationWord() {
    if (this.rations === 'bare') return 'bare bones';
    return this.rations;
  }

  statusBlock() {
    const next = this.nextStop();
    const remain = next ? Math.max(0, next.miles - this.into) : 0;
    this.at(2, 0, 'Date: ' + this.dateStr(), OT.bwhite);
    this.at(2, 1, 'Weather: ' + (this.weather ? this.weather.name : 'clear'), OT.cyan);
    this.at(36, 1, 'Health:', OT.white);
    this.at(44, 1, this.healthName(), this.healthColor());
    this.at(2, 2, 'Food: ' + this.food + ' pounds', OT.white);
    this.at(36, 2, next ? ('Next landmark: ' + remain + ' miles') : 'Next landmark: --', OT.white);
    this.at(2, 3, 'Miles traveled: ' + this.totalMiles, OT.white);
    this.at(36, 3, 'Pace: ' + this.pace, OT.white);
    this.at(56, 3, 'Rations: ' + this.rationWord(), OT.white);
  }

  locationLine() {
    const next = this.nextStop();
    if (this.into <= 0 && this.here) return 'Stopped at ' + this.here.name;
    if (next) return Math.max(0, next.miles - this.into) + ' miles from ' + next.name;
    return 'On the trail';
  }

  showTitle() {
    this.clearTimer();
    this.cls();
    this.term.fill(0, 0, 80, 9, ' ', OT.bcyan, OT.blue);
    this.center(1, 'THE OREGON TRAIL', OT.byellow, OT.blue);
    this.center(2, 'Independence to the Willamette Valley', OT.bwhite, OT.blue);
    this.center(3, '1848', OT.bcyan, OT.blue);
    this.drawWagon(30, 4, OT.blue, OT.blue);
    this.term.fill(0, 9, 80, 15, ' ', OT.green, OT.black);
    this.at(6, 11, 'You may:', OT.cyan);
    const options = [
      'Travel the trail',
      'Learn about the trail',
      'See the Oregon Top Ten',
      'End'
    ];
    options.forEach((label, index) => {
      this.at(8, 13 + index, (index + 1) + '.', OT.byellow);
      this.at(12, 13 + index, label, OT.white);
    });
    this.at(6, 18, 'What is your choice?', OT.bgreen);
    this.footer('Ctrl-S toggles sound');
    this.phase = 'menu';
    this.menuFn = n => {
      this.beep(520, 0.04);
      if (n === 1) this.showProfession(true);
      else if (n === 2) this.showLearn(0);
      else if (n === 3) this.showTopTen(false);
      else if (n === 4) this.showEnd();
    };
    this.done();
  }

  showEnd() {
    this.pause(['You have decided not to go.'], () => this.showTitle());
  }

  showLearn(page) {
    this.cls();
    this.center(1, 'Learn about the trail', OT.byellow);
    let y = 3;
    LEARN[page].forEach(para => {
      this.wrap(para, 74).forEach(line => {
        if (y <= 19) this.at(3, y++, line, OT.white);
      });
      y++;
    });
    const last = page >= LEARN.length - 1;
    this.at(3, 21, last ? 'Press RETURN for the main menu' : 'Press RETURN for the next page', OT.byellow);
    this.footer('Page ' + (page + 1) + ' of ' + LEARN.length);
    this.phase = 'pause';
    this.onPause = () => {
      if (last) this.showTitle();
      else this.showLearn(page + 1);
    };
    this.done();
  }

  showTopTen(afterGame) {
    this.cls();
    this.center(1, 'The Oregon Top Ten', OT.byellow);
    this.at(8, 3, 'Name', OT.cyan);
    this.at(40, 3, 'Points', OT.cyan);
    this.board.forEach((row, index) => {
      const fg = row.fresh ? OT.byellow : OT.white;
      const name = (index + 1) + '.  ' + row.name;
      this.at(8, 5 + index, name.slice(0, 30), fg);
      this.at(40, 5 + index, String(row.score), fg);
    });
    if (afterGame && this.madeTop) this.center(16, 'Your party is on the list.', OT.bgreen);
    else if (afterGame) this.center(16, 'Your party did not make the list.', OT.white);
    this.at(8, 18, afterGame ? 'Press RETURN' : 'Press RETURN for the main menu', OT.byellow);
    this.footer('Ctrl-S toggles sound');
    this.phase = 'pause';
    this.onPause = () => {
      this.board.forEach(row => { row.fresh = false; });
      if (afterGame) this.showProfession(true);
      else this.showTitle();
    };
    this.done();
  }

  showProfession(fresh) {
    if (fresh) this.initState();
    this.cls();
    this.center(1, 'Many kinds of people made the trip to Oregon.', OT.bwhite);
    this.at(4, 4, 'You may:', OT.cyan);
    const options = [
      'Be a banker from Boston',
      'Be a carpenter from Ohio',
      'Be a farmer from Illinois',
      'Find out the differences between these choices'
    ];
    options.forEach((label, index) => {
      this.at(6, 6 + index, (index + 1) + '.', OT.byellow);
      this.at(10, 6 + index, label, OT.white);
    });
    this.at(4, 12, 'What is your choice?', OT.bgreen);
    this.footer('Ctrl-S toggles sound');
    this.phase = 'menu';
    this.menuFn = n => {
      this.beep(520, 0.04);
      if (n === 4) {
        this.showDifferences();
        return;
      }
      const keys = ['banker', 'carpenter', 'farmer'];
      if (n < 1 || n > 3) return;
      this.profession = keys[n - 1];
      this.cents = PROFESSIONS[this.profession].money;
      this.nameIndex = 0;
      this.members = [];
      this.showNames();
    };
    this.done();
  }

  showDifferences() {
    this.cls();
    this.center(1, 'The differences', OT.byellow);
    const lines = [
      'The banker starts with the most money and the least glory. Sixteen hundred dollars, and the points stand as scored.',
      'The carpenter starts with eight hundred dollars. The final score is doubled.',
      'The farmer starts with four hundred dollars. The final score is tripled. That is the hard way, and the one the list remembers.',
      'Everyone pays the same prices at Matt’s. The profession is a wager on whether you arrive at all.'
    ];
    let y = 3;
    lines.forEach(line => {
      this.wrap(line, 74).forEach(part => {
        this.at(3, y++, part, OT.white);
      });
      y++;
    });
    this.at(3, 21, 'Press RETURN', OT.byellow);
    this.phase = 'pause';
    this.onPause = () => this.showProfession(false);
    this.done();
  }

  showNames() {
    this.cls();
    this.center(1, 'The wagon party', OT.byellow);
    const labels = ['Wagon leader', 'Second', 'Third', 'Fourth', 'Fifth'];
    for (let i = 0; i < 5; i++) {
      const have = this.members[i] && this.members[i].name;
      const fg = i === this.nameIndex ? OT.byellow : OT.white;
      this.at(6, 4 + i, (i + 1) + '.  ' + labels[i], fg);
      this.at(28, 4 + i, have ? this.members[i].name : (i === this.nameIndex ? '_' : ''), fg);
    }
    const ask = labels[this.nameIndex].toLowerCase();
    this.at(4, 11, 'What is the first name of the ' + ask + '?', OT.white);
    if (this.note) this.at(4, 16, this.note.slice(0, 72), OT.bred);
    this.footer('Letters, and then RETURN');
    this.done();
    this.askLine(13, '> ', { mode: 'text', max: 12 }, raw => this.submitName(raw));
  }

  submitName(raw) {
    const name = String(raw || '').trim().replace(/\s+/g, ' ');
    if (!/^[A-Za-z][A-Za-z .'-]*$/.test(name)) {
      this.note = 'Use a first name. Letters are enough.';
      this.showNames();
      return;
    }
    this.members[this.nameIndex] = { name: name, alive: true, ill: null, illDays: 0 };
    this.nameIndex += 1;
    this.note = '';
    if (this.nameIndex < 5) this.showNames();
    else this.showMonth();
  }

  showMonth() {
    this.cls();
    this.center(1, 'It is 1848.', OT.bwhite);
    const intro = 'Your jumping-off place is Independence, Missouri. You must decide which month to leave.';
    let y = 3;
    this.wrap(intro, 74).forEach(line => this.at(3, y++, line, OT.white));
    this.at(4, 7, 'You may:', OT.cyan);
    ['March', 'April', 'May', 'June', 'July', 'Ask for advice'].forEach((label, index) => {
      this.at(6, 9 + index, (index + 1) + '.', OT.byellow);
      this.at(10, 9 + index, label, OT.white);
    });
    this.at(4, 16, 'What is your choice?', OT.bgreen);
    this.phase = 'menu';
    this.menuFn = n => {
      this.beep(520, 0.04);
      if (n === 6) {
        this.showMonthAdvice();
        return;
      }
      if (n < 1 || n > 5) return;
      this.month = [3, 4, 5, 6, 7][n - 1];
      this.day = 1;
      this.year = 1848;
      this.weather = this.rollWeather();
      this.openStore();
    };
    this.done();
  }

  showMonthAdvice() {
    const lines = [
      'March is cold and the grass is thin, and you have the most time before the mountain snow.',
      'April is still cool. A great many wagons roll then. The rivers are waking up.',
      'May has grass and kindly weather, and the rivers are high with snowmelt.',
      'June is hot on the plains. The rivers are still full, and the mountains will not wait.',
      'July is hard on oxen and people. A late start is a bet against snow in Oregon.'
    ];
    this.cls();
    this.center(1, 'When to leave', OT.byellow);
    let y = 3;
    lines.forEach(line => {
      this.wrap(line, 74).forEach(part => this.at(3, y++, part, OT.white));
      y++;
    });
    this.at(3, 21, 'Press RETURN', OT.byellow);
    this.phase = 'pause';
    this.onPause = () => this.showMonth();
    this.done();
  }

  prices() {
    const mult = 1 + (this.shopMarkup || 0);
    return {
      yoke: Math.round(4000 * mult),
      food: Math.round(20 * mult),
      clothing: Math.round(1000 * mult),
      ammo: Math.round(200 * mult),
      part: Math.round(1000 * mult)
    };
  }

  bill() {
    const price = this.prices();
    const parts = this.pending.wheels + this.pending.axles + this.pending.tongues;
    return this.pending.yoke * price.yoke
      + this.pending.food * price.food
      + this.pending.clothing * price.clothing
      + this.pending.boxes * price.ammo
      + parts * price.part;
  }

  purchaseError() {
    if (this.pending.yoke < 0 || this.pending.yoke > 9) return 'You can buy up to 9 yoke.';
    if (this.food + this.pending.food > 2000) return 'The wagon holds 2000 pounds of food.';
    if (this.pending.clothing < 0 || this.pending.clothing > 99) return 'That is more clothing than the wagon can use.';
    if (this.pending.boxes < 0 || this.pending.boxes > 99) return 'That is more ammunition than you can carry.';
    if (this.pending.wheels > 6 || this.pending.axles > 6 || this.pending.tongues > 6) {
      return 'Six of each spare part is the limit.';
    }
    if (this.bill() > this.cents) return 'That costs more than you have.';
    return null;
  }

  openStore() {
    if (this.here && this.here.kind === 'fort' && this.into <= 0) {
      this.shopMarkup = this.here.markup || 0;
      this.shopTitle = this.here.name;
      this.shopPlace = this.here.name;
    } else {
      this.shopMarkup = 0;
      this.shopTitle = "Matt's General Store";
      this.shopPlace = 'Independence, Missouri';
    }
    this.pending = emptyPending();
    this.showStore();
  }

  showStore(advice) {
    const price = this.prices();
    this.cls();
    this.center(0, this.shopTitle, OT.byellow);
    this.center(1, this.shopPlace, OT.cyan);
    this.center(2, this.dateStr(), OT.white);
    this.at(2, 3, 'You have ' + formatMoney(this.cents), OT.bgreen);
    this.at(2, 4, 'In the wagon: ' + this.oxen + ' oxen, ' + this.food + ' lb food, ' + this.clothing + ' clothes, ' + this.bullets + ' bullets', OT.gray);
    const rows = [
      ['1.', 'Oxen', this.pending.yoke + ' yoke', formatMoney(price.yoke), formatMoney(this.pending.yoke * price.yoke)],
      ['2.', 'Food', this.pending.food + ' lb', formatMoney(price.food), formatMoney(this.pending.food * price.food)],
      ['3.', 'Clothing', this.pending.clothing + ' sets', formatMoney(price.clothing), formatMoney(this.pending.clothing * price.clothing)],
      ['4.', 'Ammunition', this.pending.boxes + ' boxes', formatMoney(price.ammo), formatMoney(this.pending.boxes * price.ammo)],
      ['5.', 'Spare parts', String(this.pending.wheels + this.pending.axles + this.pending.tongues), formatMoney(price.part), formatMoney((this.pending.wheels + this.pending.axles + this.pending.tongues) * price.part)]
    ];
    this.at(4, 6, 'item', OT.cyan);
    this.at(22, 6, 'buying', OT.cyan);
    this.at(40, 6, 'each', OT.cyan);
    this.at(56, 6, 'cost', OT.cyan);
    rows.forEach((row, index) => {
      const y = 8 + index;
      this.at(2, y, row[0], OT.byellow);
      this.at(6, y, row[1], OT.white);
      this.at(22, y, row[2], OT.white);
      this.at(40, y, row[3], OT.white);
      this.at(56, y, row[4], OT.bwhite);
    });
    this.at(8, 13, 'wheels ' + this.pending.wheels + '    axles ' + this.pending.axles + '    tongues ' + this.pending.tongues, OT.gray);
    this.at(4, 15, 'Total bill', OT.white);
    this.at(56, 15, formatMoney(this.bill()), OT.byellow);
    this.at(4, 16, 'Still available', OT.white);
    this.at(56, 16, formatMoney(this.cents - this.bill()), OT.bgreen);
    if (advice && advice.length) {
      let y = 18;
      advice.forEach(line => {
        this.wrap(line, 76).forEach(part => {
          if (y <= 20) this.at(2, y++, part, OT.cyan);
        });
      });
    } else if (this.note) {
      this.at(2, 18, this.note.slice(0, 76), OT.bred);
    } else {
      this.at(2, 18, 'A number buys. ENTER leaves the store.', OT.gray);
    }
    this.footer('Oxen are sold by the yoke. A box is 20 bullets.');
    this.phase = 'menu';
    this.onEnter = () => this.leaveStore();
    this.menuFn = n => {
      this.beep(480, 0.03);
      if (n === 1) this.askBuy('yoke');
      else if (n === 2) this.askBuy('food');
      else if (n === 3) this.askBuy('clothing');
      else if (n === 4) this.askBuy('boxes');
      else if (n === 5) this.askPart(0);
    };
    this.done();
  }

  mattLine(field) {
    const price = this.prices();
    if (this.shopMarkup > 0) {
      if (field === 'yoke') return 'A yoke is two oxen, ' + formatMoney(price.yoke) + '.';
      if (field === 'food') return 'Food is ' + formatMoney(price.food) + ' a pound.';
      if (field === 'clothing') return 'Clothing is ' + formatMoney(price.clothing) + ' a set.';
      if (field === 'boxes') return 'A box of 20 bullets is ' + formatMoney(price.ammo) + '.';
      return '';
    }
    if (field === 'yoke') return 'Two oxen make a yoke. I recommend at least three. I charge ' + formatMoney(price.yoke) + ' a yoke.';
    if (field === 'food') return 'I recommend 200 pounds for each person. Five people is 1000 pounds. ' + formatMoney(price.food) + ' a pound.';
    if (field === 'clothing') return 'You will want warm clothing in the mountains. At least two sets each. ' + formatMoney(price.clothing) + ' a set.';
    if (field === 'boxes') return 'Ammunition comes in boxes of 20 bullets. ' + formatMoney(price.ammo) + ' a box.';
    return '';
  }

  askBuy(field) {
    const prompts = { yoke: 'How many yoke? ', food: 'How many pounds? ', clothing: 'How many sets? ', boxes: 'How many boxes? ' };
    this.note = '';
    this.showStore([this.mattLine(field)]);
    this.askLine(21, prompts[field], { mode: 'digits', max: 4 }, raw => {
      if (raw === '') {
        this.showStore();
        return;
      }
      const next = parseInt(raw, 10);
      const prev = this.pending[field];
      this.pending[field] = Number.isFinite(next) ? next : 0;
      const err = this.purchaseError();
      if (err) {
        this.pending[field] = prev;
        this.note = err;
      }
      this.showStore();
    });
  }

  askPart(index) {
    const keys = ['wheels', 'axles', 'tongues'];
    const names = ['wagon wheels', 'wagon axles', 'wagon tongues'];
    const price = formatMoney(this.prices().part);
    this.note = '';
    this.showStore([names[index] + ' are ' + price + ' each.']);
    this.askLine(21, 'How many? ', { mode: 'digits', max: 2 }, raw => {
      if (raw === '') {
        this.showStore();
        return;
      }
      const next = parseInt(raw, 10) || 0;
      const prev = this.pending[keys[index]];
      this.pending[keys[index]] = next;
      const err = this.purchaseError();
      if (err) {
        this.pending[keys[index]] = prev;
        this.note = err;
        this.showStore();
        return;
      }
      if (index < 2) this.askPart(index + 1);
      else this.showStore();
    });
  }

  leaveStore() {
    if (this.oxen + this.pending.yoke * 2 <= 0) {
      this.note = 'Buy at least one yoke of oxen. A wagon does not pull itself.';
      this.showStore();
      return;
    }
    this.cents -= this.bill();
    this.oxen += this.pending.yoke * 2;
    this.food += this.pending.food;
    this.clothing += this.pending.clothing;
    this.bullets += this.pending.boxes * 20;
    this.wheels += this.pending.wheels;
    this.axles += this.pending.axles;
    this.tongues += this.pending.tongues;
    this.pending = emptyPending();
    this.note = '';
    this.beep(620, 0.06);
    const first = !this.departed && this.shopMarkup === 0;
    if (first) {
      this.departed = true;
      this.pause(['You leave Independence and roll onto the prairie.'], () => this.showTrail());
    } else {
      this.showTrail();
    }
  }

  askLine(row, prompt, opts, callback) {
    this.phase = 'line';
    this.lineRow = row;
    this.linePrompt = prompt;
    this.lineOpts = opts || { mode: 'text', max: 12 };
    this.buffer = '';
    this.onLine = callback;
    this.paintLine();
  }

  paintLine() {
    this.term.showCursor();
    const text = (this.linePrompt + this.buffer).slice(0, 74);
    this.term.setFg(OT.bgreen);
    this.term.setBg(OT.black);
    this.term.writeAt(2, this.lineRow, text + ' '.repeat(Math.max(0, 74 - text.length)));
    this.term.moveTo(Math.min(this.term.cols - 1, 2 + text.length), this.lineRow);
    this.term.render();
  }

  lineKey(event) {
    if (event.key === 'Enter') {
      const callback = this.onLine;
      const value = this.buffer;
      this.onLine = null;
      this.buffer = '';
      if (callback) callback(value);
      return;
    }
    if (event.key === 'Escape') {
      const callback = this.onLine;
      this.onLine = null;
      this.buffer = '';
      if (callback) callback('');
      return;
    }
    if (event.key === 'Backspace') {
      this.buffer = this.buffer.slice(0, -1);
      this.paintLine();
      return;
    }
    const max = this.lineOpts.max || 12;
    if (this.buffer.length >= max) return;
    if (this.lineOpts.mode === 'digits') {
      if (/^\d$/.test(event.key)) this.buffer += event.key;
    } else if (/^[A-Za-z .'-]$/.test(event.key)) {
      this.buffer += event.key;
    }
    this.paintLine();
  }

  showTrail() {
    this.clearTimer();
    this.cls();
    this.statusBlock();
    this.at(2, 4, this.locationLine().slice(0, 76), OT.bwhite);
    const sick = this.living().filter(member => member.ill);
    if (sick.length) {
      this.at(2, 5, sick.map(member => member.name + ' has ' + member.ill.say).join('. ').slice(0, 76), OT.bred);
    }
    this.at(2, 7, 'You may:', OT.cyan);
    const ninth = this.ninthOption();
    const options = [
      'Continue on the trail',
      'Check supplies',
      'Look at the map',
      'Change pace',
      'Change food rations',
      'Stop to rest',
      'Attempt to trade',
      'Hunt for food',
      ninth.label
    ];
    options.forEach((label, index) => {
      this.at(4, 8 + index, (index + 1) + '.', OT.byellow);
      this.at(8, 8 + index, label, OT.white);
    });
    let note = this.note || '';
    if (this.broken) note = 'The wagon ' + this.broken + ' is broken. You cannot travel until it is replaced.';
    else if (this.oxen <= 0) note = 'You have no oxen to pull the wagon.';
    else if (this.food <= 0) note = 'There is no food in the wagon.';
    if (note) this.at(2, 18, note.slice(0, 76), this.broken || this.oxen <= 0 ? OT.bred : OT.byellow);
    this.at(2, 20, 'What is your choice?', OT.bgreen);
    this.footer('Q abandons the trail    Ctrl-S sound');
    this.allowQuit = true;
    this.phase = 'menu';
    this.menuFn = n => {
      this.beep(480, 0.03);
      this.note = '';
      if (n === 1) this.startTravel();
      else if (n === 2) this.showSupplies(() => this.showTrail());
      else if (n === 3) this.showMap();
      else if (n === 4) this.showPace();
      else if (n === 5) this.showRations();
      else if (n === 6) this.askRest();
      else if (n === 7) this.offerTrade();
      else if (n === 8) this.startHunt();
      else if (n === 9) ninth.go();
    };
    this.done();
  }

  ninthOption() {
    if (this.here && this.here.kind === 'town' && this.into <= 0) {
      return { label: "Visit Matt's General Store", go: () => this.openStore() };
    }
    if (this.here && this.here.kind === 'fort' && this.into <= 0) {
      return { label: 'Buy supplies', go: () => this.openStore() };
    }
    return { label: 'Talk to people', go: () => this.showTalk() };
  }

  showPace() {
    this.simpleMenu('Change pace', [
      ['a steady pace', () => { this.pace = 'steady'; this.showTrail(); }],
      ['a strenuous pace', () => { this.pace = 'strenuous'; this.showTrail(); }],
      ['a grueling pace', () => { this.pace = 'grueling'; this.showTrail(); }],
      ['find out what these paces mean', () => this.showPaceHelp()]
    ]);
  }

  showPaceHelp() {
    this.pause([
      'A steady pace is half of what the oxen can do. It is the kindest to the party.',
      'A strenuous pace is three quarters. Most miles, most days, if the health holds.',
      'A grueling pace is everything the team has. People and oxen wear out fast.',
      'Four healthy oxen, steady, on the plains: about twenty miles. Past Fort Laramie the days are shorter.'
    ], () => this.showPace());
  }

  showRations() {
    this.simpleMenu('Change food rations', [
      ['filling — large, generous meals', () => { this.rations = 'filling'; this.showTrail(); }],
      ['meager — small, but adequate', () => { this.rations = 'meager'; this.showTrail(); }],
      ['bare bones — very small, and everyone stays hungry', () => { this.rations = 'bare'; this.showTrail(); }],
      ['find out what these rations mean', () => this.showRationHelp()]
    ]);
  }

  showRationHelp() {
    this.pause([
      'Filling meals use three pounds of food for each person each day. Health likes this.',
      'Meager meals use two pounds. People get by.',
      'Bare bones uses one pound. The party loses ground, and illness finds them sooner.',
      'A day with an empty wagon is worse than any of the three.'
    ], () => this.showRations());
  }

  simpleMenu(title, options) {
    this.cls();
    this.statusBlock();
    this.at(2, 5, title, OT.byellow);
    this.at(2, 7, 'You may:', OT.cyan);
    options.forEach((option, index) => {
      this.at(4, 9 + index, (index + 1) + '.', OT.byellow);
      this.at(8, 9 + index, option[0], OT.white);
    });
    this.at(2, 16, 'What is your choice?', OT.bgreen);
    this.phase = 'menu';
    this.menuFn = n => {
      if (options[n - 1]) options[n - 1][1]();
    };
    this.done();
  }

  showSupplies(back) {
    this.cls();
    this.center(0, 'Your supplies', OT.byellow);
    this.at(2, 2, this.dateStr() + '    ' + this.weather.name, OT.white);
    const lines = [
      ['oxen', String(this.oxen) + (this.hurtOx ? '  (' + this.hurtOx + ' injured)' : '')],
      ['food', this.food + ' pounds'],
      ['clothing', this.clothing + ' sets'],
      ['ammunition', this.bullets + ' bullets'],
      ['wagon wheels', String(this.wheels)],
      ['wagon axles', String(this.axles)],
      ['wagon tongues', String(this.tongues)],
      ['cash', formatMoney(this.cents)]
    ];
    lines.forEach((line, index) => {
      this.at(4, 4 + index, line[0], OT.cyan);
      this.at(24, 4 + index, line[1], OT.white);
    });
    this.members.forEach((member, index) => {
      const state = !member.alive ? 'dead' : (member.ill ? member.ill.say : 'well');
      const fg = !member.alive ? OT.bred : (member.ill ? OT.byellow : OT.bgreen);
      this.at(46, 4 + index, member.name.slice(0, 12), OT.white);
      this.at(60, 4 + index, state.slice(0, 16), fg);
    });
    this.at(2, 14, 'Pace: ' + this.pace + '    Rations: ' + this.rationWord(), OT.white);
    this.at(2, 15, 'Health: ' + this.healthName(), this.healthColor());
    this.at(2, 17, this.locationLine().slice(0, 76), OT.gray);
    this.at(2, 21, 'Press RETURN', OT.byellow);
    this.phase = 'pause';
    this.onPause = back;
    this.done();
  }

  showMap() {
    this.cls();
    this.center(0, 'The trail', OT.byellow);
    this.at(2, 1, 'Miles traveled: ' + this.totalMiles, OT.white);
    const rows = [];
    if (this.here) rows.push({ marker: this.into <= 0 ? '>' : ' ', name: this.here.name, extra: this.into <= 0 ? 'here' : 'behind you' });
    this.trail.forEach((stop, index) => {
      const here = this.into > 0 && index === 0;
      const extra = here ? (Math.max(0, stop.miles - this.into) + ' miles ahead') : (stop.miles + ' miles');
      rows.push({ marker: here ? '>' : ' ', name: stop.name, extra: extra });
    });
    const last = this.trail[this.trail.length - 1];
    if (!last || last.kind === 'split') rows.push({ marker: ' ', name: 'The trail divides', extra: '' });
    rows.slice(0, 18).forEach((row, index) => {
      const y = 3 + index;
      const fg = row.marker === '>' ? OT.byellow : OT.white;
      this.at(2, y, row.marker, OT.byellow);
      this.at(4, y, row.name.slice(0, 42), fg);
      this.at(48, y, row.extra.slice(0, 28), OT.gray);
    });
    this.at(2, 22, 'Press RETURN', OT.byellow);
    this.phase = 'pause';
    this.onPause = () => this.showTrail();
    this.done();
  }

  showTalk() {
    const key = this.into > 0 ? 'road' : ((this.here && TALK[this.here.id]) ? this.here.id : 'road');
    const lines = TALK[key] || TALK.road;
    const line = lines[Math.floor(this.rand() * lines.length)];
    this.beep(300, 0.05);
    this.pause([line], () => this.showTrail());
  }

  askRest() {
    this.cls();
    this.statusBlock();
    this.at(2, 6, 'Stop to rest', OT.byellow);
    this.wrap('Resting spends food and gives the party and the oxen a chance to mend. How many days?').forEach((line, index) => {
      this.at(2, 8 + index, line, OT.white);
    });
    this.done();
    this.askLine(12, 'Days (1-20): ', { mode: 'digits', max: 2 }, raw => {
      const days = parseInt(raw, 10);
      if (!days) {
        this.showTrail();
        return;
      }
      if (days > 20) {
        this.note = 'You can rest up to 20 days at a stretch.';
        this.showTrail();
        return;
      }
      this.runRest(days);
    });
  }

  runRest(left) {
    if (left <= 0 || !this.livingCount()) {
      if (!this.livingCount()) {
        this.gameOver();
        return;
      }
      this.note = 'You rest. Health is ' + this.healthName() + '.';
      this.showTrail();
      return;
    }
    const result = this.simulateDay({ resting: true });
    this.present(result.events, () => {
      if (!this.livingCount()) {
        this.gameOver();
        return;
      }
      this.runRest(left - 1);
    });
  }

  offerTrade() {
    const offer = this.makeOffer();
    if (!offer) {
      this.pause(['No one wants to trade today.'], () => this.showTrail());
      return;
    }
    this.cls();
    this.statusBlock();
    this.at(2, 6, 'A trade', OT.byellow);
    let y = 8;
    this.wrap(offer.text).forEach(line => {
      this.wrap(line, 74).forEach(part => this.at(2, y++, part, OT.white));
    });
    this.at(2, 16, 'Accept the trade? (Y/N)', OT.byellow);
    this.phase = 'yn';
    this.onYes = () => {
      offer.apply();
      this.beep(600, 0.06);
      this.note = 'The trade is made.';
      this.showTrail();
    };
    this.onNo = () => this.showTrail();
    this.done();
  }

  ynKey(event) {
    const key = event.key.toLowerCase();
    if (key === 'y' && this.onYes) {
      const fn = this.onYes;
      this.onYes = null;
      this.onNo = null;
      fn();
    } else if (key === 'n' && this.onNo) {
      const fn = this.onNo;
      this.onYes = null;
      this.onNo = null;
      fn();
    }
  }

  makeOffer() {
    const wants = [];
    if (this.food > 80) {
      const amount = 40 + Math.floor(this.rand() * 40);
      wants.push({ id: 'food', amount: amount, text: amount + ' pounds of food' });
    }
    if (this.clothing > 4) {
      const amount = 1 + Math.floor(this.rand() * 2);
      wants.push({ id: 'clothing', amount: amount, text: amount + ' set' + (amount === 1 ? '' : 's') + ' of clothing' });
    }
    if (this.bullets > 40) {
      const amount = 20 + Math.floor(this.rand() * 40);
      wants.push({ id: 'bullets', amount: amount, text: amount + ' bullets' });
    }
    if (this.cents >= 1500) {
      const amount = 500 + Math.floor(this.rand() * 4) * 500;
      wants.push({ id: 'cash', amount: amount, text: formatMoney(amount) });
    }
    ['wheels', 'axles', 'tongues'].forEach(key => {
      const part = key.slice(0, -1);
      if (this[key] > 0 && this.broken !== part) wants.push({ id: key, amount: 1, text: 'a wagon ' + part });
    });
    const gives = [];
    const foodGive = 30 + Math.floor(this.rand() * 50);
    gives.push({ id: 'food', amount: foodGive, text: foodGive + ' pounds of food' });
    gives.push({ id: 'clothing', amount: 2, text: '2 sets of clothing' });
    const bulletGive = 20 + Math.floor(this.rand() * 40);
    gives.push({ id: 'bullets', amount: bulletGive, text: bulletGive + ' bullets' });
    gives.push({ id: 'wheels', amount: 1, text: 'a wagon wheel' });
    gives.push({ id: 'axles', amount: 1, text: 'a wagon axle' });
    gives.push({ id: 'tongues', amount: 1, text: 'a wagon tongue' });
    if (this.rand() < 0.25) gives.push({ id: 'ox', amount: 1, text: 'an ox' });
    if (!wants.length) {
      if (this.broken && this.hungry > 6) {
        return {
          text: 'A family takes pity and offers a wagon ' + this.broken + ', and will not take pay.',
          apply: () => { this.broken = null; }
        };
      }
      return null;
    }
    let give = gives[Math.floor(this.rand() * gives.length)];
    if (this.broken && this.rand() < 0.75) {
      const key = { wheel: 'wheels', axle: 'axles', tongue: 'tongues' }[this.broken];
      give = { id: key, amount: 1, text: 'a wagon ' + this.broken };
    }
    const want = wants[Math.floor(this.rand() * wants.length)];
    if (give.id === want.id) return null;
    return {
      text: 'A traveler offers to trade you ' + give.text + ' for ' + want.text + '.',
      apply: () => {
        this.takeFromParty(want);
        this.giveToParty(give);
      }
    };
  }

  takeFromParty(want) {
    const amount = want.amount || 0;
    if (want.id === 'food') this.food = Math.max(0, this.food - amount);
    else if (want.id === 'clothing') this.clothing = Math.max(0, this.clothing - amount);
    else if (want.id === 'bullets') this.bullets = Math.max(0, this.bullets - amount);
    else if (want.id === 'cash') this.cents = Math.max(0, this.cents - amount);
    else if (this[want.id] > 0) this[want.id] -= 1;
  }

  giveToParty(give) {
    const amount = give.amount || 0;
    if (give.id === 'food') this.food = Math.min(2000, this.food + amount);
    else if (give.id === 'clothing') this.clothing += amount;
    else if (give.id === 'bullets') this.bullets += amount;
    else if (give.id === 'ox') this.oxen += amount;
    else if (give.id === 'wheels' || give.id === 'axles' || give.id === 'tongues') {
      this[give.id] += 1;
      const part = give.id.slice(0, -1);
      if (this.broken === part) this.broken = null;
    }
  }

  confirmAbandon() {
    this.at(2, 21, 'Abandon the trail? (Y/N)'.padEnd(40, ' '), OT.bred);
    this.term.render();
    this.phase = 'yn';
    this.onYes = () => {
      this.pause(['You turn the wagon around.'], () => this.showProfession(true));
    };
    this.onNo = () => this.showTrail();
  }

  startTravel() {
    if (this.broken) {
      this.note = 'The wagon ' + this.broken + ' is broken. Trade for a spare, or wait one out.';
      this.showTrail();
      return;
    }
    if (this.oxen <= 0) {
      this.note = 'You have no oxen to pull the wagon.';
      this.showTrail();
      return;
    }
    this.stopTravel = false;
    this.phase = 'travel';
    this.travelStep();
  }

  travelStep() {
    if (this.stopTravel) {
      this.stopTravel = false;
      this.showTrail();
      return;
    }
    const result = this.simulateDay({ traveling: true });
    this.drawTravel(result);
    const interrupt = result.events.length || result.arrived || this.broken || !this.livingCount() || this.oxen <= 0;
    if (!interrupt) {
      this.timer = setTimeout(() => this.travelStep(), 680);
      return;
    }
    this.present(result.events, () => {
      if (!this.livingCount()) {
        this.gameOver();
        return;
      }
      if (result.arrived) this.onArrival();
      else this.showTrail();
    });
  }

  drawTravel(result) {
    this.cls();
    this.statusBlock();
    this.at(2, 5, this.locationLine().slice(0, 76), OT.bwhite);
    this.paintScene();
    const miles = result && result.miles ? result.miles : 0;
    this.at(2, 20, miles ? ('The wagon rolls ' + miles + ' miles.') : 'You make no progress today.', OT.bgreen);
    this.at(2, 21, 'Press RETURN to size up the situation', OT.byellow);
    this.footer('Ctrl-S toggles sound');
    this.phase = 'travel';
    this.done();
    this.beep(140, 0.035);
  }

  paintScene() {
    const terrain = this.terrain();
    const sky = terrain === 'desert' ? OT.cyan : OT.blue;
    const ground = terrain === 'desert' ? OT.yellow : (terrain === 'mountain' ? OT.cyan : OT.green);
    const grass = terrain === 'desert' ? OT.byellow : OT.bgreen;
    this.term.fill(2, 7, 76, 4, ' ', OT.bcyan, sky);
    this.term.fill(2, 11, 76, 7, terrain === 'desert' ? '.' : ',', grass, ground);
    const weather = this.weather || {};
    if (weather.snow) this.at(8, 7, '*   *    *     *    *', OT.bwhite, sky);
    else if (weather.rain) this.at(8, 7, '////   ////   ////', OT.bcyan, sky);
    else if (weather.heat) this.at(68, 7, 'o', OT.byellow, sky);
    else this.at(10, 7, '.   .    .', OT.bwhite, sky);
    if (terrain === 'mountain' || terrain === 'foothills') {
      this.at(6, 9, '/\\    /\\     /\\', OT.bwhite, sky);
      this.at(48, 8, '/\\     /\\', OT.bwhite, sky);
    } else if (terrain === 'forest') {
      this.at(6, 9, 'T   T    T    T', OT.bgreen, sky);
    } else if (terrain === 'desert') {
      this.at(58, 9, '/\\', OT.byellow, sky);
    }
    this.drawWagon(30, 9, sky, ground);
  }

  drawWagon(x, y, sky, ground) {
    const art = [
      ['      ______', sky],
      ['   __|      |__', sky],
      ['  |  |______|  |', ground],
      ['==|____________|==', ground],
      ['  (ox)      (ox)', ground]
    ];
    art.forEach((row, index) => {
      const bg = row[1];
      let col = x;
      for (const ch of row[0]) {
        let fg = OT.bwhite;
        if (ch === '_' || ch === '|' || ch === '=') fg = OT.byellow;
        if (ch === '(' || ch === ')' || ch === 'o' || ch === 'x') fg = OT.yellow;
        this.at(col, y + index, ch, fg, bg);
        col += 1;
      }
    });
  }

  simulateDay(opts) {
    const traveling = !!(opts && opts.traveling);
    const resting = !!(opts && (opts.resting || opts.hunting));
    const events = [];
    const weather = this.rollWeather();
    this.weather = weather;
    const beforeFood = this.food;
    const fed = this.consumeFood();
    if (!fed && beforeFood > 0) events.push({ kind: 'text', lines: ['The food is gone.'] });
    else if (fed && beforeFood > 0 && this.food === 0) events.push({ kind: 'text', lines: ['That was the last of the food.'] });
    this.applyHealth(weather, resting, fed);
    this.tickIllness(events);
    if (!fed) {
      this.hungry += 1;
      if (this.hungry >= 4) this.maybeStarve(events);
    } else {
      this.hungry = 0;
    }
    if (weather.snow && this.clothing < this.livingCount() && this.health < 40 && this.livingCount() && this.rand() < 0.12) {
      const who = this.living()[Math.floor(this.rand() * this.livingCount())];
      this.kill(who, 'freezing', events);
    }
    if (this.health <= 0 && this.livingCount()) {
      const ill = this.living().find(member => member.ill);
      const who = ill || this.living()[0];
      this.kill(who, ill ? ill.ill.id : 'exhaustion', events);
      this.health = 28;
    }
    if (resting && this.hurtOx > 0 && this.rand() < 0.5) {
      this.hurtOx -= 1;
      events.push({ kind: 'text', lines: ['An injured ox is well enough to pull again.'] });
    }
    const day = { miles: 0 };
    if (traveling) {
      day.miles = this.computeMiles(weather);
      if (weather.block) {
        day.miles = 0;
        events.push({ kind: 'text', lines: [weather.blockText || 'You cannot move today.'] });
      } else {
        this.rollTrailEvents(weather, events, day);
      }
      const next = this.nextStop();
      if (next && this.into + day.miles >= next.miles && day.miles > 0 && !this.broken) {
        const moved = next.miles - this.into;
        this.totalMiles += moved;
        this.into = next.miles;
        day.miles = moved;
        this.advanceDate();
        if (next.kind !== 'end') {
          events.push({ kind: 'text', lines: ['You have reached ' + next.name + '.'] });
        }
        return { events: events, arrived: true, miles: day.miles, weather: weather };
      }
      this.into += day.miles;
      this.totalMiles += day.miles;
    }
    this.advanceDate();
    return { events: events, arrived: false, miles: day.miles, weather: weather };
  }

  consumeFood() {
    const per = { filling: 3, meager: 2, bare: 1 }[this.rations] || 3;
    const need = per * this.livingCount();
    if (need <= 0) return true;
    if (this.food >= need) {
      this.food -= need;
      return true;
    }
    this.food = 0;
    return false;
  }

  applyHealth(weather, resting, fed) {
    const noFood = fed === false;
    let delta = 0;
    if (noFood) delta -= 8;
    else if (this.rations === 'filling') delta += 2;
    else if (this.rations === 'meager') delta -= 1;
    else delta -= 3;
    if (resting) delta += 7;
    else if (this.pace === 'grueling') delta -= 3;
    else if (this.pace === 'strenuous') delta -= 1;
    else delta += 1;
    const people = Math.max(1, this.livingCount());
    if (weather.cold) {
      const setsEach = this.clothing / people;
      if (setsEach < 2) delta -= (2 - setsEach) * (weather.snow ? 4 : 2);
    }
    if (weather.heat && this.pace === 'grueling') delta -= 2;
    if (this.living().some(member => member.ill)) delta -= 2;
    this.health = Math.max(0, Math.min(140, this.health + delta));
  }

  tickIllness(events) {
    this.members.forEach(member => {
      if (!member.alive || !member.ill) return;
      member.illDays -= 1;
      const kill = this.health < 30 ? member.ill.kill : (this.health < 55 ? member.ill.kill * 0.35 : 0);
      if (kill && this.rand() < kill) {
        this.kill(member, member.ill.id, events);
        return;
      }
      if (member.illDays <= 0 && member.alive) {
        member.ill = null;
        events.push({ kind: 'text', lines: [member.name + ' is well again.'] });
      }
    });
    if (!this.livingCount()) return;
    const chances = { good: 0.02, fair: 0.05, poor: 0.12, 'very poor': 0.22, dead: 0 };
    let chance = chances[this.healthName()] || 0;
    if (this.badWater > 0) {
      chance += 0.12;
      this.badWater -= 1;
    }
    if (this.rand() >= chance) return;
    const pool = this.living().filter(member => !member.ill);
    if (!pool.length) return;
    const who = pool[Math.floor(this.rand() * pool.length)];
    const disease = DISEASES[Math.floor(this.rand() * DISEASES.length)];
    who.ill = disease;
    who.illDays = disease.min + Math.floor(this.rand() * (disease.max - disease.min + 1));
    events.push({ kind: 'text', lines: [who.name + ' has ' + disease.say + '.'] });
  }

  maybeStarve(events) {
    if (this.rand() > 0.5) return;
    const who = this.living()[Math.floor(this.rand() * this.livingCount())];
    if (who) this.kill(who, 'starvation', events);
  }

  phrase(cause) {
    if (cause === 'starvation') return 'starvation';
    if (cause === 'freezing') return 'the cold';
    if (cause === 'drowning') return 'drowning';
    const disease = DISEASES.find(item => item.id === cause);
    return disease ? disease.say : cause;
  }

  youLine(cause) {
    return 'YOU HAVE DIED OF ' + this.phrase(cause).toUpperCase();
  }

  kill(member, cause, events) {
    if (!member || !member.alive) return;
    member.alive = false;
    member.ill = null;
    const say = this.phrase(cause);
    if (this.members[0] && member === this.members[0]) {
      events.push({ kind: 'youdied', cause: cause, name: member.name, say: say });
    } else {
      events.push({
        kind: 'tomb',
        name: member.name,
        cause: say,
        when: String(this.year),
        phrase: member.name + ' has died of ' + say + '.'
      });
    }
    this.beep(70, 0.45, 'sawtooth');
  }

  loseDays(count, events) {
    for (let i = 0; i < count; i++) {
      const fed = this.consumeFood();
      this.applyHealth(this.weather, false, fed);
      if (!fed) {
        this.hungry += 1;
        if (this.hungry >= 4) this.maybeStarve(events);
      } else {
        this.hungry = 0;
      }
      this.tickIllness(events);
      this.advanceDate();
    }
  }

  rollTrailEvents(weather, events, day) {
    let breakChance = 0.035;
    if (this.pace === 'grueling') breakChance += 0.03;
    if (this.terrain() === 'mountain') breakChance += 0.02;
    if (this.rand() < breakChance) {
      const part = ['wheel', 'axle', 'tongue'][Math.floor(this.rand() * 3)];
      events.push({ kind: 'text', lines: this.breakPart(part) });
      if (this.broken) day.miles = 0;
      else day.miles = Math.max(0, day.miles - 5);
      return;
    }
    if (!weather.grass && this.rand() < 0.22) {
      events.push({ kind: 'text', lines: ['The grass is thin. The oxen are suffering.'] });
      if (this.oxen > 0 && this.rand() < 0.45) this.hurtOx = Math.min(this.oxen, this.hurtOx + 1);
      day.miles = Math.round(day.miles * 0.7);
      return;
    }
    if (this.rand() > 0.16) return;
    const bag = ['fruit', 'thief', 'ox', 'water', 'lost', 'rough', 'grave', 'help', 'fire', 'wander'];
    if (weather.rain) bag.push('storm', 'hail');
    if (weather.cold) bag.push('fog');
    const pick = bag[Math.floor(this.rand() * bag.length)];
    this.applyIncident(pick, events, day);
  }

  breakPart(part) {
    const key = { wheel: 'wheels', axle: 'axles', tongue: 'tongues' }[part];
    const label = 'wagon ' + part;
    if (this[key] > 0) {
      this[key] -= 1;
      return ['A ' + label + ' is broken.', 'You repair the wagon with a spare.'];
    }
    this.broken = part;
    return ['A ' + label + ' is broken.', 'You have no spare part.'];
  }

  applyIncident(pick, events, day) {
    if (pick === 'fruit') {
      const found = 20 + Math.floor(this.rand() * 55);
      const room = Math.max(0, 2000 - this.food);
      const add = Math.min(room, found);
      this.food += add;
      events.push({ kind: 'text', lines: ['You find wild fruit.', 'You gather ' + add + ' pounds.'] });
    } else if (pick === 'thief') {
      events.push({ kind: 'text', lines: ['A thief came during the night.', this.stealSomething()] });
    } else if (pick === 'ox') {
      if (this.oxen > 1 && this.rand() < 0.6) {
        this.oxen -= 1;
        if (this.hurtOx > this.oxen) this.hurtOx = this.oxen;
        events.push({ kind: 'text', lines: ['An ox has died.'] });
      } else if (this.oxen > 0) {
        this.hurtOx = Math.min(this.oxen, this.hurtOx + 1);
        events.push({ kind: 'text', lines: ['An ox is injured.'] });
      }
    } else if (pick === 'water') {
      this.badWater = 3;
      events.push({ kind: 'text', lines: ['The water is bad. The party may sicken.'] });
    } else if (pick === 'lost') {
      const extra = 1 + Math.floor(this.rand() * 3);
      events.push({ kind: 'text', lines: ['You lose the trail for ' + (extra + 1) + ' days.'] });
      this.loseDays(extra, events);
      day.miles = 0;
    } else if (pick === 'rough') {
      day.miles = Math.round(day.miles * 0.5);
      events.push({ kind: 'text', lines: ['The trail is rough. You make poor time.'] });
    } else if (pick === 'grave') {
      events.push(this.randomGrave());
    } else if (pick === 'help') {
      const add = Math.min(2000 - this.food, 30 + Math.floor(this.rand() * 50));
      this.food += Math.max(0, add);
      events.push({ kind: 'text', lines: ['People who know this country bring you food.', 'You take on ' + Math.max(0, add) + ' pounds.'] });
    } else if (pick === 'fire') {
      const lost = Math.round(this.food * 0.15);
      this.food = Math.max(0, this.food - lost);
      events.push({ kind: 'text', lines: ['There is a fire in the wagon.', 'You lose ' + lost + ' pounds of food.'] });
    } else if (pick === 'wander') {
      if (this.oxen > 0) {
        this.oxen -= 1;
        if (this.hurtOx > this.oxen) this.hurtOx = this.oxen;
        events.push({ kind: 'text', lines: ['An ox wanders off.'] });
      }
    } else if (pick === 'storm') {
      day.miles = 0;
      events.push({ kind: 'text', lines: ['A severe thunderstorm stops the wagon.'] });
    } else if (pick === 'hail') {
      const lost = Math.round(this.food * 0.08);
      this.food = Math.max(0, this.food - lost);
      events.push({ kind: 'text', lines: ['Hail batters the wagon.', 'You lose ' + lost + ' pounds of food.'] });
    } else if (pick === 'fog') {
      day.miles = Math.round(day.miles * 0.25);
      events.push({ kind: 'text', lines: ['Heavy fog. You can barely keep the trail.'] });
    }
  }

  stealSomething() {
    const bag = [];
    if (this.food > 30) bag.push('food');
    if (this.bullets > 20) bag.push('bullets');
    if (this.clothing > 1) bag.push('clothing');
    if (this.cents > 800) bag.push('cash');
    const pick = bag.length ? bag[Math.floor(this.rand() * bag.length)] : 'food';
    if (pick === 'food') {
      const n = Math.min(this.food, 20 + Math.floor(this.rand() * 60));
      this.food -= n;
      return 'You lose ' + n + ' pounds of food.';
    }
    if (pick === 'bullets') {
      const n = Math.min(this.bullets, 20 + Math.floor(this.rand() * 40));
      this.bullets -= n;
      return 'You lose ' + n + ' bullets.';
    }
    if (pick === 'clothing') {
      const n = Math.min(this.clothing, 1 + Math.floor(this.rand() * 2));
      this.clothing -= n;
      return 'You lose ' + n + ' set' + (n === 1 ? '' : 's') + ' of clothing.';
    }
    const cents = Math.min(this.cents, 400 + Math.floor(this.rand() * 1200));
    this.cents -= cents;
    return 'You lose ' + formatMoney(cents) + '.';
  }

  randomGrave() {
    const first = ['J.', 'A.', 'M.', 'E.', 'S.', 'W.', 'H.', 'C.', 'L.', 'R.'];
    const last = ['Miller', 'Clark', 'Brown', 'Adams', 'Reed', 'Walker', 'Young', 'Harris', 'Martin', 'Turner', 'Parker', 'Hill'];
    const cause = ['cholera', 'dysentery', 'typhoid', 'a fever', 'exhaustion'];
    const name = first[Math.floor(this.rand() * first.length)] + ' ' + last[Math.floor(this.rand() * last.length)];
    const why = cause[Math.floor(this.rand() * cause.length)];
    const year = 1841 + Math.floor(this.rand() * 7);
    if (this.broken && this.rand() < 0.35) {
      const key = { wheel: 'wheels', axle: 'axles', tongue: 'tongues' }[this.broken];
      this[key] += 1;
      this.broken = null;
      return {
        kind: 'tomb',
        name: name.toUpperCase(),
        cause: why,
        when: String(year),
        phrase: 'Beside the grave is a wagon ' + key.slice(0, -1) + '. You take it.'
      };
    }
    return {
      kind: 'tomb',
      name: name.toUpperCase(),
      cause: why,
      when: String(year),
      phrase: 'You pass a gravesite.'
    };
  }

  computeMiles(weather) {
    if (this.oxen <= 0 || this.broken) return 0;
    const cap = this.totalMiles >= 640 ? 24 : 40;
    const pace = { steady: 0.5, strenuous: 0.75, grueling: 1 }[this.pace] || 0.5;
    const healthy = Math.max(0, this.oxen - this.hurtOx * 0.5);
    const ox = Math.min(1, healthy / 4);
    const sick = this.living().filter(member => member.ill).length;
    const people = Math.max(0.4, 1 - 0.1 * sick);
    let speed = weather.speed == null ? 1 : weather.speed;
    if (this.terrain() === 'mountain') speed *= 0.85;
    if (this.terrain() === 'desert') speed *= 0.9;
    let miles = cap * pace * ox * people * speed;
    miles += this.rand() * 4 - 2;
    return Math.max(0, Math.round(miles));
  }

  advanceDate() {
    this.day += 1;
    const dim = daysInMonth(this.month, this.year);
    if (this.day > dim) {
      this.day = 1;
      this.month += 1;
      if (this.month > 12) {
        this.month = 1;
        this.year += 1;
      }
    }
  }

  rollWeather() {
    const month = this.month;
    const terrain = this.terrain();
    const high = terrain === 'foothills' || terrain === 'mountain' || terrain === 'forest';
    const dry = terrain === 'desert';
    let table;
    if (month <= 2 || month === 12) {
      table = high
        ? [['blizzard', 0.4], ['snow', 0.4], ['very cold', 0.2]]
        : [['snow', 0.3], ['very cold', 0.4], ['cold', 0.3]];
    } else if (month === 3) {
      table = high
        ? [['snow', 0.3], ['cold', 0.4], ['cool', 0.3]]
        : [['cold', 0.2], ['cool', 0.4], ['rain', 0.25], ['warm', 0.15]];
    } else if (month === 4 || month === 5) {
      table = high
        ? [['cool', 0.35], ['cold', 0.2], ['rain', 0.25], ['snow', 0.1], ['warm', 0.1]]
        : [['warm', 0.35], ['cool', 0.2], ['rain', 0.25], ['thunderstorm', 0.1], ['hot', 0.1]];
    } else if (month >= 6 && month <= 8) {
      if (dry) table = [['very hot', 0.45], ['hot', 0.35], ['warm', 0.15], ['thunderstorm', 0.05]];
      else if (high) table = [['warm', 0.3], ['cool', 0.3], ['hot', 0.15], ['thunderstorm', 0.15], ['rain', 0.1]];
      else table = [['hot', 0.35], ['very hot', 0.25], ['warm', 0.15], ['thunderstorm', 0.15], ['rain', 0.1]];
    } else if (month === 9 || month === 10) {
      table = high
        ? [['cool', 0.3], ['cold', 0.3], ['rain', 0.2], ['snow', 0.15], ['warm', 0.05]]
        : [['warm', 0.3], ['cool', 0.35], ['rain', 0.2], ['cold', 0.15]];
    } else {
      table = high
        ? [['snow', 0.35], ['cold', 0.35], ['very cold', 0.2], ['blizzard', 0.1]]
        : [['cold', 0.4], ['very cold', 0.3], ['cool', 0.2], ['rain', 0.1]];
    }
    return this.describeWeather(this.weighted(table));
  }

  weighted(table) {
    let roll = this.rand();
    for (let i = 0; i < table.length; i++) {
      roll -= table[i][1];
      if (roll <= 0) return table[i][0];
    }
    return table[table.length - 1][0];
  }

  describeWeather(name) {
    const speed = {
      'very hot': 0.85, hot: 0.95, warm: 1, cool: 1, cold: 0.88,
      'very cold': 0.7, rain: 0.8, 'heavy rain': 0.65, thunderstorm: 0.55,
      snow: 0.4, blizzard: 0.15
    }[name] || 1;
    const cold = name === 'cold' || name === 'very cold' || name === 'snow' || name === 'blizzard';
    const snow = name === 'snow' || name === 'blizzard';
    const heat = name === 'hot' || name === 'very hot';
    const rain = name === 'rain' || name === 'heavy rain' || name === 'thunderstorm';
    const block = name === 'blizzard' && this.rand() < 0.55;
    const dryGround = heat && (this.terrain() === 'desert' || this.terrain() === 'plains') && this.month >= 7;
    return {
      name: name,
      speed: speed,
      cold: cold,
      snow: snow,
      heat: heat,
      rain: rain,
      block: block,
      blockText: 'You are snowbound.',
      grass: !dryGround
    };
  }

  onArrival() {
    const place = this.trail.shift();
    this.here = place;
    this.into = 0;
    if (!place) {
      this.showTrail();
      return;
    }
    if (place.kind === 'end') {
      this.win();
      return;
    }
    if (place.kind === 'river') {
      this.setupRiver(place);
      this.showRiver();
      return;
    }
    if (place.kind === 'split') {
      this.showSplit();
      return;
    }
    this.note = 'You are at ' + place.name + '.';
    this.showTrail();
  }

  setupRiver(place) {
    let depth = place.depthBase;
    if (this.month === 3) depth += 0.4;
    if (this.month === 4) depth += 0.9;
    if (this.month === 5) depth += 1.5;
    if (this.month === 6) depth += 1.1;
    if (this.month === 7) depth += 0.3;
    if (this.month >= 8 && this.month <= 10) depth -= 0.5;
    if (this.weather && this.weather.rain) depth += 0.6;
    depth += this.rand() * 0.8 - 0.3;
    if (place.id === 'snake') depth = Math.max(depth, 4.8);
    this.river = {
      depth: Math.round(Math.max(0.5, depth) * 10) / 10,
      width: Math.round(place.width * (0.9 + this.rand() * 0.2))
    };
  }

  showRiver() {
    this.clearTimer();
    const place = this.here;
    this.cls();
    this.center(0, place.name, OT.bcyan);
    this.at(4, 2, 'Weather: ' + this.weather.name, OT.cyan);
    this.at(4, 3, 'River width: ' + this.river.width + ' feet', OT.bwhite);
    this.at(4, 4, 'River depth: ' + this.river.depth.toFixed(1) + ' feet', OT.bwhite);
    this.at(4, 5, 'Food: ' + this.food + ' pounds', OT.white);
    this.at(4, 7, 'You may:', OT.cyan);
    const options = [
      ['attempt to ford the river', () => this.cross('ford')],
      ['caulk the wagon and float it across', () => this.spendThen(() => this.cross('caulk'))],
      ['wait to see if conditions improve', () => this.spendThen(() => this.waitRiver())],
      ['get more information', () => this.riverInfo()],
      ['check supplies', () => this.showSupplies(() => this.showRiver())]
    ];
    if (place.ferry) {
      options.splice(2, 0, ['take a ferry across (' + formatMoney(place.ferry) + ')', () => {
        if (this.cents < place.ferry) {
          this.pause(['You do not have the ferry fare.'], () => this.showRiver());
          return;
        }
        this.spendThen(() => this.cross('ferry'));
      }]);
    } else if (place.guide) {
      options.splice(2, 0, ['hire a guide (3 sets of clothing)', () => {
        if (this.clothing < 3 && this.cents < 2500) {
          this.pause(['The guide wants three sets of clothing, or $25. You have neither to spare.'], () => this.showRiver());
          return;
        }
        this.spendThen(() => this.cross('guide'));
      }]);
    }
    options.forEach((option, index) => {
      this.at(4, 9 + index, (index + 1) + '.', OT.byellow);
      this.at(8, 9 + index, option[0], OT.white);
    });
    this.at(4, 20, 'What is your choice?', OT.bgreen);
    this.footer('Ctrl-S toggles sound');
    this.phase = 'menu';
    this.menuFn = n => {
      if (options[n - 1]) options[n - 1][1]();
    };
    this.done();
  }

  riverInfo() {
    const depth = this.river.depth;
    let line;
    if (depth < 2.5) line = 'It looks shallow enough to ford, if the bottom is firm.';
    else if (depth < 4) line = 'Fording this is a gamble. Floating the wagon is safer. A ferry, where there is one, is safer than that.';
    else line = 'This is deep. A ford is a good way to lose the wagon’s insides, or a person.';
    const extra = [];
    extra.push(line);
    if (this.here.guide) extra.push('A guide who knows this ford is the surest of the bad choices. The price is three sets of clothing.');
    if (this.here.ferry) extra.push('The ferry charges ' + formatMoney(this.here.ferry) + ' and does not care how deep the middle is.');
    if (!this.here.ferry && !this.here.guide) extra.push('There is no ferry at this crossing.');
    this.pause(extra, () => this.showRiver());
  }

  spendThen(then) {
    const result = this.simulateDay({ resting: true });
    this.present(result.events, () => {
      if (!this.livingCount()) {
        this.gameOver();
        return;
      }
      then();
    });
  }

  waitRiver() {
    let shift = this.rand() * 0.9 - 0.55;
    if (this.weather.rain) shift += 0.35;
    this.river.depth = Math.round(Math.max(0.4, this.river.depth + shift) * 10) / 10;
    this.note = '';
    this.showRiver();
  }

  cross(kind) {
    if (kind === 'ferry') {
      if (this.cents < this.here.ferry) {
        this.pause(['You do not have the ferry fare.'], () => this.showRiver());
        return;
      }
      this.cents -= this.here.ferry;
    }
    if (kind === 'guide') {
      if (this.clothing >= 3) this.clothing -= 3;
      else if (this.cents >= 2500) this.cents -= 2500;
      else {
        this.pause(['The guide wants three sets of clothing, or $25. You have neither to spare.'], () => this.showRiver());
        return;
      }
    }
    const risk = this.crossingRisk(kind);
    const events = [];
    if (this.rand() < risk) {
      const deaths = [];
      const lines = this.riverMishap(deaths);
      events.push({ kind: 'text', lines: lines });
      deaths.forEach(death => this.kill(death.who, death.cause, events));
    } else {
      const fine = {
        ford: 'You ford the river. The far bank is under your wheels.',
        caulk: 'The wagon floats. You land it on the far bank.',
        ferry: 'The ferry puts you across.',
        guide: 'The guide finds the ford and takes the wagon across.'
      }[kind];
      events.push({ kind: 'text', lines: [fine] });
    }
    this.present(events, () => {
      if (!this.livingCount()) {
        this.gameOver();
        return;
      }
      this.note = 'You are across.';
      this.showTrail();
    });
  }

  crossingRisk(kind) {
    const depth = this.river.depth;
    if (kind === 'ferry') return 0.03;
    if (kind === 'guide') return 0.08;
    if (kind === 'caulk') {
      let risk = 0.12 + this.river.width / 5000;
      if (depth > 5) risk += 0.1;
      if (this.weather.rain) risk += 0.18;
      if (this.weather.block) risk += 0.2;
      return Math.min(0.85, risk);
    }
    if (depth < 2.5) return 0.06;
    if (depth < 3) return 0.2;
    if (depth < 4) return 0.42;
    if (depth < 5) return 0.7;
    if (depth < 6.5) return 0.88;
    return 0.95;
  }

  riverMishap(events) {
    const lines = ['The current takes the wagon.'];
    const foodLoss = Math.min(this.food, Math.round(this.food * (0.1 + this.rand() * 0.35)));
    if (foodLoss > 0) {
      this.food -= foodLoss;
      lines.push('You lose ' + foodLoss + ' pounds of food.');
    }
    if (this.clothing > 0 && this.rand() < 0.35) {
      const sets = Math.min(this.clothing, 1 + Math.floor(this.rand() * 2));
      this.clothing -= sets;
      lines.push(sets + ' set' + (sets === 1 ? '' : 's') + ' of clothing wash away.');
    }
    const spareKeys = ['wheels', 'axles', 'tongues'].filter(key => this[key] > 0);
    if (spareKeys.length && this.rand() < 0.3) {
      const key = spareKeys[Math.floor(this.rand() * spareKeys.length)];
      this[key] -= 1;
      lines.push('You lose a wagon ' + key.slice(0, -1) + '.');
    }
    if (this.oxen > 0 && this.rand() < 0.22) {
      this.oxen -= 1;
      if (this.hurtOx > this.oxen) this.hurtOx = this.oxen;
      lines.push('An ox is lost in the river.');
    }
    if (this.cents > 0 && this.rand() < 0.18) {
      const lost = Math.min(this.cents, 300 + Math.floor(this.rand() * 1500));
      this.cents -= lost;
      lines.push('You lose ' + formatMoney(lost) + '.');
    }
    const drownAt = 0.08 + Math.max(0, this.river.depth - 4) * 0.06;
    if (this.river.depth >= 4 && this.livingCount() && this.rand() < drownAt) {
      const who = this.living()[Math.floor(this.rand() * this.livingCount())];
      lines.push(who.name + ' is thrown into the water.');
      events.push({ who: who, cause: 'drowning' });
    }
    return lines;
  }

  showSplit() {
    const split = this.here.split;
    this.cls();
    this.center(1, this.here.name, OT.byellow);
    this.at(3, 3, 'The trail divides here.', OT.white);
    let options;
    let blocks;
    if (split === 'south') {
      blocks = [
        ['Head for Fort Bridger', '125 miles to a store, then 162 miles on to Soda Springs.'],
        ['Take the Green River cutoff', '57 miles to the crossing, then 144 miles to Soda Springs. No store.']
      ];
      options = [
        ['Head for Fort Bridger', () => this.chooseBranch(VIA_BRIDGER.concat(AFTER_SODA), 'You turn toward Fort Bridger.')],
        ['Take the Green River cutoff', () => this.chooseBranch(VIA_GREEN.concat(AFTER_SODA), 'You take the cutoff toward the Green River.')]
      ];
    } else if (split === 'blue') {
      blocks = [
        ['Go by Fort Walla Walla', '55 miles to the fort, then 120 more to The Dalles. You can buy supplies.'],
        ['Take the cutoff to The Dalles', '125 miles. No fort. Rougher country.']
      ];
      options = [
        ['Go by Fort Walla Walla', () => this.chooseBranch(VIA_WALLA, 'You head for Fort Walla Walla.')],
        ['Take the cutoff to The Dalles', () => this.chooseBranch(VIA_DALLES_SHORT, 'You take the cutoff toward The Dalles.')]
      ];
    } else {
      blocks = [
        ['Take the Barlow Road ($5.00)', 'A toll, then 100 miles over the mountains into the valley.'],
        ['Raft the Columbia River', 'No toll. You steer a raft between the rocks.']
      ];
      options = [
        ['Take the Barlow Road ($5.00)', () => this.chooseBarlow()],
        ['Raft the Columbia River', () => this.startRaft()]
      ];
    }
    let y = 5;
    blocks.forEach((block, index) => {
      this.at(4, y, (index + 1) + '.', OT.byellow);
      this.at(8, y, block[0], OT.bwhite);
      y += 1;
      this.wrap(block[1], 66).forEach(line => {
        this.at(8, y, line, OT.white);
        y += 1;
      });
      y += 1;
    });
    this.at(3, 16, 'What is your choice?', OT.bgreen);
    this.phase = 'menu';
    this.menuFn = n => {
      if (options[n - 1]) options[n - 1][1]();
    };
    this.done();
  }

  chooseBranch(stops, note) {
    this.trail = stops.map(cloneStop);
    this.note = note;
    this.beep(500, 0.05);
    this.showTrail();
  }

  chooseBarlow() {
    if (this.cents < 500) {
      this.pause(['The toll is $5.00. You do not have it.'], () => this.showSplit());
      return;
    }
    this.cents -= 500;
    this.chooseBranch(BARLOW, 'You pay the toll and take the Barlow Road.');
  }

  startHunt() {
    if (this.bullets <= 0) {
      this.note = 'You have no bullets.';
      this.showTrail();
      return;
    }
    const result = this.simulateDay({ hunting: true });
    this.present(result.events, () => {
      if (!this.livingCount()) {
        this.gameOver();
        return;
      }
      if (this.bullets <= 0) {
        this.note = 'You have no bullets.';
        this.showTrail();
        return;
      }
      this.openHunt();
    });
  }

  openHunt() {
    this.clearTimer();
    const rocks = {};
    for (let i = 0; i < 18; i++) {
      const x = 2 + Math.floor(this.rand() * 76);
      const y = 4 + Math.floor(this.rand() * 17);
      rocks[x + ',' + y] = this.terrain() === 'forest' && this.rand() < 0.5 ? '🌲' : '🪨';
    }
    this.hunt = {
      x: 8,
      y: 12,
      dx: 1,
      dy: 0,
      animals: [],
      shots: [],
      rocks: rocks,
      meat: 0,
      ticks: 0,
      maxTicks: 150,
      msg: 'Arrows or WASD move. SPACE shoots. Q returns.',
      done: false
    };
    this.phase = 'hunt';
    this.drawHunt();
    this.timer = setInterval(() => this.huntTick(), 150);
  }

  huntBlocked(x, y) {
    if (!this.hunt) return true;
    if (x < 1 || y < 4 || x > 78 || y > 21) return true;
    return !!this.hunt.rocks[x + ',' + y];
  }

  huntKey(event) {
    if (!this.hunt || this.hunt.done) return;
    const key = event.key;
    const dirs = {
      ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1],
      a: [-1, 0], d: [1, 0], w: [0, -1], s: [0, 1],
      A: [-1, 0], D: [1, 0], W: [0, -1], S: [0, 1]
    };
    if (dirs[key]) {
      event.preventDefault();
      const dx = dirs[key][0];
      const dy = dirs[key][1];
      this.hunt.dx = dx;
      this.hunt.dy = dy;
      const nx = this.hunt.x + dx;
      const ny = this.hunt.y + dy;
      if (!this.huntBlocked(nx, ny)) {
        this.hunt.x = nx;
        this.hunt.y = ny;
      }
      this.drawHunt();
      return;
    }
    if (key === ' ' && !event.repeat) {
      if (this.bullets <= 0) {
        this.hunt.msg = 'You are out of bullets.';
        this.beep(80, 0.05);
      } else if (this.hunt.dx || this.hunt.dy) {
        this.bullets -= 1;
        this.hunt.shots.push({
          x: this.hunt.x + this.hunt.dx,
          y: this.hunt.y + this.hunt.dy,
          dx: this.hunt.dx,
          dy: this.hunt.dy
        });
        this.beep(180, 0.04);
      }
      return;
    }
    if (key === 'q' || key === 'Q' || key === 'Escape') this.endHunt();
  }

  spawnAnimal() {
    const terrain = this.terrain();
    const bag = [
      { ch: '🐇', fg: OT.bwhite, meat: 2 + Math.floor(this.rand() * 4), every: 1, name: 'rabbit' },
      { ch: '🐇', fg: OT.bwhite, meat: 2 + Math.floor(this.rand() * 4), every: 1, name: 'rabbit' },
      { ch: '🦨', fg: OT.bmagenta, meat: 1 + Math.floor(this.rand() * 3), every: 2, name: 'skunk' }
    ];
    if (terrain === 'prairie' || terrain === 'plains' || terrain === 'foothills') {
      bag.push({ ch: '🦌', fg: OT.byellow, meat: 40 + Math.floor(this.rand() * 35), every: 2, name: 'deer' });
      bag.push({ ch: '🦬', fg: OT.yellow, meat: 80 + Math.floor(this.rand() * 40), every: 3, name: 'buffalo' });
    }
    if (terrain === 'mountain' || terrain === 'forest' || terrain === 'foothills') {
      bag.push({ ch: '🦌', fg: OT.byellow, meat: 40 + Math.floor(this.rand() * 30), every: 2, name: 'deer' });
      bag.push({ ch: '🐻', fg: OT.bred, meat: 70 + Math.floor(this.rand() * 40), every: 3, name: 'bear' });
    }
    if (terrain === 'desert') {
      bag.push({ ch: '🦌', fg: OT.byellow, meat: 30 + Math.floor(this.rand() * 25), every: 2, name: 'deer' });
    }
    const spec = bag[Math.floor(this.rand() * bag.length)];
    const fromLeft = this.rand() < 0.5;
    const animal = {
      x: fromLeft ? 1 : 78,
      y: 5 + Math.floor(this.rand() * 16),
      dx: fromLeft ? 1 : -1,
      dy: this.rand() < 0.3 ? (this.rand() < 0.5 ? -1 : 1) : 0,
      ch: spec.ch,
      fg: spec.fg,
      meat: spec.meat,
      every: spec.every,
      tick: 0
    };
    if (this.huntBlocked(animal.x, animal.y)) return;
    this.hunt.animals.push(animal);
  }

  huntTick() {
    const hunt = this.hunt;
    if (!hunt || hunt.done) return;
    hunt.ticks += 1;
    hunt.shots.forEach(shot => {
      shot.x += shot.dx;
      shot.y += shot.dy;
    });
    hunt.shots = hunt.shots.filter(shot => !this.huntBlocked(shot.x, shot.y));
    hunt.animals.forEach(animal => {
      animal.tick += 1;
      if (animal.tick < animal.every) return;
      animal.tick = 0;
      const nx = animal.x + animal.dx;
      const ny = Math.max(4, Math.min(21, animal.y + animal.dy));
      if (this.huntBlocked(nx, ny)) animal.dx = -animal.dx;
      else {
        animal.x = nx;
        animal.y = ny;
      }
    });
    hunt.animals = hunt.animals.filter(animal => animal.x > 0 && animal.x < 79);
    const deadAnimals = new Set();
    const deadShots = new Set();
    hunt.shots.forEach(shot => {
      const animal = hunt.animals.find(item => item.x === shot.x && item.y === shot.y);
      if (!animal || deadAnimals.has(animal)) return;
      deadAnimals.add(animal);
      deadShots.add(shot);
      hunt.meat += animal.meat;
      hunt.msg = 'Hit. ' + animal.meat + ' pounds.';
      this.beep(700, 0.05);
    });
    hunt.animals = hunt.animals.filter(animal => !deadAnimals.has(animal));
    hunt.shots = hunt.shots.filter(shot => !deadShots.has(shot));
    if (hunt.ticks % 6 === 0 && hunt.animals.length < 5) this.spawnAnimal();
    this.drawHunt();
    if (hunt.ticks >= hunt.maxTicks) this.endHunt();
  }

  drawHunt() {
    const hunt = this.hunt;
    if (!hunt) return;
    this.term.beginFrame();
    this.term.clear();
    this.at(2, 0, 'Hunting', OT.byellow);
    this.at(16, 0, 'Bullets: ' + this.bullets, OT.white);
    this.at(36, 0, 'Shot: ' + hunt.meat + ' lb', OT.bgreen);
    this.at(56, 0, 'Carry 100', OT.gray);
    this.at(2, 1, hunt.msg.slice(0, 76), OT.cyan);
    this.at(2, 22, 'Q back to the wagon', OT.gray);
    Object.keys(hunt.rocks).forEach(key => {
      const parts = key.split(',');
      const ch = hunt.rocks[key];
      this.at(parseInt(parts[0], 10), parseInt(parts[1], 10), ch, ch === '🌲' ? OT.green : OT.yellow);
    });
    hunt.animals.forEach(animal => this.at(animal.x, animal.y, animal.ch, animal.fg));
    hunt.shots.forEach(shot => this.at(shot.x, shot.y, '💥', OT.byellow));
    this.at(hunt.x, hunt.y, '🤠', OT.bwhite);
    this.phase = 'hunt';
    this.term.hideCursor();
    this.term.endFrame();
  }

  endHunt() {
    if (!this.hunt || this.hunt.done) return;
    this.hunt.done = true;
    this.clearTimer();
    const shot = this.hunt.meat;
    const carry = Math.min(100, shot);
    const room = Math.max(0, 2000 - this.food);
    const add = Math.min(room, carry);
    this.food += add;
    const lines = ['You shot ' + shot + ' pounds of food.', 'You carry ' + add + ' pounds back to the wagon.'];
    if (shot > 100) lines.push('You can take only 100 pounds. The rest stays on the ground.');
    if (room <= 0) lines.push('The wagon already holds 2000 pounds.');
    this.beep(520, 0.08);
    this.pause(lines, () => this.showTrail());
  }

  startRaft() {
    const result = this.simulateDay({ resting: true });
    this.present(result.events, () => {
      if (!this.livingCount()) {
        this.gameOver();
        return;
      }
      this.openRaft();
    });
  }

  openRaft() {
    this.clearTimer();
    this.raft = {
      x: 36,
      y: 16,
      rocks: [],
      ticks: 0,
      hits: 0,
      channel: false,
      missed: false,
      done: false,
      msg: 'Arrows steer. The channel opens on the right.'
    };
    this.phase = 'raft';
    this.drawRaft();
    this.timer = setInterval(() => this.raftTick(), 140);
  }

  raftKey(event) {
    if (!this.raft || this.raft.done) return;
    const key = event.key;
    if (key === 'ArrowLeft' || key === 'a' || key === 'A') this.raft.x = Math.max(2, this.raft.x - 2);
    else if (key === 'ArrowRight' || key === 'd' || key === 'D') this.raft.x = Math.min(74, this.raft.x + 2);
    else if (key === 'ArrowUp' || key === 'w' || key === 'W') this.raft.y = Math.max(6, this.raft.y - 1);
    else if (key === 'ArrowDown' || key === 's' || key === 'S') this.raft.y = Math.min(21, this.raft.y + 1);
    else return;
    event.preventDefault();
  }

  raftTick() {
    const raft = this.raft;
    if (!raft || raft.done) return;
    raft.ticks += 1;
    raft.rocks.forEach(rock => { rock.y += 1; });
    if (raft.ticks > 100) raft.channel = true;
    if (raft.ticks % 2 === 0) {
      const x = 2 + Math.floor(this.rand() * 68);
      if (!(raft.channel && x > 64)) raft.rocks.push({ x: x, y: 4 });
    }
    raft.rocks = raft.rocks.filter(rock => rock.y < 23);
    const body = [raft.x];
    raft.rocks = raft.rocks.filter(rock => {
      const hit = rock.y === raft.y && body.indexOf(rock.x) !== -1;
      if (!hit) return true;
      raft.hits += 1;
      this.beep(90, 0.06, 'sawtooth');
      const lost = Math.min(this.food, 15 + Math.floor(this.rand() * 25));
      this.food -= lost;
      if (raft.hits % 3 === 0 && this.clothing > 0) this.clothing -= 1;
      raft.msg = 'The raft strikes a rock.';
      return false;
    });
    if (raft.channel && raft.x >= 66) {
      this.endRaft(false);
      return;
    }
    if (raft.ticks > 190) {
      this.endRaft(true);
      return;
    }
    this.drawRaft();
  }

  drawRaft() {
    const raft = this.raft;
    if (!raft) return;
    this.term.beginFrame();
    this.term.clear();
    this.term.fill(0, 3, 80, 20, '~', OT.blue, OT.blue);
    this.at(2, 0, 'The Columbia River', OT.bcyan);
    this.at(2, 1, raft.msg.slice(0, 76), OT.white);
    if (raft.channel) {
      this.term.fill(68, 4, 12, 19, ' ', OT.bgreen, OT.cyan);
      this.at(68, 4, 'CHANNEL', OT.byellow, OT.cyan);
      this.at(68, 5, '>>>>>>', OT.bwhite, OT.cyan);
    }
    raft.rocks.forEach(rock => this.at(rock.x, rock.y, '🪨', OT.bwhite, OT.blue));
    this.at(raft.x, raft.y, '🚣', OT.byellow, OT.blue);
    this.at(2, 23, 'Left and right, up and down. Reach the channel.', OT.gray, OT.black);
    this.phase = 'raft';
    this.term.hideCursor();
    this.term.endFrame();
  }

  endRaft(missed) {
    if (!this.raft || this.raft.done) return;
    this.raft.done = true;
    this.clearTimer();
    if (missed) {
      const lost = Math.round(this.food * 0.2);
      this.food = Math.max(0, this.food - lost);
      this.pause([
        'You miss the channel and wash downstream.',
        'You lose ' + lost + ' pounds of food before the bank finds you.',
        'The Willamette Valley is in sight anyway.'
      ], () => this.win());
      return;
    }
    this.pause([
      'You swing the raft into the channel.',
      this.raft.hits ? ('The rocks took their share. Hits: ' + this.raft.hits + '.') : 'You hardly touched a rock.',
      'The Willamette Valley opens ahead.'
    ], () => this.win());
  }

  win() {
    this.lastScore = tally(this);
    this.insertScore(this.lastScore.total);
    this.beep(523, 0.1);
    setTimeout(() => this.beep(659, 0.1), 120);
    setTimeout(() => this.beep(784, 0.16), 240);
    this.showScore();
  }

  insertScore(total) {
    const name = this.members[0] ? this.members[0].name : 'Unknown';
    const board = this.board.map(row => ({ name: row.name, score: row.score }));
    board.push({ name: name, score: total, fresh: true });
    board.sort((a, b) => b.score - a.score);
    this.board = board.slice(0, 10);
    this.madeTop = this.board.some(row => row.fresh);
    this.saveBoard();
  }

  saveBoard() {
    try {
      if (typeof localStorage === 'undefined') return;
      const data = this.board.map(row => ({ name: row.name, score: row.score }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (err) {}
  }

  showScore() {
    const score = this.lastScore || tally(this);
    const prof = PROFESSIONS[this.profession] || PROFESSIONS.farmer;
    this.cls();
    this.center(0, 'The Willamette Valley', OT.byellow);
    this.center(1, this.dateStr(), OT.white);
    const rows = [
      [score.living + ' in ' + score.band + ' health', score.people],
      ['the wagon', score.wagon],
      ['oxen', score.ox],
      ['spare parts', score.parts],
      ['clothing', score.clothes],
      ['ammunition', score.ammo],
      ['food', score.food],
      ['cash', score.cash]
    ];
    rows.forEach((row, index) => {
      const label = row[0];
      const value = String(row[1]);
      const dots = '.'.repeat(Math.max(2, 36 - label.length - value.length));
      this.at(6, 3 + index, label + ' ' + dots + ' ' + value, OT.white);
    });
    this.at(6, 12, 'Subtotal', OT.cyan);
    this.at(36, 12, String(score.sub), OT.cyan);
    const who = prof.label.charAt(0).toUpperCase() + prof.label.slice(1);
    this.at(6, 14, who + '   x' + score.mult, OT.bwhite);
    this.at(6, 16, 'TOTAL SCORE', OT.byellow);
    this.at(36, 16, String(score.total), OT.byellow);
    this.at(6, 19, 'Press RETURN for the Oregon Top Ten', OT.bgreen);
    this.at(6, 21, 'R starts again', OT.gray);
    this.phase = 'score';
    this.done();
  }

  gameOver() {
    this.clearTimer();
    this.cls();
    this.center(4, 'All of the party are dead.', OT.bred);
    this.center(6, 'The wagon is left on the trail.', OT.white);
    this.center(8, this.dateStr(), OT.gray);
    this.center(9, this.totalMiles + ' miles from Independence', OT.gray);
    this.center(12, 'There is no score.', OT.white);
    this.center(16, 'Press RETURN to try again', OT.byellow);
    this.center(17, 'R starts again', OT.gray);
    this.footer('Ctrl-S toggles sound');
    this.phase = 'over';
    this.done();
    this.beep(60, 0.5, 'sawtooth');
  }

  showYouDied(event, next) {
    this.cls();
    this.center(2, this.youLine(event.cause), OT.bred);
    this.drawStone(event.name, event.say, String(this.year));
    if (this.livingCount()) this.center(20, 'The rest of the party presses on.', OT.white);
    else this.center(20, 'No one is left to press on.', OT.white);
    this.at(4, 22, 'Press RETURN', OT.byellow);
    this.phase = 'pause';
    this.onPause = next;
    this.done();
  }

  showTomb(event, next) {
    this.cls();
    this.drawStone(event.name, event.cause, event.when || String(this.year));
    if (event.phrase) {
      let y = 18;
      this.wrap(event.phrase, 70).forEach(line => {
        this.center(y++, line, OT.white);
      });
    }
    this.at(4, 22, 'Press RETURN', OT.byellow);
    this.phase = 'pause';
    this.onPause = next;
    this.done();
  }

  drawStone(name, cause, when) {
    const inner = 18;
    const fit = value => {
      const s = String(value || '').slice(0, inner - 2);
      const pad = inner - 2 - s.length;
      const left = Math.floor(pad / 2);
      return ' '.repeat(left) + s + ' '.repeat(pad - left);
    };
    const bar = '+' + '-'.repeat(inner) + '+';
    const row = text => '|' + fit(text) + '|';
    const lines = [bar, row('R.I.P.'), row(''), row(name), row(cause), row(when), bar];
    const x = Math.floor((80 - (inner + 2)) / 2);
    lines.forEach((line, index) => this.at(x, 6 + index, line, OT.bwhite));
  }
}

// Score screen accepts R as well as the menu keys. Handled here so the
// class onKey stays a single switch.
const _baseOnKey = OregonGame.prototype.onKey;
OregonGame.prototype.onKey = function (event) {
  if (this.phase === 'score' && (event.key === 'r' || event.key === 'R')) {
    event.preventDefault();
    this.showProfession(true);
    return;
  }
  if (this.phase === 'score' && (event.key === 'Enter' || event.key === ' ')) {
    event.preventDefault();
    this.showTopTen(true);
    return;
  }
  _baseOnKey.call(this, event);
};

if (typeof useEffect === 'function') {
  useEffect(() => {
    const container = document.getElementById('game');
    if (!container || typeof Glass === 'undefined') return undefined;
    const term = new Glass({
      cols: 80,
      rows: 24,
      title: '🐂 The Oregon Trail',
      fg: '#39ff14',
      bg: '#000000',
      border: '#39ff14',
      footer: false
    });
    container.appendChild(term.wrap);
    term.focus();
    const game = new OregonGame(term);
    return () => {
      game.destroy();
      term.destroy();
    };
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { OregonGame, tally, formatMoney, PROFESSIONS };
}
