import * as THREE from 'three';
import { Settings } from '../config/Settings.js';
import { clamp, damp } from '../util/math.js';
import { buildSoldierGeometry } from '../world/Models.js';
import { WEAPON_BY_ID } from '../config/Weapons.js';

// The player's growing squad of soldiers. Auto-runs forward, can be steered
// left/right, and grows/shrinks through gates and combat.
export class Squad {
  constructor(scene) {
    this.scene = scene;
    this.count = Settings.squad.baseUnits;
    this.x = 0;
    this.z = 0;
    this.weapon = WEAPON_BY_ID.pistol;
    this.damageMul = 1;
    this.fireMul = 1;
    this.critChance = 0;
    this.bonusStreams = 0;
    this.fireTimer = 0;
    this._time = 0;

    this.maxRender = Settings.squad.maxRenderUnits;
    const geo = buildSoldierGeometry();
    const mat = new THREE.MeshStandardMaterial({ roughness: 0.6, metalness: 0.1 });
    this.mesh = new THREE.InstancedMesh(geo, mat, this.maxRender);
    this.mesh.castShadow = true;
    this.mesh.frustumCulled = false;
    scene.add(this.mesh);

    this._m = new THREE.Matrix4();
    this._q = new THREE.Quaternion();
    this._pos = new THREE.Vector3();
    this._scl = new THREE.Vector3(1, 1, 1);
    this._color = new THREE.Color();
    this.positions = []; // populated each frame, front-to-back order
    this._colorsDirty = true;
  }

  reset(startCount, weaponId, stats = {}) {
    this.count = Math.max(1, Math.round(startCount));
    this.x = 0;
    this.z = 0;
    this.weapon = WEAPON_BY_ID[weaponId] ?? WEAPON_BY_ID.pistol;
    this.damageMul = stats.damageMul ?? 1;
    this.fireMul = stats.fireMul ?? 1;
    this.critChance = stats.critChance ?? 0;
    this.bonusStreams = stats.bonusStreams ?? 0;
    this.fireTimer = 0;
    this._colorsDirty = true;
  }

  get half() {
    return (Settings.squad.formationColumns / 2) * Settings.squad.spacing + 0.3;
  }

  get alive() {
    return this.count > 0;
  }

  addUnits(n) {
    this.count = clamp(this.count + n, 0, 99999);
    this._colorsDirty = true;
  }

  multiplyUnits(m) {
    this.count = clamp(Math.round(this.count * m), 0, 99999);
    this._colorsDirty = true;
  }

  removeUnits(n) {
    this.count = Math.max(0, this.count - n);
  }

  trySetWeapon(weapon) {
    // Upgrade-only: never hand the player something weaker.
    if (weapon.tier > this.weapon.tier) {
      this.weapon = weapon;
      return true;
    }
    return false;
  }

  update(dt, steerX) {
    this._time += dt;
    const s = Settings.squad;

    // Forward auto-run.
    this.z += s.runSpeed * dt;

    // Steering: steerX is a desired delta in world units this frame.
    // Clamp by the formation's half-width too, so no soldier spills off the
    // bridge — the whole blob stays zoned inside the rails.
    const limit = Settings.bridge.width / 2 - Settings.bridge.margin - this.half;
    this.x = clamp(this.x + steerX, -limit, limit);

    this._rebuildInstances();
  }

  _rebuildInstances() {
    const cols = Settings.squad.formationColumns;
    const sp = Settings.squad.spacing;
    const render = Math.min(this.count, this.maxRender);
    this.positions.length = 0;

    for (let i = 0; i < render; i++) {
      const col = i % cols;
      const row = (i / cols) | 0;
      const xo = (col - (cols - 1) / 2) * sp;
      const zo = -row * sp;
      // Running bob + slight per-unit phase.
      const bob = Math.sin(this._time * 14 + i * 0.7) * 0.05;
      const x = this.x + xo;
      const y = 0.02 + Math.abs(bob);
      const z = this.z + zo;
      this.positions.push({ x, y: y + 0.0, z });

      this._pos.set(x, y, z);
      this._q.identity();
      this._m.compose(this._pos, this._q, this._scl);
      this.mesh.setMatrixAt(i, this._m);

      if (this._colorsDirty) {
        // Front rows a touch brighter for readability.
        const t = row === 0 ? 1 : 0.78;
        this._color.setRGB(0.2 * t, 0.5 * t, 1.0 * t);
        this.mesh.setColorAt(i, this._color);
      }
    }
    this.mesh.count = render;
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this._colorsDirty && this.mesh.instanceColor) {
      this.mesh.instanceColor.needsUpdate = true;
      this._colorsDirty = false;
    }
  }

  // Front-most muzzle points for firing, up to `n` streams.
  getMuzzles(n) {
    const out = [];
    const limit = Math.min(n, this.positions.length);
    for (let i = 0; i < limit; i++) {
      const p = this.positions[i];
      out.push({ x: p.x + 0.16, y: 0.6, z: p.z + 0.4 });
    }
    return out;
  }
}
