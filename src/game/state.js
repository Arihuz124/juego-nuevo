import {
  DEFAULT_WIDTH,
  DEFAULT_HEIGHT,
  DRAW_SIZE,
  DRAW_H,
  MAX_PLAYER_HP,
  MAX_ENEMY_HP,
  SAVE_KEY,
} from './constants';

export function getCenterSpawn(width = DEFAULT_WIDTH, height = DEFAULT_HEIGHT) {
  return {
    x: Math.round(width / 2 - DRAW_SIZE / 2),
    y: Math.round(height / 2 - DRAW_H / 2),
  };
}

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
  const spawn = getCenterSpawn(DEFAULT_WIDTH, DEFAULT_HEIGHT);

  return {
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
    showControlsGuide: false,

    screen: 'menu', // 'menu' | 'playing'
    menuHovered: null,
    menuSelected: 0,
    saveNoticeTimer: 0,

    room: 'center',
    x: spawn.x,
    y: spawn.y,
    playerHp: MAX_PLAYER_HP,
    playerHitFlash: 0,

    checkpoint: {
      room: 'center',
      x: spawn.x,
      y: spawn.y,
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
      x: Math.round(DEFAULT_WIDTH / 2 - DRAW_SIZE / 2),
      y: 55,
      size: DRAW_SIZE,
      hp: MAX_ENEMY_HP,
      hitFlash: 0,
      shootTimer: 0,
    },
    bullets: [],

    eastChest: {
      x: Math.round(DEFAULT_WIDTH * 0.68),
      y: Math.round(DEFAULT_HEIGHT / 2 - 24),
      size: 48,
      isOpen: false,
    },

    westNpc: {
      x: Math.round(DEFAULT_WIDTH * 0.22),
      y: Math.round(DEFAULT_HEIGHT / 2 - DRAW_H / 2),
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

    // aquí para futuros implementos de cooldown de ataque y magia (attackCooldown: 0, magicCooldown: 0)
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
  const spawn = getCenterSpawn(game.width, game.height);
  game.room = 'center';
  game.x = spawn.x;
  game.y = spawn.y;
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
    x: spawn.x,
    y: spawn.y,
    northEnemyHp: MAX_ENEMY_HP,
  };
  game.screen = 'playing';
  setIsPlaying(true);
}

export function loadSavedGame(game, setIsPlaying) {
  const saved = readSavedGame();
  if (!saved) return;

  const spawn = getCenterSpawn(game.width, game.height);
  game.room = saved.room;
  game.x = Math.min(saved.x ?? spawn.x, Math.max(0, game.width - DRAW_SIZE));
  game.y = Math.min(saved.y ?? spawn.y, Math.max(0, game.height - DRAW_H));
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
  game.x = Math.min(cp.x, Math.max(0, game.width - DRAW_SIZE));
  game.y = Math.min(cp.y, Math.max(0, game.height - DRAW_H));
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
  const spawn = getCenterSpawn(game.width, game.height);
  game.room = targetRoom;
  game.x = spawn.x;
  game.y = spawn.y;
  game.bullets = [];
  game.isAttacking = false;
  game.attackFrame = 0;
  game.isMapOpen = false;
  game.hoveredMapRoom = null;

  if (targetRoom === 'bottom') {
    saveCheckpointAtSouth(game);
  }
}

export function resizeGameScreen(game, newWidth, newHeight) {
  game.width = newWidth;
  game.height = newHeight;

  game.x = Math.max(0, Math.min(game.x, newWidth - DRAW_SIZE));
  game.y = Math.max(0, Math.min(game.y, newHeight - DRAW_H));

  game.northEnemy.x = Math.round(newWidth / 2 - DRAW_SIZE / 2);
  game.eastChest.x = Math.round(newWidth * 0.68);
  game.eastChest.y = Math.round(newHeight / 2 - 24);
  game.westNpc.x = Math.round(newWidth * 0.22);
  game.westNpc.y = Math.round(newHeight / 2 - DRAW_H / 2);
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