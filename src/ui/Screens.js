import { UPGRADES } from '../state/Progression.js';
import { formatNumber } from '../util/math.js';

// Manages all full-screen menus: title, upgrade shop, win and lose screens.
export class Screens {
  constructor(root, prog, handlers) {
    this.prog = prog;
    this.h = handlers;
    this.el = document.createElement('div');
    this.el.className = 'screens';
    root.appendChild(this.el);
    this._build();
  }

  _build() {
    this.el.innerHTML = `
      <div class="screen" id="screen-menu">
        <h1 class="title">BRIDGE<span>BRIGADE</span></h1>
        <p class="subtitle">Steer your squad. Pick the right gates. Storm the bridge.</p>
        <div class="menu-stats">
          <div>Best: Level <b id="menu-best">1</b></div>
          <div>🪙 <b id="menu-coins">0</b></div>
        </div>
        <button class="btn btn-primary" id="btn-play">PLAY</button>
        <button class="btn" id="btn-upgrades">UPGRADES</button>
        <button class="btn btn-ghost" id="btn-mute">SOUND: ON</button>
        <p class="hint">Drag / A-D / ◀ ▶ to steer</p>
      </div>

      <div class="screen" id="screen-upgrades" style="display:none">
        <h2 class="title-sm">UPGRADES</h2>
        <div class="coins-banner">🪙 <b id="up-coins">0</b></div>
        <div class="upgrade-list" id="upgrade-list"></div>
        <button class="btn" id="btn-up-back">BACK</button>
      </div>

      <div class="screen screen-overlay" id="screen-win" style="display:none">
        <h2 class="title-sm win">LEVEL CLEAR!</h2>
        <div class="result" id="win-result"></div>
        <button class="btn btn-primary" id="btn-next">NEXT LEVEL</button>
        <button class="btn" id="btn-win-shop">UPGRADES</button>
      </div>

      <div class="screen screen-overlay" id="screen-lose" style="display:none">
        <h2 class="title-sm lose">OVERRUN!</h2>
        <div class="result" id="lose-result"></div>
        <button class="btn btn-primary" id="btn-retry">RETRY</button>
        <button class="btn" id="btn-lose-shop">UPGRADES</button>
      </div>
    `;

    const $ = (id) => this.el.querySelector(id);
    this.screenMenu = $('#screen-menu');
    this.screenUpgrades = $('#screen-upgrades');
    this.screenWin = $('#screen-win');
    this.screenLose = $('#screen-lose');
    this.upgradeList = $('#upgrade-list');
    this.muteBtn = $('#btn-mute');

    $('#btn-play').onclick = () => this.h.onPlay();
    $('#btn-upgrades').onclick = () => this.showUpgrades();
    $('#btn-up-back').onclick = () => this.showMenu();
    $('#btn-next').onclick = () => this.h.onNext();
    $('#btn-retry').onclick = () => this.h.onRetry();
    $('#btn-win-shop').onclick = () => this.showUpgrades();
    $('#btn-lose-shop').onclick = () => this.showUpgrades();
    this.muteBtn.onclick = () => {
      const muted = this.h.onToggleMute();
      this.muteBtn.textContent = `SOUND: ${muted ? 'OFF' : 'ON'}`;
    };
  }

  _hideAll() {
    for (const s of [this.screenMenu, this.screenUpgrades, this.screenWin, this.screenLose]) {
      s.style.display = 'none';
    }
  }

  hide() {
    this.el.style.display = 'none';
  }

  showMenu() {
    this.el.style.display = 'flex';
    this._hideAll();
    this.screenMenu.style.display = 'flex';
    this.el.querySelector('#menu-best').textContent = this.prog.data.highestLevel;
    this.el.querySelector('#menu-coins').textContent = formatNumber(this.prog.coins);
    this.muteBtn.textContent = `SOUND: ${this.prog.data.muted ? 'OFF' : 'ON'}`;
  }

  showUpgrades() {
    this.el.style.display = 'flex';
    this._hideAll();
    this.screenUpgrades.style.display = 'flex';
    this._renderUpgrades();
  }

  _renderUpgrades() {
    this.el.querySelector('#up-coins').textContent = formatNumber(this.prog.coins);
    this.upgradeList.innerHTML = '';
    for (const [id, def] of Object.entries(UPGRADES)) {
      const lvl = this.prog.level(id);
      const maxed = this.prog.isMaxed(id);
      const cost = this.prog.cost(id);
      const afford = this.prog.coins >= cost;

      const row = document.createElement('div');
      row.className = 'upgrade-row';
      row.innerHTML = `
        <div class="up-info">
          <div class="up-name">${def.name} <span class="up-lvl">Lv ${lvl}/${def.max}</span></div>
          <div class="up-desc">${def.desc}</div>
          <div class="up-value">${def.display(lvl)}${maxed ? '' : ` → <b>${def.display(lvl + 1)}</b>`}</div>
        </div>
        <button class="btn-buy ${maxed ? 'maxed' : afford ? '' : 'cant'}">
          ${maxed ? 'MAX' : `🪙 ${formatNumber(cost)}`}
        </button>
      `;
      const btn = row.querySelector('.btn-buy');
      if (!maxed) {
        btn.onclick = () => {
          if (this.prog.buy(id)) {
            this.h.onBuy?.(id);
            this._renderUpgrades();
            this.showMenuStatsRefresh();
          }
        };
      }
      this.upgradeList.appendChild(row);
    }
  }

  showMenuStatsRefresh() {
    const best = this.el.querySelector('#menu-best');
    const coins = this.el.querySelector('#menu-coins');
    if (best) best.textContent = this.prog.data.highestLevel;
    if (coins) coins.textContent = formatNumber(this.prog.coins);
  }

  showWin(stats) {
    this.el.style.display = 'flex';
    this._hideAll();
    this.screenWin.style.display = 'flex';
    this.el.querySelector('#win-result').innerHTML = `
      <div>Squad survived: <b>${formatNumber(stats.count)}</b></div>
      <div>Coins earned: <b>🪙 ${formatNumber(stats.coinsEarned)}</b></div>
      <div>Up next: <b>Level ${stats.nextLevel}</b></div>
    `;
  }

  showLose(stats) {
    this.el.style.display = 'flex';
    this._hideAll();
    this.screenLose.style.display = 'flex';
    this.el.querySelector('#lose-result').innerHTML = `
      <div>Reached: <b>Level ${stats.level}</b></div>
      <div>Coins earned: <b>🪙 ${formatNumber(stats.coinsEarned)}</b></div>
      <div>Total coins: <b>🪙 ${formatNumber(this.prog.coins)}</b></div>
    `;
  }
}
