const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function walk(dir, list=[]) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'download_backups' || e.name === 'node_modules' || e.name === '.git') continue;
      walk(full, list);
    } else {
      if (full.endsWith('.html')) list.push(full);
    }
  }
  return list;
}

function extractPaths(html) {
  const re = /(?:src|href)=\"([^\"]+)\"/g;
  const paths = [];
  let m;
  while ((m = re.exec(html)) !== null) {
    paths.push(m[1]);
  }
  return paths;
}

const htmlFiles = walk(root);
const report = [];
for (const hf of htmlFiles) {
  const relHtml = path.relative(root, hf);
  const raw = fs.readFileSync(hf, 'utf8');
  const paths = extractPaths(raw);
  const missing = [];
  for (const p of paths) {
    // ignore data: and external URLs
    if (!p || p.startsWith('data:') || p.startsWith('http://') || p.startsWith('https://') || p.startsWith('//')) continue;
    // ignore template placeholders and inline template strings
    if (p.includes('${') || p.includes('}')) continue;
    // ignore fragment-only links (anchors) and query-string navigation links
    if (p.startsWith('#') || p.includes('?')) continue;

    // ignore javascript: pseudo-protocol
    if (p.startsWith('javascript:')) continue;
    // ignore page snapshot folders and per-page _files references
    if (p.startsWith('./pages/') || p.startsWith('pages/') || p.includes('_files/')) continue;

    // ignore HTML navigation links (page-to-page links) — not static asset files
    if (/\.html($|[?#])/.test(p)) continue;

    // resolve
    let candidate;
    if (p.startsWith('/assets/')) {
      // map webroot /assets/... to filesystem public/assets/...
      candidate = path.join(root, 'public', p.replace(/^\//, ''));
    } else if (p.startsWith('/')) {
      candidate = path.join(root, p.replace(/^\//, ''));
    } else {
      candidate = path.resolve(path.dirname(hf), p);
    }
    if (!fs.existsSync(candidate)) missing.push({ref: p, resolved: path.relative(root, candidate)});
  }
  if (missing.length) report.push({file: relHtml, missing});
}

console.log(JSON.stringify({ scanned: htmlFiles.length, issues: report.length, details: report }, null, 2));
if (report.length) process.exitCode = 2;
else process.exitCode = 0;
