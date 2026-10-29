import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2','.wav':'audio/wav'};
const port = Number(process.argv[2] || 4190);
http.createServer(async (req,res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    let name = decodeURIComponent(url.pathname), root = path.resolve('.local/endfield/public');
    if (name === '/__review/') {root = path.resolve('examples/visual');name = '/review.html';}
    else if(name.startsWith('/__screens/')) {root = path.resolve('.local/screenshots/endfield');name = name.slice('/__screens'.length);}
    else if(name.startsWith('/__variants/')) {
      const variant = name.split('/')[2];
      if(!['no-cover','few','empty'].includes(variant)) throw Error('Unknown variant');
      root = path.resolve('.local/endfield-'+variant+'/public');name = '/index.html';
    }
    if(name.endsWith('/'))name+='index.html';
    const file=path.resolve(root,'.'+name);
    if(!file.startsWith(root+path.sep))throw Error('Invalid path');
    const data=await fs.readFile(file);
    res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});res.end(data);
  } catch {res.writeHead(404);res.end('Not found');}
}).listen(port,'127.0.0.1',()=>console.log('Endfield review: http://127.0.0.1:'+port+'/__review/'));
