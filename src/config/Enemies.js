// Enemy archetypes. HP/coins are baseline values scaled by level.

export const ENEMIES = {
  runner: {
    id: 'runner',
    name: 'Runner',
    hp: 10,
    speed: 4.2,
    coins: 1,
    contactDamage: 1,   // units removed from squad on contact
    color: 0xff5d5d,
    scale: 1.0,
  },
  fast: {
    id: 'fast',
    name: 'Sprinter',
    hp: 7,
    speed: 7.5,
    coins: 2,
    contactDamage: 1,
    color: 0xff9b3d,
    scale: 0.9,
  },
  tank: {
    id: 'tank',
    name: 'Brute',
    hp: 55,
    speed: 2.6,
    coins: 4,
    contactDamage: 3,
    color: 0xb43c3c,
    scale: 1.5,
  },
  shielded: {
    id: 'shielded',
    name: 'Shielded',
    hp: 30,
    speed: 3.4,
    coins: 3,
    contactDamage: 2,
    color: 0x9d6bff,
    scale: 1.15,
  },
};

export const BOSS = {
  id: 'boss',
  name: 'Warlord',
  hp: 1400,
  speed: 1.8,
  coins: 120,
  contactDamage: 30,
  color: 0x7a1f1f,
  scale: 3.4,
};

export const ENEMY_LIST = Object.values(ENEMIES);
