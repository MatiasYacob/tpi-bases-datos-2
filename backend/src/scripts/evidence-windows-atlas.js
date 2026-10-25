// Restaura la copia real de Atlas solo en un mongod temporal propio.
import { spawn } from 'node:child_process';
import { writeFile, readFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient } from 'mongodb';
const root=fileURLToPath(new URL('../../../',import.meta.url));
const shell=process.env.SystemRoot+'\\System32\\WindowsPowerShell\\v1.0\\powershell.exe';
const date=new Date().toLocaleDateString('sv-SE');
const copy=path.join(root,'resguardos_tpi',date);
const expected=JSON.parse(await readFile(path.join(copy,'conteos-esperados.json'),'utf8'));
let mongod,client;
try{
 mongod=await MongoMemoryServer.create({binary:{version:'7.0.24'}});
 const uri=mongod.getUri().replace(/\/$/,'');
 const child=spawn(shell,['-NoProfile','-ExecutionPolicy','Bypass','-File',path.join(root,'scripts/restaurar-prueba.ps1'),'-Fecha',date,'-UriLocal',uri],{cwd:process.env.TEMP,windowsHide:true});
 let output='';child.stdout.on('data',b=>output+=b);child.stderr.on('data',b=>output+=b);
 const code=await new Promise((resolve,reject)=>{child.on('close',resolve);child.on('error',reject);});
 console.log(output);assert.equal(code,0);
 client=await new MongoClient(uri).connect();const db=client.db('tpi_tienda_restore_test');
 const counts={},states={};
 for(const n of ['clientes','productos','pedidos']){
  counts[n]=await db.collection(n).countDocuments({});assert.equal(counts[n],expected[n]);
  const active=await db.collection(n).countDocuments({activo:true});states[n]={activos:active,inactivos:counts[n]-active};
 }
 const restoredReport=await db.collection('pedidos').aggregate([
  {$match:{activo:true,estado:'completado'}},{$unwind:'$items'},{$group:{_id:'$items.categoria',unidades:{$sum:'$items.cantidad'},centavos:{$sum:'$items.subtotalCentavos'}}},{$sort:{_id:1}},
 ]).toArray();
 const nodeRequire=(await import('node:module')).createRequire(import.meta.url);
 const env=nodeRequire('dotenv').parse(await readFile(path.join(root,'backend/.env'),'utf8'));
 const source=new MongoClient(env.MONGODB_URI,{serverSelectionTimeoutMS:5000});
 let sourceComparison;
 try{
  await source.connect();
  const sourceDb=source.db('tpi_tienda');const sourceCounts={};
  for(const n of Object.keys(counts))sourceCounts[n]=await sourceDb.collection(n).countDocuments({});
  const sourceReport=await sourceDb.collection('pedidos').aggregate([
   {$match:{activo:true,estado:'completado'}},{$unwind:'$items'},{$group:{_id:'$items.categoria',unidades:{$sum:'$items.cantidad'},centavos:{$sum:'$items.subtotalCentavos'}}},{$sort:{_id:1}},
  ]).toArray();
  sourceComparison={conteos:sourceCounts,reporte:sourceReport,coincide:JSON.stringify(sourceCounts)===JSON.stringify(counts)&&JSON.stringify(sourceReport)===JSON.stringify(restoredReport)};
 }finally{await source.close();}
 const record={fechaUtc:new Date().toISOString(),origen:'Atlas, tpi_tienda (lectura)',destino:'tpi_tienda_restore_test en MongoDB temporal 7.0.24 propio',conteos:counts,estado:states,reporte:restoredReport,comparacionPosteriorOrigen:sourceComparison,codigo:code,transcripcion:output,escriturasPausadas:false,limite:'Comparacion de conteos y reporte, no igualdad campo por campo; no snapshot transaccional ni RTO del servicio completo.'};
 await mkdir(path.join(root,'docs/evidencias/windows'),{recursive:true});
 await writeFile(path.join(root,'docs/evidencias/windows/atlas-restauracion.json'),JSON.stringify(record,null,2)+'\n');
 assert.ok(sourceComparison.coincide, 'Los conteos o el reporte actual del origen difieren de la copia.');
 console.log(JSON.stringify({resultado:'APROBADO',conteos:counts,coincideOrigen:sourceComparison.coincide}));
}catch{
 console.error('ERROR: no se pudo completar la restauracion o la comparacion con el origen. Revisar copia, acceso y cambios de datos; no se muestran credenciales.');
 process.exitCode=1;
}finally{if(client)await client.close();if(mongod)await mongod.stop();}
