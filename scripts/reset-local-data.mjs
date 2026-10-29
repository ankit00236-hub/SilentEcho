import './sites-env.mjs';
import {existsSync,lstatSync,readdirSync,realpathSync,rmSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(fileURLToPath(new URL('..',import.meta.url)));
if(process.argv.length!==3||process.argv[2]!=='--confirm-local-reset')throw Error('Stop the local server, then run: node scripts/reset-local-data.mjs --confirm-local-reset. This deletes local accounts, sessions, organisations, complaints, messages, and evidence.');
const config=path.join(root,'dist/server/wrangler.json'),state=path.join(root,'.wrangler/state');
if(!existsSync(config))throw Error('Run npm run build before resetting local data.');
for(const candidate of [path.join(root,'.wrangler'),state])if(existsSync(candidate)&&(lstatSync(candidate).isSymbolicLink()||!realpathSync(candidate).startsWith(root+path.sep)))throw Error('Refusing to reset a linked or external state directory.');
rmSync(state,{recursive:true,force:true});
for(const name of readdirSync(path.join(root,'drizzle')).filter(name=>/^\d+.*\.sql$/.test(name)).sort()){
 const result=spawnSync(process.execPath,[path.join(root,'node_modules/wrangler/bin/wrangler.js'),'d1','execute','DB','--local','--config',config,'--persist-to',state,'--file',path.join(root,'drizzle',name)],{cwd:root,env:process.env,stdio:'inherit'});
 if(result.status!==0)throw Error('Local state was cleared, but schema setup failed. Reapply local migrations before starting the app.');
}
console.log('Local account, organisation, case, session, and evidence data cleared. Schema recreated. Source files, supplied artwork, and the encryption key are unchanged. No hosted database was touched.');
