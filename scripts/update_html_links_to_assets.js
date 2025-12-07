const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const publicAssets = path.join(root, 'public', 'assets');
const jsDir = path.join(publicAssets, 'js');
const cssDir = path.join(publicAssets, 'css');
const imgDir = path.join(publicAssets, 'img');
const backupDir = path.join(root, 'download_backups', 'html_links_before_update');
if(!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, {recursive:true});

const filenameToAsset = {};
function addFiles(dir, publicPathPrefix){ if(!fs.existsSync(dir)) return; const files = fs.readdirSync(dir); for(const f of files){ filenameToAsset[f] = publicPathPrefix + '/' + f; } }
addFiles(jsDir, '/assets/js'); addFiles(cssDir, '/assets/css'); addFiles(imgDir, '/assets/img');

function walkHtml(dir, out){ const entries = fs.readdirSync(dir, {withFileTypes:true});
  for(const e of entries){ const full = path.join(dir,e.name);
    if(e.isDirectory()){ const n=e.name.toLowerCase(); if(['download_backups','.git','node_modules'].includes(n)) continue; walkHtml(full,out); }
    else if(full.endsWith('.html')) out.push(full);
  }
}
const htmls = []; walkHtml(root, htmls);
let changed = [];
for(const hf of htmls){ let s = fs.readFileSync(hf,'utf8'); const orig = s;
  // backup
  const rel = path.relative(root,hf); const bakPath = path.join(backupDir, rel); const bdir = path.dirname(bakPath); if(!fs.existsSync(bdir)) fs.mkdirSync(bdir, {recursive:true}); fs.writeFileSync(bakPath, orig, 'utf8');

  // replace occurrences of filenames
  for(const fname in filenameToAsset){
    // match occurrences like ./something/fname or /something/fname or ../.../fname or "fname" directly
    const re = new RegExp('(["\'])((?:\.\./|\./|/)?[^"\']*?)' + fname.replace(/[-\\^$*+?.()|[\]{}]/g,'\\$&') + '(["\'])','g');
    s = s.replace(re, (m, q1, pre, q3) => `${q1}${filenameToAsset[fname]}${q3}`);
  }

  if(s !== orig){ fs.writeFileSync(hf, s, 'utf8'); changed.push(path.relative(root,hf)); }
}
console.log('Updated', changed.length, 'HTML files. List:', JSON.stringify(changed, null,2));
