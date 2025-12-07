const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function walk(dir, out){
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for(const e of entries){
    const full = path.join(dir, e.name);
    if(e.isDirectory()){
      if(['download_backups','node_modules','.git','public'].includes(e.name)) continue;
      walk(full, out);
    } else {
      if(full.endsWith('.html')) out.push(full);
    }
  }
}

const htmls = [];
walk(root, htmls);
let changed = 0;
for(const hf of htmls){
  let s = fs.readFileSync(hf,'utf8');
  const orig = s;
  s = s.replace(/(src=\"[^\"]+?)\.download(\"){1}/g, '$1$2');
  s = s.replace(/(href=\"[^\"]+?)\.download(\"){1}/g, '$1$2');
  if(s !== orig){ fs.writeFileSync(hf, s, 'utf8'); changed++; }
}
console.log('Processed', htmls.length, 'HTML files, modified', changed);