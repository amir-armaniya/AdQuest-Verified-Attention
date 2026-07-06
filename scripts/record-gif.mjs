// record-gif.mjs — Auto-plays the demo flow and captures frames for GIF
// Usage: node --experimental-vm-modules scripts/record-gif.mjs
// Requires: puppeteer browsers install chrome (or chromium installed)

import puppeteer from 'puppeteer';

const BASE = 'http://localhost:8099';
const OUT_DIR = 'assets/gif-frames-new';
const W = 420, H = 760; // mobile viewport
const DELAY = ms => new Promise(r => setTimeout(r, ms));

// Selling text overlays to inject
const OVERLAYS = [
  // Frame 0: Pain point (before navigating)
  null,
  // Frame 1: Game Screen — "WATCH AD TO CLAIM"
  { text: 'AdQuest turns ads into a game\nusers CHOOSE to play.', y: 0.08, color: '#22c55e' },
  // Frame 2: Primer
  { text: '① Mystery hook captures\nattention before the ad loads.', y: 0.12, color: '#a855f7' },
  // Frame 3: Video playing
  { text: '② Users watch your FULL ad\nvoluntarily.', y: 0.08, color: '#3b82f6' },
  // Frame 4: Challenge options
  { text: '③ Hold-to-Verify proves\nreal, verified attention.', y: 0.08, color: '#06b6d4' },
  // Frame 5: Hold filling (simulated)
  { text: 'Not a click.\nPhysical, verified engagement.', y: 0.08, color: '#22d3ee' },
  // Frame 6: Reward
  { text: '④ Gamified reward.\nUsers return for more.', y: 0.08, color: '#eab308' },
  // Frame 7: Proof / CTA
  { text: '2.0x engagement lift\n93 real users verified', y: 0.06, color: '#4ade80' },
];

