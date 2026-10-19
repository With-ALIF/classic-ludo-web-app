const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const OUT_DIR = path.join(__dirname, "..", "public", "icons");

const RED = [229, 57, 53];
const GREEN = [67, 160, 71];
const YELLOW = [249, 168, 37];
const BLUE = [30, 136, 229];
const WHITE = [250, 250, 250];

let CRC_TABLE = null;
function crc32(buf) {
  if (!CRC_TABLE) {
    CRC_TABLE = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      CRC_TABLE[n] = c;
    }
  }
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function encodePng(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0;
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}

function sdRoundRect(px, py, x, y, w, h, r) {
  const rr = Math.max(0, Math.min(r, Math.min(w, h) / 2));
  const cx = px - (x + w / 2);
  const cy = py - (y + h / 2);
  const qx = Math.abs(cx) - (w / 2 - rr);
  const qy = Math.abs(cy) - (h / 2 - rr);
  const ax = Math.max(qx, 0);
  const ay = Math.max(qy, 0);
  return Math.hypot(ax, ay) + Math.min(Math.max(qx, qy), 0) - rr;
}

function sampleColor(x, y, opts) {
  const { size, maskable } = opts;
  const bgRadius = maskable ? 0 : size * 0.225;
  if (sdRoundRect(x, y, 0, 0, size, size, bgRadius) > 0) return null;
  let col = RED;
  const diceSize = (maskable ? 0.52 : 0.6) * size;
  const d = (size - diceSize) / 2;
  if (sdRoundRect(x, y, d, d, diceSize, diceSize, diceSize * 0.18) <= 0) {
    col = WHITE;
    const off = diceSize * 0.215;
    const pipR = diceSize * 0.09;
    const pips = [
      [-1, -1, RED],
      [1, -1, GREEN],
      [1, 1, YELLOW],
      [-1, 1, BLUE],
    ];
    for (const [sx, sy, c] of pips) {
      const px = size / 2 + sx * off;
      const py = size / 2 + sy * off;
      if ((x - px) ** 2 + (y - py) ** 2 <= pipR * pipR) col = c;
    }
  }
  return col;
}

function render(size, opts) {
  const rgba = Buffer.alloc(size * size * 4);
  const N = 4;
  const n = N * N;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      for (let sy = 0; sy < N; sy++) {
        for (let sx = 0; sx < N; sx++) {
          const c = sampleColor(x + (sx + 0.5) / N, y + (sy + 0.5) / N, opts);
          if (c) {
            r += c[0];
            g += c[1];
            b += c[2];
            a += 255;
          }
        }
      }
      const idx = (y * size + x) * 4;
      rgba[idx] = Math.round(r / n);
      rgba[idx + 1] = Math.round(g / n);
      rgba[idx + 2] = Math.round(b / n);
      rgba[idx + 3] = Math.round(a / n);
    }
  }
  return encodePng(size, size, rgba);
}

const targets = [
  ["icon-192.png", { size: 192, maskable: false }],
  ["icon-512.png", { size: 512, maskable: false }],
  ["icon-maskable-192.png", { size: 192, maskable: true }],
  ["icon-maskable-512.png", { size: 512, maskable: true }],
  ["apple-touch-icon.png", { size: 180, maskable: true }],
];

fs.mkdirSync(OUT_DIR, { recursive: true });
for (const [name, opts] of targets) {
  const buf = render(opts.size, { size: opts.size, maskable: opts.maskable });
  fs.writeFileSync(path.join(OUT_DIR, name), buf);
  console.log(`${name} ${buf.length} bytes`);
}
console.log("done");
