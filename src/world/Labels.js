import * as THREE from 'three';

// Creates a world-space text sprite from a canvas texture. Used for gate
// and crate labels floating above the bridge.
export function makeTextSprite(text, { color = '#ffffff', bg = 'rgba(0,0,0,0.35)', size = 64 } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  draw(ctx, canvas, text, color, bg, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(3, 1.5, 1);
  sprite.userData = { canvas, ctx, tex, color, bg, size };
  return sprite;
}

export function setSpriteText(sprite, text) {
  const { canvas, ctx, tex, color, bg, size } = sprite.userData;
  draw(ctx, canvas, text, color, bg, size);
  tex.needsUpdate = true;
}

function draw(ctx, canvas, text, color, bg, size) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = bg;
  roundRect(ctx, 8, 30, canvas.width - 16, 68, 16);
  ctx.fill();
  ctx.font = `bold ${size}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 6;
  ctx.strokeStyle = 'rgba(0,0,0,0.6)';
  ctx.strokeText(text, canvas.width / 2, 64);
  ctx.fillStyle = color;
  ctx.fillText(text, canvas.width / 2, 64);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
