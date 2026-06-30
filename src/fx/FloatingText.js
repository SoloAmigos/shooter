import * as THREE from 'three';
import { Settings } from '../config/Settings.js';

// Pooled DOM labels (damage / +coins / gate results) projected from world
// space to screen space. Cheap and crisp; capped to avoid DOM thrash.
export class FloatingText {
  constructor(container, camera) {
    this.camera = camera;
    this.max = Settings.fx.maxFloatingText;
    this.layer = document.createElement('div');
    this.layer.className = 'fx-layer';
    container.appendChild(this.layer);

    this._v = new THREE.Vector3();
    this.items = [];
    for (let i = 0; i < this.max; i++) {
      const el = document.createElement('div');
      el.className = 'float-text';
      el.style.display = 'none';
      this.layer.appendChild(el);
      this.items.push({ el, alive: false, x: 0, y: 0, z: 0, vy: 0, life: 0, maxLife: 1 });
    }
    this._cursor = 0;
  }

  spawn(x, y, z, text, { color = '#fff', size = 18, life = 0.9, vy = 1.4 } = {}) {
    const it = this.items[this._cursor];
    this._cursor = (this._cursor + 1) % this.max;
    it.alive = true;
    it.x = x; it.y = y; it.z = z;
    it.vy = vy;
    it.life = 0;
    it.maxLife = life;
    it.el.textContent = text;
    it.el.style.color = color;
    it.el.style.fontSize = `${size}px`;
    it.el.style.display = 'block';
  }

  update(dt) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    for (const it of this.items) {
      if (!it.alive) continue;
      it.life += dt;
      if (it.life >= it.maxLife) {
        it.alive = false;
        it.el.style.display = 'none';
        continue;
      }
      it.y += it.vy * dt;
      this._v.set(it.x, it.y, it.z).project(this.camera);
      if (this._v.z > 1) {
        it.el.style.display = 'none';
        continue;
      }
      const sx = (this._v.x * 0.5 + 0.5) * w;
      const sy = (-this._v.y * 0.5 + 0.5) * h;
      const t = it.life / it.maxLife;
      it.el.style.display = 'block';
      it.el.style.transform = `translate(-50%,-50%) translate(${sx}px, ${sy}px) scale(${1.2 - t * 0.3})`;
      it.el.style.opacity = `${1 - t * t}`;
    }
  }
}
