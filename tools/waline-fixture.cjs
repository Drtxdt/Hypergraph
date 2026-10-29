const http=require('node:http');
let handler;
const server=http.createServer((req,res)=>{
 if(req.url==='/test-oauth-services'){res.setHeader('Content-Type','application/json');res.end('{"services":[]}');return;}
 return handler(req,res);
});
server.listen(0,'127.0.0.1',()=>{
 process.env.SERVER_URL='http://127.0.0.1:'+server.address().port;
 process.env.OAUTH_URL=process.env.SERVER_URL+'/test-oauth-services';
 console.log('Loading Waline');
 handler=require('../deploy/waline/index.cjs');
 console.log('Loaded Waline');
 process.send({url:process.env.SERVER_URL});
});
