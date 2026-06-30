import * as THREE from 'three';
import { Settings } from '../config/Settings.js';
import { SceneManager } from './SceneManager.js';
import { Input } from './Input.js';
import { Audio } from './Audio.js';
import { Events } from './Events.js';

import { Environment } from '../world/Environment.js';
import { generateLevel } from '../world/LevelGenerator.js';

import { Squad } from '../entities/Squad.js';
import { BulletPool } from '../entities/BulletPool.js';
import { EnemyManager } from '../entities/EnemyManager.js';
import { GateManager } from '../entities/GateManager.js';
import { CrateManager } from '../entities/CrateManager.js';
import { Boss } from '../entities/Boss.js';

import { CombatSystem } from '../systems/CombatSystem.js';
import { Particles } from '../fx/Particles.js';
import { FloatingText } from '../fx/FloatingText.js';
import { CameraShake } from '../fx/CameraShake.js';

import { Progression } from '../state/Progression.js';
import { WEAPON_BY_ID } from '../config/Weapons.js';
import { HUD } from '../ui/HUD.js';
import { Screens } from '../ui/Screens.js';

const SPAWN_AHEAD = 52;

// Top-level orchestrator: owns the world, the systems, the run state machine
// and the per-frame update order.
export class Game {
  constructor(root, canvas) {
    this.root = root;
    this.prog = new Progression();
    this.events = new Events();

    this.sm = new SceneManager(canvas);
    this.input = new Input(canvas);
    this.audio = new Audio();
    this.audio.setEnabled(!this.prog.data.muted);

    const scene = this.sm.scene;
    this.env = new Environment(scene);
    this.squad = new Squad(scene);
    this.bullets = new BulletPool(scene);
    this.enemies = new EnemyManager(scene);
    this.gates = new GateManager(scene);
    this.crates = new CrateManager(scene);
    this.boss = new Boss(scene);

    this.particles = new Particles(scene);
    this.floating = new FloatingText(root, this.sm.camera);
    this.shake = new CameraShake(this.sm.camera);

    // Shared context handed to systems.
    this.ctx = {
      squad: this.squad,
      bullets: this.bullets,
      enemies: this.enemies,
      crates: this.crates,
      boss: this.boss,
      particles: this.particles,
      floating: this.floating,
      shake: this.shake,
      audio: this.audio,
      coinValue: (base) => Math.max(1, Math.round(base * this.prog.getCoinMul())),
    };
    this.combat = new CombatSystem(this.ctx);
    this.combat.onCoins = (amount, x, z) => this._gainCoins(amount, x, z);
    this.combat.onWeaponPickup = (id) => this._pickupWeapon(id);

    this.hud = new HUD(root);
    this.screens = new Screens(root, this.prog, {
      onPlay: () => this.startRun(this.prog.getCurrentLevel()),
      onNext: () => this.startRun(this.levelNum + 1),
      onRetry: () => this.startRun(this.levelNum),
      onToggleMute: () => this._toggleMute(),
      onBuy: () => {},
    });

    this.state = 'menu';
    this.levelNum = 1;
    this.runCoins = 0;
    this._spawnIdx = 0;
    this._level = null;
    this._clock = new THREE.Clock();

    this.hud.show(false);
    this.screens.showMenu();
    this._loop = this._loop.bind(this);

    // Resume audio on first interaction (browser autoplay policy).
    const unlock = () => this.audio.resume();
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
  }

  start() {
    this._clock.start();
    requestAnimationFrame(this._loop);
  }

  // ---- Run lifecycle ----
  startRun(levelNum) {
    this.levelNum = levelNum;
    this.runCoins = 0;
    this._level = generateLevel(levelNum);
    this._spawnIdx = 0;
    this.prog.setCurrentLevel(levelNum); // resume here if they leave & come back

    this.env.buildBridge(this._level.length);
    this.enemies.reset();
    this.gates.reset();
    this.crates.reset();
    this.boss.despawn();

    this.squad.reset(this.prog.getStartUnits(), this.prog.getStartWeaponId(), {
      damageMul: this.prog.getDamageMul(),
      fireMul: this.prog.getFireMul(),
      critChance: this.prog.getCritChance(),
      bonusStreams: this.prog.getBonusStreams(),
    });

    this.state = 'playing';
    this.screens.hide();
    this.hud.show(true);
  }

  _endRun(won) {
    this.prog.addCoins(this.runCoins);
    this.prog.recordLevel(won ? this.levelNum + 1 : this.levelNum);
    // Advance the resume point on a win; on a loss you retry the same level.
    this.prog.setCurrentLevel(won ? this.levelNum + 1 : this.levelNum);
    this.prog.save();
    this.hud.show(false);

    if (won) {
      this.audio.win();
      this.screens.showWin({
        count: this.squad.count,
        coinsEarned: this.runCoins,
        nextLevel: this.levelNum + 1,
      });
      this.state = 'won';
    } else {
      this.audio.lose();
      this.screens.showLose({
        level: this.levelNum,
        coinsEarned: this.runCoins,
      });
      this.state = 'lost';
    }
  }

