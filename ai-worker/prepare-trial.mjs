// Package only the building editor's public dependencies for the owner trial.
import { readFile, writeFile, mkdir, copyFile, cp, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const out = path.join(here, '.trial-public');
const site = 'https://ram1x7.github.io/heartopilist/';
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
let html = await readFile(path.join(root, 'build.html'), 'utf8');
// The trial has no analytics, update popups, prefetching, or service worker.
html = html.replace(/<!-- Google Analytics -->[\s\S]*?<\/script>\s*<script>[\s\S]*?<\/script>/, '')
  .replace(/<link\b[^>]*rel="(?:prefetch|manifest)"[^>]*>\s*/g, '')
  .replace(/<script\b[^>]*src="js\/(?:sw-register|data-updates|update-popup)\.js"[^>]*><\/script>\s*/g, '')
  .replace(/href="\.\/(?!build\.html)([^"#]+)"/g, (_, target) => `href="${site}${target}"`);
// Keep the styles local, along with every local script and ES module import.
html = html.replaceAll(`href="${site}css/`, 'href="./css/');
const visited = new Set();
async function include(relative) {
  relative = relative.split('?')[0];
  if (visited.has(relative)) return;
  if (relative.startsWith('../') || path.isAbsolute(relative)) throw new Error('Invalid asset path');
  visited.add(relative);
  const source = path.join(root, relative);
  const dest = path.join(out, relative);
  await mkdir(path.dirname(dest), { recursive: true });
  await copyFile(source, dest);
  if (/\.(?:m?js)$/.test(relative)) {
    const code = await readFile(source, 'utf8');
    for (const match of code.matchAll(/\b(?:from\s*|import\s*)["'](\.[^"']+)["']/g)) {
      await include(path.posix.normalize(path.posix.join(path.posix.dirname(relative), match[1])));
    }
  }
}
for (const match of html.matchAll(/(?:src|href)="((?:\.\/)?(?:js|css)\/[^" ]+)"/g)) {
  await include(match[1].replace(/^\.\//, ''));
}
await cp(path.join(root, 'locales'), path.join(out, 'locales'), { recursive: true });
await writeFile(path.join(out, 'build.html'), html);
await writeFile(path.join(out, 'index.html'), '<!doctype html><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><meta http-equiv="refresh" content="0;url=/build"><a href="/build">建築AI試験版を開く</a>');
await writeFile(path.join(out, '_headers'), '/*\n  X-Robots-Tag: noindex, nofollow\n  Referrer-Policy: strict-origin-when-cross-origin\n  X-Content-Type-Options: nosniff\n  Cache-Control: no-cache\n');
console.log(`Building trial packaged: ${visited.size} script/style files.`);
