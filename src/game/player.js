import {
  DRAW_SIZE,
  DRAW_H,
  SPEED,
  WALK_ANIMS,
  ATTACK_ANIMS,
  getRoomDoors,
  getHousePortal,
} from './constants';
import {
  rectsOverlap,
  hitsRoomObstacle,
  getSwordHitbox,
  getEnemyBox,
  getPlayerBox,
  isDoorUnlocked,
} from './physics';
import { saveCheckpointAtSouth, startAutoWalk } from './state';

export function updatePlayer(game) {
  if (game.isAttacking) {
    const frames = ATTACK_ANIMS[game.lastCardinal] || ATTACK_ANIMS.down;
    game.attackTimer += 1;

    if (
      !game.attackHasHit &&
      game.room === 'top' &&
      game.northEnemy.hp > 0
    ) {
      if (rectsOverlap(getSwordHitbox(game), getEnemyBox(game))) {
        game.attackHasHit = true;
        game.northEnemy.hp -= 1;
        game.northEnemy.hitFlash = 10;
        // aquí para futuros implementos de sonido de golpe con espada
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

  // Si está en caminata automática (al entrar/salir de puerta o casa), el personaje se mueve solo
  if (game.autoWalk?.active) {
    dx = game.autoWalk.dx;
    dy = game.autoWalk.dy;
    game.autoWalk.frames -= 1;
    if (game.autoWalk.frames <= 0) {
      game.autoWalk.active = false;
    }
  } else {
    if (game.keys['arrowup'] || game.keys['w']) dy -= 1;
    if (game.keys['arrowdown'] || game.keys['s']) dy += 1;
    if (game.keys['arrowleft'] || game.keys['a']) dx -= 1;
    if (game.keys['arrowright'] || game.keys['d']) dx += 1;
  }

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
    if (hitsRoomObstacle(game, game.x, game.y)) {
      game.x = prevX;
    }

    const prevY = game.y;
    game.y += vy;
    if (hitsRoomObstacle(game, game.x, game.y)) {
      game.y = prevY;
    }

    game.animTimer += 1;
    if (game.animTimer >= 8) {
      game.animTimer = 0;
      game.animIndex = (game.animIndex + 1) % 3;
      // aquí para futuros implementos de sonido de caminata (pasos)
    }
  } else if (!game.isAttacking) {
    game.animIndex = 1;
    game.animTimer = 0;
  }

  const maxPosX = game.width - DRAW_SIZE;
  const maxPosY = game.height - DRAW_H;

  // Mantener dentro de los límites de la pantalla (ya no se cruza por todo el borde)
  if (game.x < 0) game.x = 0;
  if (game.x > maxPosX) game.x = maxPosX;
  if (game.y < 0) game.y = 0;
  if (game.y > maxPosY) game.y = maxPosY;

  // Durante la caminata automática no volvemos a disparar portales ni puertas
  if (game.autoWalk?.active) return;

  const pBox = getPlayerBox(game);

  // 1. Revisar entrada o salida de casa (cuadro negro)
  const housePortal = getHousePortal(game.room, game.width, game.height);
  if (housePortal && rectsOverlap(pBox, housePortal)) {
    const targetRoom = housePortal.targetRoom;
    game.room = targetRoom;
    game.bullets = [];

    const destPortal = getHousePortal(targetRoom, game.width, game.height);
    if (housePortal.type === 'enter' && destPortal) {
      // Aparece frente a la salida interior y camina hacia arriba
      game.x = Math.round(destPortal.x + destPortal.w / 2 - DRAW_SIZE / 2);
      game.y = destPortal.y - DRAW_H - 12;
      startAutoWalk(game, 0, -1, 14);
    } else if (housePortal.type === 'exit' && destPortal) {
      // Aparece frente a la puerta de la casa en el exterior y camina hacia abajo
      game.x = Math.round(destPortal.x + destPortal.w / 2 - DRAW_SIZE / 2);
      game.y = destPortal.y + destPortal.h + 12;
      startAutoWalk(game, 0, 1, 14);
    }
    return;
  }

  // 2. Revisar puertas hacia otros cuartos exteriores
  const doors = getRoomDoors(game.room, game.width, game.height);
  for (const door of doors) {
    if (rectsOverlap(pBox, door) && isDoorUnlocked(game, door)) {
      game.room = door.targetRoom;
      game.bullets = [];
      game.visitedRooms[door.targetRoom] = true;
      if (door.connectorId) {
        game.visitedConnectors[door.connectorId] = true;
      }

      if (door.side === 'right') {
        game.x = 34;
        game.y = Math.round(game.height / 2 - DRAW_H / 2);
      } else if (door.side === 'left') {
        game.x = maxPosX - 34;
        game.y = Math.round(game.height / 2 - DRAW_H / 2);
      } else if (door.side === 'top') {
        game.x = Math.round(game.width / 2 - DRAW_SIZE / 2);
        game.y = maxPosY - 34;
      } else if (door.side === 'bottom') {
        game.x = Math.round(game.width / 2 - DRAW_SIZE / 2);
        game.y = 34;
      }

      if (door.targetRoom === 'bottom') {
        saveCheckpointAtSouth(game);
      }

      startAutoWalk(game, door.walkDir[0], door.walkDir[1], 14);
      return;
    }
  }
}