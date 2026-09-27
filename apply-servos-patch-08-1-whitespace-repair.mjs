import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(process.argv[2]||process.cwd());
const rel='tests/folios-source.test.mjs';
const file=path.join(root,rel);
if(!fs.existsSync(file)) throw new Error(`Missing ${rel}`);

const before=fs.readFileSync(file,'utf8');
const newline=before.includes('\r\n')?'\r\n':'\n';
const after=before.replace(/(?:\r?\n)+$/,'')+newline;

if(after===before){
  console.log(`${rel}: already has exactly one final newline.`);
}else{
  fs.writeFileSync(file,after,'utf8');
  console.log(`Repaired EOF whitespace: ${rel}`);
}
console.log('No application logic, Rust, SQLite, Supabase, or business data was changed.');
console.log('Next: git diff --check');
