// scripts/generate-csp-hashes.cjs
// Runs as part of the build pipeline (never manually).
// Scans every .html file in dist/, hashes all inline <script> contents,
// and writes worker/csp-generated.ts containing the complete CSP string.
// The Worker imports that module and sets the header at runtime — the
// 2000-character _headers line limit does not apply to Worker responses.
// NOTE: the CSP directives below are now maintained HERE, not in _headers.
//
// 2026-09-21 — FIX: hash sources are now emitted as 'sha256-...' (single-
// quoted). Previously they were unquoted, which Chrome parsed as host
// sources: tokens containing '+' or '=' with no early '/' were rejected
// ("invalid source ... will be ignored"), and tokens with a benign '/'
// parsed as meaningless hosts. Result: zero hashes were ever enforced.
// Build now FAILS if any token is malformed or unquoted.
//
// 2026-09-22 — CODEQL REMEDIATION: tag extraction rewritten as a
// character-level scanner. Two CodeQL rules applied to the previous
// regex approach in mutually exclusive ways: js/bad-tag-filter demands
// enough regex complexity to cover HTML edge cases (closing tags with
// whitespace/attributes, '>' inside quoted attribute values), while
// js/redos flags that exact complexity as catastrophic-backtracking
// risk. The scanner resolves both by construction: it walks the input
// forward once, tracks quote state like a browser does, finds the
// first </script to end a body, and contains no regular expression
// applied to HTML at all. Linear time, no backtracking exists.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DIST = path.resolve('dist');
const OUTPUT = path.resolve('worker/csp-generated.ts');
const BASE_DIRECTIVES = "'self' 'wasm-unsafe-eval'";

// Directives other than script-src (which receives the generated hashes).
const STATIC_CSP =
  "default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; " +
  "connect-src 'self' https://dns.google https://cloudflare-dns.com; font-src 'self'; " +
  "frame-ancestors 'none'; base-uri 'self'; form-action 'self'";

// A legal CSP hash source token, fully formed: single-quoted algorithm prefix,
// 43 base64 characters (SHA-256 digest), terminating padding character.
// (Applied to generated tokens, never to HTML — safe from js/bad-tag-filter
// and, being anchored and simple, from js/redos.)
const HASH_TOKEN_RE = /^'sha256-[A-Za-z0-9+/]{43}='$/;

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(full);
  }
  return files;
}

// --- Character-level HTML scanning (regex-free) -----------------------------
// Mirrors the rules browsers apply when locating script tags:
//   * The attribute region of a tag ends at the first unquoted '>' — a '>'
//     inside a quoted attribute value does NOT terminate the tag.
//   * '<script' / '</script' must be followed by a non-name character, so
//     hypothetical tags like <scripted> or </scripting> do not match.
//   * A script BODY ends at the first '</script' followed by whitespace,
//     '/' or '>' — regardless of any quotes inside the body (script
//     content is not attribute-parsed by browsers either).

const WS_CHARS = ' \t\n\r\f';

function isNameChar(ch) {
  return (
    (ch >= 'a' && ch <= 'z') ||
    (ch >= 'A' && ch <= 'Z') ||
    (ch >= '0' && ch <= '9') ||
    ch === '_' ||
    ch === '-'
  );
}

// Detects a 'src' attribute inside a chunk of attribute-region text
// (chunks exclude quoted values). Regex-free.
function attrHasSrc(chunk) {
  const lower = chunk.toLowerCase();
  let i = lower.indexOf('src');
  while (i !== -1) {
    const beforeOk = i === 0 || !isNameChar(lower[i - 1]);
    let k = i + 3;
    while (k < lower.length && WS_CHARS.indexOf(lower[k]) !== -1) k++;
    const afterOk = k < lower.length && lower[k] === '=';
    if (beforeOk && afterOk) return true;
    i = lower.indexOf('src', i + 1);
  }
  return false;
}

