import { connect } from '../config/db.js';
import { initialize } from '../config/schema.js';
let client;
try {
  const connection = await connect();
  client = connection.client;
  await initialize(connection.db);
  console.log('Validadores e indices preparados');
} catch { console.error('No se pudo preparar la base. Revisar permisos y documentos existentes.'); process.exitCode = 1; }
finally { if (client) await client.close(); }
