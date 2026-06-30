// Central tunable constants for the whole game.
// Keep gameplay-feel numbers here so balancing lives in one place.

export const Settings = {
  // ---- Rendering / world ----
  bridge: {
    width: 17,        // playable left-right span (wider = less cramped)
    margin: 1.0,      // keep squad away from the very edge
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
    baseUnits: 8,         // starting count before meta upgrades
    runSpeed: 9.0,        // forward units/sec
    steerSpeed: 22.0,     // left-right responsiveness (keyboard)
    dragSensitivity: 2.6, // screen-drag -> world steering factor
    spacing: 0.6,         // gap between soldiers in formation
    maxRenderUnits: 360,  // hard cap on instanced soldier meshes
    formationColumns: 9,  // soldiers per row in the blob
  },

  // ---- Combat ----
  combat: {
    bulletMaxAlive: 1600,
    bulletLifetime: 1.5,
    enemyMaxRender: 460,
    // Firepower scaling: beyond a weapon's stream cap, every extra soldier
    // adds this fraction to bullet damage so a bigger army always hits harder.
    overflowDamagePerUnit: 0.04,
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
