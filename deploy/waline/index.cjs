module.exports=require('@waline/vercel')({secureDomains:[process.env.SITE_URL || 'http://127.0.0.1:4174']});
if(require.main===module)require('node:http').createServer(module.exports).listen(Number(process.env.PORT||9090),'127.0.0.1',()=>console.log('Waline local service ready'));
