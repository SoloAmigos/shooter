import { Settings } from '../config/Settings.js';
import { WEAPONS } from '../config/Weapons.js';
import { makeRng } from '../util/math.js';

// Deterministically builds a level layout from its number. Same level
// number always yields the same layout, but difficulty scales upward
// forever — that's the "infinite levels" backbone.
export function generateLevel(levelNum) {
  const rng = makeRng(levelNum * 2654435761 + 12345);
  const L = Settings.level;

  const length = Math.min(L.maxLength, L.baseLength + (levelNum - 1) * L.lengthPerLevel);
  const events = [];

  const isBoss =
    levelNum >= L.firstBossLevel && (levelNum - L.firstBossLevel) % L.bossEvery === 0;

  const hpMul = 1 + (levelNum - 1) * 0.22;
  const countMul = 1 + (levelNum - 1) * 0.12;

  // Reserve room at the end for the boss / finish.
  const usable = length - (isBoss ? 26 : 12);
  let z = 16;
  const step = () => 14 + rng() * 10;

  // Unlock tougher enemy types as levels progress.
  const pool = ['runner'];
  if (levelNum >= 2) pool.push('fast');
  if (levelNum >= 3) pool.push('shielded');
  if (levelNum >= 4) pool.push('tank');

  let gateBudget = 0;
  while (z < usable) {
    const roll = rng();

    if (roll < 0.42 || gateBudget < 1) {
      // ---- Gate pair: the core decision ----
      events.push({ type: 'gatePair', z, options: makeGatePair(rng, levelNum) });
      gateBudget++;
      z += step();
    } else if (roll < 0.78) {
      // ---- Enemy crowd ----
      const enemyType = pool[(rng() * pool.length) | 0];
      const base = enemyType === 'tank' ? 4 : enemyType === 'shielded' ? 8 : 16;
      const count = Math.round(base * countMul * (0.7 + rng() * 0.8));
      events.push({ type: 'crowd', z, enemyType, count, hpMul, spread: 3 + rng() * 4 });
      z += step() + 4;
    } else {
      // ---- Weapon crate ----
      const tierCap = Math.min(WEAPONS.length - 1, 1 + Math.floor(levelNum / 2));
      const w = WEAPONS[1 + ((rng() * tierCap) | 0)];
      events.push({
        type: 'crate',
        z,
        x: (rng() - 0.5) * (Settings.bridge.width - 3),
        hp: Math.round(40 * hpMul),
        weaponId: w.id,
      });
      z += step();
    }
  }

  if (isBoss) {
    events.push({ type: 'boss', z: length - 16, hpMul });
  }

  events.push({ type: 'finish', z: length });
  events.sort((a, b) => a.z - b.z);

  return { levelNum, length, isBoss, events };
}

// Produce two gate options for a fork. Steer left/right to choose.
function makeGatePair(rng, levelNum) {
  const mkCount = () => {
    if (rng() < 0.55) {
      // multiplicative
      const m = 2 + ((rng() * 3) | 0); // x2..x4
      return { kind: 'count', op: 'x', val: m, label: `x${m}` };
    }
    // additive (scales a little with level)
    const a = 5 + ((rng() * (8 + levelNum)) | 0);
    return { kind: 'count', op: '+', val: a, label: `+${a}` };
  };

  // Occasionally one side is a weapon or a damage buff to spice choices.
  const r = rng();
  let left = mkCount();
  let right = mkCount();

  if (r < 0.18 && levelNum >= 2) {
    const tier = Math.min(WEAPONS.length - 1, 1 + ((rng() * 3) | 0));
    const w = WEAPONS[tier];
    left = { kind: 'weapon', weaponId: w.id, label: w.name };
  } else if (r < 0.3) {
    const pct = 15 + ((rng() * 25) | 0);
    right = { kind: 'buff', stat: 'damage', val: pct / 100, label: `DMG +${pct}%` };
  }

  // Make sure the two options differ.
  if (left.label === right.label) right = mkCount();
  return [left, right];
}
