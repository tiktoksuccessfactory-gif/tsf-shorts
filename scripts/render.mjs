// TSF Shorts © 2026 Kevin Hopek, TikTok Success Factory (tiktoksuccessfactory.pl). Zakaz odsprzedaży i publikowania kopii, zasady: LICENSE.txt
// Renders the picture of an episode to out/<ep>/video_clean.mp4 (no sound, no captions).
//   node scripts/render.mjs <episode> [--draft] [--workers N] [--from s] [--to s]
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { serve, launchFilm, openFilm, outDir, log, FFMPEG, run, cpus, fmtTime } from './common.mjs';

export async function render(ep, { draft = false, workers = 0, from = 0, to = null } = {}) {
  const [w, h] = draft ? [540, 960] : [1080, 1920];
  const out = outDir(ep);
  const { srv, port } = await serve();
  const { br, page: p0, info } = await launchFilm(port, ep, w, h).catch((e) => { srv.close(); throw e; });
  try {
    log(`episode "${ep}": ${info.duration.toFixed(1)} s, ${w}x${h}, graphics: ${info.gpu}`);
    if (/swiftshader|llvmpipe|software/i.test(info.gpu || '')) log('NOTE: the browser is drawing without the graphics card, so rendering will be slow.');
    const plan = await p0.evaluate(() => TSF.audioPlan());
    if (plan.missingWords && plan.missingWords.length) log('NOTE: these cue words were not found in words.json, their backup times are used: ' + plan.missingWords.map((x) => `"${x}"`).join(', '));
    fs.writeFileSync(path.join(out, 'audio_plan.json'), JSON.stringify(plan, null, 1));
    const f0 = Math.round(from * 30), f1 = Math.min(Math.ceil((to ?? info.duration) * 30), Math.ceil(info.duration * 30)) - 1;
    const total = f1 - f0 + 1;
    const N = Math.max(1, Math.min(workers || (draft ? 2 : Math.min(4, Math.max(1, Math.floor(cpus() / 3)))), Math.ceil(total / 60)));
    const per = Math.ceil(total / N);
    let done = 0; const t0 = Date.now(); let lastLog = 0;
    const chunk = async (i) => {
      const a = f0 + i * per, b = Math.min(f1, a + per - 1); if (a > b) return null;
      const page = i === 0 ? p0 : (await openFilm(br, port, ep, w, h)).page;
      const file = path.join(out, `part_${i}.mp4`);
      const ff = spawn(FFMPEG, ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', '30', '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', draft ? 'veryfast' : 'medium', '-crf', draft ? '23' : '16', '-pix_fmt', 'yuv420p', '-r', '30', file], { stdio: ['pipe', 'ignore', 'pipe'] });
      let ferr = ''; ff.stderr.on('data', (d) => (ferr += d));
      const closed = new Promise((res, rej) => ff.on('close', (c) => (c === 0 ? res() : rej(new Error('ffmpeg: ' + ferr)))));
      for (let f = a; f <= b; f++) {
        const url = await page.evaluate((f) => TSF.grab(f, 0.95), f);
        const buf = Buffer.from(url.slice(url.indexOf(',') + 1), 'base64');
        if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
        done++;
        const now = Date.now();
        if (now - lastLog > 3000 || done === total) { lastLog = now; const el = (now - t0) / 1000; log(`picture ${Math.round((done / total) * 100)}%  (${done}/${total} frames, ${fmtTime(el)} so far, about ${fmtTime((el / done) * (total - done))} left)`); }
      }
      ff.stdin.end(); await closed; return file;
    };
    const files = (await Promise.all(Array.from({ length: N }, (_, i) => chunk(i)))).filter(Boolean);
    const list = path.join(out, 'parts.txt');
    fs.writeFileSync(list, files.map((f) => `file '${path.basename(f)}'`).join('\n'));
    await run(FFMPEG, ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', 'parts.txt', '-c', 'copy', 'video_clean.mp4'], { cwd: out });
    for (const f of files) fs.unlinkSync(f); fs.unlinkSync(list);
    log(`picture done in ${fmtTime((Date.now() - t0) / 1000)} -> out/${ep}/video_clean.mp4`);
    return path.join(out, 'video_clean.mp4');
  } finally { await br.close(); srv.close(); }
}

export function args(argv) {
  const o = { ep: null, draft: false, workers: 0, from: 0, to: null, captions: true, n: 12 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--draft') o.draft = true; else if (a === '--workers') o.workers = +argv[++i];
    else if (a === '--from') o.from = +argv[++i]; else if (a === '--to') o.to = +argv[++i];
    else if (a === '--no-captions') o.captions = false; else if (a === '--n') o.n = +argv[++i];
    else if (!a.startsWith('--')) o.ep = a;
  }
  return o;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'))) {
  const o = args(process.argv.slice(2));
  if (!o.ep) { console.log('usage: node scripts/render.mjs <episode> [--draft]'); process.exit(1); }
  render(o.ep, o).catch((e) => { console.error(e.message || e); process.exit(1); });
}
