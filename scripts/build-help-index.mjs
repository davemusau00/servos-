import fs from 'node:fs';
import path from 'node:path';
const dir='docs/user-guide';
const files=fs.readdirSync(dir).filter(f=>f.endsWith('.md')).sort();
const readMeta=(text,key)=>text.split('\n').find(line=>line.startsWith(`${key}: `))?.slice(key.length+2).trim()||'';
const articles=files.map(file=>{const text=fs.readFileSync(path.join(dir,file),'utf8');const title=text.match(/^#\s+(.+)$/m)?.[1]||file;const overview=text.match(/## Overview\s+([\s\S]*?)(?=\n## |$)/)?.[1].trim()||'';return {id:file.replace(/\.md$/,''),title,section:readMeta(text,'Section'),roles:readMeta(text,'Roles').split(',').map(x=>x.trim()).filter(Boolean),permissions:readMeta(text,'Permission').split(',').map(x=>x.trim()).filter(Boolean),screen:readMeta(text,'Screen'),summary:overview,body:text.replace(/^#.*\n/,'').trim(),keywords:readMeta(text,'Keywords').split(',').map(x=>x.trim()).filter(Boolean)};});
fs.mkdirSync('src/generated',{recursive:true});
fs.writeFileSync('src/generated/help-index.json',JSON.stringify({generatedAt:new Date().toISOString(),source:'docs/user-guide',count:articles.length,articles},null,2)+'\n');
console.log(`Generated ${articles.length} offline help articles.`);
