import express from 'express';
import cors from 'cors';
import { resourceRouter } from './routes/resources.js';
import { ApiError } from './services/errors.js';
import { dates, keys } from './services/validation.js';
import { reportPipeline } from './services/orders.js';
export function createApp(db, origin = 'http://localhost:5173') {
  const app = express();
  app.disable('x-powered-by');
  app.use(cors({ origin }));
  app.use(express.json({ limit: '100kb' }));
  app.get('/api/health', async (_req, res) => {
    try { await db.command({ ping: 1 }); res.json({ data: { estado: 'ok' } }); }
    catch { res.status(503).json({ error: { codigo: 'ERROR_INTERNO', mensaje: 'Base de datos no disponible' } }); }
  });
  for (const kind of ['clientes', 'productos', 'pedidos']) app.use('/api/' + kind, resourceRouter(db, kind));
  app.get('/api/reportes/ventas-por-categoria', async (req, res) => {
    keys(req.query, ['desde', 'hasta'], 'query');
    const data = await db.collection('pedidos').aggregate(reportPipeline(dates(req.query))).toArray();
    res.json({ data });
  });
  app.use((_req, _res, next) => next(new ApiError(404, 'NO_ENCONTRADO', 'Ruta no encontrada')));
  // Express 5 propaga los rechazos de handlers async a este middleware.
  app.use((err, _req, res, _next) => {
    if (err.code === 11000) err = new ApiError(409, 'EMAIL_DUPLICADO', 'Email ya registrado', 'email');
    if (err.type === 'entity.parse.failed') err = new ApiError(400, 'VALIDACION', 'JSON invalido');
    if (err.type === 'entity.too.large') err = new ApiError(413, 'VALIDACION', 'Solicitud demasiado grande');
    const known = err instanceof ApiError;
    res.status(known ? err.status : 500).json({ error: {
      codigo: known ? err.codigo : 'ERROR_INTERNO',
      mensaje: known ? err.message : 'Error interno del servidor',
      ...(known && err.campo ? { campo: err.campo } : {}),
    } });
  });
  return app;
}
