import { COLS, ROWS } from './constants';

function removeExteriorBlack(img) {
  const offCanvas = document.createElement('canvas');
  offCanvas.width = img.naturalWidth;
  offCanvas.height = img.naturalHeight;
  const ctx = offCanvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  const imgData = ctx.getImageData(0, 0, offCanvas.width, offCanvas.height);
  const data = imgData.data;
  const w = offCanvas.width;
  const h = offCanvas.height;

  const cellW = Math.floor(w / COLS);
  const cellH = Math.floor(h / ROWS);
  const visited = new Uint8Array(w * h);

  const isBlack = (x, y) => {
    const idx = (y * w + x) * 4;
    return data[idx] < 30 && data[idx + 1] < 30 && data[idx + 2] < 30;
  };

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const x0 = c * cellW;
      const y0 = r * cellH;
      const x1 = Math.min(w, (c + 1) * cellW);
      const y1 = Math.min(h, (r + 1) * cellH);

      const queue = [];
      const pushIfBlack = (x, y) => {
        const pos = y * w + x;
        if (!visited[pos] && isBlack(x, y)) {
          visited[pos] = 1;
          queue.push(x, y);
        }
      };

      for (let x = x0; x < x1; x++) {
        pushIfBlack(x, y0);
        pushIfBlack(x, y1 - 1);
      }
      for (let y = y0; y < y1; y++) {
        pushIfBlack(x0, y);
        pushIfBlack(x1 - 1, y);
      }

      let head = 0;
      while (head < queue.length) {
        const cx = queue[head++];
        const cy = queue[head++];
        data[(cy * w + cx) * 4 + 3] = 0;

        if (cx > x0) pushIfBlack(cx - 1, cy);
        if (cx + 1 < x1) pushIfBlack(cx + 1, cy);
        if (cy > y0) pushIfBlack(cx, cy - 1);
        if (cy + 1 < y1) pushIfBlack(cx, cy + 1);
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return offCanvas;
}

export function loadGameAssets() {
  const assets = {
    cleanSheet: null,
    mapImg: null,
    // aquí para futuros implementos de fondos de escenarios (backgrounds: {})
    // aquí para futuros implementos de sprites de NPCs animados (npcs: {})
    // aquí para futuros implementos de sprites de jefes y sus ataques (bosses: {})
    // aquí para futuros implementos de sprites de objetos interactuables y bloques (objects: {})
  };

  const rawImg = new Image();
  rawImg.src = './assets/sprites/player/sprites.jpg';
  rawImg.onload = () => {
    assets.cleanSheet = removeExteriorBlack(rawImg);
  };
  const mapImg = new Image();
  mapImg.src = './assets/ui/mapa.png'; // cambia 'ui' por 'backgrounds' si la pusiste ahí
  mapImg.onload = () => {
    assets.mapImg = mapImg;
  };

  return assets;
}