# Guía del Proyecto (Nota para el programador)

Hola pana del futuro, seguro entraste aquí después de un tiempo y te estás preguntando para qué diablos sirven tantos archivos y carpetas. Tranquilo, todo está separado para no volver a tener un `App.jsx` gigante e imposible de leer. 

Aquí tienes el mapa completo de dónde está cada cosa:

---

## 1. Recursos Visuales y Audio (`public/assets/`)
Aquí van todos los archivos multimedia limpios (imágenes y sonidos):
* **`public/assets/sprites/player/sprites.jpg`**: La hoja de sprites principal de tu personaje (caminatas y ataques).
* **`public/assets/sprites/npcs/`**: Sprites de los personajes secundarios (estáticos o animados).
* **`public/assets/sprites/bosses/`**: Sprites de los jefes y sus proyectiles/ataques.
* **`public/assets/sprites/objects/`**: Cofres, bloques empujables y decoración de los cuartos.
* **`public/assets/backgrounds/`**: Fondos dibujados para reemplazar los colores planos de cada sala.
* **`public/assets/ui/`**: Imágenes de interfaz, como el diseño de `mapa.png`.
* **`public/assets/audio/music/song.mp3`**: La música de fondo principal.
* **`public/assets/audio/sfx/`**: Efectos de sonido cortos (pasos, espadazos, abrir cofres, voces de diálogo).

---

## 2. El Contenedor Principal (`src/App.jsx`)
Es el caparazón visual de React. **No tiene lógica del juego**, solo se encarga de:
* Montar el `<canvas>` donde se dibuja todo a 60 FPS.
* Escuchar el teclado (`WASD`, `E`, `Tab`, `M`) y el ratón.
* Mostrar la leyenda de controles en PC o los botones táctiles (D-Pad, `E`, `ATACAR`, `MAPA`) cuando se abre desde un celular.
* Bloquear el clic derecho y el menú contextual del navegador (línea 324) para que no estorben al jugar.

---

## 3. El Motor del Juego (`src/game/`)
Toda la lógica pura vive aquí dividida por responsabilidades:

* **`constants.js`**: El archivo de configuración. Aquí están las medidas del canvas, velocidades, vidas máximas, colores de las salas y **las coordenadas exactas `[fila, columna]` de los sprites de tu skin según cada dirección de movimiento y ataque**.
* **`assets.js`**: El cargador de imágenes. Importa las hojas de sprites y ejecuta la función que borra el fondo negro exterior automáticamente antes de dibujarlas.
* **`audio.js`**: Controla la música de fondo (`song.mp3`), el muteo con la tecla `M` y los futuros efectos de sonido (SFX).
* **`state.js`**: La memoria de la partida. Define dónde empieza el jugador, cuánta vida tiene, el estado de los cofres/enemigos y las funciones para **guardar y cargar partida** en `localStorage` (checkpoint en el cuarto sur).
* **`physics.js`**: Las matemáticas de colisión. Calcula las cajas de impacto (*hitboxes*) del jugador, la espada, enemigos, cofres y NPCs, además de detectar si estás lo suficientemente cerca para interactuar.
* **`player.js`**: Todo lo que hace tu personaje: movimiento en 8 direcciones, animación de pasos, duración del espadazo y las transiciones al cruzar los bordes hacia los cuartos norte, sur, este y oeste.
* **`npcs.js`**: Controla el comportamiento de los NPCs (como el del cuarto oeste) y sus futuras rutinas de movimiento o animaciones de entrada/salida.
* **`interactions.js`**: Maneja la tecla `E` (abrir/cerrar el cofre este) y todo el sistema de cuadros de diálogo letra por letra estilo *Undertale*.
* **`combat.js`**: La inteligencia de combate. Controla cada cuánto dispara el enemigo del cuarto norte, la trayectoria de sus balas, el daño que recibes y el *respawn* en el último punto de guardado si te quedas sin corazones.
* **`renderer.js`**: El pintor. Toma los datos actuales de `state.js` y dibuja todo en pantalla en orden: menú de inicio, fondo de la sala, enemigos, objetos, personaje, corazones de vida, caja de diálogo y el mapa interactivo con `Tab`.

---

## 4. Comandos rápidos para guardar y publicar
Acuérdate de entrar siempre a la carpeta del proyecto antes de correr cualquier comando:

```bash
cd mi-juego-limpio
