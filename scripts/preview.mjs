// Opens the live preview of an episode in your browser:  node scripts/preview.mjs <episode>
import { spawn } from 'node:child_process';
import { serve, log } from './common.mjs';
const ep = process.argv[2] || 'demo';
const { port } = await serve(8800).catch(() => serve(0));
const url = `http://127.0.0.1:${port}/player/preview.html?ep=${encodeURIComponent(ep)}`;
log('preview: ' + url + '   (close this window to stop)');
const cmd = process.platform === 'win32' ? ['cmd', ['/c', 'start', '', url]] : process.platform === 'darwin' ? ['open', [url]] : ['xdg-open', [url]];
try { spawn(cmd[0], cmd[1], { stdio: 'ignore', detached: true }).unref(); } catch (e) {}
