import { formatNumber } from '../util/math.js';

// In-game heads-up display. Pure DOM overlay updated each frame.
export class HUD {
  constructor(root) {
    this.el = document.createElement('div');
    this.el.className = 'hud';
    this.el.innerHTML = `
      <div class="hud-top">
        <div class="hud-pill" id="hud-level">Level 1</div>
        <div class="hud-progress"><div class="hud-progress-fill" id="hud-progress"></div></div>
        <div class="hud-pill hud-coins" id="hud-coins">🪙 0</div>
      </div>
      <div class="hud-boss" id="hud-boss">
        <div class="hud-boss-name" id="hud-boss-name">Warlord</div>
        <div class="hud-boss-bar"><div class="hud-boss-fill" id="hud-boss-fill"></div></div>
      </div>
      <div class="hud-bottom">
        <div class="hud-weapon" id="hud-weapon">Pistol</div>
        <div class="hud-count" id="hud-count"><span class="hud-count-icon">▲</span><span id="hud-count-num">6</span></div>
      </div>
    `;
    root.appendChild(this.el);

    this.level = this.el.querySelector('#hud-level');
    this.coins = this.el.querySelector('#hud-coins');
    this.progress = this.el.querySelector('#hud-progress');
    this.weapon = this.el.querySelector('#hud-weapon');
    this.countNum = this.el.querySelector('#hud-count-num');
    this.boss = this.el.querySelector('#hud-boss');
    this.bossName = this.el.querySelector('#hud-boss-name');
    this.bossFill = this.el.querySelector('#hud-boss-fill');
    this._lastCount = -1;
  }

  show(v) {
    this.el.style.display = v ? 'block' : 'none';
  }

  update(state) {
    this.level.textContent = `Level ${state.level}`;
    this.coins.textContent = `🪙 ${formatNumber(state.coins)}`;
    this.progress.style.width = `${Math.min(100, state.progress * 100).toFixed(1)}%`;
    this.weapon.textContent = state.weaponName;

    if (state.count !== this._lastCount) {
      this.countNum.textContent = formatNumber(state.count);
      // Punchy scale pop when the count changes.
      this.countNum.parentElement.classList.remove('pop');
      void this.countNum.parentElement.offsetWidth;
      this.countNum.parentElement.classList.add('pop');
      this._lastCount = state.count;
    }

    if (state.boss && state.boss.active) {
      this.boss.style.display = 'block';
      this.bossName.textContent = state.boss.name;
      this.bossFill.style.width = `${Math.max(0, (state.boss.hp / state.boss.maxHp) * 100)}%`;
    } else {
      this.boss.style.display = 'none';
    }
  }
}
