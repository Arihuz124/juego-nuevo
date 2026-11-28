export const DEFAULT_WIDTH = typeof window !== 'undefined' ? window.innerWidth : 960;
export const DEFAULT_HEIGHT = typeof window !== 'undefined' ? window.innerHeight : 540;
export const DRAW_SIZE = 64;
export const DRAW_H = Math.round(DRAW_SIZE * (219 / 172));
export const SPEED = 4;

export const MAX_PLAYER_HEARTS = 7;
export const MAX_PLAYER_HP = MAX_PLAYER_HEARTS * 2;
export const MAX_ENEMY_HP = 7;
export const SAVE_KEY = 'juego_princesa_save_unico';

export const COLS = 12;
export const ROWS = 10;

export const WALK_ANIMS = {
  '0,-1':  [[0, 0], [0, 8],  [1, 4]],   // Arriba
  '1,-1':  [[0, 1], [0, 9],  [1, 5]],   // Arriba-Derecha
  '1,0':   [[0, 2], [0, 10], [1, 6]],   // Derecha
  '1,1':   [[0, 3], [0, 11], [1, 7]],   // Abajo-Derecha
  '0,1':   [[0, 4], [1, 0],  [1, 8]],   // Abajo
  '-1,1':  [[0, 5], [1, 1],  [1, 9]],   // Abajo-Izquierda
  '-1,0':  [[0, 6], [1, 2],  [1, 10]],  // Izquierda
  '-1,-1': [[0, 7], [1, 3],  [1, 11]],  // Arriba-Izquierda
};

export const ATTACK_ANIMS = {
  up:    [[4, 2], [4, 5], [4, 1]], 
  down:  [[5, 6], [4, 3], [5, 8], [5, 9]],
  right: [[7, 6], [8, 2], [8, 4], [9, 0]],
  left:  [[7, 1], [7, 7], [6, 11]],
};

export const ROOMS = {
  // Cuando tengas el paisaje de cada cuarto, cambia bgSrc: null por ej. './assets/backgrounds/center.png'
  center: { color: '#d63031', bgSrc: null }, // Rojo
  top:    { color: '#00b894', bgSrc: null }, // Verde (Norte)
  bottom: { color: '#0984e3', bgSrc: null }, // Azul (Sur - Punto de guardado)
  left:   { color: '#6c5ce7', bgSrc: null }, // Morado (Oeste)
  right:  { color: '#fdcb6e', bgSrc: null }, // Amarillo (Este)
};

export function getMenuButtons(width, height) {
  const cx = Math.round(width / 2);
  const cy = Math.round(height / 2);
  const btnW = 240;
  const btnH = 46;
  return {
    newGame:  { x: cx - btnW / 2, y: cy - 52, w: btnW, h: btnH, label: 'Partida nueva' },
    loadGame: { x: cx - btnW / 2, y: cy + 12, w: btnW, h: btnH, label: 'Cargar partida' },
  };
}

export function getMapLayout(width, height) {
  const cx = Math.round(width / 2);
  const cy = Math.round(height / 2);

  const rooms = {
    center: { x: cx - 55,  y: cy - 55,  w: 110, h: 110 },
    top:    { x: cx - 55,  y: cy - 167, w: 110, h: 76 },
    bottom: { x: cx - 55,  y: cy + 91,  w: 110, h: 76 },
    left:   { x: cx - 167, y: cy - 55,  w: 76,  h: 110 },
    right:  { x: cx + 91,  y: cy - 55,  w: 76,  h: 110 },
  };

  const connectors = [
    { x: cx - 14, y: cy - 91, w: 28, h: 36 },
    { x: cx - 14, y: cy + 55, w: 28, h: 36 },
    { x: cx - 91, y: cy - 14, w: 36, h: 28 },
    { x: cx + 55, y: cy - 14, w: 36, h: 28 },
  ];

  return { rooms, connectors };
}

// aquí para futuros implementos de configuración de jefes, bloques y objetos