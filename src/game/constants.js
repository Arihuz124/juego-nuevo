export const CANVAS_SIZE = 500;
export const DRAW_SIZE = 64;
export const DRAW_H = Math.round(DRAW_SIZE * (219 / 172));
export const SPEED = 4;

export const MAX_PLAYER_HP = 3;
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
  up:    [[5,9], [4, 5], [4, 1]], //4 , 2
  down:  [[5, 6], [4, 3], [5, 8], [5, 9]],
  right: [[7, 6], [8, 2], [8, 4], [9, 0]],
  left:  [[7, 1], [7, 7], [6, 11]],
};

export const ROOMS = {
  center: { color: '#d63031' }, // Rojo
  top:    { color: '#00b894' }, // Verde (Norte)
  bottom: { color: '#0984e3' }, // Azul (Sur - Punto de guardado)
  left:   { color: '#6c5ce7' }, // Morado (Oeste)
  right:  { color: '#fdcb6e' }, // Amarillo (Este)
};

export const MENU_BUTTONS = {
  newGame:  { x: 130, y: 198, w: 240, h: 46, label: 'Partida nueva' },
  loadGame: { x: 130, y: 262, w: 240, h: 46, label: 'Cargar partida' },
};

export const MAP_ROOMS = {
  center: { x: 195, y: 195, w: 110, h: 110 },
  top:    { x: 195, y: 83,  w: 110, h: 76 },
  bottom: { x: 195, y: 341, w: 110, h: 76 },
  left:   { x: 83,  y: 195, w: 76,  h: 110 },
  right:  { x: 341, y: 195, w: 76,  h: 110 },
};

export const MAP_CONNECTORS = [
  { x: 236, y: 159, w: 28, h: 36 },
  { x: 236, y: 305, w: 28, h: 36 },
  { x: 159, y: 236, w: 36, h: 28 },
  { x: 305, y: 236, w: 36, h: 28 },
];

// aquí para futuros implementos de configuración de jefes, bloques y objetos