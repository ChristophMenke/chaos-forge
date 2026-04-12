import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import crypto from "node:crypto";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const OUT = "screenshots/login";
const GM_PIN = process.env.GM_PIN;

const VIEWPORTS = [
  { name: "iphone-se", width: 375, height: 667 },
  { name: "iphone-14", width: 390, height: 844 },
  { name: "ipad-portrait", width: 768, height: 1024 },
  { name: "ipad-landscape", width: 1024, height: 768 },
  { name: "macbook-air-13", width: 1470, height: 956 },
  { name: "macbook-air-15", width: 1710, height: 1112 },
  { name: "desktop-1080p", width: 1920, height: 1080 },
  { name: "desktop-1440p", width: 2560, height: 1440 },
];

async function main() {
  await mkdir(OUT, { recursive: true });

  const browser = await chromium.launch();

  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await context.newPage();

    // 1. Login page (email step)
    await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: join(OUT, `login-${vp.name}.png`), fullPage: false });
    console.log(`${vp.name} login: ${vp.width}x${vp.height}`);

    // 2. Master PIN gate
    const secret = process.env.GM_SESSION_SECRET ?? GM_PIN;
    // Don't set GM cookie - we WANT to see the PIN gate
    await page.goto("http://localhost:3000/master", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: join(OUT, `master-${vp.name}.png`), fullPage: false });
    console.log(`${vp.name} master: ${vp.width}x${vp.height}`);

    await context.close();
  }

  await browser.close();
  console.log("\nDone! Screenshots in", OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
