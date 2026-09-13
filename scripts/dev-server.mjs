import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.xml':'application/xml; charset=utf-8','.txt':'text/plain; charset=utf-8'};
createServer(async (request,response)=>{
  try {
    const pathname = new URL(request.url,'http://localhost').pathname;
    const candidate = pathname === '/' ? 'index.html' : `${pathname.slice(1)}${extname(pathname) ? '' : '.html'}`;
    const path = join(root,candidate);
    const info = await stat(path);
    if (!info.isFile()) throw new Error('not found');
    response.writeHead(200,{'content-type':types[extname(path)]||'application/octet-stream'});
    response.end(await readFile(path));
  } catch { response.writeHead(404,{'content-type':'text/plain'}); response.end('Not found'); }
}).listen(4173,'127.0.0.1',()=>console.log('Preview: http://127.0.0.1:4173'));
