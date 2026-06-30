// Minimal synchronous event emitter for loose coupling between systems.

export class Events {
  constructor() {
    this._map = new Map();
  }

  on(name, fn) {
    if (!this._map.has(name)) this._map.set(name, new Set());
    this._map.get(name).add(fn);
    return () => this.off(name, fn);
  }

  off(name, fn) {
    this._map.get(name)?.delete(fn);
  }

  emit(name, payload) {
    const set = this._map.get(name);
    if (!set) return;
    for (const fn of set) fn(payload);
  }
}
