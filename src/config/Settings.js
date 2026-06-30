// Central tunable constants for the whole game.
// Keep gameplay-feel numbers here so balancing lives in one place.

export const Settings = {
  // ---- Rendering / world ----
  bridge: {
    width: 11,        // playable left-right span
    margin: 1.2,      // keep squad away from the very edge
    segmentLength: 24,// length of one repeating bridge tile
    railHeight: 0.6,
  },

  camera: {
    distance: 12,     // how far behind the squad
    height: 8,        // how high above
    lookAhead: 9,     // how far in front the camera aims
    fov: 55,
    follow: 0.12,     // lerp factor for smooth follow
  },

  // ---- Player squad ----
  squad: {
    baseUnits: 6,         // starting count before meta upgrades
    runSpeed: 9.0,        // forward units/sec
    steerSpeed: 16.0,     // left-right responsiveness
    spacing: 0.62,        // gap between soldiers in formation
    maxRenderUnits: 320,  // hard cap on instanced soldier meshes
    contactDamageCooldown: 0.18, // how often a touching enemy bites
    formationColumns: 7,  // soldiers per row in the blob
  },

  // ---- Combat ----
  combat: {
    bulletMaxAlive: 700,
    bulletLifetime: 1.6,
    enemyMaxRender: 360,
    aimRange: 60,         // how far ahead bullets are relevant
  },

  // ---- Progression / economy ----
  economy: {
    coinPerKillBase: 1,
    levelClearBonus: 25,
    coinMagnetSpeed: 22,
  },

  // ---- Level generation ----
  level: {
    baseLength: 150,      // world-Z length of level 1
    lengthPerLevel: 14,   // grows each level
    maxLength: 520,
    firstBossLevel: 3,    // bosses start appearing here
    bossEvery: 3,         // and then every N levels
  },

  // ---- Misc ----
  fx: {
    maxFloatingText: 40,
    maxParticles: 600,
  },

  storageKey: 'bridge-brigade-save-v1',
};
