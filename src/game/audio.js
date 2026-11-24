export function createAudioManager() {
  const bgMusic = new Audio('./assets/audio/music/song.mp3');
  bgMusic.loop = true;
  bgMusic.volume = 0.4;
  let musicStarted = false;

  // aquí para futuros implementos de música dinámica por escenario o combate de jefe
  // aquí para futuros implementos de efectos de sonido (caminatas, ataques, diálogos, empujar bloques)

  return {
    startMusic() {
      if (!musicStarted) {
        bgMusic
          .play()
          .then(() => {
            musicStarted = true;
          })
          .catch(() => {});
      }
    },
    toggleMute() {
      bgMusic.muted = !bgMusic.muted;
    },
    stopMusic() {
      bgMusic.pause();
    },
    // aquí para futuros implementos de métodos playSfx(nombre) y changeMusic(pista)
  };
}