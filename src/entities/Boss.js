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
    this.lineZ = 0;       // arena line the squad is held at
    this.contactDamage = BOSS.contactDamage;
    this.contactTimer = 0;
    this._t = 0;
    this._lunge = 0;
  }

  spawn(z, level = 1) {
    this.active = true;
    // HP and bite both scale with depth so late bosses stay threatening.
    this.maxHp = Math.round(BOSS.hp * (1 + (level - 1) * 0.55));
    this.hp = this.maxHp;
    this.contactDamage = Math.round(BOSS.contactDamage * (1 + (level - 1) * 0.25));
    this.x = 0;
    this.z = z;
    this.lineZ = z - 7;   // squad fights from here
    this.contactTimer = 1.0;
    this._lunge = 0;
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

  // Returns units to remove from squad this frame (0 if not attacking).
  update(dt, squad) {
    if (!this.active) return 0;
    this._t += dt;
    const frontZ = squad.z + 0.3;

    // Track the squad's X, and close the gap in Z until at melee range.
    const dx = squad.x - this.x;
    this.x += Math.sign(dx) * Math.min(Math.abs(dx), BOSS.speed * 1.6 * dt);
    const reach = frontZ + 2.2;
    if (this.z > reach) this.z -= BOSS.speed * dt;

    const inRange = this.z <= reach + 0.2 && Math.abs(this.x - squad.x) < squad.half + 2.0;

    // Telegraphed lunge: wind up, then strike on the beat.
    let bite = 0;
    this.contactTimer -= dt;
    if (this._lunge > 0) this._lunge = Math.max(0, this._lunge - dt * 3);
    if (inRange && this.contactTimer <= 0) {
      bite = this.contactDamage;
      this.contactTimer = 0.85;   // attack cadence
      this._lunge = 1;            // pop the lunge animation
    }

    // Animation: idle sway + a forward stomp on the lunge.
    this.group.position.set(this.x, 0, this.z + this._lunge * -1.2);
    this.group.rotation.y = Math.sin(this._t * 2) * 0.18;
    const sc = BOSS.scale * 0.5 * (1 + this._lunge * 0.12);
    this.group.scale.setScalar(sc);
    this.body.position.y = 1.4 + Math.sin(this._t * 4) * 0.08;
    this.body.material.emissiveIntensity = this._lunge * 0.6;
    this.body.material.emissive.setHex(0xff3030);

    return bite;
  }
}
