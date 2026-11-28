import { useEffect, useRef, useState } from 'react';
import { getMenuButtons, getMapLayout } from './game/constants';
import { loadGameAssets } from './game/assets';
import { createAudioManager } from './game/audio';
import {
  createInitialGameState,
  readSavedGame,
  startNewGame,
  loadSavedGame,
  teleportToRoom,
  returnToMenu,
  resizeGameScreen,
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
  const gameRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const returnToMenuRef = useRef(null);
  const mobileControlsRef = useRef(null);

  const [viewport, setViewport] = useState(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }));
  const [isMobile, setIsMobile] = useState(
    () => window.innerWidth <= 880 || 'ontouchstart' in window
  );

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      setViewport({ width: w, height: h });
      setIsMobile(w <= 880 || 'ontouchstart' in window);

      if (gameRef.current) {
        resizeGameScreen(gameRef.current, w, h);
      }
      if (canvasRef.current) {
        canvasRef.current.width = w;
        canvasRef.current.height = h;
      }
    };

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
    resizeGameScreen(game, window.innerWidth, window.innerHeight);
    canvas.width = game.width;
    canvas.height = game.height;
    gameRef.current = game;

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
      toggleGuide: () => {
        if (game.screen !== 'playing') return;
        game.showControlsGuide = !game.showControlsGuide;
      },
    };

    const getCanvasCoords = (e) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = game.width / rect.width;
      const scaleY = game.height / rect.height;
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

      if (e.key.toLowerCase() === 'h' && game.screen === 'playing') {
        game.showControlsGuide = !game.showControlsGuide;
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
        const menuButtons = getMenuButtons(game.width, game.height);
        if (pointInRect(mx, my, menuButtons.newGame)) {
          game.menuHovered = 'newGame';
          game.menuSelected = 0;
        } else if (pointInRect(mx, my, menuButtons.loadGame)) {
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

      const { rooms: mapRooms } = getMapLayout(game.width, game.height);
      let found = null;
      for (const [roomKey, rect] of Object.entries(mapRooms)) {
        if (game.visitedRooms?.[roomKey] && pointInRect(mx, my, rect)) {
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
        const menuButtons = getMenuButtons(game.width, game.height);
        if (pointInRect(mx, my, menuButtons.newGame)) {
          startNewGame(game, setIsPlaying);
          return;
        }
        if (pointInRect(mx, my, menuButtons.loadGame) && readSavedGame()) {
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
        const { rooms: mapRooms } = getMapLayout(game.width, game.height);
        for (const [roomKey, rect] of Object.entries(mapRooms)) {
          if (game.visitedRooms?.[roomKey] && pointInRect(mx, my, rect)) {
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
    width: '50px',
    height: '50px',
    backgroundColor: 'rgba(37, 37, 45, 0.78)',
    color: '#ffffff',
    border: '2px solid rgba(255, 255, 255, 0.85)',
    fontFamily: 'monospace',
    fontSize: '18px',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    WebkitTouchCallout: 'none',
    touchAction: 'none',
    padding: 0,
  };

  const hudBtnStyle = {
    height: '36px',
    padding: '0 10px',
    backgroundColor: 'rgba(20, 20, 24, 0.78)',
    color: '#ffffff',
    border: '2px solid rgba(255, 255, 255, 0.85)',
    fontFamily: 'monospace',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    WebkitTouchCallout: 'none',
    touchAction: 'none',
  };

  //BLOQUEO DE CLICCK derecho
  useEffect(() => {
    const bloquearClicDerecho = (e) => {
      if (e.button === 2) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const bloquearMenuContextual = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    document.addEventListener('mousedown', bloquearClicDerecho, true);
    document.addEventListener('contextmenu', bloquearMenuContextual, true);

    return () => {
      document.removeEventListener('mousedown', bloquearClicDerecho, true);
      //document.removeEventListener('contextmenu', bloquearMenuContextual, true);
    };
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        margin: 0,
        padding: 0,
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none',
      }}
    >
      {/* Pantalla completa del juego */}
      <canvas
        ref={canvasRef}
        width={viewport.width}
        height={viewport.height}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          imageRendering: 'pixelated',
          cursor: 'pointer',
          touchAction: 'none',
        }}
      />

      {/* Botones flotantes superiores izquierdos encima del juego */}
      {isPlaying && (
        <div
          style={{
            position: 'absolute',
            top: '16px',
            left: '16px',
            display: 'flex',
            gap: '8px',
            zIndex: 10,
          }}
        >
          <button
            type="button"
            onClick={(e) => {
              e.currentTarget.blur();
              returnToMenuRef.current?.();
            }}
            title="Volver al menú"
            style={{ ...hudBtnStyle, width: '36px', padding: 0, fontSize: '18px' }}
          >
            ←
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.currentTarget.blur();
              mobileControlsRef.current?.toggleGuide();
            }}
            title="Guía de controles (H)"
            style={{ ...hudBtnStyle, width: '36px', padding: 0, fontSize: '16px' }}
          >
            ?
          </button>

          {isMobile && (
            <>
              <button
                type="button"
                onClick={() => mobileControlsRef.current?.toggleMap()}
                style={hudBtnStyle}
              >
                MAPA
              </button>
              <button
                type="button"
                onClick={() => mobileControlsRef.current?.toggleMute()}
                style={{ ...hudBtnStyle, width: '36px', padding: 0 }}
              >
                ♪
              </button>
            </>
          )}
        </div>
      )}

      {/* Controles táctiles flotantes en celular */}
      {isMobile && isPlaying && (
        <>
          <div
            style={{
              position: 'absolute',
              bottom: '74px',
              left: '16px',
              display: 'grid',
              gridTemplateColumns: '50px 50px 50px',
              gridTemplateRows: '50px 50px 50px',
              gap: '4px',
              zIndex: 10,
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

          <div
            style={{
              position: 'absolute',
              bottom: '18px',
              right: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              zIndex: 10,
            }}
          >
            <button
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                mobileControlsRef.current?.interact();
              }}
              style={{
                ...hudBtnStyle,
                height: '46px',
                minWidth: '106px',
                backgroundColor: 'rgba(9, 132, 227, 0.85)',
              }}
            >
              E (HABLAR)
            </button>
            <button
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                mobileControlsRef.current?.attack();
              }}
              style={{
                ...hudBtnStyle,
                height: '46px',
                minWidth: '106px',
                backgroundColor: 'rgba(214, 48, 49, 0.85)',
              }}
            >
              ATACAR
            </button>
          </div>
        </>
      )}
    </div>
  );
}