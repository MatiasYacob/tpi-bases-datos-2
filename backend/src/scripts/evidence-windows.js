// Pruebas reales de las herramientas CLI y scripts PowerShell, sin Atlas.
// Todo mongod y tpi_tienda/tpi_tienda_restore_test pertenecen al proceso temporal.
import { spawn } from 'node:child_process';
import { mkdir, cp, writeFile, readFile, readdir, copyFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient } from 'mongodb';
import { initialize } from '../config/schema.js';
import { seed } from './seed-data.js';

const root = fileURLToPath(new URL('../../../',import.meta.url));
const tempRoot = path.join(root,'backend/node_modules/.cache','tpi-windows-'+Date.now());
const evidenceRoot = path.join(root,'docs/evidencias/windows');
const transcripts = [], results = [];
let mongod,client;
const shell = process.env.SystemRoot + '\\System32\\WindowsPowerShell\\v1.0\\powershell.exe';
let toolsBin;
async function findTools(folder) {
  let entries;
  try { entries = await readdir(folder,{withFileTypes:true}); }
  catch (error) { if (error.code === 'ENOENT') return; throw error; }
  for (const e of entries) {
    if (e.isDirectory()) { const f=await findTools(path.join(folder,e.name));if(f)return f; }
    else if (e.name==='mongodump.exe') return folder;
  }
}
async function run(script,args=[],expected=0) {
  const child=spawn(shell,['-NoProfile','-ExecutionPolicy','Bypass','-File',path.join(tempRoot,'scripts',script),...args],
    {cwd:process.env.TEMP,env:{...process.env,TPI_TOOLS_BIN:toolsBin},windowsHide:true});
  let output='';
  child.stdout.on('data',b=>output+=b);child.stderr.on('data',b=>output+=b);
  const code=await new Promise((resolve,reject)=>{child.on('close',resolve);child.on('error',reject);});
  transcripts.push({script,args,code,output});
  assert.equal(code,expected,script+' exit inesperado: '+output);
  return output;
}
function ok(name,details) { results.push({caso:name,resultado:'APROBADO',detalle:details}); console.log('OK: '+name); }
async function snapshot(folder) {
  const data={};
  async function walk(p){for(const e of await readdir(p,{withFileTypes:true})){
    const f=path.join(p,e.name);
    if(e.isDirectory())await walk(f);else data[path.relative(folder,f)]=createHash('sha256').update(await readFile(f)).digest('hex');
  }}
  await walk(folder);return data;
}
try {
  assert.equal(process.platform, 'win32', 'Estas pruebas requieren Windows y Windows PowerShell 5.1.');
  const candidates = [process.env.TPI_TOOLS_BIN, ...(process.env.PATH || '').split(path.delimiter)].filter(Boolean);
  const required = ['mongodump.exe', 'mongorestore.exe', 'bsondump.exe'];
  for (const folder of candidates) {
    try { await Promise.all(required.map(name => access(path.join(folder, name)))); toolsBin = folder; break; }
    catch { /* Buscar en la siguiente carpeta de herramientas. */ }
  }
  if (!toolsBin) toolsBin = await findTools(path.join(root, '.tools'));
  assert.ok(toolsBin, 'Instalar MongoDB Database Tools y configurar TPI_TOOLS_BIN, PATH o .tools/.');
  await Promise.all(required.map(name => access(path.join(toolsBin, name))));
  await mkdir(path.join(tempRoot,'scripts'),{recursive:true});
  for(const name of ['backup.ps1','restaurar-prueba.ps1','verificar-conteos.ps1','programar-backup.ps1'])await copyFile(path.join(root,'scripts',name),path.join(tempRoot,'scripts',name));
  await cp(path.join(root,'scripts/windows'),path.join(tempRoot,'scripts/windows'),{recursive:true});
  mongod=await MongoMemoryServer.create({binary:{version:'7.0.24'}});
  const uri=mongod.getUri().replace(/\/$/,'');
  client=await new MongoClient(uri).connect();const db=client.db('tpi_tienda');
  await initialize(db);await seed(db);
  const config=path.join(tempRoot,'scripts/backup.config.yml');
  await writeFile(config,'uri: '+JSON.stringify(uri)+'\n');
  const date=new Date().toLocaleDateString('sv-SE');
  const backupRoot=path.join(tempRoot,'resguardos_tpi');
  const copy=path.join(backupRoot,date);
  const first=await run('backup.ps1');
  assert.match(first,/OK: respaldo publicado/);
  assert.deepEqual(JSON.parse(await readFile(path.join(copy,'conteos-esperados.json'),'utf8')),{clientes:3,productos:9,pedidos:6});
  ok('Respaldo manual real con conteos desde BSON','3 clientes, 9 productos y 6 pedidos; MongoDB temporal');
  const before=await snapshot(copy);
  assert.match(await run('backup.ps1'),/OMITIDO/);assert.deepEqual(await snapshot(copy),before);ok('Copia existente se omite sin alterarla');
  await run('backup.ps1',['-Forzar']);assert.deepEqual(JSON.parse(await readFile(path.join(copy,'conteos-esperados.json'),'utf8')),{clientes:3,productos:9,pedidos:6});ok('Reemplazo forzado publica una copia valida');
  const restored=await run('restaurar-prueba.ps1',['-Fecha',date,'-UriLocal',uri]);
  const restoreDb=client.db('tpi_tienda_restore_test');
  for(const [n,count]of [['clientes',3],['productos',9],['pedidos',6]])assert.equal(await restoreDb.collection(n).countDocuments({}),count);
  ok('Restauracion real con historial, bajas y reporte',restored);
  await run('verificar-conteos.ps1',['-Fecha',date,'-UriLocal',uri]);
  await run('restaurar-prueba.ps1',['-Fecha',date,'-UriLocal',uri],1);ok('Destino ocupado se rechaza sin borrarlo');
  const stable=await snapshot(copy);
  await writeFile(config,'uri: "mongodb://127.0.0.1:1/?serverSelectionTimeoutMS=1000&connectTimeoutMS=1000"\n');
  await run('backup.ps1',['-Forzar'],1);assert.deepEqual(await snapshot(copy),stable);ok('Fallo de conexion conserva copia anterior (SHA-256)');
  await writeFile(config,'uri: '+JSON.stringify(uri)+'\n');
  for(let offset=1;offset<=6;offset++){
    const d=new Date();d.setDate(d.getDate()-offset);
    const name=d.toLocaleDateString('sv-SE');
    await cp(copy,path.join(backupRoot,name),{recursive:true});
  }
  await mkdir(path.join(backupRoot,'carpeta-incompleta'),{recursive:true});
  await writeFile(path.join(backupRoot,'notas.txt'),'conservar');
  await run('backup.ps1',['-Forzar']);
  const kept=(await readdir(backupRoot)).filter(n=>/^\d{4}-\d{2}-\d{2}$/.test(n));
  assert.equal(kept.length,5);assert.equal(await readFile(path.join(backupRoot,'notas.txt'),'utf8'),'conservar');
  ok('Retencion conserva cinco copias y no toca archivos ajenos','Seis fechas anteriores simuladas copiadas de un respaldo de prueba; no copias historicas reales');
  await db.collection('pedidos').updateMany({},{$set:{activo:false,deletedAt:new Date()}});
  await restoreDb.dropDatabase(); // Destino descartable del servidor creado por este ensayo.
  await run('backup.ps1',['-Forzar']);await run('restaurar-prueba.ps1',['-Fecha',date,'-UriLocal',uri]);ok('Restauracion real con todos los pedidos inactivos');
  await db.collection('pedidos').deleteMany({}); // Solo fixture temporal para el caso cero, no CRUD de la app.
  await restoreDb.dropDatabase();
  await run('backup.ps1',['-Forzar']);await run('restaurar-prueba.ps1',['-Fecha',date,'-UriLocal',uri]);ok('Restauracion real con cero pedidos');
  const countsFile=path.join(copy,'conteos-esperados.json');
  await writeFile(countsFile,JSON.stringify({clientes:3,productos:9,pedidos:999}));
  await run('verificar-conteos.ps1',['-Fecha',date,'-UriLocal',uri],1);ok('Conteos incorrectos se rechazan');
  await writeFile(countsFile,JSON.stringify({clientes:3,productos:9,pedidos:0}));
  await run('programar-backup.ps1',['-Hora','02:00','-SoloExportar']);
  const xml=await readFile(path.join(backupRoot,'tarea-windows.xml'),'utf16le');
  assert.match(xml,/IgnoreNew/);assert.match(xml,/StartWhenAvailable/);ok('Programacion Windows: XML generado y validado sin registrar tarea');
  await mkdir(evidenceRoot,{recursive:true});
  const record={fechaUtc:new Date().toISOString(),entorno:'Windows PowerShell 5.1, MongoDB temporal 7.0.24, Database Tools 100.19.1',atlas:false,tareaRegistrada:false,carpetaPrueba:tempRoot,resultados:results,transcripciones:transcripts};
  await writeFile(path.join(evidenceRoot,'pruebas-locales.json'),JSON.stringify(record,null,2)+'\n');
  console.log('EVIDENCIA: '+path.join(evidenceRoot,'pruebas-locales.json'));
}finally{if(client)await client.close();if(mongod)await mongod.stop();}
