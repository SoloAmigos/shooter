import { Storage } from '../util/Storage.js';
import { Settings } from '../config/Settings.js';
import { WEAPONS } from '../config/Weapons.js';

// Persistent meta-progression: coins earned across runs and the permanent
// upgrades they buy. This is the "play for hours" layer.
export const UPGRADES = {
  startUnits: {
    name: 'Recruits',
    desc: 'Start each run with more soldiers.',
    baseCost: 40,
    costMul: 1.45,
    max: 40,
    value: (lvl) => Settings.squad.baseUnits + lvl * 2,
    display: (lvl) => `${Settings.squad.baseUnits + lvl * 2} units`,
  },
  damage: {
    name: 'Firepower',
    desc: 'Increase all weapon damage.',
    baseCost: 55,
    costMul: 1.5,
    max: 50,
    value: (lvl) => 1 + lvl * 0.1,
    display: (lvl) => `+${(lvl * 10)}%`,
  },
  fireRate: {
    name: 'Rate of Fire',
    desc: 'Shoot faster.',
    baseCost: 60,
    costMul: 1.5,
    max: 30,
    value: (lvl) => 1 + lvl * 0.06,
    display: (lvl) => `+${(lvl * 6)}%`,
  },
  coin: {
    name: 'Greed',
    desc: 'Earn more coins from kills.',
    baseCost: 50,
    costMul: 1.4,
    max: 40,
    value: (lvl) => 1 + lvl * 0.12,
    display: (lvl) => `+${(lvl * 12)}%`,
  },
  weaponTier: {
    name: 'Loadout',
    desc: 'Start runs with a better gun.',
    baseCost: 150,
    costMul: 2.4,
    max: WEAPONS.length - 1,
    value: (lvl) => lvl,
    display: (lvl) => WEAPONS[lvl]?.name ?? WEAPONS[0].name,
  },
};

const DEFAULT_SAVE = {
  coins: 0,
  highestLevel: 1,
  levels: { startUnits: 0, damage: 0, fireRate: 0, coin: 0, weaponTier: 0 },
  muted: false,
};

export class Progression {
  constructor() {
    this.data = Storage.load(Settings.storageKey, DEFAULT_SAVE);
    // Guard against older saves missing keys.
    this.data.levels = { ...DEFAULT_SAVE.levels, ...this.data.levels };
  }

  save() {
    Storage.save(Settings.storageKey, this.data);
  }

  get coins() {
    return this.data.coins;
  }

  addCoins(n) {
    this.data.coins += n;
  }

  spend(n) {
    if (this.data.coins < n) return false;
    this.data.coins -= n;
    return true;
  }

  level(id) {
    return this.data.levels[id] ?? 0;
  }

  cost(id) {
    const def = UPGRADES[id];
    const lvl = this.level(id);
    if (lvl >= def.max) return Infinity;
    return Math.round(def.baseCost * Math.pow(def.costMul, lvl));
  }

  isMaxed(id) {
    return this.level(id) >= UPGRADES[id].max;
  }

  buy(id) {
    if (this.isMaxed(id)) return false;
    const c = this.cost(id);
    if (!this.spend(c)) return false;
    this.data.levels[id] += 1;
    this.save();
    return true;
  }

  // Derived run parameters.
  getStartUnits() {
    return UPGRADES.startUnits.value(this.level('startUnits'));
  }
  getDamageMul() {
    return UPGRADES.damage.value(this.level('damage'));
  }
  getFireMul() {
    return UPGRADES.fireRate.value(this.level('fireRate'));
  }
  getCoinMul() {
    return UPGRADES.coin.value(this.level('coin'));
  }
  getStartWeaponId() {
    return WEAPONS[this.level('weaponTier')].id;
  }

  recordLevel(n) {
    if (n > this.data.highestLevel) {
      this.data.highestLevel = n;
      this.save();
    }
  }
}
