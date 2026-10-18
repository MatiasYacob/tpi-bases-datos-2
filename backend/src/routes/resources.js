import { Router } from 'express';
import { active, serialize, stamp } from '../repositories/resources.js';
import { entity, id, keys, listing, member, states } from '../services/validation.js';
import { ApiError, missing } from '../services/errors.js';
import { buildOrder, transition } from '../services/orders.js';
export function resourceRouter(db, kind) {
  const router = Router();
  const collection = db.collection(kind);
  router.get('/', async (req, res) => {
    const { filter, pagina, limite } = listing(req.query, kind);
    const [data, total] = await Promise.all([
      collection.find(filter).sort({ createdAt: -1, _id: -1 }).skip((pagina - 1) * limite).limit(limite).toArray(),
      collection.countDocuments(filter),
    ]);
    res.json({ data: serialize(data), paginacion: { pagina, limite, total } });
  });
  router.get('/:id', async (req, res) => {
    const doc = await active(db, kind, id(req.params.id));
    if (!doc) missing();
    res.json({ data: serialize(doc) });
  });
  router.post('/', async (req, res) => {
    const doc = kind === 'pedidos' ? await buildOrder(db, req.body) : stamp(entity(req.body, kind));
    const { insertedId } = await collection.insertOne(doc);
    res.status(201).json({ data: serialize({ ...doc, _id: insertedId }) });
  });
  router.patch('/:id', async (req, res) => {
    const _id = id(req.params.id);
    let changes;
    const filter = { _id, activo: true };
    if (kind === 'pedidos') {
      keys(req.body, ['estado']);
      const next = member(req.body.estado, states, 'estado');
      const current = await active(db, kind, _id);
      if (!current) missing();
      transition(current.estado, next);
      filter.estado = current.estado;
      changes = { estado: next };
    } else changes = entity(req.body, kind, true);
    const result = await collection.findOneAndUpdate(filter, { $set: { ...changes, updatedAt: new Date() } }, { returnDocument: 'after' });
    if (!result) {
      if (kind === 'pedidos' && await active(db, kind, _id)) throw new ApiError(409, 'TRANSICION_INVALIDA', 'El pedido cambio; volver a consultar');
      missing();
    }
    res.json({ data: serialize(result) });
  });
  router.delete('/:id', async (req, res) => {
    const _id = id(req.params.id);
    const now = new Date();
    const result = await collection.updateOne({ _id, activo: true }, { $set: { activo: false, deletedAt: now, updatedAt: now } });
    if (!result.matchedCount) missing();
    res.json({ data: { id: _id.toHexString(), activo: false } });
  });
  return router;
}
