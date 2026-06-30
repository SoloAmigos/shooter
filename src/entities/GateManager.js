import * as THREE from 'three';
import { Settings } from '../config/Settings.js';
import { WEAPONS } from '../config/Weapons.js';
import { makeTextSprite } from '../world/Labels.js';
import { makeRng } from '../util/math.js';

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

function weightedMult(rng) {
  const r = rng();
  const m = r < 0.5 ? 2 : r < 0.85 ? 3 : 4;
  return { kind: 'count', op: 'x', val: m, label: `x${m}` };
}

// Build the two fork options. Values depend on the squad's CURRENT size so an
// additive gate stays a real alternative to a multiplier instead of being
// strictly worse — directly fixing the "+5 is useless vs x2" problem.
function buildOptions(seed, level, count) {
  const rng = makeRng(seed);
  const c = Math.max(1, count);

  // An additive option scaled to roughly match a given multiplier's gain.
  const addCompetitiveWith = (m) => {
    const target = Math.round(c * (m - 1) * (0.85 + rng() * 0.5));
    const val = Math.max(5 + level * 2, target);
    return { kind: 'count', op: '+', val, label: `+${val}` };
  };

  const r = rng();

  if (level >= 2 && r < 0.12) {
    const tier = Math.min(WEAPONS.length - 1, 1 + ((rng() * 3) | 0));
    const w = WEAPONS[tier];
    return shuffle(rng, [{ kind: 'weapon', weaponId: w.id, label: w.name }, weightedMult(rng)]);
  }
  if (r < 0.24) {
    const pct = 20 + ((rng() * 30) | 0);
    return shuffle(rng, [weightedMult(rng), { kind: 'buff', stat: 'damage', val: pct / 100, label: `DMG +${pct}%` }]);
  }
  if (r < 0.64) {
    const mOpt = weightedMult(rng);
    return shuffle(rng, [mOpt, addCompetitiveWith(mOpt.val)]);
  }
  // Two multipliers, made distinct.
  const a = weightedMult(rng);
  let b = weightedMult(rng);
  if (b.val === a.val) b = { kind: 'count', op: 'x', val: a.val + 1, label: `x${a.val + 1}` };
  return shuffle(rng, [a, b]);
}

function shuffle(rng, pair) {
  return rng() < 0.5 ? pair : [pair[1], pair[0]];
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

  spawnPair(ev, squadCount) {
    const options = buildOptions(ev.seed, ev.level, squadCount);
    const W = Settings.bridge.width;
    const group = new THREE.Group();
    group.position.z = ev.z;

    const panels = [];
    const sides = [-1, 1];
    for (let i = 0; i < 2; i++) {
      const opt = options[i];
      const color = optionColor(opt);
      const panel = new THREE.Mesh(
        new THREE.BoxGeometry(W / 2 - 0.1, 2.8, 0.25),
        new THREE.MeshStandardMaterial({
          color,
          emissive: color,
          emissiveIntensity: 0.45,
          transparent: true,
          opacity: 0.35,
          roughness: 0.4,
        })
      );
      panel.position.set((sides[i] * W) / 4, 1.4, 0);
      group.add(panel);

      const label = makeTextSprite(opt.label, { color: '#ffffff' });
      label.position.set((sides[i] * W) / 4, 3.2, 0);
      label.scale.set(3.4, 1.7, 1);
      group.add(label);
      panels.push(panel);
    }

    this.scene.add(group);
    this.gates.push({ z: ev.z, options, group, panels, triggered: false });
  }

  update(dt, squad, apply) {
    for (const g of this.gates) {
      if (g.triggered) continue;
      const pulse = 0.45 + Math.sin(performance.now() * 0.005) * 0.15;
      for (const p of g.panels) p.material.emissiveIntensity = pulse;

      if (squad.z >= g.z) {
        const side = squad.x < 0 ? 0 : 1;
        apply(g.options[side], { x: squad.x, z: g.z });
        g.triggered = true;
        this.scene.remove(g.group);
      }
    }
    if (this.gates.some((g) => g.triggered)) {
      this.gates = this.gates.filter((g) => !g.triggered);
    }
  }
}
