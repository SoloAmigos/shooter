import * as THREE from 'three';
import { Settings } from '../config/Settings.js';
import { ENEMIES } from '../config/Enemies.js';
import { buildEnemyGeometry } from '../world/Models.js';
import { rand } from '../util/math.js';

// Pool + instanced renderer for normal enemies. Enemies advance toward the
// squad; on contact they bite (remove units) and die.
export class EnemyManager {
  constructor(scene) {
    this.max = Settings.combat.enemyMaxRender;
    const geo = buildEnemyGeometry();
    const mat = new THREE.MeshStandardMaterial({ roughness: 0.7, metalness: 0.05 });
    this.mesh = new THREE.InstancedMesh(geo, mat, this.max);
    this.mesh.castShadow = true;
    this.mesh.frustumCulled = false;
    scene.add(this.mesh);

    this.e = new Array(this.max).fill(null).map(() => ({
      alive: false, x: 0, z: 0, hp: 0, maxHp: 0,
      speed: 0, contact: 0, coins: 0, scale: 1, color: 0xffffff,
      flash: 0,
    }));
    this._m = new THREE.Matrix4();
    this._q = new THREE.Quaternion();
    this._pos = new THREE.Vector3();
    this._scl = new THREE.Vector3();
    this._color = new THREE.Color();
    this._tmp = new THREE.Color();
    this.aliveCount = 0;
  }

  reset() {
    for (const e of this.e) e.alive = false;
    this.aliveCount = 0;
    for (let i = 0; i < this.max; i++) {
      this._m.makeScale(0.0001, 0.0001, 0.0001);
      this.mesh.setMatrixAt(i, this._m);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  _free() {
    for (let i = 0; i < this.max; i++) if (!this.e[i].alive) return i;
    return -1;
  }

  spawn(typeId, x, z, hpMul) {
    const i = this._free();
    if (i < 0) return null;
    const cfg = ENEMIES[typeId] ?? ENEMIES.runner;
    const e = this.e[i];
    e.alive = true;
    e.x = x; e.z = z;
    e.maxHp = Math.round(cfg.hp * hpMul);
    e.hp = e.maxHp;
    e.speed = cfg.speed;
    e.contact = cfg.contactDamage;
    e.coins = cfg.coins;
    e.scale = cfg.scale;
    e.color = cfg.color;
    e.flash = 0;
    this._color.set(cfg.color);
    this.mesh.setColorAt(i, this._color);
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
    return e;
  }

  spawnCrowd(ev) {
    const W = Settings.bridge.width - 2.4;
    const rows = Math.ceil(ev.count / 8);
    let spawned = 0;
    for (let r = 0; r < rows && spawned < ev.count; r++) {
      for (let c = 0; c < 8 && spawned < ev.count; c++) {
        const x = (rand(-0.5, 0.5)) * W;
        const z = ev.z + r * 1.0 + rand(0, 0.6);
        if (this.spawn(ev.enemyType, x, z, ev.hpMul)) spawned++;
      }
    }
  }

  // dmg an enemy; returns coins (>0) if it died this hit.
  damage(e, dmg) {
    e.hp -= dmg;
    e.flash = 0.12;
    if (e.hp <= 0) {
      e.alive = false;
      return e.coins;
    }
    return 0;
  }

  // Move toward squad; invoke onContact(e) when they reach it.
  update(dt, squad, onContact) {
    this.aliveCount = 0;
    const frontZ = squad.z + 0.3;
    const half = squad.half;
    for (let i = 0; i < this.max; i++) {
      const e = this.e[i];
      if (!e.alive) {
        this._m.makeScale(0.0001, 0.0001, 0.0001);
        this.mesh.setMatrixAt(i, this._m);
        continue;
      }
      this.aliveCount++;

      // Steer toward the squad.
      const dx = squad.x - e.x;
      const dz = frontZ - e.z;
      const d = Math.hypot(dx, dz) || 1;
      e.x += (dx / d) * e.speed * dt;
      e.z += (dz / d) * e.speed * dt;

      // Contact check.
      if (e.z <= frontZ + 0.4 && Math.abs(e.x - squad.x) < half + 0.4) {
        e.alive = false;
        onContact(e);
        this._m.makeScale(0.0001, 0.0001, 0.0001);
        this.mesh.setMatrixAt(i, this._m);
        continue;
      }

      if (e.flash > 0) e.flash = Math.max(0, e.flash - dt);

      const s = e.scale;
      this._pos.set(e.x, 0.0, e.z);
      this._q.identity();
      this._scl.set(s, s, s);
      this._m.compose(this._pos, this._q, this._scl);
      this.mesh.setMatrixAt(i, this._m);

      // Hit flash toward white.
      this._color.set(e.color);
      if (e.flash > 0) this._color.lerp(this._tmp.set(0xffffff), e.flash / 0.12);
      this.mesh.setColorAt(i, this._color);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }

  forEach(cb) {
    for (let i = 0; i < this.max; i++) if (this.e[i].alive) cb(this.e[i]);
  }
}
