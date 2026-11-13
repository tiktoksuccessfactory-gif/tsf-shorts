// TSF Shorts © 2026 Kevin Hopek, TikTok Success Factory (tiktoksuccessfactory.pl). Zakaz odsprzedaży i publikowania kopii, zasady: LICENSE.txt
// Shared helpers for the TSF scripts: paths, a tiny static file server, launching the browser, running ffmpeg.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import ffmpegPath from 'ffmpeg-static';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const FFMPEG = process.env.TSF_FFMPEG || ffmpegPath;
export const epDir = (ep) => path.join(ROOT, 'episodes', ep);
export const outDir = (ep) => { const d = path.join(ROOT, 'out', ep); fs.mkdirSync(d, { recursive: true }); return d; };
export const log = (...a) => console.log('[tsf]', ...a);
export const SIGNATURE = 'TSF Shorts by Kevin Hopek, TikTok Success Factory (tiktoksuccessfactory.pl)';
console.log('\n  ' + SIGNATURE + '\n');

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.m4a': 'audio/mp4', '.ttf': 'font/ttf', '.woff2': 'font/woff2' };
export function serve(port = 0) {
  return new Promise((res, rej) => {
    const srv = http.createServer((req, rsp) => {
      const u = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      const f = path.join(ROOT, path.normalize(u).replace(/^([/\\])+/, ''));
      if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rsp.writeHead(404); rsp.end('not found'); return; }
      rsp.writeHead(200, { 'Content-Type': MIME[path.extname(f).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      fs.createReadStream(f).pipe(rsp);
    });
    srv.on('error', rej);
    srv.listen(port, '127.0.0.1', () => res({ srv, port: srv.address().port }));
  });
}

// Uses the Chrome or Edge already installed on the computer (nothing extra to download).
export async function browser(glForce = null) {
  const { chromium } = await import('playwright-core');
  const gl = glForce || process.env.TSF_GL || (process.platform === 'win32' ? 'd3d11' : process.platform === 'darwin' ? 'metal' : 'swiftshader');
  const args = ['--ignore-gpu-blocklist', '--enable-gpu-rasterization', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'];
  if (gl === 'swiftshader') args.push('--use-angle=swiftshader', '--enable-unsafe-swiftshader');
  else args.push('--use-gl=angle', `--use-angle=${gl}`);
  const tries = process.env.TSF_CHROME ? [{ executablePath: process.env.TSF_CHROME }] : [{ channel: 'chrome' }, { channel: 'msedge' }, { channel: 'chromium' }];
  let last;
  for (const t of tries) { try { return await chromium.launch({ headless: true, args, ...t }); } catch (e) { last = e; } }
  throw new Error('Could not start Chrome or Edge. Install Google Chrome, or set TSF_CHROME to the browser exe.\n' + (last && last.message));
}

export async function openFilm(br, port, ep, w, h) {
  const page = await br.newPage({ viewport: { width: w, height: h } });
  page.on('pageerror', (e) => log('page error:', e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) log('browser:', m.text().slice(0, 400)); });
  await page.goto(`http://127.0.0.1:${port}/player/film.html?ep=${encodeURIComponent(ep)}&w=${w}&h=${h}`);
  await page.waitForFunction('window.TSF_LOADED === true', null, { timeout: 180000 });
  const info = await page.evaluate(() => ({ ready: TSF.ready, error: TSF.error, duration: TSF.duration, gpu: TSF.gpu }));
  if (!info.ready) throw new Error('Episode failed to load:\n' + info.error);
  return { page, info };
}

export function run(cmd, args, { cwd, quiet = true } = {}) {
  return new Promise((res, rej) => {
    const p = spawn(cmd, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] });
    let err = '';
    p.stdout.on('data', (d) => { if (!quiet) process.stdout.write(d); });
    p.stderr.on('data', (d) => { err += d; if (err.length > 20000) err = err.slice(-20000); });
    p.on('close', (c) => (c === 0 ? res(err) : rej(new Error(`${path.basename(cmd)} failed (${c}):\n${err.slice(-3000)}`))));
  });
}
export const cpus = () => (os.cpus() || []).length || 4;
export const fmtTime = (s) => { const k = Math.round(s); return `${Math.floor(k / 60)}:${String(k % 60).padStart(2, "0")}`; };

// browser + first page; if the graphics card cannot start WebGL, falls back to software drawing (slower, always works)
export async function launchFilm(port, ep, w, h) {
  let br = await browser();
  try { const r = await openFilm(br, port, ep, w, h); return { br, ...r }; }
  catch (e) {
    if (!/webgl|context|gpu/i.test(String(e.message))) { await br.close(); throw e; }
    log('the graphics card could not start WebGL here, switching to software drawing (slower)');
    await br.close(); br = await browser('swiftshader');
    const r = await openFilm(br, port, ep, w, h); return { br, ...r };
  }
}
