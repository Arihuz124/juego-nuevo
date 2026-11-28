import {
  isNear,
  getPlayerBox,
  getChestBox,
  getNpcBox,
  getSwitchBox,
} from './physics';

export function advanceDialogue(game) {
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
}

export function updateDialogue(game) {
  const currentLine = game.dialogue.lines[game.dialogue.lineIndex] || '';
  if (game.dialogue.charIndex < currentLine.length) {
    game.dialogue.timer += 1;
    if (game.dialogue.timer >= 2) {
      game.dialogue.timer = 0;
      game.dialogue.charIndex += 1;
      // aquí para futuros implementos de sonido de voz/texto al escribir letra
    }
  }
}

export function handleInteractionKey(game) {
  if (game.room === 'right' && isNear(getPlayerBox(game), getChestBox(game))) {
    game.eastChest.isOpen = !game.eastChest.isOpen;
    // aquí para futuros implementos de sonido al abrir/cerrar cofre
    return true;
  }

  if (game.room === 'right' && isNear(getPlayerBox(game), getSwitchBox(game))) {
    game.rightSwitchPressed = !game.rightSwitchPressed;
    game.dialogue = {
      active: true,
      lines: [
        game.rightSwitchPressed
          ? 'Presionaste el interruptor. Se escuchó abrir la puerta de la derecha.'
          : 'Desactivaste el interruptor. La puerta de la derecha se cerró.',
      ],
      lineIndex: 0,
      charIndex: 0,
      timer: 0,
    };
    game.keys = {};
    game.isMoving = false;
    return true;
  }

  if (game.room === 'left' && isNear(getPlayerBox(game), getNpcBox(game))) {
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
    return true;
  }

  // aquí para futuros implementos de empujar bloques para puzzles
  // aquí para futuros implementos de abrir/cerrar interfaces pequeñas para ver detalles de cosas

  return false;
}