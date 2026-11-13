/**
 * Generates LiftBro PWA icons (barbell on near-black) as PNGs without any
 * image library — rectangles drawn into an RGBA buffer, hand-encoded PNG.
 *
 * Run: npm run icons  (outputs to public/)
 */
import { deflateSync } from "node:zlib";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const BG = [0x0b, 0x0b, 0x0c];
const BAR = [0xd4, 0xd4, 0xd8];
const PLATE = [0xd9, 0x23, 0x23];

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let i = 0; i < 8; i++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeAndData = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData));
  return Buffer.concat([len, typeAndData, crc]);
}

function encodePng(size, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  // scanlines, each prefixed with filter byte 0
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function makeIcon(size) {
  const px = Buffer.alloc(size * size * 4);

  const rect = (x0, y0, x1, y1, [r, g, b]) => {
    for (let y = Math.round(y0 * size); y < Math.round(y1 * size); y++) {
      for (let x = Math.round(x0 * size); x < Math.round(x1 * size); x++) {
        const i = (y * size + x) * 4;
        px[i] = r;
        px[i + 1] = g;
        px[i + 2] = b;
        px[i + 3] = 255;
      }
    }
  };

  rect(0, 0, 1, 1, BG);
  // Barbell geometry stays inside the maskable safe zone (center ~80%).
  rect(0.14, 0.465, 0.86, 0.535, BAR); // bar
  for (const [cx, halfW, y0, y1] of [
    [0.3, 0.035, 0.3, 0.7], // inner plates
    [0.7, 0.035, 0.3, 0.7],
    [0.215, 0.03, 0.36, 0.64], // outer plates
    [0.785, 0.03, 0.36, 0.64],
  ]) {
    rect(cx - halfW, y0, cx + halfW, y1, PLATE);
  }

  return encodePng(size, px);
}

const publicDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public");
writeFileSync(path.join(publicDir, "icon-192.png"), makeIcon(192));
writeFileSync(path.join(publicDir, "icon-512.png"), makeIcon(512));
writeFileSync(path.join(publicDir, "apple-touch-icon.png"), makeIcon(180));
console.log("Icons written to public/: icon-192.png, icon-512.png, apple-touch-icon.png");
