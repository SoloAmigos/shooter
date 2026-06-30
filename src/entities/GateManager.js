import * as THREE from 'three';
import { Settings } from '../config/Settings.js';
import { makeTextSprite } from '../world/Labels.js';

const KIND_COLOR = {
  'count+': 0x35d07f,
  'countx': 0x35a0ff,
  weapon: 0xff9b3d,
  buff: 0xb06bff,
};

function optionColor(opt) {
  if (opt.kind === 'count') return KIND_COLOR[`count${opt.op}`];
  return KIND_COLOR[opt.kind] ?? 0xffffff;
}

// Renders fork gates and resolves which option the squad ran through.
export class GateManager {
  constructor(scene) {
    this.scene = scene;
    this.gates = [];
  }

  reset() {
    for (const g of this.gates) this.scene.remove(g.group);
    this.gates.length = 0;
  }

  spawnPair(ev) {
    const W = Settings.bridge.width;
    const group = new THREE.Group();
    group.position.z = ev.z;

    const panels = [];
    const sides = [-1, 1];
    for (let i = 0; i < 2; i++) {
      const opt = ev.options[i];
      const color = optionColor(opt);
      const panel = new THREE.Mesh(
        new THREE.BoxGeometry(W / 2 - 0.1, 2.6, 0.25),
        new THREE.MeshStandardMaterial({
          color,
          emissive: color,
          emissiveIntensity: 0.45,
          transparent: true,
          opacity: 0.35,
          roughness: 0.4,
        })
      );
      panel.position.set((sides[i] * W) / 4, 1.3, 0);
      group.add(panel);

      const label = makeTextSprite(opt.label, { color: '#ffffff' });
      label.position.set((sides[i] * W) / 4, 3.0, 0);
      group.add(label);
      panels.push(panel);
    }

    this.scene.add(group);
    this.gates.push({ z: ev.z, options: ev.options, group, panels, triggered: false });
  }

  update(dt, squad, apply) {
    for (const g of this.gates) {
      if (g.triggered) continue;
      // Gentle pulse.
      const pulse = 0.45 + Math.sin(performance.now() * 0.005) * 0.15;
      for (const p of g.panels) p.material.emissiveIntensity = pulse;

      if (squad.z >= g.z) {
        const side = squad.x < 0 ? 0 : 1;
        apply(g.options[side], { x: squad.x, z: g.z });
        g.triggered = true;
        this.scene.remove(g.group);
      }
    }
    // Drop triggered gates from the list.
    if (this.gates.some((g) => g.triggered)) {
      this.gates = this.gates.filter((g) => !g.triggered);
    }
  }
}
