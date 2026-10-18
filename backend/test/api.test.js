import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient } from 'mongodb';
import { createApp } from '../src/app.js';
import { initialize } from '../src/config/schema.js';
import { seed } from '../src/scripts/seed-data.js';
let mongod, client, db, api;
before(async () => {
  mongod = await MongoMemoryServer.create();
  client = await new MongoClient(mongod.getUri()).connect();
  db = client.db('tpi_test');
  await initialize(db);
  api = request(createApp(db));
}, { timeout: 180000 });
after(async () => { if (client) await client.close(); if (mongod) await mongod.stop(); });
const customer = { nombre: 'Ana', apellido: 'Demo', email: 'ana@example.com' };
const product = { nombre: 'Mouse', categoria: 'tecnologia', precioCentavos: 10000 };
test('salud y errores sanitizados', async () => {
  await api.get('/api/health').expect(200);
  const bad = await api.post('/api/clientes').set('Content-Type', 'application/json').send('{bad').expect(400);
  assert.equal(bad.body.error.codigo, 'VALIDACION');
  await api.get('/api/inexistente').expect(404);
  const offline = request(createApp({ collection: () => ({}), command: async () => { throw Error('secret'); } }));
  const response = await offline.get('/api/health').expect(503);
  assert.ok(!JSON.stringify(response.body).includes('secret'));
});
test('CRUD, historial, estados y reporte', async () => {
  const c = (await api.post('/api/clientes').send(customer).expect(201)).body.data;
  const p = (await api.post('/api/productos').send(product).expect(201)).body.data;
  assert.deepEqual(c.contacto, {});
  await api.post('/api/clientes').send({ ...customer, email: ' ANA@EXAMPLE.COM ' }).expect(409);
  await api.post('/api/productos').send({ ...product, precioCentavos: 1.5 }).expect(400);
  await api.patch('/api/clientes/' + c.id).send({ activo: false }).expect(400);
  const payload = { clienteId: c.id, items: [{ productoId: p.id, cantidad: 2 }] };
  await api.post('/api/pedidos').send({ ...payload, totalCentavos: 1 }).expect(400);
  await api.post('/api/pedidos').send({ ...payload, items: [...payload.items, ...payload.items] }).expect(400);
  const order = (await api.post('/api/pedidos').send(payload).expect(201)).body.data;
  assert.equal(order.totalCentavos, 20000);
  await api.patch('/api/productos/' + p.id).send({ precioCentavos: 90000 }).expect(200);
  await api.patch('/api/clientes/' + c.id).send({ nombre: 'Otro' }).expect(200);
  const historic = (await api.get('/api/pedidos/' + order.id).expect(200)).body.data;
  assert.equal(historic.totalCentavos, 20000);
  assert.equal(historic.cliente.nombre, 'Ana');
  await api.patch('/api/pedidos/' + order.id).send({ estado: 'completado' }).expect(409);
  await api.patch('/api/pedidos/' + order.id).send({ estado: 'confirmado' }).expect(200);
  const concurrent = await Promise.all([
    api.patch('/api/pedidos/' + order.id).send({ estado: 'completado' }),
    api.patch('/api/pedidos/' + order.id).send({ estado: 'completado' }),
  ]);
  assert.deepEqual(concurrent.map(r => r.status).sort(), [200, 409]);
  const report = (await api.get('/api/reportes/ventas-por-categoria').expect(200)).body;
  assert.deepEqual(report.data, [{ categoria: 'tecnologia', unidadesVendidas: 2, importeCentavos: 20000 }]);
  await api.delete('/api/productos/' + p.id).expect(200);
  await api.get('/api/productos/' + p.id).expect(404);
  await api.post('/api/pedidos').send(payload).expect(404);
  assert.equal((await db.collection('productos').countDocuments({})), 1);
  await api.delete('/api/clientes/' + c.id).expect(200);
  await api.post('/api/clientes').send(customer).expect(409);
  await api.get('/api/pedidos/' + order.id).expect(200);
  await api.delete('/api/pedidos/' + order.id).expect(200);
  assert.deepEqual((await api.get('/api/reportes/ventas-por-categoria')).body.data, []);
});
test('filtros, identificadores y paginacion invalidos', async () => {
  for (const path of ['/clientes/no-id', '/clientes?pagina=1.5', '/productos?limite=101', '/productos?categoria=otra', '/pedidos?clienteId=x', '/pedidos?estado=otro', '/pedidos?desde=2026-02-30T00:00:00Z', '/pedidos?desde=2026-01-03T00:00:00Z&hasta=2026-01-01T00:00:00Z']) await api.get('/api' + path).expect(400);
  const response = await api.get('/api/productos?categoria=hogar&pagina=1&limite=2').expect(200);
  assert.deepEqual(response.body, { data: [], paginacion: { pagina: 1, limite: 2, total: 0 } });
});
test('validadores BSON y seed repetible', async () => {
  await assert.rejects(db.collection('productos').insertOne({ nombre: 'Invalido' }), err => err.code === 121);
  const isolated = client.db('seed_test');
  await initialize(isolated);
  await seed(isolated);
  await seed(isolated);
  for (const [name, count] of [['clientes', 3], ['productos', 9], ['pedidos', 6]]) assert.equal(await isolated.collection(name).countDocuments({}), count);
});
