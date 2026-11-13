// TSF Shorts © 2026 Kevin Hopek, TikTok Success Factory (tiktoksuccessfactory.pl). Zakaz odsprzedaży i publikowania kopii, zasady: LICENSE.txt
// One command for a finished video:  node scripts/make.mjs <episode> [--draft] [--skip-render] [--no-captions]
// picture (render.mjs) -> sound (audio.mjs) -> loudness -14 LUFS -> captions -> out/<episode>/<episode>.mp4
import fs from 'node:fs';
import path from 'node:path';
import { render, args } from './render.mjs';
import { audio } from './audio.mjs';
import { makeAss, captionFonts } from './captions.mjs';
import { ROOT, epDir, outDir, log, FFMPEG, run, fmtTime } from './common.mjs';

async function loudnorm(out) {
  const target = 'I=-14:TP=-1.5:LRA=11';
  const err = await run(FFMPEG, ['-hide_banner', '-i', 'mix.wav', '-af', `loudnorm=${target}:print_format=json`, '-f', 'null', '-'], { cwd: out });
  const m = JSON.parse(err.slice(err.lastIndexOf('{'), err.lastIndexOf('}') + 1));
  return `loudnorm=${target}:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`;
}

export async function make(o) {
  const t0 = Date.now(), ep = o.ep, out = outDir(ep);
  if (!fs.existsSync(path.join(epDir(ep), 'episode.js'))) throw new Error(`No episode "${ep}". Expected episodes/${ep}/episode.js`);
  if (!(o.skipRender && fs.existsSync(path.join(out, 'video_clean.mp4')))) await render(ep, o);
  await audio(ep);
  const plan = JSON.parse(fs.readFileSync(path.join(out, 'audio_plan.json'), 'utf8'));
  const af = await loudnorm(out);
  const name = ep + (o.draft ? '_draft' : '');
  await run(FFMPEG, ['-y', '-loglevel', 'error', '-i', 'video_clean.mp4', '-i', 'mix.wav', '-af', af, '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-t', String(plan.duration), '-movflags', '+faststart', `${name}_no_captions.mp4`], { cwd: out });
  const wf = path.join(epDir(ep), 'words.json');
  const capsOn = o.captions && plan.captions.enabled !== false && fs.existsSync(wf);
  if (capsOn) {
    const fam = captionFonts(out, ROOT);
    fs.writeFileSync(path.join(out, 'captions.ass'), makeAss(JSON.parse(fs.readFileSync(wf, 'utf8')), plan.captions, plan.duration, plan.captions.font || fam));
    await run(FFMPEG, ['-y', '-loglevel', 'error', '-i', `${name}_no_captions.mp4`, '-vf', 'subtitles=captions.ass:fontsdir=fonts', '-c:v', 'libx264', '-preset', o.draft ? 'veryfast' : 'medium', '-crf', o.draft ? '23' : '17', '-pix_fmt', 'yuv420p', '-c:a', 'copy', '-movflags', '+faststart', `${name}.mp4`], { cwd: out });
  } else fs.copyFileSync(path.join(out, `${name}_no_captions.mp4`), path.join(out, `${name}.mp4`));
  log(`DONE in ${fmtTime((Date.now() - t0) / 1000)}:`);
  log(`  out/${ep}/${name}.mp4` + (capsOn ? '   (with captions)' : ''));
  if (capsOn) log(`  out/${ep}/${name}_no_captions.mp4`);
}

const o = args(process.argv.slice(2));
o.skipRender = process.argv.includes('--skip-render');
if (!o.ep) {
  const eps = fs.readdirSync(path.join(ROOT, 'episodes')).filter((d) => fs.existsSync(path.join(ROOT, 'episodes', d, 'episode.js')));
  console.log('usage: node scripts/make.mjs <episode> [--draft]\nepisodes: ' + eps.join(', ')); process.exit(1);
}
make(o).catch((e) => { console.error('\nERROR: ' + (e.message || e)); process.exit(1); });
