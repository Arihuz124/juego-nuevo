import {
  DRAW_SIZE,
  DRAW_H,
  SPEED,
  WALK_ANIMS,
  ATTACK_ANIMS,
} from './constants';
import {
  rectsOverlap,
  hitsRoomObstacle,
  getSwordHitbox,
  getEnemyBox,
} from './physics';
import { saveCheckpointAtSouth } from './state';

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
  const offset = 6;

  if (game.room === 'center') {
    if (game.y <= 0) {
      game.room = 'top';
      game.y = maxPosY - offset;
    } else if (game.y >= maxPosY) {
      game.room = 'bottom';
      game.y = offset;
      saveCheckpointAtSouth(game);
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
}