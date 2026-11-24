import { useEffect, useRef, useState } from 'react';

const CANVAS_SIZE = 500;
const DRAW_SIZE = 64;
const SPEED = 4;

const MAX_PLAYER_HP = 3;
const MAX_ENEMY_HP = 7;
const SAVE_KEY = 'juego_princesa_save_unico';

// Cuadrícula de la hoja (12 columnas x 10 filas)
const COLS = 12;
const ROWS = 10;

// Coordenadas [fila, columna]: [paso 1, quieto, paso 2] en 8 direcciones
const WALK_ANIMS = {
  '0,-1':  [[0, 0], [0, 8],  [1, 4]],   // Arriba
  '1,-1':  [[0, 1], [0, 9],  [1, 5]],   // Arriba-Derecha
  '1,0':   [[0, 2], [0, 10], [1, 6]],   // Derecha
  '1,1':   [[0, 3], [0, 11], [1, 7]],   // Abajo-Derecha
  '0,1':   [[0, 4], [1, 0],  [1, 8]],   // Abajo
  '-1,1':  [[0, 5], [1, 1],  [1, 9]],   // Abajo-Izquierda
  '-1,0':  [[0, 6], [1, 2],  [1, 10]],  // Izquierda
  '-1,-1': [[0, 7], [1, 3],  [1, 11]],  // Arriba-Izquierda
};

// Coordenadas de ataque en las 4 direcciones
const ATTACK_ANIMS = {
  up:    [[4, 2], [4, 5], [4, 1]],
  down:  [[5, 6], [4, 3], [5, 8], [5, 9]],
  right: [[7, 6], [8, 2], [8, 4], [9, 0]],
  left:  [[7, 1], [7, 7], [6, 11]],
};

const ROOMS = {
  center: { color: '#d63031' }, // Rojo
  top:    { color: '#00b894' }, // Verde (Norte)
  bottom: { color: '#0984e3' }, // Azul (Sur - Punto de guardado)
  left:   { color: '#6c5ce7' }, // Morado (Oeste)
  right:  { color: '#fdcb6e' }, // Amarillo (Este)
};

// Botones centrados de la pantalla de inicio
const MENU_BUTTONS = {
  newGame:  { x: 130, y: 198, w: 240, h: 46, label: 'Partida nueva' },
  loadGame: { x: 130, y: 262, w: 240, h: 46, label: 'Cargar partida' },
};

// Coordenadas de los cuartos y pasillos en el mapa (estilo en cruz)
const MAP_ROOMS = {
  center: { x: 195, y: 195, w: 110, h: 110 },
  top:    { x: 195, y: 83,  w: 110, h: 76 },
  bottom: { x: 195, y: 341, w: 110, h: 76 },
  left:   { x: 83,  y: 195, w: 76,  h: 110 },
  right:  { x: 341, y: 195, w: 76,  h: 110 },
};

const MAP_CONNECTORS = [
  { x: 236, y: 159, w: 28, h: 36 },
  { x: 236, y: 305, w: 28, h: 36 },
  { x: 159, y: 236, w: 36, h: 28 },
  { x: 305, y: 236, w: 36, h: 28 },
];

function readSavedGame() {
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

function writeSavedGame(data) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {
    // Ignorar si el navegador bloquea almacenamiento local
  }
}

