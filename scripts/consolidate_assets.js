const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.resolve(__dirname, '..');
const publicAssets = path.join(root, 'public', 'assets');
const jsDir = path.join(publicAssets, 'js');
const cssDir = path.join(publicAssets, 'css');
const imgDir = path.join(publicAssets, 'img');
const backupHtmlDir = path.join(root, 'download_backups', 'html_backups');

function ensure(dir){ if(!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); }
ensure(jsDir); ensure(cssDir); ensure(imgDir); ensure(backupHtmlDir);

function hashFile(fp){ try{ const data = fs.readFileSync(fp); return crypto.createHash('md5').update(data).digest('hex'); }catch(e){return null;} }

function shouldCopy(file){ const ext = path.extname(file).toLowerCase(); return ['.js','.css','.png','.jpg','.jpeg','.gif','.svg','.ico','.webp'].includes(ext); }

// Find candidate asset files (walk folders but skip download_backups, public/assets, .git, node_modules)
function walkAssets(dir, out){ const entries = fs.readdirSync(dir, {withFileTypes:true});
  for(const e of entries){ const full = path.join(dir,e.name);
    if(e.isDirectory()){
      const n = e.name.toLowerCase();
      if(['download_backups','public','node_modules','.git'].includes(n)) continue;
      walkAssets(full, out);
    } else {
      if(shouldCopy(full)) out.push(full);
    }
  }
}

const candidates = [];
walkAssets(root, candidates);

const copied = [];
for(const src of candidates){
  const rel = path.relative(root, src);
  // Skip files already inside public/assets
  if(rel.startsWith(path.join('public','assets'))) continue;
  const ext = path.extname(src).toLowerCase();
  const base = path.basename(src);
  let destDir = imgDir;
  if(ext === '.js') destDir = jsDir;
  else if(ext === '.css') destDir = cssDir;
  else destDir = imgDir;
  const dest = path.join(destDir, base);
  // If dest exists and same hash, skip; if exists and different, create a conflict-suffixed name
  if(fs.existsSync(dest)){
    const h1 = hashFile(src); const h2 = hashFile(dest);
    if(h1 === h2){ /* same file */ continue; }
    // create a unique name
    const name = path.basename(base, ext);
    const newName = `${name}--conflict-${h1.slice(0,8)}${ext}`;
    const newDest = path.join(destDir, newName);
    fs.copyFileSync(src, newDest);
    copied.push({src:rel,dest:path.relative(root,newDest),conflict:true});
  } else {
    ensure(destDir);
    try{ fs.copyFileSync(src, dest); copied.push({src:rel,dest:path.relative(root,dest),conflict:false}); }catch(e){ console.error('copy failed', src, e.message); }
  }
}

// Now update HTML files to point to /assets/... for references to these filenames (only local relative references)
function walkHtml(dir, out){ const entries = fs.readdirSync(dir, {withFileTypes:true});
  for(const e of entries){ const full = path.join(dir,e.name);
    if(e.isDirectory()){
      const n=e.name.toLowerCase(); if(n==='download_backups' || n==='node_modules' || n==='.git' || (n==='public' && path.basename(path.dirname(full))===path.basename(root))) continue;
      walkHtml(full,out);
    } else {
      if(full.endsWith('.html')) out.push(full);
    }
  }
}

const htmlFiles = [];
walkHtml(root, htmlFiles);

const filenameToAsset = {};
for(const item of copied){ const name = path.basename(item.dest); const ext = path.extname(name).toLowerCase();
  let publicPath = `/assets/js/${name}`;
  if(['.css'].includes(ext)) publicPath = `/assets/css/${name}`;
  if(['.png','.jpg','.jpeg','.gif','.svg','.ico','.webp'].includes(ext)) publicPath = `/assets/img/${name}`;
  filenameToAsset[name] = publicPath;
}
// Also include files that were already present in public/assets before (so replacements can point there)
function listDirFiles(d,relbase){ if(!fs.existsSync(d)) return; const e = fs.readdirSync(d); for(const f of e) filenameToAsset[f] = `/${path.relative(root, d).replace(/\\/g,'/')}/${f}`; }
listDirFiles(jsDir); listDirFiles(cssDir); listDirFiles(imgDir);

const modified = [];
for(const hf of htmlFiles){
  let raw = fs.readFileSync(hf,'utf8');
  const orig = raw;
  // backup
  const rel = path.relative(root,hf);
  const bakPath = path.join(backupHtmlDir, rel);
  ensure(path.dirname(bakPath));
  fs.writeFileSync(bakPath, orig, 'utf8');

  // Remove .download suffixes in references
  raw = raw.replace(/(\.(js|css|png|jpg|jpeg|gif|svg|ico|webp))\.download/g, '$1');

  // Replace local relative references to known filenames with /assets paths
  for(const fname in filenameToAsset){
     // replace occurrences like ./some_files/fname or /some/path/fname or ../whatever/fname
     const esc = fname.replace(/[-\\^$*+?.()|[\\]{}]/g, '\\$&');
     const re = new RegExp('(["\\\\\'])([^"\\\\\']*\\\\/)?' + esc + '(["\\\\\'])', 'g');
     raw = raw.replace(re, (m, q1, pre, q3) => `${q1}${filenameToAsset[fname]}${q3}`);
  }

  if(raw !== orig){ fs.writeFileSync(hf, raw, 'utf8'); modified.push(path.relative(root,hf)); }
}

console.log(JSON.stringify({copiedCount: copied.length, copied, modifiedCount: modified.length, modified}, null, 2));
