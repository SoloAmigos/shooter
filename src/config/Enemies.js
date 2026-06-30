// Enemy archetypes. HP/coins are baseline values scaled by level.

export const ENEMIES = {
  runner: {
    id: 'runner',
    name: 'Runner',
    hp: 12,
    speed: 5.2,
    coins: 1,
    contactDamage: 2,   // units removed from squad on contact
    color: 0xff5d5d,
    scale: 1.0,
  },
  fast: {
    id: 'fast',
    name: 'Sprinter',
    hp: 9,
    speed: 9.0,
    coins: 2,
    contactDamage: 2,
    color: 0xff9b3d,
    scale: 0.9,
  },
  tank: {
    id: 'tank',
    name: 'Brute',
    hp: 70,
    speed: 3.0,
    coins: 5,
    contactDamage: 8,
    color: 0xb43c3c,
    scale: 1.5,
  },
  shielded: {
    id: 'shielded',
    name: 'Shielded',
    hp: 38,
    speed: 4.0,
    coins: 3,
    contactDamage: 4,
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