// Elimina solo el fondo negro exterior de cada celda sin tocar los bordes oscuros del personaje
function removeExteriorBlack(img) {
  const offCanvas = document.createElement('canvas');
  offCanvas.width = img.naturalWidth;
  offCanvas.height = img.naturalHeight;
  const ctx = offCanvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  const imgData = ctx.getImageData(0, 0, offCanvas.width, offCanvas.height);
  const data = imgData.data;
  const w = offCanvas.width;
  const h = offCanvas.height;

  const cellW = Math.floor(w / COLS);
  const cellH = Math.floor(h / ROWS);
  const visited = new Uint8Array(w * h);

  const isBlack = (x, y) => {
    const idx = (y * w + x) * 4;
    return data[idx] < 30 && data[idx + 1] < 30 && data[idx + 2] < 30;
  };

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const x0 = c * cellW;
      const y0 = r * cellH;
      const x1 = Math.min(w, (c + 1) * cellW);
      const y1 = Math.min(h, (r + 1) * cellH);

      const queue = [];
      const pushIfBlack = (x, y) => {
        const pos = y * w + x;
        if (!visited[pos] && isBlack(x, y)) {
          visited[pos] = 1;
          queue.push(x, y);
        }
      };

      for (let x = x0; x < x1; x++) {
        pushIfBlack(x, y0);
        pushIfBlack(x, y1 - 1);
      }
      for (let y = y0; y < y1; y++) {
        pushIfBlack(x0, y);
        pushIfBlack(x1 - 1, y);
      }

      let head = 0;
      while (head < queue.length) {
        const cx = queue[head++];
        const cy = queue[head++];
        data[(cy * w + cx) * 4 + 3] = 0;

        if (cx > x0) pushIfBlack(cx - 1, cy);
        if (cx + 1 < x1) pushIfBlack(cx + 1, cy);
        if (cy > y0) pushIfBlack(cx, cy - 1);
        if (cy + 1 < y1) pushIfBlack(cx, cy + 1);
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return offCanvas;
}

function rectsOverlap(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

function pointInRect(px, py, r) {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

function drawPixelHeart(ctx, x, y, filled) {
  const pattern = [
    '01100110',
    '11111111',
    '11111111',
    '11111111',
    '01111110',
    '00111100',
    '00011000',
  ];
  const pixelSize = 3;

  ctx.fillStyle = '#111111';
  for (let r = 0; r < pattern.length; r++) {
    for (let c = 0; c < pattern[r].length; c++) {
      if (pattern[r][c] === '1') {
        ctx.fillRect(
          x + c * pixelSize - 1,
          y + r * pixelSize - 1,
          pixelSize + 2,
          pixelSize + 2
        );
      }
    }
  }

  ctx.fillStyle = filled ? '#ff2e4c' : '#3a3a3a';
  for (let r = 0; r < pattern.length; r++) {
    for (let c = 0; c < pattern[r].length; c++) {
      if (pattern[r][c] === '1') {
        ctx.fillRect(x + c * pixelSize, y + r * pixelSize, pixelSize, pixelSize);
      }
    }
  }

  if (filled) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + 2 * pixelSize, y + 1 * pixelSize, pixelSize, pixelSize);
  }
}

export default function App() {
  const canvasRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const returnToMenuRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    let cleanSheet = null;
    const rawImg = new Image();
    rawImg.src = './sprites.png';
    rawImg.onload = () => {
      cleanSheet = removeExteriorBlack(rawImg);
    };

    // Música de fondo en bucle
    const bgMusic = new Audio('./song.mp3');
    bgMusic.loop = true;
    bgMusic.volume = 0.4;
    let musicStarted = false;

    const startMusic = () => {
      if (!musicStarted) {
        bgMusic
          .play()
          .then(() => {
            musicStarted = true;
          })
          .catch(() => {});
      }
    };

    const drawH = Math.round(DRAW_SIZE * (219 / 172));
    const centerSpawnX = CANVAS_SIZE / 2 - DRAW_SIZE / 2;
    const centerSpawnY = CANVAS_SIZE / 2 - drawH / 2;

    const game = {
      screen: 'menu', // 'menu' | 'playing'
      menuHovered: null,
      menuSelected: 0,
      saveNoticeTimer: 0,

      room: 'center',
      x: centerSpawnX,
      y: centerSpawnY,
      playerHp: MAX_PLAYER_HP,
      playerHitFlash: 0,

      checkpoint: {
        room: 'center',
        x: centerSpawnX,
        y: centerSpawnY,
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
        isOpen: false, // false = café, true = verde
      },
      westNpc: {
        x: 110,
        y: CANVAS_SIZE / 2 - drawH / 2,
        w: DRAW_SIZE,
        h: drawH,
        sprite: [4, 0],
      },
      dialogue: {
        active: false,
        lines: [],
        lineIndex: 0,
        charIndex: 0,
        timer: 0,
      },
    };

    const saveCheckpointAtSouth = () => {
      const saveData = {
        room: 'bottom',
        x: game.x,
        y: game.y,
        northEnemyHp: game.northEnemy.hp,
      };
      writeSavedGame(saveData);
      game.checkpoint = { ...saveData };
      game.saveNoticeTimer = 90;
    };

    const startNewGame = () => {
      game.room = 'center';
      game.x = centerSpawnX;
      game.y = centerSpawnY;
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
        x: centerSpawnX,
        y: centerSpawnY,
        northEnemyHp: MAX_ENEMY_HP,
      };
      game.screen = 'playing';
      setIsPlaying(true);
    };

    const loadSavedGame = () => {
      const saved = readSavedGame();
      if (!saved) return;

      game.room = saved.room;
      game.x = saved.x ?? centerSpawnX;
      game.y = saved.y ?? centerSpawnY;
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
    };

    const respawnAtLastCheckpoint = () => {
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
    };

    const teleportToRoom = (targetRoom) => {
      game.room = targetRoom;
      game.x = centerSpawnX;
      game.y = centerSpawnY;
      game.bullets = [];
      game.isAttacking = false;
      game.attackFrame = 0;
      game.isMapOpen = false;
      game.hoveredMapRoom = null;

      if (targetRoom === 'bottom') {
        saveCheckpointAtSouth();
      }
    };

    returnToMenuRef.current = () => {
      game.screen = 'menu';
      game.isMapOpen = false;
      game.dialogue.active = false;
      game.isAttacking = false;
      game.attackFrame = 0;
      game.keys = {};
      setIsPlaying(false);
    };

    // Cajas de colisión (hitboxes)
    const getPlayerBox = (px = game.x, py = game.y) => ({
      x: px + 14,
      y: py + 16,
      w: DRAW_SIZE - 28,
      h: drawH - 22,
    });

    const getEnemyBox = () => ({
      x: game.northEnemy.x,
      y: game.northEnemy.y,
      w: game.northEnemy.size,
      h: game.northEnemy.size,
    });

    const getChestBox = () => ({
      x: game.eastChest.x,
      y: game.eastChest.y,
      w: game.eastChest.size,
      h: game.eastChest.size,
    });

    const getNpcBox = () => ({
      x: game.westNpc.x + 14,
      y: game.westNpc.y + 16,
      w: game.westNpc.w - 28,
      h: game.westNpc.h - 22,
    });

    const isNear = (a, b, margin = 36) =>
      rectsOverlap(a, {
        x: b.x - margin,
        y: b.y - margin,
        w: b.w + margin * 2,
        h: b.h + margin * 2,
      });

    const hitsRoomObstacle = (px, py) => {
      const pBox = getPlayerBox(px, py);
      if (game.room === 'top' && game.northEnemy.hp > 0) {
        return rectsOverlap(pBox, getEnemyBox());
      }
      if (game.room === 'right') {
        return rectsOverlap(pBox, getChestBox());
      }
      if (game.room === 'left') {
        return rectsOverlap(pBox, getNpcBox());
      }
      return false;
    };

    const getSwordHitbox = () => {
      const p = getPlayerBox();
      const reach = 36;
      if (game.lastCardinal === 'up') {
        return { x: p.x - 6, y: p.y - reach, w: p.w + 12, h: reach };
      }
      if (game.lastCardinal === 'down') {
        return { x: p.x - 6, y: p.y + p.h, w: p.w + 12, h: reach };
      }
      if (game.lastCardinal === 'left') {
        return { x: p.x - reach, y: p.y - 4, w: reach, h: p.h + 8 };
      }
      return { x: p.x + p.w, y: p.y - 4, w: reach, h: p.h + 8 };
    };

    const getCanvasCoords = (e) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_SIZE / rect.width;
      const scaleY = CANVAS_SIZE / rect.height;
      return {
        mx: (e.clientX - rect.left) * scaleX,
        my: (e.clientY - rect.top) * scaleY,
      };
    };

    const advanceDialogue = () => {
      const currentLine = game.dialogue.lines[game.dialogue.lineIndex] || '';
      if (game.dialogue.charIndex < currentLine.length) return;

      game.dialogue.lineIndex += 1;
      if (game.dialogue.lineIndex >= game.dialogue.lines.length) {
        game.dialogue.active = false;
        game.keys = {};
      } else {
        game.dialogue.charIndex = 0;
        game.dialogue.timer = 0;
      }
    };

    const handleKeyDown = (e) => {
      startMusic();

      if (e.key.toLowerCase() === 'm') {
        bgMusic.muted = !bgMusic.muted;
        return;
      }

      if (game.dialogue.active) {
        e.preventDefault();
        advanceDialogue();
        return;
      }

      if (game.screen === 'menu') {
        if (e.key === 'ArrowUp' || e.key.toLowerCase() === 'w') {
          e.preventDefault();
          game.menuSelected = 0;
        } else if (e.key === 'ArrowDown' || e.key.toLowerCase() === 's') {
          e.preventDefault();
          if (readSavedGame()) game.menuSelected = 1;
        } else if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (game.menuSelected === 0) {
            startNewGame();
          } else if (game.menuSelected === 1 && readSavedGame()) {
            loadSavedGame();
          }
        }
        return;
      }

      if (e.key === 'Tab') {
        e.preventDefault();
        if (!e.repeat) {
          game.isMapOpen = !game.isMapOpen;
          game.hoveredMapRoom = null;
        }
        return;
      }

      if (!game.isMapOpen && e.key.toLowerCase() === 'e') {
        if (game.room === 'right' && isNear(getPlayerBox(), getChestBox())) {
          game.eastChest.isOpen = !game.eastChest.isOpen;
          return;
        }

        if (game.room === 'left' && isNear(getPlayerBox(), getNpcBox())) {
          game.dialogue = {
            active: true,
            lines: [
              'hello world',
              'perdon fue un chiste, como sea quieres ir a ver mi cuarto?',
            ],
            lineIndex: 0,
            charIndex: 0,
            timer: 0,
          };
          game.keys = {};
          game.isMoving = false;
          return;
        }
      }

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }
      game.keys[e.key.toLowerCase()] = true;
    };

    const handleKeyUp = (e) => {
      game.keys[e.key.toLowerCase()] = false;
    };

    const handleWindowBlur = () => {
      game.keys = {};
    };

    const handleMouseMove = (e) => {
      const { mx, my } = getCanvasCoords(e);

      if (game.screen === 'menu') {
        if (pointInRect(mx, my, MENU_BUTTONS.newGame)) {
          game.menuHovered = 'newGame';
          game.menuSelected = 0;
        } else if (pointInRect(mx, my, MENU_BUTTONS.loadGame)) {
          game.menuHovered = 'loadGame';
          if (readSavedGame()) game.menuSelected = 1;
        } else {
          game.menuHovered = null;
        }
        return;
      }

      if (!game.isMapOpen) {
        game.hoveredMapRoom = null;
        return;
      }

      let found = null;
      for (const [roomKey, rect] of Object.entries(MAP_ROOMS)) {
        if (pointInRect(mx, my, rect)) {
          found = roomKey;
          break;
        }
      }
      game.hoveredMapRoom = found;
    };

    const handleMouseDown = (e) => {
      startMusic();
      const { mx, my } = getCanvasCoords(e);

      if (game.screen === 'menu') {
        if (pointInRect(mx, my, MENU_BUTTONS.newGame)) {
          startNewGame();
          return;
        }
        if (pointInRect(mx, my, MENU_BUTTONS.loadGame) && readSavedGame()) {
          loadSavedGame();
          return;
        }
        return;
      }

      if (game.dialogue.active) {
        advanceDialogue();
        return;
      }

      if (game.isMapOpen) {
        for (const [roomKey, rect] of Object.entries(MAP_ROOMS)) {
          if (pointInRect(mx, my, rect)) {
            teleportToRoom(roomKey);
            return;
          }
        }
        return;
      }

      if (!game.isAttacking) {
        game.isAttacking = true;
        game.attackHasHit = false;
        game.attackFrame = 0;
        game.attackTimer = 0;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleWindowBlur);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);

    let animationFrameId;

    const update = () => {
      if (game.screen !== 'playing' || game.isMapOpen) return;

      if (game.dialogue.active) {
        const currentLine = game.dialogue.lines[game.dialogue.lineIndex] || '';
        if (game.dialogue.charIndex < currentLine.length) {
          game.dialogue.timer += 1;
          if (game.dialogue.timer >= 2) {
            game.dialogue.timer = 0;
            game.dialogue.charIndex += 1;
          }
        }
        return;
      }

      if (game.saveNoticeTimer > 0) game.saveNoticeTimer -= 1;
      if (game.playerHitFlash > 0) game.playerHitFlash -= 1;
      if (game.northEnemy.hitFlash > 0) game.northEnemy.hitFlash -= 1;

      if (game.isAttacking) {
        const frames = ATTACK_ANIMS[game.lastCardinal] || ATTACK_ANIMS.down;
        game.attackTimer += 1;

        if (
          !game.attackHasHit &&
          game.room === 'top' &&
          game.northEnemy.hp > 0
        ) {
          if (rectsOverlap(getSwordHitbox(), getEnemyBox())) {
            game.attackHasHit = true;
            game.northEnemy.hp -= 1;
            game.northEnemy.hitFlash = 10;
            if (game.northEnemy.hp <= 0) {
              game.northEnemy.hp = 0;
              game.bullets = [];
            }
          }
        }

        if (game.attackTimer >= 5) {
          game.attackTimer = 0;
          game.attackFrame += 1;
          if (game.attackFrame >= frames.length) {
            game.isAttacking = false;
            game.attackFrame = 0;
          }
        }
      }

      let dx = 0;
      let dy = 0;

      if (game.keys['arrowup'] || game.keys['w']) dy -= 1;
      if (game.keys['arrowdown'] || game.keys['s']) dy += 1;
      if (game.keys['arrowleft'] || game.keys['a']) dx -= 1;
      if (game.keys['arrowright'] || game.keys['d']) dx += 1;

      game.isMoving = dx !== 0 || dy !== 0;

      if (game.isMoving && !game.isAttacking) {
        const key = `${dx},${dy}`;
        if (WALK_ANIMS[key]) {
          game.dirKey = key;
        }

        if (dy < 0) game.lastCardinal = 'up';
        else if (dy > 0) game.lastCardinal = 'down';
        else if (dx < 0) game.lastCardinal = 'left';
        else if (dx > 0) game.lastCardinal = 'right';

        const len = Math.hypot(dx, dy);
        const vx = (dx / len) * SPEED;
        const vy = (dy / len) * SPEED;

        const prevX = game.x;
        game.x += vx;
        if (hitsRoomObstacle(game.x, game.y)) {
          game.x = prevX;
        }

        const prevY = game.y;
        game.y += vy;
        if (hitsRoomObstacle(game.x, game.y)) {
          game.y = prevY;
        }

        game.animTimer += 1;
        if (game.animTimer >= 8) {
          game.animTimer = 0;
          game.animIndex = (game.animIndex + 1) % 3;
        }
      } else if (!game.isAttacking) {
        game.animIndex = 1;
        game.animTimer = 0;
      }

      const maxPosX = CANVAS_SIZE - DRAW_SIZE;
      const maxPosY = CANVAS_SIZE - drawH;
      const offset = 6;

      if (game.room === 'center') {
        if (game.y <= 0) {
          game.room = 'top';
          game.y = maxPosY - offset;
        } else if (game.y >= maxPosY) {
          game.room = 'bottom';
          game.y = offset;
          saveCheckpointAtSouth();
        } else if (game.x <= 0) {
          game.room = 'left';
          game.x = maxPosX - offset;
        } else if (game.x >= maxPosX) {
          game.room = 'right';
          game.x = offset;
        }
      } else if (game.room === 'top') {
        if (game.y >= maxPosY) {
          game.room = 'center';
          game.y = offset;
          game.bullets = [];
        }
        if (game.y < 0) game.y = 0;
        if (game.x < 0) game.x = 0;
        if (game.x > maxPosX) game.x = maxPosX;

        const enemy = game.northEnemy;

        if (enemy.hp > 0) {
          enemy.shootTimer += 1;
          if (enemy.shootTimer >= 70) {
            enemy.shootTimer = 0;
            const bulletSize = 20;
            const startX = enemy.x + enemy.size / 2 - bulletSize / 2;
            const startY = enemy.y + enemy.size / 2 - bulletSize / 2;

            const targetX = game.x + DRAW_SIZE / 2 - bulletSize / 2;
            const targetY = game.y + drawH / 2 - bulletSize / 2;
            const angle = Math.atan2(targetY - startY, targetX - startX);
            const bulletSpeed = 5;

            game.bullets.push({
              x: startX,
              y: startY,
              vx: Math.cos(angle) * bulletSpeed,
              vy: Math.sin(angle) * bulletSpeed,
              size: bulletSize,
            });
          }
        }

        const pBox = getPlayerBox();
        const remainingBullets = [];

        for (const b of game.bullets) {
          b.x += b.vx;
          b.y += b.vy;

          const bBox = { x: b.x, y: b.y, w: b.size, h: b.size };

          if (rectsOverlap(pBox, bBox)) {
            game.playerHp -= 1;
            game.playerHitFlash = 14;

            if (game.playerHp <= 0) {
              respawnAtLastCheckpoint();
              return;
            }
          } else if (
            b.x > -b.size &&
            b.x < CANVAS_SIZE &&
            b.y > -b.size &&
            b.y < CANVAS_SIZE
          ) {
            remainingBullets.push(b);
          }
        }

        game.bullets = remainingBullets;
      } else if (game.room === 'bottom') {
        if (game.y <= 0) {
          game.room = 'center';
          game.y = maxPosY - offset;
        }
        if (game.y > maxPosY) game.y = maxPosY;
        if (game.x < 0) game.x = 0;
        if (game.x > maxPosX) game.x = maxPosX;
      } else if (game.room === 'left') {
        if (game.x >= maxPosX) {
          game.room = 'center';
          game.x = offset;
        }
        if (game.x < 0) game.x = 0;
        if (game.y < 0) game.y = 0;
        if (game.y > maxPosY) game.y = maxPosY;
      } else if (game.room === 'right') {
        if (game.x <= 0) {
          game.room = 'center';
          game.x = maxPosX - offset;
        }
        if (game.x > maxPosX) game.x = maxPosX;
        if (game.y < 0) game.y = 0;
        if (game.y > maxPosY) game.y = maxPosY;
      }
    };

    const drawStartMenu = () => {
      ctx.fillStyle = '#141418';
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      const hasSave = Boolean(readSavedGame());

      const drawButton = (btn, index, enabled) => {
        const isActive =
          enabled &&
          ((index === 0 && (game.menuHovered === 'newGame' || game.menuSelected === 0)) ||
            (index === 1 && (game.menuHovered === 'loadGame' || game.menuSelected === 1)));

        ctx.fillStyle = !enabled
          ? '#1e1e24'
          : isActive
          ? '#d63031'
          : '#25252d';
        ctx.fillRect(btn.x, btn.y, btn.w, btn.h);

        ctx.strokeStyle = !enabled
          ? '#3a3a44'
          : isActive
          ? '#ffffff'
          : '#777788';
        ctx.lineWidth = 3;
        ctx.strokeRect(btn.x, btn.y, btn.w, btn.h);

        ctx.fillStyle = !enabled ? '#555562' : '#ffffff';
        ctx.font = 'bold 17px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(btn.label, btn.x + btn.w / 2, btn.y + btn.h / 2);
      };

      drawButton(MENU_BUTTONS.newGame, 0, true);
      drawButton(MENU_BUTTONS.loadGame, 1, hasSave);
    };

    const drawMapOverlay = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      ctx.fillStyle = '#000000';
      MAP_CONNECTORS.forEach((conn) => {
        ctx.fillRect(conn.x, conn.y, conn.w, conn.h);
      });

      for (const [roomKey, rect] of Object.entries(MAP_ROOMS)) {
        const isCurrent = game.room === roomKey;
        const isHovered = game.hoveredMapRoom === roomKey;

        ctx.fillStyle = '#5c0d0d';
        ctx.fillRect(rect.x, rect.y, rect.w, rect.h);

        ctx.fillStyle = isHovered ? '#b82525' : '#8e1b1b';
        ctx.fillRect(rect.x + 6, rect.y + 6, rect.w - 12, rect.h - 12);

        if (isCurrent) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 3;
          ctx.strokeRect(rect.x + 1.5, rect.y + 1.5, rect.w - 3, rect.h - 3);
        }
      }
    };

    const drawDialogueBox = () => {
      const boxX = 16;
      const boxY = CANVAS_SIZE - 144;
      const boxW = CANVAS_SIZE - 32;
      const boxH = 128;

      ctx.fillStyle = '#000000';
      ctx.fillRect(boxX, boxY, boxW, boxH);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.strokeRect(boxX, boxY, boxW, boxH);

      if (cleanSheet) {
        ctx.imageSmoothingEnabled = false;
        const frameW = cleanSheet.width / COLS;
        const frameH = cleanSheet.height / ROWS;
        const [r, c] = game.westNpc.sprite;
        ctx.drawImage(
          cleanSheet,
          c * frameW,
          r * frameH,
          frameW,
          frameH,
          boxX + 14,
          boxY + 14,
          76,
          Math.round(76 * (frameH / frameW))
        );
      }

      const currentLine = game.dialogue.lines[game.dialogue.lineIndex] || '';
      const visibleText = currentLine.slice(0, game.dialogue.charIndex);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 15px monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';

      const textX = boxX + 106;
      const maxTextW = boxW - 124;
      const words = visibleText.split(' ');
      let line = '';
      let lineY = boxY + 22;

      for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + ' ';
        if (ctx.measureText(testLine).width > maxTextW && i > 0) {
          ctx.fillText(line.trim(), textX, lineY);
          line = words[i] + ' ';
          lineY += 24;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line.trim(), textX, lineY);
    };

    const draw = () => {
      if (game.screen === 'menu') {
        drawStartMenu();
        return;
      }

      ctx.fillStyle = ROOMS[game.room].color;
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      if (game.room === 'top') {
        const enemy = game.northEnemy;

        if (enemy.hp > 0) {
          ctx.fillStyle = enemy.hitFlash > 0 ? '#ffffff' : '#000000';
          ctx.fillRect(enemy.x, enemy.y, enemy.size, enemy.size);

          const barW = enemy.size;
          const barH = 7;
          const barY = enemy.y - 12;
          ctx.fillStyle = '#111111';
          ctx.fillRect(enemy.x - 1, barY - 1, barW + 2, barH + 2);
          ctx.fillStyle = '#ff4757';
          ctx.fillRect(
            enemy.x,
            barY,
            Math.round((enemy.hp / MAX_ENEMY_HP) * barW),
            barH
          );
        }

        ctx.fillStyle = '#000000';
        game.bullets.forEach((b) => {
          ctx.fillRect(Math.round(b.x), Math.round(b.y), b.size, b.size);
        });
      }

      if (game.room === 'right') {
        const c = game.eastChest;
        ctx.fillStyle = '#111111';
        ctx.fillRect(c.x - 2, c.y - 2, c.size + 4, c.size + 4);
        ctx.fillStyle = c.isOpen ? '#2ecc71' : '#8B4513';
        ctx.fillRect(c.x, c.y, c.size, c.size);
      }

      if (game.room === 'left' && cleanSheet) {
        ctx.imageSmoothingEnabled = false;
        const frameW = cleanSheet.width / COLS;
        const frameH = cleanSheet.height / ROWS;
        const [r, col] = game.westNpc.sprite;
        ctx.drawImage(
          cleanSheet,
          col * frameW,
          r * frameH,
          frameW,
          frameH,
          game.westNpc.x,
          game.westNpc.y,
          game.westNpc.w,
          game.westNpc.h
        );
      }

      const skipFrameForFlash =
        game.playerHitFlash > 0 && Math.floor(game.playerHitFlash / 2) % 2 === 0;

      if (!skipFrameForFlash) {
        if (cleanSheet) {
          ctx.imageSmoothingEnabled = false;

          const frameW = cleanSheet.width / COLS;
          const frameH = cleanSheet.height / ROWS;

          const attackFrames = ATTACK_ANIMS[game.lastCardinal] || ATTACK_ANIMS.down;
          const safeAttackIdx = Math.min(game.attackFrame, attackFrames.length - 1);
          const walkFrames = WALK_ANIMS[game.dirKey] || WALK_ANIMS['0,1'];

          const [row, col] = game.isAttacking
            ? attackFrames[safeAttackIdx]
            : walkFrames[game.animIndex % walkFrames.length];

          ctx.drawImage(
            cleanSheet,
            col * frameW,
            row * frameH,
            frameW,
            frameH,
            Math.round(game.x),
            Math.round(game.y),
            DRAW_SIZE,
            drawH
          );
        } else {
          ctx.fillStyle = '#000000';
          ctx.fillRect(game.x, game.y, DRAW_SIZE, DRAW_SIZE);
        }
      }

      // HUD de corazones
      const heartWidth = 24;
      const heartGap = 8;
      const startHeartsX =
        CANVAS_SIZE - 14 - (MAX_PLAYER_HP * heartWidth + (MAX_PLAYER_HP - 1) * heartGap);

      for (let i = 0; i < MAX_PLAYER_HP; i++) {
        const hx = startHeartsX + i * (heartWidth + heartGap);
        const hy = 14;
        drawPixelHeart(ctx, hx, hy, i < game.playerHp);
      }

      // Aviso breve al guardar partida
      if (game.saveNoticeTimer > 0) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(14, 14, 152, 26);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('Partida guardada', 24, 27);
      }

      if (game.dialogue.active) {
        drawDialogueBox();
      }

      if (game.isMapOpen) {
        drawMapOverlay();
      }
    };

    const loop = () => {
      update();
      draw();
      animationFrameId = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      bgMusic.pause();
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleWindowBlur);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mousedown', handleMouseDown);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        gap: '16px',
      }}
    >
      {/* Columna izquierda: botón de regreso pegado a la esquina superior derecha */}
      <div
        style={{
          width: '180px',
          display: 'flex',
          justifyContent: 'flex-end',
        }}
      >
        {isPlaying && (
          <button
            type="button"
            onClick={(e) => {
              e.currentTarget.blur();
              if (returnToMenuRef.current) {
                returnToMenuRef.current();
              }
            }}
            title="Volver al menú"
            style={{
              width: '38px',
              height: '38px',
              backgroundColor: '#1e1e24',
              color: '#ffffff',
              border: '3px solid #ffffff',
              fontFamily: 'monospace',
              fontSize: '18px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
            }}
          >
            ←
          </button>
        )}
      </div>

      {/* Centro: pantalla principal del juego */}
      <canvas
        ref={canvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        style={{
          border: '4px solid #ffffff',
          display: 'block',
          imageRendering: 'pixelated',
          cursor: 'pointer',
        }}
      />

      {/* Columna derecha: leyenda de controles */}
      <div
        style={{
          width: '180px',
          backgroundColor: '#141418',
          border: '3px solid #ffffff',
          padding: '12px 14px',
          color: '#ffffff',
          fontFamily: 'monospace',
          fontSize: '13px',
          lineHeight: '1.8',
          textAlign: 'left',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ fontWeight: 'bold', marginBottom: '6px', color: '#fdcb6e' }}>
          CONTROLES
        </div>
        <div>W - Arriba</div>
        <div>S - Abajo</div>
        <div>A - Izquierda</div>
        <div>D - Derecha</div>
        <div>E - Interactuar</div>
        <div>Clic izq - Atacar</div>
        <div>Tab - Mapa</div>
        <div>M - Mutear</div>
      </div>
    </div>
  );
}