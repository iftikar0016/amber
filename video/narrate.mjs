// Renders each scene's narration with ElevenLabs, with per-character timings for the captions.
// The key is read from .amber/tts.env (gitignored) and never printed.
//   node video/narrate.mjs [--voice George] [--sample "text"]
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../src/config.mjs';

const OUT = path.join(ROOT, '.amber', 'video', 'audio');
const MODEL = 'eleven_multilingual_v2';
const SETTINGS = { stability: 0.55, similarity_boost: 0.75, style: 0.1, use_speaker_boost: true };

function key() {
  const file = path.join(ROOT, '.amber', 'tts.env');
  const line = fs.readFileSync(file, 'utf8').split(/\r?\n/).find((l) => l.startsWith('ELEVENLABS_API_KEY='));
  const k = line ? line.slice('ELEVENLABS_API_KEY='.length).trim().replace(/^['"]|['"]$/g, '') : '';
  if (!k) throw new Error('No ELEVENLABS_API_KEY in .amber/tts.env');
  return k;
}

async function voiceId(name) {
  const r = await fetch('https://api.elevenlabs.io/v1/voices', { headers: { 'xi-api-key': key() } });
  if (!r.ok) throw new Error(`ElevenLabs voices: ${r.status}`);
  const v = (await r.json()).voices.find((x) => x.name.toLowerCase().startsWith(name.toLowerCase()));
  if (!v) throw new Error(`No voice named ${name}`);
  return v.voice_id;
}

/** One request: mp3 plus character timings. Cached by voice + text. */
export async function speak(text, voice, outBase) {
  const hash = createHash('sha256').update(voice + '\n' + MODEL + '\n' + JSON.stringify(SETTINGS) + '\n' + text).digest('hex').slice(0, 12);
  const mp3 = `${outBase}.mp3`;
  const meta = `${outBase}.json`;
  if (fs.existsSync(meta) && JSON.parse(fs.readFileSync(meta, 'utf8')).hash === hash && fs.existsSync(mp3)) return JSON.parse(fs.readFileSync(meta, 'utf8'));
  const id = await voiceId(voice);
  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${id}/with-timestamps?output_format=mp3_44100_128`, {
    method: 'POST',
    headers: { 'xi-api-key': key(), 'content-type': 'application/json' },
    body: JSON.stringify({ text, model_id: MODEL, voice_settings: SETTINGS }),
  });
  if (!r.ok) throw new Error(`ElevenLabs TTS: ${r.status} ${(await r.text()).slice(0, 200)}`);
  const j = await r.json();
  fs.mkdirSync(path.dirname(mp3), { recursive: true });
  fs.writeFileSync(mp3, Buffer.from(j.audio_base64, 'base64'));
  const a = j.alignment || j.normalized_alignment;
  const out = { hash, voice, text, chars: a.characters, starts: a.character_start_times_seconds, ends: a.character_end_times_seconds };
  fs.writeFileSync(meta, JSON.stringify(out));
  return out;
}

const args = process.argv.slice(2);
const voice = args.includes('--voice') ? args[args.indexOf('--voice') + 1] : 'George';
if (args.includes('--sample')) {
  const text = args[args.indexOf('--sample') + 1];
  const r = await speak(text, voice, path.join(ROOT, '.amber', 'video', 'samples', `sample-${voice.toLowerCase()}`));
  console.log(`sample ${voice}: ${r.ends.at(-1).toFixed(1)} s`);
} else {
  const script = JSON.parse(fs.readFileSync(path.join(ROOT, 'video', 'script.json'), 'utf8'));
  let total = 0;
  let chars = 0;
  for (const s of script.scenes) {
    const r = await speak(s.narration, voice, path.join(OUT, s.id));
    total += r.ends.at(-1);
    chars += s.narration.length;
    console.log(`${s.id}: ${r.ends.at(-1).toFixed(1)} s`);
  }
  console.log(`total narration ${total.toFixed(1)} s, ${chars} characters, voice ${voice}`);
}
