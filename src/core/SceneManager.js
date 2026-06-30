import * as THREE from 'three';
import { Settings } from '../config/Settings.js';
import { damp } from '../util/math.js';

// Owns the renderer, scene, camera and the follow-cam logic.
export class SceneManager {
  constructor(canvas) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a1230);
    this.scene.fog = new THREE.Fog(0x0a1230, 40, 130);

    this.camera = new THREE.PerspectiveCamera(
      Settings.camera.fov,
      window.innerWidth / window.innerHeight,
      0.1,
      400
    );
    this.camera.position.set(0, Settings.camera.height, -Settings.camera.distance);

    this._setupLights();
    this._onResize = this._onResize.bind(this);
    window.addEventListener('resize', this._onResize);
    this._onResize();
  }

  _setupLights() {
    const hemi = new THREE.HemisphereLight(0xbcd4ff, 0x223055, 0.9);
    this.scene.add(hemi);

    const sun = new THREE.DirectionalLight(0xfff0d8, 1.5);
    sun.position.set(-18, 40, -10);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    const s = 40;
    sun.shadow.camera.left = -s;
    sun.shadow.camera.right = s;
    sun.shadow.camera.top = s;
    sun.shadow.camera.bottom = -s;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 120;
    sun.shadow.bias = -0.0004;
    this.sun = sun;
    this.scene.add(sun);
    this.scene.add(sun.target);
  }

  // Smoothly chase a forward-moving focus point at (x, z).
  updateCamera(focusX, focusZ, dt) {
    const c = Settings.camera;
    const targetX = focusX * 0.6;
    this.camera.position.x = damp(this.camera.position.x, targetX, c.follow * 60, dt);
    this.camera.position.z = damp(
      this.camera.position.z,
      focusZ - c.distance,
      c.follow * 60,
      dt
    );
    this.camera.position.y = c.height;
    this.camera.lookAt(focusX * 0.5, 1.2, focusZ + c.lookAhead);

    // Keep the sun shadow box following the action.
    this.sun.position.set(focusX - 18, 40, focusZ - 10);
    this.sun.target.position.set(focusX, 0, focusZ + 6);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  _onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  dispose() {
    window.removeEventListener('resize', this._onResize);
    this.renderer.dispose();
  }
}
