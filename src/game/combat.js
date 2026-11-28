import { DRAW_SIZE, DRAW_H } from './constants';
import { rectsOverlap, getPlayerBox } from './physics';
import { respawnAtLastCheckpoint } from './state';

export function updateCombat(game) {
  if (game.room !== 'top') return;

  const enemy = game.northEnemy;

  if (enemy.hp > 0) {
    enemy.shootTimer += 1;
    if (enemy.shootTimer >= 70) {
      enemy.shootTimer = 0;
      const bulletSize = 20;
      const startX = enemy.x + enemy.size / 2 - bulletSize / 2;
      const startY = enemy.y + enemy.size / 2 - bulletSize / 2;

      const targetX = game.x + DRAW_SIZE / 2 - bulletSize / 2;
      const targetY = game.y + DRAW_H / 2 - bulletSize / 2;
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

  const pBox = getPlayerBox(game);
  const remainingBullets = [];

  for (const b of game.bullets) {
    b.x += b.vx;
    b.y += b.vy;

    const bBox = { x: b.x, y: b.y, w: b.size, h: b.size };

    if (rectsOverlap(pBox, bBox)) {
      game.playerHp -= 1;
      game.playerHitFlash = 14;
      // aquí para futuros implementos de sonido de daño recibido

      if (game.playerHp <= 0) {
        respawnAtLastCheckpoint(game);
        return;
      }
    } else if (
      b.x > -b.size &&
      b.x < game.width &&
      b.y > -b.size &&
      b.y < game.height
    ) {
      remainingBullets.push(b);
    }
  }

  game.bullets = remainingBullets;

  // aquí para futuros implementos de jefes con múltiples fases y patrones de ataque
}