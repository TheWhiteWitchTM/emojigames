// Chapter 01 — The Beginning
window.WITCH_TALES_CHAPTERS = window.WITCH_TALES_CHAPTERS || {};
window.WITCH_TALES_CHAPTERS[1] = {
  number: 1,
  id: '01-the-beginning',
  title: 'The Beginning',
  nextFolder: '02',
  start: { map: 'cottage', x: 3, y: 2 },
  maxHp: 12,
  maxSpark: 3,
  opening: [
    'You wake up with a problem and very little else.',
    'The kettle is cold. The wards on the door have gone quiet.'
  ],
  maps: {
    cottage: [
      '################',
      '#..............#',
      '#.*............#',
      '#..............#',
      '#......t.......#',
      '#..............#',
      '#..............#',
      '#..............#',
      '#......+.......#'
    ],
    yard: [
      'TTTTTTTTTTTTTTTTTTTTTTTTTT',
      'TTTT..################TTTT',
      'TTT...################.TTT',
      'TT....################..TT',
      ',,....################..,,',
      ',,....################..,,',
      ',,....################..,,',
      ',,....################..,,',
      ',,....#######++#######..,,',
      ',,...........==.........,,',
      ',,...........==.........,,',
      ',,....W......==....H....,,',
      ',,...........==.........,,',
      ',,,,,,,,,,,,,==,,,,,,,,,,,',
      ',,...........==.........,,',
      ',,...........==.........,,',
      'TTTT.........==.......TTTT',
      'TTTT.........++.......TTTT',
      'TTTTTTTTTTTTTTTTTTTTTTTTTT'
    ],
    woods: [
      'TTTT.........++.......TTTT',
      'TTTT.........==.......TTTT',
      'TTT..........==........TTT',
      'TT...........==.........TT',
      'T............==..........T',
      ',............==...........',
      ',............==...........',
      ',............==...........',
      ',,,,,,,,,,,,,==,,,,,,,,,,,',
      'T............==..........T',
      'TTTT.........==.......TTTT',
      'TTTT.........GG.......TTTT',
      'TTTT.........XX.......TTTT',
      'TTTTTTTTTTTTTTTTTTTTTTTTTT'
    ]
  },
  npcs: [
    {
      id: 'crow',
      map: 'cottage',
      x: 14,
      y: 6,
      ch: 'Y',
      name: 'the crow',
      flag: 'met_the_crow',
      look: 'A crow. It has opinions. It is not shy about them.',
      talk: [
        'You took your time. Something walked the lane last night that does not belong.',
        'It took the iron key off the nail by the door. It went into the trees south of the yard.',
        'I would not leave it there.'
      ],
      talkAgain: 'Still here. The trees have not gotten friendlier.'
    },
    {
      id: 'mera',
      map: 'yard',
      x: 21,
      y: 14,
      ch: 'f',
      name: 'Mera',
      flag: 'met_mera',
      look: 'Mera from the next cottage. She came as far as the fence and no farther.',
      talk: [
        'I heard it. I did not go looking.',
        'If you are going into those trees, get the key back. I like this lane ordinary.'
      ],
      talkAgain: 'The far gate still wants iron. You know the lock.'
    }
  ],
  enemies: [
    {
      id: 'shade',
      map: 'woods',
      x: 13,
      y: 6,
      ch: 's',
      name: 'a shade that should not be there',
      flag: 'shade_dead',
      hp: 11,
      atkMin: 1,
      atkMax: 3,
      look: 'It stands where a person should not. It has no breath, and it has your key.',
      loot: { id: 'iron-key', name: 'iron key', flag: 'has_the_key' },
      intro: 'It turns as if it had been waiting.',
      win: 'It comes apart like smoke that forgot how. The iron key is on the path.'
    }
  ],
  specials: [
    { map: 'cottage', x: 2, y: 2, look: 'Your own bed. You slept in it. That is the whole review.' },
    { map: 'cottage', x: 7, y: 4, look: 'A cup. The tea went to mud in the night.' },
    { map: 'cottage', x: 6, y: 7, look: 'The iron key hung here. The nail is empty.' },
    { map: 'cottage', x: 14, y: 6, look: 'The east window. The glass is cold. The wards that used to sit in the frame are quiet.' },
    { map: 'yard', x: 6, y: 11, look: 'Black water. The key is not in it. The crow is a gossip, not a map.' },
    { map: 'yard', x: 19, y: 11, look: 'A broom, a hoe, a coil of twine. You already have a better broom.' },
    { map: 'woods', x: 13, y: 11, look: 'The old iron gate. The lock knows one key.' },
    { map: 'woods', x: 14, y: 11, look: 'The old iron gate. The lock knows one key.' }
  ],
  exits: [
    { map: 'cottage', x: 7, y: 8, toMap: 'yard', toX: 13, toY: 9 },
    { map: 'yard', x: 13, y: 8, toMap: 'cottage', toX: 7, toY: 7 },
    { map: 'yard', x: 14, y: 8, toMap: 'cottage', toX: 7, toY: 7 },
    { map: 'yard', x: 13, y: 17, toMap: 'woods', toX: 13, toY: 1 },
    { map: 'yard', x: 14, y: 17, toMap: 'woods', toX: 14, toY: 1 },
    { map: 'woods', x: 13, y: 0, toMap: 'yard', toX: 13, toY: 16 },
    { map: 'woods', x: 14, y: 0, toMap: 'yard', toX: 14, toY: 16 }
  ]
};
