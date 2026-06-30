import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Builds a single low-poly "soldier" geometry (body + head + gun) merged
// into one BufferGeometry so it can be drawn with InstancedMesh.
export function buildSoldierGeometry() {
  const parts = [];

  const body = new THREE.CapsuleGeometry(0.18, 0.34, 4, 8);
  body.translate(0, 0.55, 0);
  parts.push(body);

  const head = new THREE.SphereGeometry(0.16, 10, 8);
  head.translate(0, 1.0, 0);
  parts.push(head);

  // Gun pointing forward (+Z).
  const gun = new THREE.BoxGeometry(0.08, 0.08, 0.42);
  gun.translate(0.16, 0.6, 0.22);
  parts.push(gun);

  const geo = mergeGeometries(parts, false);
  geo.computeVertexNormals();
  return geo;
}

// Enemy blob: a slightly menacing rounded body + head, also merged.
export function buildEnemyGeometry() {
  const parts = [];
  const body = new THREE.CapsuleGeometry(0.22, 0.3, 4, 8);
  body.translate(0, 0.5, 0);
  parts.push(body);
  const head = new THREE.SphereGeometry(0.2, 10, 8);
  head.translate(0, 0.95, 0);
  parts.push(head);
  const geo = mergeGeometries(parts, false);
  geo.computeVertexNormals();
  return geo;
}
