import { Game } from './core/Game.js';

// Bootstrap: wire up the canvas + UI root and kick off the game loop.
const canvas = document.getElementById('game-canvas');
const root = document.getElementById('ui-root');

const game = new Game(root, canvas);
game.start();

// Expose for quick debugging in the console.
window.__game = game;
