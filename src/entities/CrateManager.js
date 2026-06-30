import * as THREE from 'three';
import { WEAPON_BY_ID } from '../config/Weapons.js';
import { makeTextSprite, setSpriteText } from '../world/Labels.js';

// Breakable weapon crates. Shoot them down to claim a weapon upgrade.
export class CrateManager {
  constructor(scene) {
    this.scene = scene;
    this.crates = [];
  }

  reset() {
    for (const c of this.crates) this.scene.remove(c.group);
    this.crates.length = 0;
  }

  spawn(ev) {
    const weapon = WEAPON_BY_ID[ev.weaponId];
    const group = new THREE.Group();
    group.position.set(ev.x, 0, ev.z);

    const box = new THREE.Mesh(
      new THREE.BoxGeometry(1.3, 1.3, 1.3),
      new THREE.MeshStandardMaterial({ color: 0xf2a33a, roughness: 0.6, metalness: 0.15 })
    );
    box.position.y = 0.75;
    box.castShadow = true;
    group.add(box);

    const nameLabel = makeTextSprite(weapon.name, { color: '#fff' });
    nameLabel.position.set(0, 2.4, 0);
    nameLabel.scale.set(2.4, 1.2, 1);
    group.add(nameLabel);

    const hpLabel = makeTextSprite(`${ev.hp}`, { color: '#fff', bg: 'rgba(0,0,0,0.0)' });
    hpLabel.position.set(0, 0.75, 0.7);
    hpLabel.scale.set(1.4, 0.8, 1);
    group.add(hpLabel);

    this.scene.add(group);
    this.crates.push({
      x: ev.x, z: ev.z, hp: ev.hp, maxHp: ev.hp,
      weaponId: ev.weaponId, group, box, hpLabel, alive: true,
    });
  }

  damage(c, dmg) {
    c.hp -= dmg;
    setSpriteText(c.hpLabel, `${Math.max(0, Math.ceil(c.hp))}`);
    c.box.material.emissive = new THREE.Color(0xffffff);
    c.box.material.emissiveIntensity = 0.4;
    if (c.hp <= 0) {
      c.alive = false;
      return true;
    }
    return false;
  }

  update(dt, squadZ) {
    const keep = [];
    for (const c of this.crates) {
      const passed = c.z < squadZ - 12;
      if (!c.alive || passed) {
        this.scene.remove(c.group);
        continue;
      }
      // Fade the hit flash.
      if (c.box.material.emissiveIntensity > 0) {
        c.box.material.emissiveIntensity = Math.max(0, c.box.material.emissiveIntensity - dt * 3);
      }
      c.box.rotation.y += dt * 0.6;
      keep.push(c);
    }
    this.crates = keep;
  }

  forEach(cb) {
    for (const c of this.crates) if (c.alive) cb(c);
  }
}