async function addOverlay(page, overlay) {
  if (!overlay) return;
  await page.evaluate((ov) => {
    const existing = document.getElementById('__gif-overlay');
    if (existing) existing.remove();

    const div = document.createElement('div');
    div.id = '__gif-overlay';
    div.style.cssText = `
      position: fixed;
      top: ${ov.y * 100}%;
      left: 50%;
      transform: translateX(-50%);
      z-index: 999999;
      background: rgba(0,0,0,0.82);
      backdrop-filter: blur(12px);
      border: 1px solid ${ov.color}40;
      border-radius: 14px;
      padding: 14px 22px;
      font-family: 'Inter', -apple-system, sans-serif;
      font-size: 15px;
      font-weight: 700;
      color: ${ov.color};
      text-align: center;
      line-height: 1.5;
      white-space: pre-line;
      box-shadow: 0 0 40px ${ov.color}30;
      max-width: 90vw;
      pointer-events: none;
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

async function main() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: W, height: H });
  await page.goto(`${BASE}/demo.html`, { waitUntil: 'networkidle2', timeout: 30000 });
  await DELAY(2000);

  // Frame 0: Pain point (black bg with text)
  await page.evaluate(() => {
    document.body.style.background = '#07060d';
    const adLayer = document.getElementById('adLayer');
    if (adLayer) adLayer.style.display = 'none';
    const gameLayer = document.getElementById('gameLayer');
    if (gameLayer) gameLayer.style.display = 'none';
  });
  await addOverlay(page, { text: 'Ads are dying.\nPeople skip. Ignore. Hate them.', y: 0.35, color: '#ef4444' });
  await DELAY(500);
  await page.screenshot({ path: `${OUT_DIR}/frame-01-pain.png`, clip: { x: 0, y: 0, width: W, height: H } });
  console.log('✓ frame-01-pain.png');
  await removeOverlay(page);

  // Restore game layer for demo flow
  await page.evaluate(() => {
    const adLayer = document.getElementById('adLayer');
    if (adLayer) adLayer.style.display = '';
    const gameLayer = document.getElementById('gameLayer');
    if (gameLayer) gameLayer.style.display = '';
  });
  await DELAY(500);

  // Frame 1: Game Screen
  await addOverlay(page, OVERLAYS[1]);
  await DELAY(300);
  await page.screenshot({ path: `${OUT_DIR}/frame-02-game.png`, clip: { x: 0, y: 0, width: W, height: H } });
  console.log('✓ frame-02-game.png');
  await removeOverlay(page);

  // Click "WATCH AD TO CLAIM" button
  await page.click('#gameLayer button');
  await DELAY(1500);

  // Frame 2: Primer
  await addOverlay(page, OVERLAYS[2]);
  await DELAY(300);
  await page.screenshot({ path: `${OUT_DIR}/frame-03-primer.png`, clip: { x: 0, y: 0, width: W, height: H } });
  console.log('✓ frame-03-primer.png');
  await removeOverlay(page);

  // Click "I'M READY"
  await page.evaluate(() => {
    const btn = document.querySelector('#primerState button');
    if (btn) btn.click();
  });
  await DELAY(3500); // wait for video to start

  // Frame 3: Video Playing
  await addOverlay(page, OVERLAYS[3]);
  await DELAY(300);
  await page.screenshot({ path: `${OUT_DIR}/frame-04-video.png`, clip: { x: 0, y: 0, width: W, height: H } });
  console.log('✓ frame-04-video.png');
  await removeOverlay(page);

  // Force end video (skip waiting 16s)
  await page.evaluate(() => {
    // trigger endVideo by pausing and calling the function
    const video = document.getElementById('mainVideo');
    if (video) { video.pause(); video.currentTime = video.duration; video.dispatchEvent(new Event('ended')); }
  });
  await DELAY(1000);

  // Frame 4: Challenge options
  await addOverlay(page, OVERLAYS[4]);
  await DELAY(300);
  await page.screenshot({ path: `${OUT_DIR}/frame-05-challenge.png`, clip: { x: 0, y: 0, width: W, height: H } });
  console.log('✓ frame-05-challenge.png');
  await removeOverlay(page);

  // Frame 5: Hold filling — simulate progress
  await page.evaluate(() => {
    const overlay = document.querySelector('#opt-2 .fill-overlay');
    if (overlay) overlay.style.height = '72%';
    const card = document.getElementById('opt-2');
    if (card) card.classList.add('active-input');
  });
  await addOverlay(page, OVERLAYS[5]);
  await DELAY(300);
  await page.screenshot({ path: `${OUT_DIR}/frame-06-hold.png`, clip: { x: 0, y: 0, width: W, height: H } });
  console.log('✓ frame-06-hold.png');
  await removeOverlay(page);

  // Force complete the challenge (correct answer)
  await page.evaluate(() => {
    const overlay = document.querySelector('#opt-2 .fill-overlay');
    if (overlay) overlay.style.height = '100%';
    // Manually trigger finishChallenge with correct id
    if (typeof finishChallenge === 'function') finishChallenge(2, document.getElementById('opt-2'));
  });
  await DELAY(1500);

  // Frame 6: Reward
  await addOverlay(page, OVERLAYS[6]);
  await DELAY(300);
  await page.screenshot({ path: `${OUT_DIR}/frame-07-reward.png`, clip: { x: 0, y: 0, width: W, height: H } });
  console.log('✓ frame-07-reward.png');
  await removeOverlay(page);

  // Frame 7: Proof/CTA
  await addOverlay(page, OVERLAYS[7]);
  await DELAY(300);
  await page.screenshot({ path: `${OUT_DIR}/frame-08-proof.png`, clip: { x: 0, y: 0, width: W, height: H } });
  console.log('✓ frame-08-proof.png');

  await browser.close();
  console.log('\n✅ All 8 frames captured in ' + OUT_DIR);
}

main().catch(e => { console.error('ERROR:', e); process.exit(1); });
