import { formatNumber } from '../util/math.js';

// Orchestrates firing and all bullet collisions (enemies, crates, boss).
// Pulls its references from a shared context object built by Game.
export class CombatSystem {
  constructor(ctx) {
    this.ctx = ctx;
    this.onCoins = () => {};       // (amount, x, z) -> void
    this.onWeaponPickup = () => {}; // (weapon) -> void
    this.onBossKilled = () => {};
    this._list = [];
  }

  fire(dt) {
    const { squad, bullets, particles, audio } = this.ctx;
    if (squad.count <= 0) return;
    squad.fireTimer -= dt;
    if (squad.fireTimer > 0) return;

    const w = squad.weapon;
    squad.fireTimer = 1 / (w.fireRate * squad.fireMul);

    const streams = Math.max(1, Math.min(squad.count, w.streams));
    const muzzles = squad.getMuzzles(streams);
    const dmg = w.damage * squad.damageMul;

    for (const mz of muzzles) {
      for (let s = 0; s < w.bulletsPerShot; s++) {
        const ang = (Math.random() - 0.5) * 2 * w.spread;
        const vx = Math.sin(ang) * w.bulletSpeed;
        const vz = Math.cos(ang) * w.bulletSpeed;
        bullets.spawn(mz.x, mz.y, mz.z, vx, vz, dmg, w);
      }
    }
    // One muzzle flash per volley keeps the particle budget sane.
    const flash = muzzles[0];
    if (flash) particles.burst(flash.x, flash.y, flash.z, w.color, 2, 4, 0.5);
    audio.shoot();
  }

  collide() {
    const { bullets, enemies, crates, boss, particles, floating, shake, audio } = this.ctx;

    // Snapshot live enemies once per frame.
    this._list.length = 0;
    enemies.forEach((e) => this._list.push(e));
    const list = this._list;

    bullets.forEach((b, i) => {
      if (!b.alive) return;

      // --- Boss ---
      if (boss.active) {
        const dz = b.z - boss.z;
        const dx = b.x - boss.x;
        if (Math.abs(dz) < 1.6 && Math.abs(dx) < 1.6) {
          const dead = boss.damage(b.damage);
          particles.burst(b.x, 1.4, b.z, 0xffd23f, 4, 5, 0.7);
          if (Math.random() < 0.25) {
            floating.spawn(boss.x, 2.6, boss.z, formatNumber(b.damage), { color: '#ffd23f', size: 16 });
          }
          this._killBullet(b, i);
          if (dead) {
            this._explode(boss.x, boss.z, 1.6);
            audio.explosion();
            shake.add(0.8);
            this.onCoins(this.ctx.coinValue(120), boss.x, boss.z);
            boss.despawn();
            this.onBossKilled();
          }
          return;
        }
      }

      // --- Crates ---
      let crateHit = false;
      crates.forEach((c) => {
        if (crateHit) return;
        if (Math.abs(b.z - c.z) < 0.9 && Math.abs(b.x - c.x) < 0.9) {
          crateHit = true;
          const broken = crates.damage(c, b.damage);
          particles.burst(b.x, 0.8, b.z, 0xf2a33a, 3, 4, 0.6);
          this._killBullet(b, i);
          if (broken) {
            particles.burst(c.x, 0.8, c.z, 0xffffff, 16, 8, 1.0);
            audio.gate();
            this.onWeaponPickup(c.weaponId);
          }
        }
      });
      if (crateHit) return;

      // --- Enemies ---
      for (let k = 0; k < list.length; k++) {
        const e = list[k];
        if (!e.alive) continue;
        const r = 0.5 * e.scale + 0.2;
        const dx = b.x - e.x;
        const dz = b.z - e.z;
        if (dx * dx + dz * dz <= r * r) {
          if (b.aoe > 0) {
            this._explode(e.x, e.z, b.aoe);
            audio.explosion();
            shake.add(0.25);
            this._killBullet(b, i);
          } else {
            const coins = enemies.damage(e, b.damage);
            particles.burst(e.x, 0.5, e.z, e.color, 4, 5, 0.6);
            if (coins > 0) {
              this._reward(coins, e.x, e.z);
            }
            if (b.pierce > 0) {
              b.pierce -= 1;
            } else {
              this._killBullet(b, i);
            }
          }
          return; // one enemy per bullet per frame
        }
      }
    });
  }

  // Splash damage for rockets / boss death.
  _explode(x, z, radius) {
    const { enemies, particles } = this.ctx;
    particles.burst(x, 0.6, z, 0xffae3a, 20, 10, 1.2);
    enemies.forEach((e) => {
      const dx = e.x - x;
      const dz = e.z - z;
      if (dx * dx + dz * dz <= radius * radius) {
        const coins = enemies.damage(e, 9999);
        if (coins > 0) this._reward(coins, e.x, e.z);
      }
    });
  }

  _reward(coins, x, z) {
    const value = this.ctx.coinValue(coins);
    this.ctx.audio.coin();
    this.onCoins(value, x, z);
  }

  _killBullet(b, i) {
    b.alive = false;
    this.ctx.bullets.hideAt(i);
  }
}
