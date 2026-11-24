import {
  CANVAS_SIZE,
  DRAW_SIZE,
  DRAW_H,
  MAX_PLAYER_HP,
  MAX_ENEMY_HP,
  COLS,
  ROWS,
  WALK_ANIMS,
  ATTACK_ANIMS,
  ROOMS,
  MENU_BUTTONS,
  MAP_ROOMS,
  MAP_CONNECTORS,
} from './constants';
import { readSavedGame } from './state';

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

function drawStartMenu(ctx, game) {
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
}

function drawMapOverlay(ctx, game) {
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
}

function drawDialogueBox(ctx, game, assets) {
  const boxX = 16;
  const boxY = CANVAS_SIZE - 144;
  const boxW = CANVAS_SIZE - 32;
  const boxH = 128;

  ctx.fillStyle = '#000000';
  ctx.fillRect(boxX, boxY, boxW, boxH);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4;
  ctx.strokeRect(boxX, boxY, boxW, boxH);

  if (assets.cleanSheet) {
    ctx.imageSmoothingEnabled = false;
    const frameW = assets.cleanSheet.width / COLS;
    const frameH = assets.cleanSheet.height / ROWS;
    const [r, c] = game.westNpc.sprite;
    ctx.drawImage(
      assets.cleanSheet,
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
}

export function drawGame(ctx, game, assets) {
  if (game.screen === 'menu') {
    drawStartMenu(ctx, game);
    return;
  }

  // aquí para futuros implementos de dibujar imágenes de fondo de escenarios en lugar de color sólido
  ctx.fillStyle = ROOMS[game.room].color;
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  if (game.room === 'top') {
    const enemy = game.northEnemy;

    if (enemy.hp > 0) {
      // aquí para futuros implementos de sprites de jefes y sus ataques
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
    // aquí para futuros implementos de sprites de objetos interactuables y bloques empujables
    const c = game.eastChest;
    ctx.fillStyle = '#111111';
    ctx.fillRect(c.x - 2, c.y - 2, c.size + 4, c.size + 4);
    ctx.fillStyle = c.isOpen ? '#2ecc71' : '#8B4513';
    ctx.fillRect(c.x, c.y, c.size, c.size);
  }

  if (game.room === 'left' && assets.cleanSheet) {
    ctx.imageSmoothingEnabled = false;
    const frameW = assets.cleanSheet.width / COLS;
    const frameH = assets.cleanSheet.height / ROWS;
    const [r, col] = game.westNpc.sprite;
    ctx.drawImage(
      assets.cleanSheet,
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
    if (assets.cleanSheet) {
      ctx.imageSmoothingEnabled = false;

      const frameW = assets.cleanSheet.width / COLS;
      const frameH = assets.cleanSheet.height / ROWS;

      const attackFrames = ATTACK_ANIMS[game.lastCardinal] || ATTACK_ANIMS.down;
      const safeAttackIdx = Math.min(game.attackFrame, attackFrames.length - 1);
      const walkFrames = WALK_ANIMS[game.dirKey] || WALK_ANIMS['0,1'];

      const [row, col] = game.isAttacking
        ? attackFrames[safeAttackIdx]
        : walkFrames[game.animIndex % walkFrames.length];

      ctx.drawImage(
        assets.cleanSheet,
        col * frameW,
        row * frameH,
        frameW,
        frameH,
        Math.round(game.x),
        Math.round(game.y),
        DRAW_SIZE,
        DRAW_H
      );
    } else {
      ctx.fillStyle = '#000000';
      ctx.fillRect(game.x, game.y, DRAW_SIZE, DRAW_SIZE);
    }
  }

  const heartWidth = 24;
  const heartGap = 8;
  const startHeartsX =
    CANVAS_SIZE - 14 - (MAX_PLAYER_HP * heartWidth + (MAX_PLAYER_HP - 1) * heartGap);

  for (let i = 0; i < MAX_PLAYER_HP; i++) {
    const hx = startHeartsX + i * (heartWidth + heartGap);
    const hy = 14;
    drawPixelHeart(ctx, hx, hy, i < game.playerHp);
  }

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
    drawDialogueBox(ctx, game, assets);
  }

  // aquí para futuros implementos de ventanas/interfaces pequeñas para ver detalles de cosas

  if (game.isMapOpen) {
    drawMapOverlay(ctx, game);
  }
}