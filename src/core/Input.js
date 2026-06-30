import { clamp } from '../util/math.js';

// Unified steering input from keyboard and pointer/touch drag.
// Exposes `axis` in [-1, 1] (left .. right) plus an absolute drag
// target used for direct touch steering.
export class Input {
  constructor(domElement) {
    this.el = domElement;
    this.axis = 0;             // keyboard axis
    this.dragActive = false;
    this.dragDelta = 0;        // normalized horizontal drag since last frame
    this._keys = new Set();
    this._lastX = 0;

    this._bind();
  }

  _bind() {
    window.addEventListener('keydown', (e) => {
      this._keys.add(e.code);
    });
    window.addEventListener('keyup', (e) => {
      this._keys.delete(e.code);
    });

    const down = (x) => {
      this.dragActive = true;
      this._lastX = x;
      this.dragDelta = 0;
    };
    const move = (x) => {
      if (!this.dragActive) return;
      this.dragDelta += (x - this._lastX) / window.innerWidth;
      this._lastX = x;
    };
    const up = () => {
      this.dragActive = false;
    };

    this.el.addEventListener('pointerdown', (e) => {
      this.el.setPointerCapture?.(e.pointerId);
      down(e.clientX);
    });
    this.el.addEventListener('pointermove', (e) => move(e.clientX));
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  }

  // Combined steering value for this frame, consuming drag delta.
  consumeSteer() {
    let a = 0;
    if (this._keys.has('ArrowLeft') || this._keys.has('KeyA')) a -= 1;
    if (this._keys.has('ArrowRight') || this._keys.has('KeyD')) a += 1;
    this.axis = clamp(a, -1, 1);

    const drag = this.dragDelta;
    this.dragDelta = 0;
    return { axis: this.axis, drag };
  }
}
