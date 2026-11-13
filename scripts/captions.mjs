// Turns words.json into animated captions (an .ass subtitle file that ffmpeg burns into the video).
// Style comes from the episode's `captions` settings (see SKILL.md): one or two words at a time, pop-in, outline.
import fs from 'node:fs';
import path from 'node:path';

const ts = (s) => { s = Math.max(0, s); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60; return `${h}:${String(m).padStart(2, '0')}:${x.toFixed(2).padStart(5, '0')}`; };
const assColor = (hex) => { const h = hex.replace('#', ''); return `&H00${h.slice(4, 6)}${h.slice(2, 4)}${h.slice(0, 2)}`.toUpperCase(); };
const clean = (w) => String(w).replace(/[{}\\]/g, '').trim();
const norm = (w) => String(w).toLowerCase().replace(/[^a-z0-9']/g, '');

export function makeAss(words, cfg = {}, duration = 1e9, font = 'Arial Black') {
  const c = { size: 96, y: 0.7, color: '#FFFFFF', outline: 10, highlight: '#FFD23F', highlightWords: [], upper: false, maxWords: 2, maxChars: 14, ...cfg };
  const hl = new Set((c.highlightWords || []).map(norm));
  const W = words.filter((w) => clean(w.w));
  // group words: up to maxWords, short enough, no long pause inside a group, sentence ends close a group
  const groups = []; let g = [];
  for (let i = 0; i < W.length; i++) {
    const w = W[i], prev = g[g.length - 1];
    const text = g.map((x) => clean(x.w)).concat(clean(w.w)).join(' ');
    if (g.length && (g.length >= c.maxWords || text.length > c.maxChars || w.s - prev.e > 0.25 || /[.!?,;:]$/.test(clean(prev.w)))) { groups.push(g); g = []; }
    g.push(w);
  }
  if (g.length) groups.push(g);
  const head = `[Script Info]\nScriptType: v4.00+\nPlayResX: 1080\nPlayResY: 1920\nWrapStyle: 2\nScaledBorderAndShadow: yes\n\n[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\nStyle: Cap,${font},${c.size},${assColor(c.color)},${assColor(c.color)},&H00101010,&H64000000,-1,0,0,0,100,100,1,0,1,${c.outline},3,5,60,60,0,1\n\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n`;
  const x = 540, y = Math.round(1920 * c.y);
  const lines = groups.map((G, i) => {
    const s = G[0].s, next = groups[i + 1] ? groups[i + 1][0].s : Infinity;
    const e = Math.min(next, G[G.length - 1].e + 0.35, duration);
    const txt = G.map((w) => { let t = clean(w.w).replace(/[.,;:]+$/, ''); if (c.upper) t = t.toUpperCase(); return hl.has(norm(w.w)) ? `{\\c${assColor(c.highlight)}}${t}{\\c${assColor(c.color)}}` : t; }).join(' ');
    return `Dialogue: 0,${ts(s)},${ts(e)},Cap,,0,0,0,,{\\an5\\pos(${x},${y})\\fscx72\\fscy72\\t(0,90,\\fscx108\\fscy108)\\t(90,150,\\fscx100\\fscy100)}${txt}`;
  });
  return head + lines.join('\n') + '\n';
}

// fonts for the captions are copied next to the subtitle file, so ffmpeg finds them without any system setup.
// Put your own .ttf/.otf files in the "fonts" folder of the project and set captions.font in the episode to use them.
export function captionFonts(outdir, root) {
  const fdir = path.join(outdir, 'fonts'); fs.mkdirSync(fdir, { recursive: true });
  const own = path.join(root, 'fonts');
  if (fs.existsSync(own)) for (const f of fs.readdirSync(own)) if (/\.(ttf|otf)$/i.test(f)) fs.copyFileSync(path.join(own, f), path.join(fdir, f));
  const cands = process.platform === 'win32'
    ? [['C:/Windows/Fonts/ariblk.ttf', 'Arial Black'], ['C:/Windows/Fonts/impact.ttf', 'Impact'], ['C:/Windows/Fonts/arialbd.ttf', 'Arial']]
    : [['/System/Library/Fonts/Supplemental/Arial Black.ttf', 'Arial Black'], ['/Library/Fonts/Arial Black.ttf', 'Arial Black'], ['/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 'DejaVu Sans']];
  for (const [f, fam] of cands) if (fs.existsSync(f)) { fs.copyFileSync(f, path.join(fdir, path.basename(f))); return fam; }
  return 'Arial';
}