function extractInlineScripts(html) {
  const lower = html.toLowerCase();
  const n = html.length;
  const scripts = [];

  let pos = 0;
  outer: while (pos < n) {
    // 1. Find the next '<script' that is a genuine tag (boundary after).
    let open = -1;
    for (let search = pos; ; ) {
      const idx = lower.indexOf('<script', search);
      if (idx === -1) break;
      const after = idx + 7;
      if (after >= n || !isNameChar(lower[after])) {
        open = idx;
        break;
      }
      search = after;
    }
    if (open === -1) return scripts;

    // 2. Walk the attribute region to its terminating '>', tracking quotes.
    //    Accumulate attribute text in chunks between quoted values so a
    //    '>' or 'src=' hidden inside a quoted value is ignored.
    let i = open + 7;
    let tagEnd = -1;
    let srcAttr = false;
    let chunkStart = i;
    while (i < n) {
      const c = html[i];
      if (c === '"' || c === "'") {
        // Attr text before the quoted value:
        if (!srcAttr && attrHasSrc(html.slice(chunkStart, i))) srcAttr = true;
        i++;
        while (i < n && html[i] !== c) i++; // skip quoted value
        i++; // past the closing quote
        chunkStart = i;
        continue;
      }
      if (c === '>') {
        if (!srcAttr && attrHasSrc(html.slice(chunkStart, i))) srcAttr = true;
        tagEnd = i;
        break;
      }
      i++;
    }
    if (tagEnd === -1) return scripts; // truncated file: no closing '>'

    // External (<script src=...>) and self-closing tags carry no body.
    if (srcAttr || html[tagEnd - 1] === '/') {
      pos = tagEnd + 1;
      continue;
    }

    // 3. Find the body's end: first '</script' followed by ws, '/' or '>'.
    let closeIdx = -1;
    for (let search = tagEnd + 1; ; ) {
      const idx = lower.indexOf('</script', search);
      if (idx === -1) break;
      const after = idx + 8;
      if (after >= n) break;
      const nc = lower[after];
      if (!isNameChar(nc)) {
        closeIdx = idx;
        break;
      }
      search = after;
    }
    if (closeIdx === -1) return scripts; // unclosed script: skip rest

    const closeGt = html.indexOf('>', closeIdx);
    if (closeGt === -1) return scripts;

    // CRITICAL: no trim. Browsers hash the exact bytes between the tags,
    // including leading/trailing whitespace. Trimming produces hashes the
    // browser will reject.
    const body = html.slice(tagEnd + 1, closeIdx);
    if (body.trim().length > 0) scripts.push(body);

    pos = closeGt + 1;
  }

  return scripts;
}

function sha256CspToken(text) {
  const digest = crypto.createHash('sha256').update(text, 'utf-8').digest('base64');
  // SINGLE QUOTES ARE MANDATORY. A hash source without quotes is parsed
  // by browsers as a host source, silently voiding the hash.
  return `'sha256-${digest}'`;
}

function main() {
  if (!fs.existsSync(DIST)) {
    console.error('dist/ not found — run astro build first.');
    process.exit(1);
  }
  if (!fs.existsSync(path.dirname(OUTPUT))) {
    console.error('worker/ not found — aborting so the strict CSP is never weakened silently.');
    process.exit(1);
  }

  const files = walk(DIST);
  console.log(`Scanning ${files.length} HTML files...`);

  const hashes = new Set();
  for (const f of files) {
    const html = fs.readFileSync(f, 'utf-8');
    for (const s of extractInlineScripts(html)) {
      hashes.add(sha256CspToken(s));
    }
  }

  // Validation gate 1: every token must be a well-formed, quoted hash source.
  const malformed = Array.from(hashes).filter(t => !HASH_TOKEN_RE.test(t));
  if (malformed.length > 0) {
    console.error(`CSP VALIDATION FAILURE: ${malformed.length} malformed hash token(s):`);
    for (const t of malformed) console.error(`  ${JSON.stringify(t)}`);
    process.exit(1);
  }

  const sorted = Array.from(hashes).sort();
  const csp = `script-src ${[BASE_DIRECTIVES, ...sorted].join(' ')}; ${STATIC_CSP}`;

  // Validation gate 2: the assembled policy must not contain any UNQUOTED
  // 'sha256-' occurrence.
  const unquotedRe = /(^|[\s;])sha256-/;
  if (unquotedRe.test(csp)) {
    console.error('CSP VALIDATION FAILURE: assembled policy contains an unquoted sha256- token. Aborting.');
    process.exit(1);
  }

  fs.writeFileSync(
    OUTPUT,
    '// AUTO-GENERATED by scripts/generate-csp-hashes.cjs — do not edit.\n' +
    `// ${sorted.length} inline-script hashes harvested from ${files.length} pages.\n` +
    `export const CSP = ${JSON.stringify(csp)};\n`
  );
  console.log(`Wrote ${sorted.length} inline-script hashes (quoted) to worker/csp-generated.ts.`);
}

main();
