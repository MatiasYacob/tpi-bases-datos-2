// Consultas locales de comprobacion. No borra ni modifica documentos.
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const require = createRequire(new URL('../../backend/package.json', import.meta.url));
const { MongoClient } = require('mongodb');
const [mode, uri, countsFile] = process.argv.slice(2);
if (!/^mongodb:\/\/(127\.0\.0\.1|localhost):\d{1,5}\/?$/.test(uri || '')) throw Error('Solo URI local');
const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
try {
  await client.connect();
  const db = client.db('tpi_tienda_restore_test');
  if (mode === 'empty') {
    assert.equal((await db.listCollections({}, { nameOnly: true }).toArray()).length, 0, 'Destino ocupado');
    console.log('OK: destino local vacio.');
  } else if (mode === 'verify') {
    const expected = JSON.parse((await readFile(countsFile, 'utf8')).replace(/^\uFEFF/, ''));
    for (const name of ['clientes','productos','pedidos']) {
      assert.ok(Number.isSafeInteger(expected[name]) && expected[name] >= 0, 'Conteo esperado invalido');
      const actual = await db.collection(name).countDocuments({});
      assert.equal(actual, expected[name], 'Conteo distinto: ' + name);
      const active = await db.collection(name).countDocuments({ activo: true });
      console.log(name + ': esperado=' + expected[name] + ', recuperado=' + actual + ', activos=' + active + ', inactivos=' + (actual-active) + ' OK');
    }
    let orders = 0;
    for await (const order of db.collection('pedidos').find({})) {
      assert.ok(order.cliente && typeof order.cliente.nombre === 'string' && typeof order.cliente.email === 'string', 'Cliente historico incompleto');
      assert.ok(Array.isArray(order.items) && order.items.length > 0, 'Pedido sin items');
      let total = 0;
      for (const item of order.items) {
        assert.ok(typeof item.nombre === 'string' && ['tecnologia','libreria','hogar'].includes(item.categoria));
        assert.ok(Number.isSafeInteger(item.cantidad) && item.cantidad >= 1 && item.cantidad <= 100);
        assert.ok(Number.isSafeInteger(item.precioUnitarioCentavos) && item.precioUnitarioCentavos > 0);
        assert.equal(item.subtotalCentavos, item.cantidad * item.precioUnitarioCentavos);
        total += item.subtotalCentavos; assert.ok(Number.isSafeInteger(total));
      }
      assert.equal(order.totalCentavos, total); orders++;
    }
    console.log('Historial y calculos verificados en ' + orders + ' pedidos (incluidos inactivos).');
    const report = await db.collection('pedidos').aggregate([
      { $match: { activo:true, estado:'completado' } }, { $unwind:'$items' },
      { $group:{ _id:'$items.categoria', unidadesVendidas:{ $sum:'$items.cantidad' }, importeCentavos:{ $sum:'$items.subtotalCentavos' } } },
      { $sort:{ _id:1 } },
    ]).toArray();
    console.log('Reporte sobre datos recuperados: ' + JSON.stringify(report));
    console.log('OK: conteos e integridad de pedidos coinciden. El reporte se consulta, no se compara automaticamente con Atlas.');
  } else throw Error('Modo desconocido');
} catch {
  console.error('ERROR: verificacion local fallida (conexion, destino ocupado, conteos o integridad).');
  process.exitCode = 1;
} finally { await client.close(); }
