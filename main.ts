// Gobble Dash — the Great Turkey Escape. Entry program, Node 22, standard
// library only.
//
// What it does: takes the finished game (game/, plain static files that a
// desktop browser opens offline — game/index.html plus its ES modules, no
// libraries, no network) and the maker screenshots (screenshots/), copies
// both into the grader's output directory, and writes the dossier.json the
// judge reads, using the vendored make.fun library.
//
// How to run it while building:
//   node serve.ts            # play the game at http://localhost:8080
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts   # build /output
// Inside the grader MAKEFUN_OUTPUT_DIR is unset and the output goes to /output.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function copyTree(name) {
  const from = join(repoRoot, name);
  const to = join(outputDir, name);
  if (!existsSync(from)) return;
  mkdirSync(to, { recursive: true });
  cpSync(from, to, { recursive: true });
}

mkdirSync(outputDir, { recursive: true });
copyTree('game');
copyTree('screenshots');

// Caps mirror the gate so a local run refuses what the scorer would refuse:
// at most 4 screenshots of 256 KiB each, at most 993 game files totalling
// 48 MiB, no game path over 1000 bytes. Only text_max_bytes changes the
// dossier's bytes; the rest are guardrails. Screenshots are the maker's own
// renders of the game (see shots.json for how each one was staged).
const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);
