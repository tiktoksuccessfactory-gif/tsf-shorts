// Quick check frames (for Claude or for you): renders single frames at small size and a contact sheet.
//   node scripts/stills.mjs <episode> [--n 12] [--at 1.5,3,7.25] [--big]
//   -> out/<episode>/stills/t_<seconds>.jpg and out/<episode>/stills/sheet.jpg
import fs from 'node:fs';
import path from 'node:path';
import { serve, launchFilm, outDir, log, FFMPEG, run } from './common.mjs';

const argv = process.argv.slice(2); const ep = argv.find((a) => !a.startsWith('--') && !/^[\d.,]+$/.test(a));
const get = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : null; };
if (!ep) { console.log('usage: node scripts/stills.mjs <episode> [--n 12] [--at 1.5,3,7.25]'); process.exit(1); }
const [w, h] = argv.includes('--big') ? [1080, 1920] : [540, 960];
const dir = path.join(outDir(ep), 'stills'); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
const { srv, port } = await serve(); const { br, page, info } = await launchFilm(port, ep, w, h).catch((e) => { srv.close(); throw e; });
try {
  const times = get('--at') ? get('--at').split(',').map(Number) : Array.from({ length: +(get('--n') || 12) }, (_, i) => +(((i + 0.5) * info.duration) / +(get('--n') || 12)).toFixed(2));
  const files = [];
  for (const [i, t] of times.entries()) {
    const url = await page.evaluate((f) => TSF.grab(f, 0.9), Math.round(t * 30));
    const f = path.join(dir, `s_${String(i).padStart(2, '0')}.jpg`); fs.writeFileSync(f, Buffer.from(url.slice(url.indexOf(',') + 1), 'base64'));
    fs.copyFileSync(f, path.join(dir, `t_${t.toFixed(2)}.jpg`)); files.push(f);
  }
  const cols = Math.min(6, files.length), rows = Math.ceil(files.length / cols);
  await run(FFMPEG, ['-y', '-loglevel', 'error', '-i', 's_%02d.jpg', '-vf', `scale=270:480,tile=${cols}x${rows}:padding=4:color=white`, '-frames:v', '1', 'sheet.jpg'], { cwd: dir });
  for (const f of files) fs.unlinkSync(f);
  log(`${times.length} stills at ${times.join(', ')} s -> out/${ep}/stills/sheet.jpg`);
} finally { await br.close(); srv.close(); }
