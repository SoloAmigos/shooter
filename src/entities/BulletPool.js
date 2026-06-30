import * as THREE from 'three';
import { Settings } from '../config/Settings.js';

// GPU-instanced, pooled bullets. All bullets travel forward (+Z) with a
// small per-bullet lateral velocity for spread.
export class BulletPool {
  constructor(scene) {
    this.max = Settings.combat.bulletMaxAlive;
    const geo = new THREE.BoxGeometry(1, 1, 1);
    // Per-instance color comes from setColorAt -> instanceColor; the material
    // must NOT use vertexColors (no per-vertex color attribute exists).
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.mesh = new THREE.InstancedMesh(geo, mat, this.max);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.frustumCulled = false;
    scene.add(this.mesh);

    this.b = new Array(this.max).fill(null).map(() => ({
      alive: false,
      x: 0, y: 0, z: 0,
      vx: 0, vz: 0,
      life: 0,
      damage: 0,
      pierce: 0,
      aoe: 0,
      sx: 0.12, sy: 0.12, sz: 0.6,
    }));
    this._cursor = 0;
    this._m = new THREE.Matrix4();
    this._q = new THREE.Quaternion();
    this._pos = new THREE.Vector3();
    this._scl = new THREE.Vector3();
    this._color = new THREE.Color();

    for (let i = 0; i < this.max; i++) {
      this._m.makeScale(0.0001, 0.0001, 0.0001);
      this.mesh.setMatrixAt(i, this._m);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  spawn(x, y, z, vx, vz, damage, weapon) {
    const idx = this._cursor;
    this._cursor = (this._cursor + 1) % this.max;
    const b = this.b[idx];
    b.alive = true;
    b.x = x; b.y = y; b.z = z;
    b.vx = vx; b.vz = vz;
    b.life = 0;
    b.damage = damage;
    b.pierce = weapon.pierce || 0;
    b.aoe = weapon.aoe || 0;
    b.sx = weapon.bulletScale[0];
    b.sy = weapon.bulletScale[1];
    b.sz = weapon.bulletScale[2];
    this._color.set(weapon.color);
    this.mesh.setColorAt(idx, this._color);
    this.mesh.instanceColor.needsUpdate = true;
    return b;
  }

  kill(b) {
    b.alive = false;
  }

  update(dt) {
    const life = Settings.combat.bulletLifetime;
    for (let i = 0; i < this.max; i++) {
      const b = this.b[i];
      if (!b.alive) continue;
      b.life += dt;
      b.x += b.vx * dt;
      b.z += b.vz * dt;
      if (b.life >= life) {
        b.alive = false;
        this._m.makeScale(0.0001, 0.0001, 0.0001);
        this.mesh.setMatrixAt(i, this._m);
        continue;
      }
      this._pos.set(b.x, b.y, b.z);
      this._scl.set(b.sx, b.sy, b.sz);
      this._m.compose(this._pos, this._q, this._scl);
      this.mesh.setMatrixAt(i, this._m);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  // Visit live bullets for collision tests.
  forEach(cb) {
    for (let i = 0; i < this.max; i++) {
      const b = this.b[i];
      if (b.alive) cb(b, i);
    }
  }

  hideAt(i) {
    this._m.makeScale(0.0001, 0.0001, 0.0001);
    this.mesh.setMatrixAt(i, this._m);
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}
