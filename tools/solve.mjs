// tools/solve.mjs: runs every solve ONCE on the build machine (leg fits, contact poses, forearm, slides, rest hands,
// muscle anchors) and saves solved.json. `npm run preview` and `npm start` only LOAD it (they stop if it is missing or
// out of date). Software WebGL is enough: nothing is rendered. --only a,b re-solves only those contacts (keeps the rest).
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, serve, launch, openPage } from './common.mjs';
const { srv, url } = await serve();
const browser = await launch({ gpu: false });
try {
  const t0 = Date.now();
  const only = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1] : null;
  const page = await openPage(browser, url + '?render=1&solve=1&samples=1&w=320&h=180' + (only ? '&only=' + only : ''));
  const out = await page.evaluate(() => window.SOLVED_OUT);
  if (!out) throw new Error('the solve produced nothing');
  fs.writeFileSync(path.join(ROOT, 'solved.json'), JSON.stringify(out, null, 1));
  console.log(out.log.join('\n'));
  console.log('solved.json written in', ((Date.now() - t0) / 1000).toFixed(0), 's, hash', out.hash);
} finally { await browser.close(); srv.close(); }
