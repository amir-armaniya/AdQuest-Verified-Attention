// record-gif.mjs — Records the demo flow and captures landscape frames for GIF
// Mobile landscape orientation (760x420), longer hold on each frame for readability
// Usage: PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome node scripts/record-gif.mjs

import puppeteer from 'puppeteer';
import { mkdirSync } from 'fs';

const BASE = process.env.BASE || 'http://localhost:8099';
const OUT_DIR = 'assets/gif-frames-new';
const W = 760, H = 420; // landscape mobile
const DELAY = ms => new Promise(r => setTimeout(r, ms));
const HOLD_MS = 2200; // time each frame stays on screen (readability)

mkdirSync(OUT_DIR, { recursive: true });

// Selling text overlays — positioned for landscape, top-left badge style + bottom caption
const OVERLAYS = [
  // Frame 1: Pain point
  { text: 'Ads are dying.\nPeople skip. Ignore. Hate them.', position: 'center', color: '#ef4444', big: true },
  // Frame 2: Game Screen
  { text: 'AdQuest turns ads into a game\nusers CHOOSE to play.', position: 'bottom', color: '#22c55e' },
  // Frame 3: Primer
  { text: '① Mystery hook captures attention\nbefore the ad even loads.', position: 'bottom', color: '#a855f7' },
  // Frame 4: Video playing
  { text: '② Users watch your FULL ad — voluntarily.', position: 'bottom', color: '#3b82f6' },
  // Frame 5: Challenge options
  { text: '③ Hold-to-Verify proves real attention.', position: 'bottom', color: '#06b6d4' },
  // Frame 6: Hold filling
  { text: 'Not a click.\nPhysical, verified engagement.', position: 'bottom', color: '#22d3ee' },
  // Frame 7: Reward
  { text: '④ Gamified reward. Users return for more.', position: 'bottom', color: '#eab308' },
  // Frame 8: Proof / CTA
  { text: '2.0x engagement lift\n93 real users verified\n→ adquest.tech', position: 'center', color: '#4ade80', big: true },
];

async function addOverlay(page, overlay) {
  if (!overlay) return;
  await page.evaluate((ov) => {
    const existing = document.getElementById('__gif-overlay');
    if (existing) existing.remove();

    const div = document.createElement('div');
    div.id = '__gif-overlay';

    const isCenter = ov.position === 'center';
    const isBig = ov.big;

    div.style.cssText = `
      position: fixed;
      ${isCenter ? `
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: ${isBig ? '28px' : '20px'};
        padding: 24px 36px;
      ` : `
        bottom: 18px;
        left: 50%;
        transform: translateX(-50%);
        font-size: 18px;
        padding: 14px 26px;
      `}
      z-index: 999999;
      background: rgba(0,0,0,0.88);
      backdrop-filter: blur(14px);
      border: 1px solid ${ov.color}55;
      border-left: 3px solid ${ov.color};
      border-radius: 14px;
      font-family: 'Inter', -apple-system, sans-serif;
      font-weight: 700;
      color: ${ov.color};
      text-align: center;
      line-height: 1.5;
      white-space: pre-line;
      box-shadow: 0 8px 40px ${ov.color}40, 0 0 60px ${ov.color}20;
      max-width: 90vw;
      pointer-events: none;
      letter-spacing: 0.01em;
    `;
    div.textContent = ov.text;
    document.body.appendChild(div);
  }, overlay);
}

async function removeOverlay(page) {
  await page.evaluate(() => {
    const el = document.getElementById('__gif-overlay');
    if (el) el.remove();
  });
}

async function capture(page, name, overlay) {
  await addOverlay(page, overlay);
  await DELAY(400); // let overlay settle
  await page.screenshot({ path: `${OUT_DIR}/${name}.png`, clip: { x: 0, y: 0, width: W, height: H } });
  console.log(`✓ ${name}`);
  await DELAY(HOLD_MS); // hold for readability
  await removeOverlay(page);
  await DELAY(200);
}

async function main() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: W, height: H, isLandscape: true });
  await page.goto(`${BASE}/demo.html`, { waitUntil: 'networkidle2', timeout: 30000 });
  await DELAY(2500);

  // Frame 1: Pain point (black bg)
  await page.evaluate(() => {
    const adLayer = document.getElementById('adLayer');
    if (adLayer) adLayer.style.display = 'none';
    const gameLayer = document.getElementById('gameLayer');
    if (gameLayer) gameLayer.style.display = 'none';
    document.body.style.background = '#07060d';
  });
  await capture(page, 'frame-01-pain', OVERLAYS[0]);

  // Restore for demo flow
  await page.evaluate(() => {
    const adLayer = document.getElementById('adLayer');
    if (adLayer) adLayer.style.display = '';
    const gameLayer = document.getElementById('gameLayer');
    if (gameLayer) gameLayer.style.display = '';
  });
  await DELAY(500);

  // Frame 2: Game Screen
  await capture(page, 'frame-02-game', OVERLAYS[1]);

  // Click "WATCH AD TO CLAIM"
  await page.click('#gameLayer button');
  await DELAY(1800);

  // Frame 3: Primer
  await capture(page, 'frame-03-primer', OVERLAYS[2]);

  // Click "I'M READY"
  await page.evaluate(() => {
    const btn = document.querySelector('#primerState button');
    if (btn) btn.click();
  });
  await DELAY(3500);

  // Frame 4: Video Playing
  await capture(page, 'frame-04-video', OVERLAYS[3]);

  // Force end video
  await page.evaluate(() => {
    const video = document.getElementById('mainVideo');
    if (video) { video.pause(); video.currentTime = video.duration; video.dispatchEvent(new Event('ended')); }
  });
  await DELAY(1200);

  // Frame 5: Challenge options
  await capture(page, 'frame-05-challenge', OVERLAYS[4]);

  // Frame 6: Hold filling — simulate progress
  await page.evaluate(() => {
    const overlay = document.querySelector('#opt-2 .fill-overlay');
    if (overlay) overlay.style.height = '72%';
    const card = document.getElementById('opt-2');
    if (card) card.classList.add('active-input');
  });
  await capture(page, 'frame-06-hold', OVERLAYS[5]);

  // Force complete challenge (correct answer)
  await page.evaluate(() => {
    const overlay = document.querySelector('#opt-2 .fill-overlay');
    if (overlay) overlay.style.height = '100%';
    if (typeof finishChallenge === 'function') finishChallenge(2, document.getElementById('opt-2'));
  });
  await DELAY(1800);

  // Frame 7: Reward
  await capture(page, 'frame-07-reward', OVERLAYS[6]);

  // Frame 8: Proof/CTA
  await capture(page, 'frame-08-proof', OVERLAYS[7]);

  await browser.close();
  console.log(`\n✅ All 8 landscape frames captured in ${OUT_DIR}`);
}

main().catch(e => { console.error('ERROR:', e); process.exit(1); });
