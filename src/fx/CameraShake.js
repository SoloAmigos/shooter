// Additive camera shake. Call add() to inject trauma, update() each frame,
// and it offsets the camera after the follow logic has positioned it.

export class CameraShake {
  constructor(camera) {
    this.camera = camera;
    this.trauma = 0;
    this._t = 0;
  }

  add(amount) {
    this.trauma = Math.min(1, this.trauma + amount);
  }

  update(dt) {
    this._t += dt;
    if (this.trauma <= 0) return;
    const shake = this.trauma * this.trauma;
    const f = 38;
    const ox = Math.sin(this._t * f * 1.1) * shake * 0.5;
    const oy = Math.sin(this._t * f * 1.7 + 1.3) * shake * 0.4;
    this.camera.position.x += ox;
    this.camera.position.y += oy;
    this.trauma = Math.max(0, this.trauma - dt * 1.6);
  }
}
