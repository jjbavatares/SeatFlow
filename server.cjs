/* Loopback only: application files and explicit session saves to Desktop/SeatFlow. */
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const store=require('./session-store.cjs');
const root=__dirname,port=Number(process.env.SEATFLOW_PORT)||48765;
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.txt':'text/plain; charset=utf-8','.json':'application/json','.bcmap':'application/octet-stream','.pfb':'application/octet-stream','.ttf':'font/ttf'};
function json(res,status,value){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(value));}
async function readJson(req){const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>5*1024*1024)throw Error('La sessió és massa gran.');chunks.push(chunk);}try{return JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw Error('La sessió no conté dades JSON vàlides.');}}
const server=http.createServer(async(req,res)=>{
  const allowedHost=`127.0.0.1:${server.address()?.port}`;
  if(req.headers.host!==allowedHost){res.writeHead(403);return res.end();}
  if(req.url==='/api/session-storage'&&req.method==='GET'){try{return json(res,200,{directory:await store.sessionDirectory()});}catch{return json(res,500,{error:'No es pot localitzar la carpeta de sessions a l’escriptori.'});}}
  if(req.url==='/api/sessions'&&req.method==='GET'){try{return json(res,200,await store.listSessions());}catch{return json(res,500,{error:'No es pot llegir la carpeta SeatFlow de l’escriptori.'});}}
  if(req.url==='/api/sessions'&&req.method==='POST'){
    if(req.headers.origin!==`http://${allowedHost}`||!/^application\/json(?:;|$)/i.test(req.headers['content-type']||''))return json(res,403,{error:'Petició de desament no autoritzada.'});
    try{return json(res,201,await store.saveSession(await readJson(req)));}catch(err){return json(res,400,{error:['EACCES','EPERM','ENOSPC'].includes(err.code)?'No es pot escriure a Escriptori/SeatFlow. Comprova els permisos i l’espai disponible.':err.message});}
  }
  if(req.url==='/api/open-session'&&req.method==='POST'){
    if(req.headers.origin!==`http://${allowedHost}`||!/^application\/json(?:;|$)/i.test(req.headers['content-type']||''))return json(res,403,{error:'Petició d’obertura no autoritzada.'});
    try{const payload=await readJson(req);return json(res,200,await store.openStoredSession(payload.name));}catch(err){return json(res,400,{error:err.code==='ENOENT'?'La sessió ja no és a la carpeta SeatFlow.':err.message});}
  }
  if(req.url==='/api/shutdown'&&req.method==='POST'){
    if(req.headers.origin!==`http://${allowedHost}`||!/^application\/json(?:;|$)/i.test(req.headers['content-type']||''))return json(res,403,{error:'Petició de tancament no autoritzada.'});
    json(res,200,{closed:true});setTimeout(()=>{server.close();server.closeIdleConnections?.();setTimeout(()=>process.exit(0),800).unref();},100);return;
  }
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);return res.end();}
  let name;try{name=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);}catch{res.writeHead(400);return res.end();}
  const file=path.resolve(root,'.'+(name==='/'?'/index.html':name));
  if(!file.startsWith(root+path.sep)||!types[path.extname(file)]||name.includes('\0')){res.writeHead(403);return res.end();}
  fs.stat(file,(err,st)=>{if(err||!st.isFile()){res.writeHead(404);return res.end('Not found');}
    res.writeHead(200,{'Content-Type':types[path.extname(file)],'Content-Length':st.size,'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; font-src 'self'; script-src 'self'; worker-src 'self' blob:; connect-src 'self' blob:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'"});
    if(req.method==='HEAD')return res.end();const stream=fs.createReadStream(file);stream.on('error',()=>res.destroy());stream.pipe(res);
  });
}).listen(port,'127.0.0.1',()=>console.log(`SeatFlow: http://127.0.0.1:${port}`)).on('error',err=>{console.error(err.code==='EADDRINUSE'?'SeatFlow ja està obert en aquest port.':err.message);process.exit(1);});
