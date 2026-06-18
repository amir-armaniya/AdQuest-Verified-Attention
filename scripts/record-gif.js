const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const DEMO_URL = 'file://' + path.resolve(__dirname, '..', 'demo.html');
const OUTPUT_DIR = path.resolve(__dirname, '..', 'assets', 'gif-frames');
const GIF_OUTPUT = path.resolve(__dirname, '..', 'adquest-demo.gif');

const STATES = [
    { name: '01-game-screen', wait: 1500, desc: 'Game screen' },
    { name: '02-primer', action: 'js', fn: 'startAdFlow', wait: 2000, desc: 'Primer shown' },
    { name: '03-video-ready', action: 'js', fn: 'startVideo', wait: 1000, desc: 'Video loading' },
    { name: '04-video-playing', wait: 4000, desc: 'Video playing' },
    { name: '05-challenge', wait: 2500, desc: 'Challenge screen' },
    { name: '06-hold-start', action: 'hold', target: 2, wait: 500, desc: 'Hold begins' },
    { name: '07-hold-mid', wait: 800, desc: 'Fill bar mid' },
    { name: '08-hold-end', wait: 800, desc: 'Fill bar full' },
    { name: '09-success', wait: 2000, desc: 'Reward unlocked' },
    { name: '10-cta', wait: 1000, desc: 'CTA visible' },
];

async function record() {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    console.log('Launching Chrome...');
    const browser = await puppeteer.launch({
        headless: 'new',
        executablePath: '/usr/bin/google-chrome',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 800, height: 600, deviceScaleFactor: 2 });

    console.log('Loading demo.html...');
    await page.goto(DEMO_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2000);

    let frameNum = 1;

    for (const state of STATES) {
        console.log(`[${frameNum}] ${state.desc}`);

        if (state.action === 'js') {
            await page.evaluate((fn) => window[fn](), state.fn);
        }

        if (state.action === 'hold') {
            // Simulate hold on option 2 (correct answer)
            await page.evaluate(() => {
                const el = document.getElementById('opt-2');
                if (el) {
                    el.classList.add('active-input');
                    const overlay = el.querySelector('.fill-overlay');
                    if (overlay) overlay.style.height = '100%';
                    el.style.boxShadow = '0 0 30px rgba(59, 130, 246, 0.6)';
                    el.style.borderColor = '#3b82f6';
                }
            });
            // Trigger finish
            await page.evaluate(() => {
                finishChallenge(2, document.getElementById('opt-2'));
            });
        }

        await sleep(state.wait || 500);

        const framePath = path.join(OUTPUT_DIR, `frame-${String(frameNum).padStart(2, '0')}.png`);
        await page.screenshot({ path: framePath, type: 'png' });
        frameNum++;
    }

    await browser.close();
    console.log(`\n${frameNum - 1} frames captured.`);

    // Assemble GIF with ffmpeg
    console.log('Assembling GIF...');
    const cmd = `ffmpeg -y -framerate 3 -i "${OUTPUT_DIR}/frame-%02d.png" -vf "scale=800:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128:stats_mode=diff[p];[s1][p]paletteuse=dither=bayer:bayer_scale=3" -loop 0 "${GIF_OUTPUT}"`;
    try {
        execSync(cmd, { stdio: 'inherit' });
        const stats = fs.statSync(GIF_OUTPUT);
        console.log(`\nGIF created: ${GIF_OUTPUT} (${(stats.size / 1024).toFixed(0)} KB)`);
    } catch (e) {
        console.error('ffmpeg failed, frames are in:', OUTPUT_DIR);
    }
}

record().catch(console.error);
