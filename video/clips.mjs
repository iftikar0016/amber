// Records the video's live clips from the committed capsule and page, in headless Chrome (1920x1080).
//   node video/clips.mjs [open|baseline|heal|live ...]      -> .amber/video/clip-<name>.mp4
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../src/config.mjs';
import { createCapsuleServer } from '../src/capsule/serve.mjs';
import { launch } from '../scripts/lib/chrome.mjs';
import { recordTab } from './lib/media.mjs';

const PORT = 4796;
const O = `http://127.0.0.1:${PORT}`;
const OUT = path.join(ROOT, '.amber', 'video');
const BASELINE_DONE = 'verify-2026-11-23T15-56-36'; // the baseline, plus j10's authored baseline
const only = process.argv.slice(2);

const srv = createCapsuleServer({ port: PORT });
await srv.listen();
const c = await launch({ width: 1920, height: 1080, port: 9335 });
// A 1440-wide layout rendered at 4/3 scale: 1920x1080 pixels, with the amber block filling most of the frame.
await c.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 810, deviceScaleFactor: 4 / 3, mobile: false });
const js = (expr) => c.evaluate(expr);
const waitFor = async (expr, ms = 60000) => {
  const until = Date.now() + ms;
  while (Date.now() < until) {
    if (await js(expr)) return true;
    await c.sleep(150);
  }
  return false;
};
const counter = 'document.getElementById("counter") && document.getElementById("counter").textContent';
// The page's buttons and slider are for visitors; in the video they would sit under the captions.
const hideControls = () => js('document.querySelector(".controls").style.visibility = "hidden"; true');
const typeText = async (text, perChar = 70) => {
  for (const ch of text) {
    await c.send('Input.insertText', { text: ch });
    await c.sleep(perChar);
  }
};

const clips = {
  /** Cold open: the recorded run replayed from nothing to 15/15. */
  async open() {
    await c.goto(`${O}/amber/?t=start&speed=8`, 2500);
    await hideControls();
    return recordTab(c, path.join(OUT, 'clip-open.mp4'), async () => {
      await c.sleep(1200);
      await js('document.getElementById("replay").click()');
      await waitFor(`(${counter}).startsWith("15 of 15") && document.getElementById("replay").textContent.includes("Replay")`, 90000);
      await c.sleep(2500);
    });
  },
  /** The block right after the baseline: seven crimson fractures. */
  async baseline() {
    await c.goto(`${O}/amber/?until=${BASELINE_DONE}`, 2500);
    await hideControls();
    return recordTab(c, path.join(OUT, 'clip-baseline.mp4'), async () => c.sleep(12000));
  },
  /** From the baseline to the end: the fractures heal as Kane proves each repair. */
  async heal() {
    await c.goto(`${O}/amber/?until=${BASELINE_DONE}`, 2500);
    await hideControls();
    return recordTab(c, path.join(OUT, 'clip-heal.mp4'), async () => {
      await c.sleep(800);
      await c.goto(`${O}/amber/?until=${BASELINE_DONE}&play&speed=3`, 0);
      await c.sleep(300);
      await hideControls();
      await waitFor(`(${counter}).startsWith("15 of 15") && document.getElementById("replay").textContent.includes("Replay")`, 120000);
      await c.sleep(2500);
    });
  },
  /** The capsule itself: add a task, reload, it is still there; then the same capsule inside the flipped block. */
  async live() {
    await c.goto(`${O}/amber/`, 1500);
    await js('localStorage.clear(); indexedDB.deleteDatabase("amber-capsule"); true');
    await c.goto(`${O}/`, 4000); // a visitor: signed in as the demo user
    return recordTab(c, path.join(OUT, 'clip-live.mp4'), async () => {
      await c.sleep(1500);
      await js('[...document.querySelectorAll("a")].find((a) => a.textContent.trim() === "Kitchen renovation").click()');
      await waitFor('document.body.innerText.includes("Choose worktop")');
      await c.sleep(1200);
      await js('document.querySelector("input[placeholder*=\\"Add a task\\"], textarea[placeholder*=\\"Add a task\\"]").focus()');
      await typeText('Paint samples for the hallway');
      await c.sleep(500);
      await c.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
      await c.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
      await waitFor('document.body.innerText.includes("Paint samples for the hallway")');
      await c.sleep(2200);
      await c.send('Page.reload', {});
      await c.sleep(1200);
      await waitFor('document.body.innerText.includes("Paint samples for the hallway")');
      await c.sleep(2500);
      await c.goto(`${O}/amber/`, 1800);
      await js('document.getElementById("flip").click()');
      await c.sleep(6500);
    });
  },
};

try {
  for (const [name, fn] of Object.entries(clips)) {
    if (only.length && !only.includes(name)) continue;
    const r = await fn();
    console.log(`clip-${name}.mp4: ${r.frames} frames, ${r.seconds.toFixed(1)} s`);
  }
} finally {
  await c.close();
  await srv.close();
}
