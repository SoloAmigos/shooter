# 🌉 Bridge Brigade

An **honest** take on those "crowd-runner / count-master" mobile ads — the ones
where you spawn in, your squad auto-shoots, you run through `×2` / `+10` gates,
and slam into an enemy crowd. Except here the game *is* the satisfying thing the
ads promise, not a bait-and-switch.

Built with **Three.js**, no build step, fully modular.

![genre: crowd runner](https://img.shields.io/badge/genre-crowd--runner-35a0ff) ![engine: three.js](https://img.shields.io/badge/engine-three.js-000)

## ▶️ Play it

It uses ES modules + an import map, so it must be served over HTTP (opening
`index.html` directly via `file://` won't work).

```bash
# any static server works — pick one:
npx serve .            # then open the printed URL
# or
python3 -m http.server 5173    # then open http://localhost:5173
```

## 🎮 How to play

- **Steer** with drag / mouse, `A`–`D`, or `◀ ▶`. Everything else is automatic.
- Run your squad through **gates** — pick the better side (`×3` beats `+5` once
  you're big). Some gates hand you a **new weapon** or a **damage buff**.
- Shoot down **weapon crates** to claim upgrades.
- **Mow the enemy crowd** before it reaches you — every enemy that touches the
  squad eats a soldier.
- Survive to the **finish line**. Every few levels a **boss** blocks the way.
- Spend **coins** between runs in the **Upgrades** shop. Permanent boosts to
  starting squad size, damage, fire rate, coin gain, and starting weapon.

Levels are **procedurally generated and scale forever** — there's always a
next one, and it's always a little harder.

## 🧱 Project structure

```
index.html            # shell + import map (Three.js from CDN)
styles.css            # all UI / HUD styling
src/
  main.js             # bootstrap
  core/
    Game.js           # orchestrator + run state machine + frame loop
    SceneManager.js   # renderer, scene, lights, follow camera
    Input.js          # keyboard + pointer/touch steering
    Audio.js          # synthesized WebAudio SFX (no asset files)
    Events.js         # tiny event emitter
  config/
    Settings.js       # all gameplay tunables in one place
    Weapons.js        # weapon table (pistol → rockets)
    Enemies.js        # enemy archetypes + boss
  world/
    Environment.js    # ocean, sky dome, the bridge
    LevelGenerator.js # deterministic, infinitely-scaling level layouts
    Models.js         # merged low-poly soldier / enemy geometry
    Labels.js         # canvas-texture text sprites (gate/crate labels)
  entities/
    Squad.js          # the player's growing instanced army
    BulletPool.js     # pooled, instanced bullets
    EnemyManager.js   # pooled, instanced enemies
    GateManager.js    # fork gates + which side you ran through
    CrateManager.js   # breakable weapon crates
    Boss.js           # the end-of-level heavy
  systems/
    CombatSystem.js   # firing + all bullet collisions (enemy/crate/boss/AOE)
  fx/
    Particles.js      # instanced particle bursts
    FloatingText.js   # projected damage / coin popups
    CameraShake.js    # trauma-based screen shake
  state/
    Progression.js    # coins, meta-upgrades, localStorage save
  ui/
    HUD.js            # in-run heads-up display
    Screens.js        # menu / shop / win / lose
```

## ⚙️ Tuning & balancing

Almost everything that affects *feel* lives in `src/config/`:

- **`Settings.js`** — run speed, squad spacing, camera, level lengths, caps.
- **`Weapons.js`** — damage, fire rate, spread, pierce, AOE per weapon.
- **`Enemies.js`** — HP, speed, contact damage, coin value per archetype.

Difficulty scaling per level lives in `world/LevelGenerator.js`.

## 🗺️ Roadmap ideas

- Endless mode with a dedicated leaderboard
- More weapons + elemental effects
- Enemy variety (ranged, splitters, healers)
- A proper run-clear meta currency / prestige
- Mobile install (PWA) and haptics

## Tech notes

Performance comes from **GPU instancing** — soldiers, enemies, bullets and
particles are each a single `InstancedMesh`, so hundreds of units cost a
handful of draw calls. No external art assets; all geometry and audio are
generated at runtime.
