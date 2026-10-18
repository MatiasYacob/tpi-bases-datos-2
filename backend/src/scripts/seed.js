import { connect } from '../config/db.js';
import { initialize } from '../config/schema.js';
import { seed } from './seed-data.js';
let client;
try {
  const connection = await connect();
  client = connection.client;
  await initialize(connection.db);
  await seed(connection.db);
  console.log('Seed terminado sin borrar ni sobrescribir documentos existentes');
} catch { console.error('Seed incompleto. Revisar conexion, validadores y datos; no se borraron documentos.'); process.exitCode = 1; }
finally { if (client) await client.close(); }