  // ---- Helpers ----
  _toggleMute() {
    this.prog.data.muted = !this.prog.data.muted;
    this.audio.setEnabled(!this.prog.data.muted);
    this.prog.save();
    return this.prog.data.muted;
  }

  _gainCoins(amount, x, z) {
    this.runCoins += amount;
  }

  _pickupWeapon(id) {
    const w = WEAPON_BY_ID[id];
    if (this.squad.trySetWeapon(w)) {
      this.floating.spawn(this.squad.x, 1.6, this.squad.z, w.name + '!', {
        color: '#ffd23f', size: 22, life: 1.1,
      });
    } else {
      // Already have something better — convert to a few bonus units.
      this.squad.addUnits(3);
      this.floating.spawn(this.squad.x, 1.6, this.squad.z, '+3', { color: '#7fd0ff' });
    }
  }

  _applyGate(opt) {
    const sq = this.squad;
    this.audio.gate();
    this.particles.burst(sq.x, 1.2, sq.z, 0xffffff, 8, 6, 0.7);
    if (opt.kind === 'count') {
      if (opt.op === 'x') {
        sq.multiplyUnits(opt.val);
        this.floating.spawn(sq.x, 1.8, sq.z, `x${opt.val}`, { color: '#7fd0ff', size: 26, life: 1 });
      } else {
        sq.addUnits(opt.val);
        this.floating.spawn(sq.x, 1.8, sq.z, `+${opt.val}`, { color: '#62e09a', size: 26, life: 1 });
      }
    } else if (opt.kind === 'weapon') {
      this._pickupWeapon(opt.weaponId);
    } else if (opt.kind === 'buff') {
      sq.damageMul *= 1 + opt.val;
      this.floating.spawn(sq.x, 1.8, sq.z, opt.label, { color: '#c79bff', size: 22 });
    }
  }

  _spawnPending() {
    const events = this._level.events;
    while (this._spawnIdx < events.length && events[this._spawnIdx].z <= this.squad.z + SPAWN_AHEAD) {
      const ev = events[this._spawnIdx++];
      switch (ev.type) {
        case 'gatePair': this.gates.spawnPair(ev, this.squad.count); break;
        case 'crowd': this.enemies.spawnCrowd(ev); break;
        case 'crate': this.crates.spawn(ev); break;
        case 'boss': this.boss.spawn(ev.z, this.levelNum); break;
        case 'finish': /* marker only */ break;
      }
    }
  }

  _onEnemyContact(e) {
    this.squad.removeUnits(e.contactDamage ?? e.contact ?? 1);
    this.particles.burst(this.squad.x, 0.5, this.squad.z, 0xff5d5d, 5, 5, 0.7);
    this.shake.add(0.12);
  }

  // ---- Main loop ----
  _loop() {
    requestAnimationFrame(this._loop);
    const dt = Math.min(0.05, this._clock.getDelta());

    if (this.state === 'playing') {
      this._updatePlaying(dt);
    } else {
      // Idle camera drift on menus.
      this.sm.updateCamera(0, this.squad.z, dt);
    }

    this.particles.update(dt);
    this.shake.update(dt);
    this.floating.update(dt);
    this.env.update(this.squad.z);
    this.sm.render();
  }

  _updatePlaying(dt) {
    // Steering input. The follow-cam looks down +Z, which mirrors world X on
    // screen, so we negate: pressing right / dragging right moves right.
    const { axis, drag } = this.input.consumeSteer();
    const steerX = -(axis * Settings.squad.steerSpeed * dt +
      drag * Settings.bridge.width * Settings.squad.dragSensitivity);
    this.squad.update(dt, steerX);

    // While a boss is alive it's a wall: hold the squad at the arena line so
    // it can't just run past. The fight happens here until the boss drops.
    if (this.boss.active && this.squad.z > this.boss.lineZ) {
      this.squad.z = this.boss.lineZ;
    }

    this._spawnPending();

    // Combat order: fire, move bullets, resolve hits.
    this.combat.fire(dt);
    this.bullets.update(dt);
    this.enemies.update(dt, this.squad, (e) => this._onEnemyContact(e));
    const bite = this.boss.update(dt, this.squad);
    if (bite > 0) {
      this.squad.removeUnits(bite);
      this.shake.add(0.3);
      this.particles.burst(this.squad.x, 0.6, this.squad.z, 0xff5d5d, 8, 6, 0.8);
    }
    this.combat.collide();
    this.crates.update(dt, this.squad.z);
    this.gates.update(dt, this.squad, (opt) => this._applyGate(opt));

    // Camera follows after positions settle.
    this.sm.updateCamera(this.squad.x, this.squad.z, dt);

    // HUD.
    this.hud.update({
      level: this.levelNum,
      coins: this.prog.coins + this.runCoins,
      count: this.squad.count,
      weaponName: this.squad.weapon.name,
      progress: this.squad.z / this._level.length,
      boss: {
        active: this.boss.active,
        hp: this.boss.hp,
        maxHp: this.boss.maxHp,
        name: 'Warlord',
      },
    });

    // Win / lose checks.
    if (this.squad.count <= 0) {
      this._endRun(false);
    } else if (this.squad.z >= this._level.length && !this.boss.active) {
      this._endRun(true);
    }
  }
}
