import { Settings } from '../config/Settings.js';
import { WEAPONS } from '../config/Weapons.js';
import { makeRng } from '../util/math.js';

// Deterministically builds a level layout from its number. Same level
// number always yields the same layout, but difficulty scales upward
// forever — that's the "infinite levels" backbone.
//
// Gate *values* are intentionally NOT decided here: they're computed at
// spawn time from the squad's current size (see GateManager) so an "add"
// option can stay competitive with a "multiply" option no matter how big
// the army is.
export function generateLevel(levelNum) {
  const rng = makeRng(levelNum * 2654435761 + 12345);
  const L = Settings.level;

  const length = Math.min(L.maxLength, L.baseLength + (levelNum - 1) * L.lengthPerLevel);
  const events = [];

  const isBoss =
    levelNum >= L.firstBossLevel && (levelNum - L.firstBossLevel) % L.bossEvery === 0;

  const hpMul = 1 + (levelNum - 1) * 0.3;
  const countMul = 1 + (levelNum - 1) * 0.16;

  const usable = length - (isBoss ? 30 : 14);
  let z = 16;
  const step = () => 11 + rng() * 8;

  // Unlock tougher enemy types as levels progress.
  const pool = ['runner'];
  if (levelNum >= 2) pool.push('fast');
  if (levelNum >= 3) pool.push('shielded');
  if (levelNum >= 4) pool.push('tank');

  const baseCount = { runner: 22, fast: 15, shielded: 11, tank: 6 };
  let gateSeed = levelNum * 7919;
  let gateBudget = 0;

  while (z < usable) {
    const roll = rng();

    if (roll < 0.38 || gateBudget < 1) {
      // ---- Gate fork: the core decision (values resolved at spawn) ----
      events.push({ type: 'gatePair', z, seed: gateSeed++, level: levelNum });
      gateBudget++;
      z += step() + 2;
    } else if (roll < 0.82) {
      // ---- Enemy crowd (now a real threat) ----
      const enemyType = pool[(rng() * pool.length) | 0];
      const count = Math.max(3, Math.round(baseCount[enemyType] * countMul * (0.75 + rng() * 0.7)));
      events.push({ type: 'crowd', z, enemyType, count, hpMul, spread: 4 + rng() * 5 });
      z += step() + 5;
    } else {
      // ---- Weapon crate ----
      const tierCap = Math.min(WEAPONS.length - 1, 1 + Math.floor(levelNum / 2));
      const w = WEAPONS[1 + ((rng() * tierCap) | 0)];
      events.push({
        type: 'crate',
        z,
        x: (rng() - 0.5) * (Settings.bridge.width - 4),
        hp: Math.round(60 * hpMul),
        weaponId: w.id,
      });
      z += step();
    }
  }

  if (isBoss) {
    events.push({ type: 'boss', z: length - 18 });
  }

  events.push({ type: 'finish', z: length });
  events.sort((a, b) => a.z - b.z);

  return { levelNum, length, isBoss, events };
}
