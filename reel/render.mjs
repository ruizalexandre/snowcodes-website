// Renders reel/index.html → reel/snowcodes-reel.mp4 (1080×1920, 60 fps, H.264 + AAC, Instagram-ready).
// Frames come from headless Chrome over CDP; the soundtrack is the page's own WebAudio score.
// Usage: node reel/render.mjs [S] [page]   S = motion-blur subframes per frame (default 8; 1 = quick draft → reel/draft-<name>.mp4)
//        page = index.html (default, → snowcodes-reel.mp4) or skills.html (→ snowcodes-skills.mp4)
import { spawn } from 'node:child_process';
import { mkdtempSync, readdirSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';

const S = Number(process.argv[2] ?? 8), PAGE = process.argv[3] ?? 'index.html', FPS = 60;
const NAME = PAGE === 'index.html' ? 'reel' : PAGE.replace(/\.html$/, '');
const dir = new URL('.', import.meta.url).pathname, tmp = mkdtempSync(join(tmpdir(), 'reel-'));
const pw = join(homedir(), 'Library/Caches/ms-playwright');
const shell = readdirSync(pw).find(d => d.startsWith('chromium_headless_shell-'));
const chrome = spawn(join(pw, shell, 'chrome-headless-shell-mac-arm64/chrome-headless-shell'), [
    '--remote-debugging-port=0', '--use-angle=metal', '--allow-file-access-from-files', '--hide-scrollbars',
    '--window-size=1080,1920', `--user-data-dir=${tmp}`, `file://${dir}${PAGE}?render`]);
process.on('exit', () => chrome.kill());

const port = await new Promise((ok, ko) => {
    chrome.stderr.on('data', d => { const m = /127\.0\.0\.1:(\d+)/.exec(d); if (m) ok(m[1]); });
    chrome.on('exit', ko);
});
const page = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(t => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener('open', r));
const pending = new Map();
let id = 0;
ws.addEventListener('message', e => { const m = JSON.parse(e.data); pending.get(m.id)?.(m); pending.delete(m.id); });
const ev = expression => new Promise((ok, ko) => {
    pending.set(++id, m => {
        const err = m.error ?? m.result.exceptionDetails;
        err ? ko(new Error(JSON.stringify(err))) : ok(m.result.result.value);
    });
    ws.send(JSON.stringify({ id, method: 'Runtime.evaluate', params: { expression, awaitPromise: true, returnByValue: true } }));
});

await ev('new Promise(r => (function f() { window.ready ? r(window.ready.then(() => 1)) : setTimeout(f, 50); })())');
const N = Math.round(await ev('DUR') * FPS);                       // the page's own length
const wavPath = join(tmp, 'score.wav');
writeFileSync(wavPath, Buffer.from(await ev('audioWav()'), 'base64'));

const out = join(dir, S > 1 ? `snowcodes-${NAME}.mp4` : `draft-${NAME}.mp4`);
const ff = spawn('/opt/homebrew/bin/ffmpeg', ['-y', '-v', 'error',
    '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-', '-i', wavPath,
    '-vf', 'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p,setparams=range=tv:color_primaries=bt709:color_trc=bt709:colorspace=bt709',
    '-c:v', 'libx264', '-preset', S > 1 ? 'slow' : 'veryfast', '-crf', '16', '-profile:v', 'high',
    '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
    '-c:a', 'aac', '-b:a', '256k', '-ar', '48000', '-movflags', '+faststart', '-shortest', out], { stdio: ['pipe', 'inherit', 'inherit'] });

const t0 = Date.now();
for (let i = 0; i < N; i++) {
    const png = await ev(`frame(${i}, ${S})`);
    if (!ff.stdin.write(Buffer.from(png.slice(png.indexOf(',') + 1), 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 60 === 59) console.log(`${i + 1}/${N} frames, ${((Date.now() - t0) / 1000).toFixed(0)} s`);
}
ff.stdin.end();
await new Promise(r => ff.on('close', r));
console.log(`→ ${out}`);
process.exit(0);
