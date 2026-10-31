/**
 * Cut SvenBot's avatar (the game master's face) out of the Master-of-Chaos artwork.
 * The crop was picked together with the group; it is square and gets its round
 * shape from CSS (`rounded-full`).
 *
 * Usage: npx tsx scripts/svenbot-avatar.ts
 */

import sharp from "sharp";
import { mkdirSync } from "fs";
import { join } from "path";

const SOURCE = join(process.cwd(), "public/images/gm-panels/master-pin-portrait.webp");
const TARGET_DIR = join(process.cwd(), "public/images/svenbot");
const TARGET = join(TARGET_DIR, "svenbot-avatar.webp");

const CROP = { left: 150, top: 250, width: 420, height: 420 };
const SIZE = 256;

async function main() {
  mkdirSync(TARGET_DIR, { recursive: true });
  await sharp(SOURCE).extract(CROP).resize(SIZE, SIZE).webp({ quality: 85 }).toFile(TARGET);
  console.log(`SvenBot avatar written to ${TARGET}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
