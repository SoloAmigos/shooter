import * as THREE from 'three';
import { Settings } from '../config/Settings.js';

// Builds and owns the static scenery: ocean, sky dome, and the bridge that
// the squad runs along. The bridge is rebuilt to fit each level's length.
export class Environment {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    scene.add(this.group);

    this._buildSky();
    this._buildOcean();

    this.bridge = new THREE.Group();
    this.group.add(this.bridge);
  }

  _buildSky() {
    // Large inverted sphere with a vertical gradient via vertex colors.
    const geo = new THREE.SphereGeometry(300, 32, 16);
    const top = new THREE.Color(0x0a1230);
    const bottom = new THREE.Color(0x29407a);
    const colors = [];
    const pos = geo.attributes.position;
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i) / 300;
      c.copy(bottom).lerp(top, THREE.MathUtils.clamp(y * 0.5 + 0.5, 0, 1));
      colors.push(c.r, c.g, c.b);
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    const mat = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false });
    this.sky = new THREE.Mesh(geo, mat);
    this.group.add(this.sky);
  }

  _buildOcean() {
    const geo = new THREE.PlaneGeometry(800, 800, 1, 1);
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x14336b,
      roughness: 0.35,
      metalness: 0.2,
      transparent: true,
      opacity: 0.95,
    });
    this.ocean = new THREE.Mesh(geo, mat);
    this.ocean.position.y = -0.6;
    this.ocean.receiveShadow = false;
    this.group.add(this.ocean);
  }

  buildBridge(length) {
    // Clear previous bridge geometry.
    this.bridge.clear();

    const W = Settings.bridge.width;
    const segLen = Settings.bridge.segmentLength;
    const start = -14;
    const end = length + 18;

    const deckMat = new THREE.MeshStandardMaterial({ color: 0xd9dde6, roughness: 0.9 });
    const deckMatAlt = new THREE.MeshStandardMaterial({ color: 0xc7ccd6, roughness: 0.9 });
    const railMat = new THREE.MeshStandardMaterial({ color: 0x8d93a1, roughness: 0.7, metalness: 0.3 });

    let i = 0;
    for (let z = start; z < end; z += segLen) {
      const len = Math.min(segLen, end - z);
      const deck = new THREE.Mesh(
        new THREE.BoxGeometry(W, 0.6, len),
        i % 2 ? deckMat : deckMatAlt
      );
      deck.position.set(0, -0.3, z + len / 2);
      deck.receiveShadow = true;
      this.bridge.add(deck);

      // Side rails.
      for (const sx of [-1, 1]) {
        const rail = new THREE.Mesh(
          new THREE.BoxGeometry(0.18, Settings.bridge.railHeight, len),
          railMat
        );
        rail.position.set((sx * W) / 2, Settings.bridge.railHeight / 2, z + len / 2);
        rail.castShadow = true;
        this.bridge.add(rail);
      }
      i++;
    }

    // Finish line marker near the end.
    const finish = new THREE.Mesh(
      new THREE.BoxGeometry(W, 0.05, 1.2),
      new THREE.MeshStandardMaterial({ color: 0xffd54a, emissive: 0x554400, roughness: 0.5 })
    );
    finish.position.set(0, 0.05, length);
    this.bridge.add(finish);
    this.finishZ = length;
  }

  update(focusZ) {
    // Keep the ocean and sky centred on the action for an endless feel.
    this.ocean.position.z = focusZ;
    this.sky.position.z = focusZ;
  }
}
