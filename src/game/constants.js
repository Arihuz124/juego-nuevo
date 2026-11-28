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
  // Cuartos exteriores (según el nuevo mapa)
  left:      { color: '#6c5ce7', bgSrc: null, mapRoom: 'left' },      // Extremo izquierdo (Inicio)
  center:    { color: '#d63031', bgSrc: null, mapRoom: 'center' },    // Cruce central
  top:       { color: '#00b894', bgSrc: null, mapRoom: 'top' },       // Norte
  bottom:    { color: '#0984e3', bgSrc: null, mapRoom: 'bottom' },    // Sur (Punto de guardado)
  right:     { color: '#fdcb6e', bgSrc: null, mapRoom: 'right' },     // Este 1 (Interruptor)
  far_right: { color: '#e17055', bgSrc: null, mapRoom: 'far_right' }, // Extremo derecho

  // Interiores de casas (sub-cuartos: mantienen iluminada su zona exterior en el mapa)
  left_house:      { color: '#4b3f9e', bgSrc: null, mapRoom: 'left',      isInterior: true },
  center_house:    { color: '#8c1d1e', bgSrc: null, mapRoom: 'center',    isInterior: true },
  top_house:       { color: '#00735c', bgSrc: null, mapRoom: 'top',       isInterior: true },
  bottom_house:    { color: '#06528c', bgSrc: null, mapRoom: 'bottom',    isInterior: true },
  right_house:     { color: '#b38b36', bgSrc: null, mapRoom: 'right',     isInterior: true },
  far_right_house: { color: '#9c4732', bgSrc: null, mapRoom: 'far_right', isInterior: true },
};

// Puertas específicas entre cuartos exteriores (ya no se cruza por todo el borde)
export function getRoomDoors(room, width, height) {
  const cx = Math.round(width / 2);
  const cy = Math.round(height / 2);
  const doorW = 84;
  const doorH = 26;

  const doorsByRoom = {
    left: [
      { id: 'left_to_center', side: 'right', x: width - doorH, y: cy - doorW / 2, w: doorH, h: doorW, targetRoom: 'center', walkDir: [1, 0], connectorId: 'left-center' },
    ],
    center: [
      { id: 'center_to_left',   side: 'left',   x: 0,              y: cy - doorW / 2, w: doorH, h: doorW, targetRoom: 'left',   walkDir: [-1, 0], connectorId: 'left-center' },
      { id: 'center_to_top',    side: 'top',    x: cx - doorW / 2, y: 0,              w: doorW, h: doorH, targetRoom: 'top',    walkDir: [0, -1], connectorId: 'center-top' },
      { id: 'center_to_bottom', side: 'bottom', x: cx - doorW / 2, y: height - doorH, w: doorW, h: doorH, targetRoom: 'bottom', walkDir: [0, 1],  connectorId: 'center-bottom' },
      { id: 'center_to_right',  side: 'right',  x: width - doorH,  y: cy - doorW / 2, w: doorH, h: doorW, targetRoom: 'right',  walkDir: [1, 0],  connectorId: 'center-right' },
    ],
    top: [
      { id: 'top_to_center', side: 'bottom', x: cx - doorW / 2, y: height - doorH, w: doorW, h: doorH, targetRoom: 'center', walkDir: [0, 1], connectorId: 'center-top' },
    ],
    bottom: [
      { id: 'bottom_to_center', side: 'top', x: cx - doorW / 2, y: 0, w: doorW, h: doorH, targetRoom: 'center', walkDir: [0, -1], connectorId: 'center-bottom' },
    ],
    right: [
      { id: 'right_to_center',    side: 'left',  x: 0,             y: cy - doorW / 2, w: doorH, h: doorW, targetRoom: 'center',    walkDir: [-1, 0], connectorId: 'center-right' },
      // Puerta condicionada: requiere presionar el botón del cuarto derecho (aquí a futuro también condición de jefe)
      { id: 'right_to_far_right', side: 'right', x: width - doorH, y: cy - doorW / 2, w: doorH, h: doorW, targetRoom: 'far_right', walkDir: [1, 0],  connectorId: 'right-far_right', requiresSwitch: true },
    ],
    far_right: [
      { id: 'far_right_to_right', side: 'left', x: 0, y: cy - doorW / 2, w: doorH, h: doorW, targetRoom: 'right', walkDir: [-1, 0], connectorId: 'right-far_right' },
    ],
  };

  return doorsByRoom[room] || [];
}

// Cuadro negro de entrada/salida de casa en cada cuarto
export function getHousePortal(room, width, height) {
  const cx = Math.round(width / 2);
  const portalW = 54;
  const portalH = 44;

  // Si es un cuarto exterior, devuelve la entrada a su casa interior
  if (ROOMS[room] && !ROOMS[room].isInterior) {
    return {
      type: 'enter',
      x: Math.round(width * 0.24),
      y: 72,
      w: portalW,
      h: portalH,
      targetRoom: `${room}_house`,
      walkDir: [0, -1],
    };
  }

  // Si es un interior, devuelve la salida abajo al centro hacia el cuarto exterior
  if (ROOMS[room]?.isInterior) {
    return {
      type: 'exit',
      x: cx - portalW / 2,
      y: height - portalH - 12,
      w: portalW,
      h: portalH,
      targetRoom: ROOMS[room].mapRoom,
      walkDir: [0, 1],
    };
  }

  return null;
}

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
  const cx = Math.round(width / 2) - 55;
  const cy = Math.round(height / 2);
  const size = 76;
  const gap = 28;
  const step = size + gap;

  const rooms = {
    left:      { x: cx - step,     y: cy - size / 2,        w: size, h: size },
    center:    { x: cx,            y: cy - size / 2,        w: size, h: size },
    top:       { x: cx,            y: cy - size / 2 - step, w: size, h: size },
    bottom:    { x: cx,            y: cy - size / 2 + step, w: size, h: size },
    right:     { x: cx + step,     y: cy - size / 2,        w: size, h: size },
    far_right: { x: cx + step * 2, y: cy - size / 2,        w: size, h: size },
  };

  const connectors = [
    { id: 'left-center',     x: cx - gap,            y: cy - 12,        w: gap, h: 24 },
    { id: 'center-top',      x: cx + size / 2 - 12,  y: cy - size / 2 - gap, w: 24,  h: gap },
    { id: 'center-bottom',   x: cx + size / 2 - 12,  y: cy + size / 2,  w: 24,  h: gap },
    { id: 'center-right',    x: cx + size,           y: cy - 12,        w: gap, h: 24 },
    { id: 'right-far_right', x: cx + size + step,    y: cy - 12,        w: gap, h: 24 },
    // Pasillo derecho saliendo de far_right para futura expansión del mapa
    { id: 'far_right-next',  x: cx + size + step * 2, y: cy - 12,       w: gap, h: 24, lockedFuture: true },
  ];

  return { rooms, connectors };
}

// aquí para futuros implementos de configuración de jefes, bloques y objetos