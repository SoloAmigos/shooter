import * as THREE from 'three';
import { Settings } from '../config/Settings.js';
import { rand } from '../util/math.js';

// Pooled GPU-instanced particle burst system for hits, deaths and explosions.
export class Particles {
  constructor(scene) {
    this.max = Settings.fx.maxParticles;
    const geo = new THREE.BoxGeometry(0.16, 0.16, 0.16);
    // Instance colors via setColorAt — no vertexColors (see BulletPool note).
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.mesh = new THREE.InstancedMesh(geo, mat, this.max);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.frustumCulled = false;
    this.mesh.count = this.max;
    scene.add(this.mesh);

    this._color = new THREE.Color();
    this.p = new Array(this.max).fill(null).map(() => ({
      alive: false,
      x: 0, y: 0, z: 0,
      vx: 0, vy: 0, vz: 0,
      life: 0, maxLife: 1,
      size: 1,
    }));
    this._cursor = 0;
    this._m = new THREE.Matrix4();
    this._q = new THREE.Quaternion();
    this._s = new THREE.Vector3();
    this._pos = new THREE.Vector3();
    this._hidden = new THREE.Vector3(0, -9999, 0);

    // Park everything off-screen initially.
    for (let i = 0; i < this.max; i++) {
      this._m.makeScale(0.0001, 0.0001, 0.0001);
      this.mesh.setMatrixAt(i, this._m);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  burst(x, y, z, color, count = 8, speed = 6, size = 1) {
    this._color.set(color);
    for (let i = 0; i < count; i++) {
      const idx = this._cursor;
      this._cursor = (this._cursor + 1) % this.max;
      const p = this.p[idx];
      p.alive = true;
      p.x = x; p.y = y; p.z = z;
      const dir = Math.random() * Math.PI * 2;
      p.vx = Math.cos(dir) * rand(1, speed);
      p.vz = Math.sin(dir) * rand(1, speed);
      p.vy = rand(2, speed);
      p.life = 0;
      p.maxLife = rand(0.3, 0.6);
      p.size = size;
      this.mesh.setColorAt(idx, this._color);
    }
  }

  update(dt) {
    for (let i = 0; i < this.max; i++) {
      const p = this.p[i];
      if (!p.alive) {
        continue;
      }
      p.life += dt;
      if (p.life >= p.maxLife) {
        p.alive = false;
        this._m.makeScale(0.0001, 0.0001, 0.0001);
        this.mesh.setMatrixAt(i, this._m);
        continue;
      }
      p.vy -= 16 * dt; // gravity
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      if (p.y < 0.05) {
        p.y = 0.05;
        p.vy *= -0.4;
      }
      const k = (1 - p.life / p.maxLife) * p.size;
      this._pos.set(p.x, p.y, p.z);
      this._q.identity();
      this._s.set(k, k, k);
      this._m.compose(this._pos, this._q, this._s);
      this.mesh.setMatrixAt(i, this._m);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }
}
