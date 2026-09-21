// scripts/generate-csp-hashes.js
// Runs as part of the build pipeline (never manually).
// Scans every .html file in dist/, hashes all inline <script> contents,
// and injects the hashes into the script-src directive of dist/_headers.
// The source public/_headers stays hash-free — the pipeline owns the hashes.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DIST = path.resolve('dist');
const HEADERS = path.join(DIST, '_headers');
// Base tokens always present; hashes get appended to these.
const BASE_DIRECTIVES = "'self' 'wasm-unsafe-eval'";

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(full);
  }
  return files;
}

function extractInlineScripts(html) {
  const scripts = [];
  const re = /<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    // External scripts are governed by 'self' — skip them.
    if (/\bsrc\s*=/.test(m[1])) continue;
    // CRITICAL: no trim. Browsers hash the exact bytes between the tags,
    // including leading/trailing whitespace and comments. Trimming here
    // produces hashes the browser will reject.
    if (m[2].length > 0) scripts.push(m[2]);
  }
  return scripts;
}

function main() {
  if (!fs.existsSync(DIST)) {
    console.error('dist/ not found — run astro build first.');
    process.exit(1);
  }

  const files = walk(DIST);
  console.log(`Scanning ${files.length} HTML files...`);

  const hashes = new Set();
  for (const f of files) {
    const html = fs.readFileSync(f, 'utf-8');
    for (const s of extractInlineScripts(html)) {
      hashes.add('sha256-' + crypto.createHash('sha256').update(s, 'utf-8').digest('base64'));
    }
  }

  if (!fs.existsSync(HEADERS)) {
    console.error('dist/_headers not found — aborting so the strict CSP is never weakened silently.');
    process.exit(1);
  }

  const sorted = Array.from(hashes).sort();
  const newSrc = [BASE_DIRECTIVES, ...sorted].join(' ');
  const headers = fs.readFileSync(HEADERS, 'utf-8');

  // Replace any existing script-src directive (hash-laden or bare) with the
  // freshly generated one. Directive-scoped: stops at the next semicolon.
  const updated = headers.replace(/script-src[^;]*/gi, `script-src ${newSrc}`);

  fs.writeFileSync(HEADERS, updated);
  console.log(`Injected ${sorted.length} inline-script hashes into dist/_headers.`);
  sorted.forEach((h) => console.log(`  ${h}`));
}

main();
