# TSF Shorts © 2026 Kevin Hopek, TikTok Success Factory (tiktoksuccessfactory.pl). Zakaz odsprzedaży i publikowania kopii, zasady: LICENSE.txt
"""Word timings for the voice-over (everything in the film is timed to these words).

    python scripts/words.py <episode> [--model small.en] [--lang en]

Reads episodes/<episode>/voice.mp3 (or .wav / .m4a) and writes:
    episodes/<episode>/words.json      [{"w": "Steve", "s": 0.31, "e": 0.62}, ...]  (seconds)
    episodes/<episode>/transcript.txt  one word per line with its time, easy to read
First run downloads the speech model (about 500 MB for "small"). Needs: pip install faster-whisper
"""
import json
import os
import sys

def decode(root, path):
    # decode with the ffmpeg that came with the project (node_modules/ffmpeg-static), 16 kHz mono float
    import subprocess, shutil
    import numpy as np
    exe = os.path.join(root, 'node_modules', 'ffmpeg-static', 'ffmpeg.exe' if os.name == 'nt' else 'ffmpeg')
    if not os.path.exists(exe):
        exe = shutil.which('ffmpeg') or exe
    raw = subprocess.run([exe, '-loglevel', 'error', '-i', path, '-ac', '1', '-ar', '16000', '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).copy()

def main():
    args = sys.argv[1:]
    if not args or args[0].startswith('--'):
        print(__doc__); sys.exit(1)
    ep = args[0]
    opt = lambda k, d: args[args.index(k) + 1] if k in args else d
    lang = opt('--lang', 'en')
    model_name = opt('--model', 'small.en' if lang == 'en' else 'small')
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    d = os.path.join(root, 'episodes', ep)
    voice = next((os.path.join(d, f) for f in ('voice.mp3', 'voice.wav', 'voice.m4a', 'voice.ogg') if os.path.exists(os.path.join(d, f))), None)
    if not voice:
        print(f'No voice file in episodes/{ep}/ (expected voice.mp3)'); sys.exit(1)
    try:
        from faster_whisper import WhisperModel
    except ImportError:
        print('Missing package. Run:  pip install faster-whisper'); sys.exit(1)
    print(f'[tsf] listening to {os.path.basename(voice)} with the "{model_name}" model ...')
    audio = decode(root, voice)
    model = WhisperModel(model_name, device='cpu', compute_type='int8')
    segs, info = model.transcribe(audio, language=lang, word_timestamps=True, vad_filter=False, beam_size=5)
    words = []
    for s in segs:
        for w in (s.words or []):
            t = w.word.strip()
            if t:
                words.append({'w': t, 's': round(w.start, 3), 'e': round(w.end, 3)})
    with open(os.path.join(d, 'words.json'), 'w', encoding='utf-8') as f:
        json.dump(words, f, ensure_ascii=False, indent=0)
    with open(os.path.join(d, 'transcript.txt'), 'w', encoding='utf-8') as f:
        f.write(f'# {len(words)} words, voice length {info.duration:.2f} s\n')
        for i, w in enumerate(words):
            f.write(f"{i:4d}  {w['s']:7.2f} - {w['e']:7.2f}  {w['w']}\n")
    print(f'[tsf] {len(words)} words, {info.duration:.1f} s -> episodes/{ep}/words.json and transcript.txt')
    if info.duration < 61:
        print(f'[tsf] NOTE: the voice is {info.duration:.1f} s. TikTok pays for videos over 1 minute: aim for 61-75 s.')

if __name__ == '__main__':
    main()
