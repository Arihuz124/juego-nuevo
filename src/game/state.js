import {
  CANVAS_SIZE,
  DRAW_SIZE,
  DRAW_H,
  MAX_PLAYER_HP,
  MAX_ENEMY_HP,
  SAVE_KEY,
} from './constants';

export const CENTER_SPAWN_X = CANVAS_SIZE / 2 - DRAW_SIZE / 2;
export const CENTER_SPAWN_Y = CANVAS_SIZE / 2 - DRAW_H / 2;

export function readSavedGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.room === 'string') return parsed;
  } catch {
    return null;
  }
  return null;
}

export function writeSavedGame(data) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {
    // Ignorar si el navegador bloquea almacenamiento local
  }
}

export function createInitialGameState() {
  return {
    screen: 'menu', // 'menu' | 'playing'
    menuHovered: null,
    menuSelected: 0,
    saveNoticeTimer: 0,

    room: 'center',
    x: CENTER_SPAWN_X,
    y: CENTER_SPAWN_Y,
    playerHp: MAX_PLAYER_HP,
    playerHitFlash: 0,

    checkpoint: {
      room: 'center',
      x: CENTER_SPAWN_X,
      y: CENTER_SPAWN_Y,
      northEnemyHp: MAX_ENEMY_HP,
    },

    isMapOpen: false,
    hoveredMapRoom: null,
    keys: {},
    dirKey: '0,1',
    lastCardinal: 'down',
    animIndex: 1,
    animTimer: 0,
    isMoving: false,
    isAttacking: false,
    attackHasHit: false,
    attackFrame: 0,
    attackTimer: 0,

    northEnemy: {
      x: CANVAS_SIZE / 2 - DRAW_SIZE / 2,
      y: 55,
      size: DRAW_SIZE,
      hp: MAX_ENEMY_HP,
      hitFlash: 0,
      shootTimer: 0,
    },
    bullets: [],

    eastChest: {
      x: 320,
      y: CANVAS_SIZE / 2 - 24,
      size: 48,
      isOpen: false,
    },

    westNpc: {
      x: 110,
      y: CANVAS_SIZE / 2 - DRAW_H / 2,
      w: DRAW_SIZE,
      h: DRAW_H,
      sprite: [4, 0],
    },

    dialogue: {
      active: false,
      lines: [],
      lineIndex: 0,
      charIndex: 0,
      timer: 0,
    },

    // aquí para futuros implementos de estado de bloques empujables para puzzles
    // aquí para futuros implementos de estado de interfaz pequeña para ver detalles de cosas
  };
}

export function saveCheckpointAtSouth(game) {
  const saveData = {
    room: 'bottom',
    x: game.x,
    y: game.y,
    northEnemyHp: game.northEnemy.hp,
  };
  writeSavedGame(saveData);
  game.checkpoint = { ...saveData };
  game.saveNoticeTimer = 90;
}

export function startNewGame(game, setIsPlaying) {
  game.room = 'center';
  game.x = CENTER_SPAWN_X;
  game.y = CENTER_SPAWN_Y;
  game.playerHp = MAX_PLAYER_HP;
  game.playerHitFlash = 0;
  game.dirKey = '0,1';
  game.lastCardinal = 'down';
  game.isAttacking = false;
  game.attackHasHit = false;
  game.attackFrame = 0;
  game.attackTimer = 0;
  game.isMapOpen = false;
  game.dialogue.active = false;
  game.keys = {};
  game.bullets = [];
  game.northEnemy.hp = MAX_ENEMY_HP;
  game.northEnemy.hitFlash = 0;
  game.northEnemy.shootTimer = 0;
  game.eastChest.isOpen = false;
  game.checkpoint = {
    room: 'center',
    x: CENTER_SPAWN_X,
    y: CENTER_SPAWN_Y,
    northEnemyHp: MAX_ENEMY_HP,
  };
  game.screen = 'playing';
  setIsPlaying(true);
}

export function loadSavedGame(game, setIsPlaying) {
  const saved = readSavedGame();
  if (!saved) return;

  game.room = saved.room;
  game.x = saved.x ?? CENTER_SPAWN_X;
  game.y = saved.y ?? CENTER_SPAWN_Y;
  game.playerHp = MAX_PLAYER_HP;
  game.playerHitFlash = 0;
  game.dirKey = '0,1';
  game.lastCardinal = 'down';
  game.isAttacking = false;
  game.attackHasHit = false;
  game.attackFrame = 0;
  game.attackTimer = 0;
  game.isMapOpen = false;
  game.dialogue.active = false;
  game.keys = {};
  game.bullets = [];
  game.northEnemy.hp =
    typeof saved.northEnemyHp === 'number' ? saved.northEnemyHp : MAX_ENEMY_HP;
  game.northEnemy.hitFlash = 0;
  game.northEnemy.shootTimer = 0;
  game.checkpoint = { ...saved };
  game.screen = 'playing';
  setIsPlaying(true);
}

export function respawnAtLastCheckpoint(game) {
  const cp = readSavedGame() || game.checkpoint;
  game.room = cp.room;
  game.x = cp.x;
  game.y = cp.y;
  game.playerHp = MAX_PLAYER_HP;
  game.playerHitFlash = 0;
  game.dirKey = '0,1';
  game.lastCardinal = 'down';
  game.isAttacking = false;
  game.attackHasHit = false;
  game.attackFrame = 0;
  game.attackTimer = 0;
  game.isMapOpen = false;
  game.dialogue.active = false;
  game.keys = {};
  game.bullets = [];
  game.northEnemy.hp =
    typeof cp.northEnemyHp === 'number' ? cp.northEnemyHp : MAX_ENEMY_HP;
  game.northEnemy.hitFlash = 0;
  game.northEnemy.shootTimer = 0;
}

export function teleportToRoom(game, targetRoom) {
  game.room = targetRoom;
  game.x = CENTER_SPAWN_X;
  game.y = CENTER_SPAWN_Y;
  game.bullets = [];
  game.isAttacking = false;
  game.attackFrame = 0;
  game.isMapOpen = false;
  game.hoveredMapRoom = null;

  if (targetRoom === 'bottom') {
    saveCheckpointAtSouth(game);
  }
}

export function returnToMenu(game, setIsPlaying) {
  game.screen = 'menu';
  game.isMapOpen = false;
  game.dialogue.active = false;
  game.isAttacking = false;
  game.attackFrame = 0;
  game.keys = {};
  setIsPlaying(false);
}