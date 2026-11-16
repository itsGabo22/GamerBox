#!/usr/bin/env node
/**
 * Finds literal UI text in components that bypasses src/i18n/dictionary.ts.
 * Flags (1) JSX text nodes and (2) user-facing string attributes that contain real words.
 * Usage: npm run i18n:check   (exits 1 when something is found)
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve('src');
const ATTRS = ['placeholder', 'aria-label', 'title', 'alt', 'label', 'eyebrow', 'actionLabel', 'body'];

// Brand names, endonyms, units and code-like tokens that are intentionally not translated.
const ALLOW = [
  /^GamerBox$/, /^Gamer$/, /^Box$/, /^GB$/, /^LVL$/, /^XP$/, /^Español$/, /^English$/,
  /^[A-Z]{2}$/, /^\d[\d\s/.,+%−-]*(XP|h)?$/, /^[+−-]?\d+%?( XP)?$/,
];
// Illustration placeholders (fake numbers / initials inside drawings).
const SKIP_FILES = ['components/tutorial/TutorialArt.tsx'];

const WORD = /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]{2,}/;
const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));

const findings = [];
for (const file of walk(ROOT).filter((f) => f.endsWith('.tsx'))) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  if (SKIP_FILES.includes(rel)) continue;
  const source = fs.readFileSync(file, 'utf8');
  // Drop comments so prose in them is not reported.
  const code = source.replace(/\{\/\*[\s\S]*?\*\/\}/g, (m) => m.replace(/[^\n]/g, ' ')).replace(/^\s*\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
  const lineOf = (index) => code.slice(0, index).split('\n').length;
  const report = (index, text, kind) => {
    const value = text.trim();
    // "<Icon />, KEY:" inside object literals is code, not copy.
    if (/^,\s*\w+:$/.test(value) || /^[·•/|\s\d]*(XP|h)?$/.test(value)) return;
    if (!value || !WORD.test(value) || ALLOW.some((re) => re.test(value))) return;
    findings.push(`${rel}:${lineOf(index)}  [${kind}]  ${value.slice(0, 80)}`);
  };

  // (1) Text between tags: >text<   (no braces = not an expression)
  for (const m of code.matchAll(/>([^<>{}=;()]*?)<\/?[A-Za-z]/g)) report(m.index, m[1], 'text');
  // (1b) Text right after an expression: {value} text</tag>
  for (const m of code.matchAll(/\}([^<>{}=;()`'"]*?)<\/[A-Za-z]/g)) report(m.index, m[1], 'text');
  // (2) Literal attribute values
  for (const attr of ATTRS) {
    for (const m of code.matchAll(new RegExp(`\\s${attr}="([^"]*)"`, 'g'))) report(m.index, m[1], attr);
  }
}

if (findings.length) {
  console.error(`i18n-check: ${findings.length} literal string(s) outside dictionary.ts\n` + findings.join('\n'));
  process.exit(1);
}
console.log('i18n-check: clean — no literal UI text found in components.');
