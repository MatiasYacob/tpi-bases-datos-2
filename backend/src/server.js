import { connect } from './config/db.js';
import { createApp } from './app.js';
try {
  const { client, db } = await connect();
  const port = Number(process.env.PORT || 3000);
  const host = process.env.HOST || '127.0.0.1';
  const server = createApp(db, process.env.FRONTEND_ORIGIN).listen(port, host, () => console.log('API lista en http://' + host + ':' + port + '/api'));
  server.on('error', async () => { console.error('No se pudo iniciar HTTP'); await client.close(); process.exitCode = 1; });
  for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => {
    server.close(async () => { await client.close(); process.exitCode = 0; });
    server.closeIdleConnections();
  });
} catch {
  console.error('No se pudo conectar. Revisar .env, acceso de red y usuario de MongoDB.');
  process.exitCode = 1;
}
