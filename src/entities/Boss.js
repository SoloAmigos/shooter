import * as THREE from 'three';
import { BOSS } from '../config/Enemies.js';

// A single heavy boss unit with its own mesh. Lumbers toward the squad and
// chunks it hard on contact, so the player must burn it down first.
export class Boss {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.visible = false;
    scene.add(this.group);

    const bodyMat = new THREE.MeshStandardMaterial({ color: BOSS.color, roughness: 0.5, metalness: 0.2 });
    const body = new THREE.Mesh(new THREE.IcosahedronGeometry(1.0, 1), bodyMat);
    body.scale.set(1, 1.3, 1);
    body.position.y = 1.4;
    body.castShadow = true;
    this.group.add(body);
    this.body = body;

    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffd23f });
    for (const sx of [-0.35, 0.35]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), eyeMat);
      eye.position.set(sx, 1.7, 0.85);
      this.group.add(eye);
    }

    this.active = false;
    this.hp = 0;
    this.maxHp = 0;
    this.x = 0;
    this.z = 0;
    this.contactTimer = 0;
    this._t = 0;
  }

  spawn(z, hpMul) {
    this.active = true;
    this.maxHp = Math.round(BOSS.hp * hpMul);
    this.hp = this.maxHp;
    this.x = 0;
    this.z = z;
    this.contactTimer = 0;
    this.group.visible = true;
    this.group.scale.setScalar(BOSS.scale * 0.5);
  }

  despawn() {
    this.active = false;
    this.group.visible = false;
  }

  damage(dmg) {
    if (!this.active) return false;
    this.hp -= dmg;
    return this.hp <= 0;
  }

  // Returns units to remove from squad this frame (0 if not in contact).
  update(dt, squad) {
    if (!this.active) return 0;
    this._t += dt;
    const frontZ = squad.z + 0.3;
    const dx = squad.x - this.x;
    const dz = frontZ - this.z;
    const d = Math.hypot(dx, dz) || 1;
    this.x += (dx / d) * BOSS.speed * dt;
    this.z += (dz / d) * BOSS.speed * dt;

    this.group.position.set(this.x, 0, this.z);
    this.group.rotation.y = Math.sin(this._t * 2) * 0.2;
    this.body.position.y = 1.4 + Math.sin(this._t * 4) * 0.08;

    let bite = 0;
    this.contactTimer -= dt;
    if (this.z <= frontZ + 1.0 && Math.abs(this.x - squad.x) < squad.half + 1.2) {
      if (this.contactTimer <= 0) {
        bite = BOSS.contactDamage;
        this.contactTimer = 0.4;
      }
    }
    return bite;
  }
}
