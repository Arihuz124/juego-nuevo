import { useEffect, useRef, useState } from 'react';
import { CANVAS_SIZE, MENU_BUTTONS, MAP_ROOMS } from './game/constants';
import { loadGameAssets } from './game/assets';
import { createAudioManager } from './game/audio';
import {
  createInitialGameState,
  readSavedGame,
  startNewGame,
  loadSavedGame,
  teleportToRoom,
  returnToMenu,
} from './game/state';
import { pointInRect } from './game/physics';
import { updatePlayer } from './game/player';
import { updateNpcs } from './game/npcs';
import {
  advanceDialogue,
  updateDialogue,
  handleInteractionKey,
} from './game/interactions';
import { updateCombat } from './game/combat';
import { drawGame } from './game/renderer';

export default function App() {
  const canvasRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const returnToMenuRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const assets = loadGameAssets();
    const audio = createAudioManager();
    const game = createInitialGameState();

    returnToMenuRef.current = () => {
      returnToMenu(game, setIsPlaying);
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

    const handleKeyDown = (e) => {
      audio.startMusic();

      if (e.key.toLowerCase() === 'm') {
        audio.toggleMute();
        return;
      }

      if (game.dialogue.active) {
        e.preventDefault();
        advanceDialogue(game);
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
            startNewGame(game, setIsPlaying);
          } else if (game.menuSelected === 1 && readSavedGame()) {
            loadSavedGame(game, setIsPlaying);
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
        if (handleInteractionKey(game)) {
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
      audio.startMusic();
      const { mx, my } = getCanvasCoords(e);

      if (game.screen === 'menu') {
        if (pointInRect(mx, my, MENU_BUTTONS.newGame)) {
          startNewGame(game, setIsPlaying);
          return;
        }
        if (pointInRect(mx, my, MENU_BUTTONS.loadGame) && readSavedGame()) {
          loadSavedGame(game, setIsPlaying);
          return;
        }
        return;
      }

      if (game.dialogue.active) {
        advanceDialogue(game);
        return;
      }

      if (game.isMapOpen) {
        for (const [roomKey, rect] of Object.entries(MAP_ROOMS)) {
          if (pointInRect(mx, my, rect)) {
            teleportToRoom(game, roomKey);
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

    const loop = () => {
      if (game.screen === 'playing' && !game.isMapOpen) {
        if (game.dialogue.active) {
          updateDialogue(game);
        } else {
          if (game.saveNoticeTimer > 0) game.saveNoticeTimer -= 1;
          if (game.playerHitFlash > 0) game.playerHitFlash -= 1;
          if (game.northEnemy.hitFlash > 0) game.northEnemy.hitFlash -= 1;

          updatePlayer(game);
          updateNpcs(game);
          updateCombat(game);
        }
      }

      drawGame(ctx, game, assets);
      animationFrameId = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      audio.stopMusic();
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