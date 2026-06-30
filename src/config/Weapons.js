// Weapon definitions, ordered by tier (weak -> strong).
// `streams` is how many simultaneous bullet lines the squad can fire;
// a bigger squad fills more streams, so more soldiers => more DPS.

export const WEAPONS = [
  {
    id: 'pistol',
    name: 'Pistol',
    tier: 0,
    damage: 4,
    fireRate: 4.5,      // shots per second
    bulletsPerShot: 1,
    spread: 0.0,
    streams: 6,
    bulletSpeed: 46,
    pierce: 0,
    color: 0xfff27a,
    bulletScale: [0.12, 0.12, 0.7],
  },
  {
    id: 'smg',
    name: 'SMG',
    tier: 1,
    damage: 4,
    fireRate: 11,
    bulletsPerShot: 1,
    spread: 0.04,
    streams: 10,
    bulletSpeed: 52,
    pierce: 0,
    color: 0x9be8ff,
    bulletScale: [0.1, 0.1, 0.6],
  },
  {
    id: 'shotgun',
    name: 'Shotgun',
    tier: 2,
    damage: 6,
    fireRate: 2.6,
    bulletsPerShot: 5,
    spread: 0.32,
    streams: 8,
    bulletSpeed: 44,
    pierce: 1,
    color: 0xffc06a,
    bulletScale: [0.14, 0.14, 0.5],
  },
  {
    id: 'rifle',
    name: 'Rifle',
    tier: 3,
    damage: 14,
    fireRate: 6,
    bulletsPerShot: 1,
    spread: 0.01,
    streams: 14,
    bulletSpeed: 64,
    pierce: 2,
    color: 0x8affc0,
    bulletScale: [0.12, 0.12, 1.0],
  },
  {
    id: 'minigun',
    name: 'Minigun',
    tier: 4,
    damage: 9,
    fireRate: 18,
    bulletsPerShot: 1,
    spread: 0.06,
    streams: 22,
    bulletSpeed: 58,
    pierce: 1,
    color: 0xff8f6a,
    bulletScale: [0.1, 0.1, 0.7],
  },
  {
    id: 'rocket',
    name: 'Rockets',
    tier: 5,
    damage: 40,
    fireRate: 2.2,
    bulletsPerShot: 1,
    spread: 0.05,
    streams: 10,
    bulletSpeed: 40,
    pierce: 0,
    aoe: 3.2,           // splash radius
    color: 0xff5a5a,
    bulletScale: [0.26, 0.26, 0.7],
  },
];

export const WEAPON_BY_ID = Object.fromEntries(WEAPONS.map((w) => [w.id, w]));

// Return the weapon one tier above `id`, or the same if already max.
export function nextWeapon(id) {
  const cur = WEAPON_BY_ID[id] ?? WEAPONS[0];
  return WEAPONS.find((w) => w.tier === cur.tier + 1) ?? cur;
}
