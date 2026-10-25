// Transfiere la URI existente al YAML privado sin imprimirla.
import { createRequire } from 'node:module';
import { readFile, writeFile } from 'node:fs/promises';
const require = createRequire(new URL('../../backend/package.json', import.meta.url));
const { parse } = require('dotenv');
try {
  const env = parse(await readFile(new URL('../../backend/.env',import.meta.url),'utf8'));
  if (!env.MONGODB_URI || (env.MONGODB_DB && env.MONGODB_DB !== 'tpi_tienda')) throw Error('Configuracion ausente');
  await writeFile(new URL('../backup.config.yml',import.meta.url),'uri: '+JSON.stringify(env.MONGODB_URI)+'\n',{encoding:'utf8'});
  console.log('OK: conexion del backend transferida al YAML privado, sin mostrar credenciales.');
} catch { console.error('ERROR: no se pudo leer backend/.env o guardar configuracion.');process.exitCode=1; }
