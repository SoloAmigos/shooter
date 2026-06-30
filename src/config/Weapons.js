// Weapon definitions, ordered by tier (weak -> strong).
// `streams` is how many simultaneous bullet lines the squad can fire;
// a bigger squad fills more streams, so more soldiers => more DPS.

// `streams` is the cap on simultaneous bullet lines; the squad fills up to
// that many from its front rows, and any soldiers beyond it pump bonus
// damage (see CombatSystem). Each tier is a strict DPS upgrade on the last.
export const WEAPONS = [
  {
    id: 'pistol',
    name: 'Pistol',
    tier: 0,
    damage: 6,
    fireRate: 5,        // shots per second
    bulletsPerShot: 1,
    spread: 0.0,
    streams: 14,
    bulletSpeed: 48,
    pierce: 0,
    color: 0xfff27a,
    bulletScale: [0.13, 0.13, 0.75],
  },
  {
    id: 'smg',
    name: 'SMG',
    tier: 1,
    damage: 6,
    fireRate: 13,
    bulletsPerShot: 1,
    spread: 0.035,
    streams: 18,
    bulletSpeed: 56,
    pierce: 0,
    color: 0x9be8ff,
    bulletScale: [0.11, 0.11, 0.65],
  },
  {
    id: 'shotgun',
    name: 'Shotgun',
    tier: 2,
    damage: 12,
    fireRate: 3.2,
    bulletsPerShot: 5,
    spread: 0.16,       // tighter so pellets actually connect
    streams: 20,
    bulletSpeed: 50,
    pierce: 2,
    color: 0xffc06a,
    bulletScale: [0.16, 0.16, 0.55],
  },
  {
    id: 'rifle',
    name: 'Rifle',
    tier: 3,
    damage: 34,
    fireRate: 6.5,
    bulletsPerShot: 1,
    spread: 0.008,
    streams: 26,
    bulletSpeed: 72,
    pierce: 3,
    color: 0x8affc0,
    bulletScale: [0.13, 0.13, 1.1],
  },
  {
    id: 'minigun',
    name: 'Minigun',
    tier: 4,
    damage: 18,
    fireRate: 22,
    bulletsPerShot: 1,
    spread: 0.05,
    streams: 38,
    bulletSpeed: 64,
    pierce: 2,
    color: 0xff8f6a,
    bulletScale: [0.11, 0.11, 0.75],
  },
  {
    id: 'rocket',
    name: 'Rockets',
    tier: 5,
    damage: 220,
    fireRate: 3,
    bulletsPerShot: 1,
    spread: 0.04,
    streams: 22,
    bulletSpeed: 50,
    pierce: 0,
    aoe: 4.0,           // splash radius
    color: 0xff5a5a,
    bulletScale: [0.3, 0.3, 0.8],
  },
];

export const WEAPON_BY_ID = Object.fromEntries(WEAPONS.map((w) => [w.id, w]));

// Return the weapon one tier above `id`, or the same if already max.
export function nextWeapon(id) {
  const cur = WEAPON_BY_ID[id] ?? WEAPONS[0];
  return WEAPONS.find((w) => w.tier === cur.tier + 1) ?? cur;
}
