import sharp from "sharp";
import { writeFileSync, readFileSync } from "fs";
import { resolve } from "path";

const root = resolve(import.meta.dirname, "..");
const svgPath = resolve(root, "public/favicon.svg");
const svg = readFileSync(svgPath);

const targets = [
  { name: "favicon-16x16.png", size: 16 },
  { name: "favicon-32x32.png", size: 32 },
  { name: "favicon-48x48.png", size: 48 },
  { name: "apple-touch-icon.png", size: 180 },
  { name: "icon-192.png", size: 192 },
  { name: "icon-512.png", size: 512 },
];

async function main() {
  const pngBuffers = {};
  for (const t of targets) {
    const buf = await sharp(svg, { density: 384 }).resize(t.size, t.size).png().toBuffer();
    writeFileSync(resolve(root, "public", t.name), buf);
    pngBuffers[t.size] = buf;
    console.log(`wrote public/${t.name}`);
  }

  // Assemble a modern PNG-in-ICO container (Vista+, supported by all current browsers/OSes).
  const icoSizes = [16, 32, 48];
  const images = icoSizes.map((s) => pngBuffers[s]);
  const headerSize = 6;
  const dirEntrySize = 16;
  const offsetStart = headerSize + dirEntrySize * images.length;

  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(images.length, 4); // count

  let offset = offsetStart;
  const dirEntries = [];
  for (let i = 0; i < images.length; i++) {
    const size = icoSizes[i];
    const buf = images[i];
    const entry = Buffer.alloc(dirEntrySize);
    entry.writeUInt8(size === 256 ? 0 : size, 0); // width
    entry.writeUInt8(size === 256 ? 0 : size, 1); // height
    entry.writeUInt8(0, 2); // color palette
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(buf.length, 8); // size of image data
    entry.writeUInt32LE(offset, 12); // offset of image data
    dirEntries.push(entry);
    offset += buf.length;
  }

  const ico = Buffer.concat([header, ...dirEntries, ...images]);
  writeFileSync(resolve(root, "public/favicon.ico"), ico);
  console.log("wrote public/favicon.ico");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
