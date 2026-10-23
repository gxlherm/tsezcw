import http from 'node:http';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
const PORT=Number(process.env.PORT||3000);
const songs=[
 {id:'luzes',title:'Luzes da Noite',artist:'Demo original',duration:32,notes:[60,62,64,67,67,64,62,60,62,64,65,67,67,65,64,60]},
 {id:'sol',title:'Sol de Verão',artist:'Demo original',duration:32,notes:[64,64,67,69,71,69,67,64,65,67,69,72,71,69,67,64]}
];
const rooms=new Map(),devices=new Map(),attempts=new Map();
const now=()=>Date.now();
function reply(res,status,value){res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'});res.end(JSON.stringify(value))}
function code(){for(let i=0;i<200;i++){const c=String(crypto.randomInt(1e6)).padStart(6,'0');if(!rooms.has(c))return c}throw Error('code exhausted')}
function roomFor(device){let room=rooms.get(devices.get(device));if(!room){const c=code();room={code:c,deviceId:device,token:null,joined:false,singer:'',command:'stop',cmdSeq:0,songId:'luzes',state:'stopped',position:0,score:0,localRevision:0,lastDevice:now()}; rooms.set(c,room);devices.set(device,c)}room.lastDevice=now();return room}
function authorized(req,c){const room=rooms.get(c),token=req.headers['x-room-token'];if(!room||!room.token||typeof token!=='string')return null;const a=Buffer.from(token),b=Buffer.from(room.token);return a.length===b.length&&crypto.timingSafeEqual(a,b)?room:null}
async function body(req){let data='';for await(const ch of req){data+=ch.toString();if(data.length>8192)throw Object.assign(Error('Mensagem muito grande'),{status:413})}try{return JSON.parse(data)}catch{throw Object.assign(Error('JSON inválido'),{status:400})}}
function rate(req){const ip=req.headers['x-forwarded-for']?.split(',')[0]||req.socket.remoteAddress||'unknown',t=now();let x=attempts.get(ip);if(!x||t-x.since>300000)x={since:t,n:0};x.n++;attempts.set(ip,x);return x.n<=30}
function cleanup(){for(const [c,r] of rooms)if(now()-r.lastDevice>1800000){rooms.delete(c);devices.delete(r.deviceId)}for(const [ip,x] of attempts)if(now()-x.since>300000)attempts.delete(ip)}
const server=http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost'),p=url.pathname;
  if(p==='/health')return reply(res,200,{ok:true,app:'VOZE Karaoke',version:'0.3.0',hosting:'render-free'});
  if(p==='/'&&req.method==='GET'){const html=fs.readFileSync(path.join(here,'phone.html'));res.writeHead(200,{'content-type':'text/html; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'});return res.end(html)}
  if(p==='/api/catalog'&&req.method==='GET')return reply(res,200,{songs});
  if(p==='/api/device/poll'&&req.method==='GET'){
   const device=url.searchParams.get('device')||'';
   if(!/^[A-Za-z0-9_-]{12,64}$/.test(device))return reply(res,400,{error:'Dispositivo inválido'});
   const r=roomFor(device),state=url.searchParams.get('state'),position=Number(url.searchParams.get('position')),songId=url.searchParams.get('song'),revision=Number(url.searchParams.get('localRev'));
   if(['playing','paused','stopped','finished','buffering','error'].includes(state))r.state=state;
   if(url.searchParams.has('position')&&Number.isFinite(position))r.position=Math.min(36000,Math.max(0,position));
   if(Number.isSafeInteger(revision)&&revision>r.localRevision&&songs.some(s=>s.id===songId)){r.localRevision=revision;r.songId=songId}
   return reply(res,200,{code:r.code,joined:r.joined,singer:r.singer,command:r.command,cmdSeq:r.cmdSeq,songId:r.songId,score:r.score});
  }
  if(req.method==='POST'){
   if(req.headers['content-type']?.split(';')[0]!=='application/json')return reply(res,415,{error:'Use application/json'});
   const origin=req.headers.origin;
   if(origin&&origin!=='https://'+req.headers.host&&origin!=='http://'+req.headers.host)return reply(res,403,{error:'Origem não permitida'});
   if(p==='/api/rooms/join'){
    if(!rate(req))return reply(res,429,{error:'Muitas tentativas. Tente mais tarde.'});
    const b=await body(req),c=String(b.code||''),r=rooms.get(c);
    if(!/^\d{6}$/.test(c)||!r)return reply(res,404,{error:'Código não encontrado'});
    if(now()-r.lastDevice>180000)return reply(res,410,{error:'Roku desconectada'});
    r.token=crypto.randomBytes(32).toString('hex');r.joined=true;r.singer=String(b.name||'Cantor').trim().slice(0,36)||'Cantor';
    return reply(res,200,{code:c,token:r.token,singer:r.singer});
   }
   if(p==='/api/rooms/command'||p==='/api/rooms/score'){
    const b=await body(req),r=authorized(req,b.code);
    if(!r)return reply(res,401,{error:'Conecte novamente'});
    if(p.endsWith('/score')){if(typeof b.score!=='number'||!Number.isFinite(b.score))return reply(res,400,{error:'Pontuação inválida'});r.score=Math.max(0,Math.min(100,Math.round(b.score)));return reply(res,200,{ok:true})}
    if(!['play','pause','restart','stop','choose'].includes(b.action))return reply(res,400,{error:'Comando inválido'});
    if(b.action==='choose'){if(!songs.some(s=>s.id===b.songId))return reply(res,400,{error:'Música inválida'});r.songId=b.songId}
    r.command=b.action;r.cmdSeq++;
    if(['play','restart'].includes(b.action))r.state='buffering';
    if(b.action==='pause')r.state='paused';
    if(['stop','choose'].includes(b.action)){r.state='stopped';r.position=0}
    if(['restart','choose'].includes(b.action))r.score=0;
    return reply(res,200,{ok:true,cmdSeq:r.cmdSeq});
   }
  }
  if(p==='/api/rooms/state'&&req.method==='GET'){
   const r=authorized(req,url.searchParams.get('code'));
   if(!r)return reply(res,401,{error:'Conecte novamente'});
   return reply(res,200,{code:r.code,singer:r.singer,score:r.score,songId:r.songId,state:r.state,position:r.position,deviceOnline:now()-r.lastDevice<5000,songs});
  }
  reply(res,404,{error:'Não encontrado'});
 }catch(e){reply(res,e.status||500,{error:e.status?e.message:'Erro interno'})}
});
server.listen(PORT,'0.0.0.0',()=>console.log('VOZE Karaokê rodando na porta '+PORT));
setInterval(cleanup,60000).unref();
