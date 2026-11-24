import { DRAW_SIZE, DRAW_H } from './constants';

export function rectsOverlap(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

export function pointInRect(px, py, r) {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

export function getPlayerBox(game, px = game.x, py = game.y) {
  return {
    x: px + 14,
    y: py + 16,
    w: DRAW_SIZE - 28,
    h: DRAW_H - 22,
  };
}

export function getEnemyBox(game) {
  return {
    x: game.northEnemy.x,
    y: game.northEnemy.y,
    w: game.northEnemy.size,
    h: game.northEnemy.size,
  };
}

export function getChestBox(game) {
  return {
    x: game.eastChest.x,
    y: game.eastChest.y,
    w: game.eastChest.size,
    h: game.eastChest.size,
  };
}

export function getNpcBox(game) {
  return {
    x: game.westNpc.x + 14,
    y: game.westNpc.y + 16,
    w: game.westNpc.w - 28,
    h: game.westNpc.h - 22,
  };
}

export function isNear(a, b, margin = 36) {
  return rectsOverlap(a, {
    x: b.x - margin,
    y: b.y - margin,
    w: b.w + margin * 2,
    h: b.h + margin * 2,
  });
}

export function hitsRoomObstacle(game, px, py) {
  const pBox = getPlayerBox(game, px, py);
  if (game.room === 'top' && game.northEnemy.hp > 0) {
    return rectsOverlap(pBox, getEnemyBox(game));
  }
  if (game.room === 'right') {
    return rectsOverlap(pBox, getChestBox(game));
  }
  if (game.room === 'left') {
    return rectsOverlap(pBox, getNpcBox(game));
  }
  // aquí para futuros implementos de colisiones con bloques empujables y paredes de escenarios
  return false;
}

export function getSwordHitbox(game) {
  const p = getPlayerBox(game);
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
}