#!/usr/bin/env node
// Serve the committed capsule: no install, no Kane account, no credits, and no Vikunja.
//   node bin/demo.mjs
// Then open http://127.0.0.1:4790/ (the app, signed in as the demo user) and http://127.0.0.1:4790/amber/ (the block).
// Uses only Node's built-in modules.
import { createCapsuleServer } from '../src/capsule/serve.mjs';

const srv = createCapsuleServer();
try {
  const origin = await srv.listen();
  console.log(`AMBER capsule: ${origin}/  (Vikunja with no server)`);
  console.log(`AMBER page:    ${origin}/amber/  (the amber block and the recorded run)`);
  console.log('Ctrl+C to stop. Changes you make stay in your browser; "Reset demo" on the page restores the seed.');
} catch (e) {
  console.error(`Could not listen on 127.0.0.1:4790 (${e.code ?? e.message}). Is something else using that port? Set AMBER_PORT to use another.`);
  process.exitCode = 1;
}
