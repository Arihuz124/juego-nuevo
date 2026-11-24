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
  const mobileControlsRef = useRef(null);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 880);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 880);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const assets = loadGameAssets();
    const audio = createAudioManager();
    const game = createInitialGameState();

    returnToMenuRef.current = () => {
      returnToMenu(game, setIsPlaying);
    };

    mobileControlsRef.current = {
      setKey: (key, isPressed) => {
        audio.startMusic();
        if (game.screen !== 'playing' || game.isMapOpen || game.dialogue.active) {
          game.keys[key] = false;
          return;
        }
        game.keys[key] = isPressed;
      },
      attack: () => {
        audio.startMusic();
        if (game.screen !== 'playing') return;
        if (game.dialogue.active) {
          advanceDialogue(game);
          return;
        }
        if (!game.isMapOpen && !game.isAttacking) {
          game.isAttacking = true;
          game.attackHasHit = false;
          game.attackFrame = 0;
          game.attackTimer = 0;
        }
      },
      interact: () => {
        audio.startMusic();
        if (game.screen !== 'playing') return;
        if (game.dialogue.active) {
          advanceDialogue(game);
          return;
        }
        if (!game.isMapOpen) {
          handleInteractionKey(game);
        }
      },
      toggleMap: () => {
        audio.startMusic();
        if (game.screen !== 'playing' || game.dialogue.active) return;
        game.isMapOpen = !game.isMapOpen;
        game.hoveredMapRoom = null;
      },
      toggleMute: () => {
        audio.startMusic();
        audio.toggleMute();
      },
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

  const bindHoldKey = (key) => ({
    onPointerDown: (e) => {
      e.preventDefault();
      mobileControlsRef.current?.setKey(key, true);
    },
    onPointerUp: (e) => {
      e.preventDefault();
      mobileControlsRef.current?.setKey(key, false);
    },
    onPointerLeave: () => {
      mobileControlsRef.current?.setKey(key, false);
    },
    onPointerCancel: () => {
      mobileControlsRef.current?.setKey(key, false);
    },
  });

  const dpadBtnStyle = {
    width: '52px',
    height: '52px',
    backgroundColor: '#25252d',
    color: '#ffffff',
    border: '3px solid #ffffff',
    fontFamily: 'monospace',
    fontSize: '20px',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    userSelect: 'none',
    touchAction: 'none',
    padding: 0,
  };

  const actionBtnStyle = {
    padding: '12px 14px',
    backgroundColor: '#25252d',
    color: '#ffffff',
    border: '3px solid #ffffff',
    fontFamily: 'monospace',
    fontSize: '14px',
    fontWeight: 'bold',
    userSelect: 'none',
    touchAction: 'none',
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'center',
        alignItems: isMobile ? 'center' : 'flex-start',
        gap: isMobile ? '12px' : '16px',
        touchAction: 'manipulation',
        userSelect: 'none',
      }}
    >
      {/* Columna izquierda (en PC) / Barra superior (en celular) */}
      <div
        style={{
          width: isMobile ? 'min(92vw, 500px)' : '180px',
          display: 'flex',
          justifyContent: isMobile ? 'space-between' : 'flex-end',
          alignItems: 'center',
          minHeight: isMobile ? '38px' : 'auto',
        }}
      >
        {isPlaying && (
          <button
            type="button"
            onClick={(e) => {
              e.currentTarget.blur();
              returnToMenuRef.current?.();
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

        {/* Botones rápidos de Mapa y Audio en celular */}
        {isMobile && isPlaying && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => mobileControlsRef.current?.toggleMap()}
              style={{ ...actionBtnStyle, padding: '6px 12px', fontSize: '13px' }}
            >
              MAPA
            </button>
            <button
              type="button"
              onClick={() => mobileControlsRef.current?.toggleMute()}
              style={{ ...actionBtnStyle, padding: '6px 12px', fontSize: '13px' }}
            >
              ♪
            </button>
          </div>
        )}
      </div>

      {/* Centro: pantalla principal del juego */}
      <canvas
        ref={canvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        style={{
          width: isMobile ? 'min(92vw, 500px)' : `${CANVAS_SIZE}px`,
          height: isMobile ? 'min(92vw, 500px)' : `${CANVAS_SIZE}px`,
          border: '4px solid #ffffff',
          display: 'block',
          imageRendering: 'pixelated',
          cursor: 'pointer',
          touchAction: 'none',
        }}
      />

      {/* Controles táctiles inferiores (solo visible en celular al jugar) */}
      {isMobile && isPlaying && (
        <div
          style={{
            width: 'min(92vw, 500px)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '6px',
          }}
        >
          {/* Cruceta direccional (D-Pad) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '52px 52px 52px',
              gridTemplateRows: '52px 52px 52px',
              gap: '4px',
            }}
          >
            <div />
            <button type="button" style={dpadBtnStyle} {...bindHoldKey('w')}>
              ▲
            </button>
            <div />
            <button type="button" style={dpadBtnStyle} {...bindHoldKey('a')}>
              ◀
            </button>
            <div />
            <button type="button" style={dpadBtnStyle} {...bindHoldKey('d')}>
              ▶
            </button>
            <div />
            <button type="button" style={dpadBtnStyle} {...bindHoldKey('s')}>
              ▼
            </button>
            <div />
          </div>

          {/* Botones de acción (Interactuar y Atacar) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                mobileControlsRef.current?.interact();
              }}
              style={{ ...actionBtnStyle, backgroundColor: '#0984e3', minWidth: '110px' }}
            >
              E (HABLAR)
            </button>
            <button
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                mobileControlsRef.current?.attack();
              }}
              style={{ ...actionBtnStyle, backgroundColor: '#d63031', minWidth: '110px' }}
            >
              ATACAR
            </button>
          </div>
        </div>
      )}

      {/* Columna derecha: leyenda de controles (solo visible en PC) */}
      {!isMobile && (
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
      )}
    </div>
  );
}