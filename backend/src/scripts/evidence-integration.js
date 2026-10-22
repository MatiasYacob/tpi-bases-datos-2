// #============# Pruebas de integracion y evidencia HTTP #============#
// Ejecuta Express y MongoDB reales, temporales y aislados. No lee .env ni Atlas.
// Salidas: docs/evidencias/integracion/ y docs/pruebas-integracion.md.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient, ObjectId } from 'mongodb';
import request from 'supertest';
import { createApp } from '../app.js';
import { initialize } from '../config/schema.js';

const directory = new URL('../../../docs/evidencias/integracion/', import.meta.url);
const records = [], checks = [];
let server, client;
try {
  server = await MongoMemoryServer.create({ binary: { version: '7.0.24' } });
  client = await new MongoClient(server.getUri()).connect();
  const db = client.db('tpi_integracion_temporal');
  await initialize(db);
  const api = request(createApp(db));
  async function http(name, method, path, status, body, verify) {
    const call = api[method](path);
    if (body !== undefined) call.send(body);
    const response = await call;
    assert.equal(response.status, status, name + ': HTTP inesperado');
    if (verify) await verify(response.body);
    records.push({ caso: name, solicitud: { metodo: method.toUpperCase(), ruta: path, ...(body === undefined ? {} : { body }) },
      esperado: { status }, obtenido: { status: response.status, body: response.body }, resultado: 'APROBADO' });
    return response.body.data;
  }
  const error = code => value => assert.equal(value.error.codigo, code);
  async function check(name, fn) { await fn(); checks.push({ caso: name, resultado: 'APROBADO' }); }
  await http('Salud con MongoDB disponible', 'get', '/api/health', 200, undefined, b => assert.equal(b.data.estado, 'ok'));
  await http('Listado inicialmente vacio', 'get', '/api/clientes', 200, undefined, b => assert.deepEqual(b, { data: [], paginacion: { pagina: 1, limite: 10, total: 0 } }));
  const customer = await http('Alta y normalizacion de email', 'post', '/api/clientes', 201,
    { nombre: 'Ana', apellido: 'Prueba', email: ' ANA@EXAMPLE.COM ', contacto: { telefono: '111', direccion: 'Calle ficticia' } },
    b => { assert.equal(b.data.email, 'ana@example.com'); assert.match(b.data.id, /^[a-f0-9]{24}$/); assert.equal(b.data.activo, true); assert.equal(b.data.deletedAt, null); assert.ok(!('_id' in b.data)); assert.ok(!Number.isNaN(Date.parse(b.data.createdAt))); });
  const second = await http('Alta sin contacto', 'post', '/api/clientes', 201,
    { nombre: 'Bruno', apellido: 'Prueba', email: 'bruno@example.com' }, b => assert.deepEqual(b.data.contacto, {}));
  await http('Email duplicado normalizado', 'post', '/api/clientes', 409,
    { nombre: 'Otra', apellido: 'Persona', email: 'ANA@example.com' }, error('EMAIL_DUPLICADO'));
  await http('Edicion de cliente y reemplazo de contacto', 'patch', '/api/clientes/' + customer.id, 200,
    { nombre: 'Ana editada', contacto: { telefono: '222' } }, b => assert.deepEqual(b.data.contacto, { telefono: '222' }));
  await http('Campo reservado rechazado', 'patch', '/api/clientes/' + customer.id, 400, { activo: false }, error('VALIDACION'));
  await http('Identificador mal formado', 'get', '/api/clientes/no-id', 400, undefined, error('VALIDACION'));
  await http('Identificador inexistente', 'get', '/api/clientes/' + new ObjectId().toHexString(), 404, undefined, error('NO_ENCONTRADO'));

  const product = await http('Alta de producto en centavos', 'post', '/api/productos', 201,
    { nombre: 'Mouse', categoria: 'tecnologia', precioCentavos: 150000 }, b => assert.equal(b.data.descripcion, ''));
  const other = await http('Alta de segunda categoria', 'post', '/api/productos', 201,
    { nombre: 'Cuaderno', categoria: 'libreria', precioCentavos: 20000 });
  await http('Precio fraccionario rechazado', 'post', '/api/productos', 400,
    { nombre: 'Invalido', categoria: 'hogar', precioCentavos: 1.5 }, error('VALIDACION'));
  await http('Categoria fuera del contrato', 'post', '/api/productos', 400,
    { nombre: 'Invalido', categoria: 'otra', precioCentavos: 100 }, error('VALIDACION'));
  await http('Filtro de categoria', 'get', '/api/productos?categoria=libreria', 200, undefined,
    b => { assert.equal(b.paginacion.total, 1); assert.equal(b.data[0].id, other.id); });
  await http('Limite mayor que 100 rechazado', 'get', '/api/productos?limite=101', 400, undefined, error('VALIDACION'));
  // Fechas deterministas para probar orden compuesto y paginacion sin empates dependientes del reloj.
  await db.collection('productos').updateMany({}, { $set: { createdAt: new Date('2026-01-01T00:00:00Z') } });
  const expectedProducts = [product.id, other.id].sort().reverse();
  const firstPage = await http('Primera pagina y orden por id en empate de fecha', 'get', '/api/productos?pagina=1&limite=1', 200, undefined,
    b => { assert.equal(b.paginacion.total, 2); assert.equal(b.data[0].id, expectedProducts[0]); });
  const secondPage = await http('Segunda pagina sin duplicados', 'get', '/api/productos?pagina=2&limite=1', 200, undefined,
    b => assert.equal(b.data[0].id, expectedProducts[1]));
  assert.notEqual(firstPage[0].id, secondPage[0].id);

  const input = { clienteId: customer.id, items: [{ productoId: product.id, cantidad: 2 }, { productoId: other.id, cantidad: 1 }] };
  await http('Total enviado por navegador rechazado', 'post', '/api/pedidos', 400, { ...input, totalCentavos: 1 }, error('VALIDACION'));
  await http('Precio enviado por navegador rechazado', 'post', '/api/pedidos', 400,
    { clienteId: customer.id, items: [{ productoId: product.id, cantidad: 1, precioUnitarioCentavos: 1 }] }, error('VALIDACION'));
  await http('Producto repetido rechazado', 'post', '/api/pedidos', 400,
    { clienteId: customer.id, items: [input.items[0], input.items[0]] }, error('VALIDACION'));
  await http('Cantidad fuera de rango rechazada', 'post', '/api/pedidos', 400,
    { clienteId: customer.id, items: [{ productoId: product.id, cantidad: 101 }] }, error('VALIDACION'));
  await check('Altas invalidas no insertaron pedidos', async () => assert.equal(await db.collection('pedidos').countDocuments({}), 0));
  const order = await http('Alta de pedido y total calculado por servidor', 'post', '/api/pedidos', 201, input,
    b => { assert.equal(b.data.totalCentavos, 320000); assert.equal(b.data.estado, 'pendiente'); assert.equal(b.data.items[0].subtotalCentavos, 300000); assert.equal(b.data.cliente.nombre, 'Ana editada'); });
  await http('Cambio del precio actual', 'patch', '/api/productos/' + product.id, 200, { precioCentavos: 190000 });
  await http('Cambio del nombre actual del cliente', 'patch', '/api/clientes/' + customer.id, 200, { nombre: 'Nombre posterior' });
  await http('Detalle conserva instantaneas y precios historicos', 'get', '/api/pedidos/' + order.id, 200, undefined,
    b => { assert.equal(b.data.totalCentavos, 320000); assert.equal(b.data.items[0].precioUnitarioCentavos, 150000); assert.equal(b.data.cliente.nombre, 'Ana editada'); });
  await http('Pedido no permite editar items', 'patch', '/api/pedidos/' + order.id, 400, { items: [] }, error('VALIDACION'));
  await http('No se puede saltar de pendiente a completado', 'patch', '/api/pedidos/' + order.id, 409, { estado: 'completado' }, error('TRANSICION_INVALIDA'));
  await http('Transicion pendiente a confirmado', 'patch', '/api/pedidos/' + order.id, 200, { estado: 'confirmado' });
  await http('Repetir estado da conflicto', 'patch', '/api/pedidos/' + order.id, 409, { estado: 'confirmado' }, error('TRANSICION_INVALIDA'));
  await http('Transicion confirmado a completado', 'patch', '/api/pedidos/' + order.id, 200, { estado: 'completado' });
  await http('Estado terminal no admite cancelacion', 'patch', '/api/pedidos/' + order.id, 409, { estado: 'cancelado' }, error('TRANSICION_INVALIDA'));

  // El setup temporal fija createdAt para verificar limites de fecha exactos.
  await db.collection('pedidos').updateOne({ _id: new ObjectId(order.id) }, { $set: { createdAt: new Date('2026-01-15T12:00:00Z') } });
  const reportExpected = [
    { categoria: 'libreria', unidadesVendidas: 1, importeCentavos: 20000 },
    { categoria: 'tecnologia', unidadesVendidas: 2, importeCentavos: 300000 },
  ];
  await http('Reporte no duplica total al separar items', 'get', '/api/reportes/ventas-por-categoria', 200, undefined,
    b => assert.deepEqual(b.data, reportExpected));
  await http('Desde incluye el instante limite', 'get', '/api/reportes/ventas-por-categoria?desde=2026-01-15T12:00:00Z', 200, undefined,
    b => assert.deepEqual(b.data, reportExpected));
  await http('Hasta excluye el instante limite', 'get', '/api/reportes/ventas-por-categoria?hasta=2026-01-15T12:00:00Z', 200, undefined,
    b => assert.deepEqual(b.data, []));
  await http('Intervalo invertido rechazado', 'get', '/api/reportes/ventas-por-categoria?desde=2026-02-01T00:00:00Z&hasta=2026-01-01T00:00:00Z', 400, undefined, error('VALIDACION'));
  await http('Filtro combinado cliente estado y fecha', 'get', '/api/pedidos?clienteId=' + customer.id + '&estado=completado&desde=2026-01-15T00:00:00Z&hasta=2026-01-16T00:00:00Z', 200, undefined,
    b => { assert.equal(b.paginacion.total, 1); assert.equal(b.data[0].id, order.id); });

  await http('Baja logica de producto', 'delete', '/api/productos/' + product.id, 200, undefined,
    b => assert.deepEqual(b.data, { id: product.id, activo: false }));
  await http('Producto inactivo no se lee por detalle', 'get', '/api/productos/' + product.id, 404, undefined, error('NO_ENCONTRADO'));
  await http('Producto inactivo no se edita', 'patch', '/api/productos/' + product.id, 404, { nombre: 'No permitido' }, error('NO_ENCONTRADO'));
  await http('Pedido con producto inactivo rechazado', 'post', '/api/pedidos', 404,
    { clienteId: customer.id, items: [{ productoId: product.id, cantidad: 1 }] }, error('NO_ENCONTRADO'));
  await http('Baja logica de cliente', 'delete', '/api/clientes/' + customer.id, 200);
  await http('Cliente inactivo oculto del listado', 'get', '/api/clientes', 200, undefined,
    b => { assert.equal(b.paginacion.total, 1); assert.equal(b.data[0].id, second.id); });
  await http('Email de inactivo no se reutiliza', 'post', '/api/clientes', 409,
    { nombre: 'Repetido', apellido: 'Prueba', email: 'ana@example.com' }, error('EMAIL_DUPLICADO'));
  await http('Pedido con cliente inactivo rechazado', 'post', '/api/pedidos', 404,
    { clienteId: customer.id, items: [{ productoId: other.id, cantidad: 1 }] }, error('NO_ENCONTRADO'));
  await http('Historial sigue disponible tras bajas de referencias', 'get', '/api/pedidos/' + order.id, 200, undefined,
    b => assert.equal(b.data.totalCentavos, 320000));
  await check('Referencias inactivas no insertaron pedidos extra', async () => assert.equal(await db.collection('pedidos').countDocuments({}), 1));
  await http('Baja logica de pedido', 'delete', '/api/pedidos/' + order.id, 200);
  await http('Pedido inactivo oculto por detalle', 'get', '/api/pedidos/' + order.id, 404, undefined, error('NO_ENCONTRADO'));
  await http('Reporte excluye pedidos dados de baja', 'get', '/api/reportes/ventas-por-categoria', 200, undefined,
    b => assert.deepEqual(b.data, []));
  await check('Bajas conservan documentos y fechas BSON', async () => {
    for (const [collection, resourceId] of [['clientes', customer.id], ['productos', product.id], ['pedidos', order.id]]) {
      const doc = await db.collection(collection).findOne({ _id: new ObjectId(resourceId) });
      assert.equal(doc.activo, false); assert.ok(doc.deletedAt instanceof Date); assert.ok(doc.updatedAt instanceof Date);
    }
    assert.equal(await db.collection('clientes').countDocuments({}), 2);
    assert.equal(await db.collection('productos').countDocuments({}), 2);
    assert.equal(await db.collection('pedidos').countDocuments({}), 1);
  });
  await check('MongoDB rechaza escritura que incumple jsonSchema', async () => {
    await assert.rejects(db.collection('productos').insertOne({ nombre: 'Sin campos obligatorios' }), err => err.code === 121);
  });
  const result = {
    generadoUtc: new Date().toISOString(), node: process.version,
    mongodb: (await db.command({ buildInfo: 1 })).version,
    entorno: 'Express + driver MongoDB + MongoDB temporal local; no Atlas ni navegador',
    preparacion: 'Colecciones vacias con initialize(db). Fechas fijadas solo en base temporal para limites deterministas.',
    peticionesAprobadas: records.length, comprobacionesMongoAprobadas: checks.length,
    solicitudes: records, comprobacionesMongo: checks,
  };
  await mkdir(directory, { recursive: true });
  await writeFile(new URL('http.json', directory), JSON.stringify(result, null, 2) + '\n');
  const lines = [
    '# Pruebas de integracion', '',
    'Responsable: Matias. Revisor previsto: Javier.', '',
    '## Resultado real', '',
    'Ejecucion UTC: ' + result.generadoUtc + '. Node ' + result.node + '; MongoDB ' + result.mongodb + '.',
    'Peticiones HTTP verificadas: ' + records.length + '. Comprobaciones adicionales MongoDB: ' + checks.length + '. Todas aprobadas.', '',
    '## Alcance y reproducibilidad', '',
    'Desde backend: npm ci y npm run evidence:integration.',
    'El script usa Supertest para solicitudes HTTP a Express y el driver oficial contra MongoDB temporal real.',
    'No utiliza mocks de repositorios, no lee .env y no conecta a Atlas.',
    'Incluye validadores e indices del proyecto; el proceso cierra el servidor temporal al terminar.',
    'Los emails y nombres son ficticios. Las fechas se fijan en el setup temporal para probar limites.',
    'Esto demuestra integracion API/persistencia local. No es una nueva prueba de navegador, Atlas ni backups.',
    'La prueba de concurrencia, JSON malformado y seed repetible sigue en npm test.',
    'Cada ejecucion sobrescribe este documento y evidencias/integracion/http.json.', '',
    '## Casos HTTP', '',
    '| Caso | Metodo | HTTP esperado/obtenido | Resultado |',
    '| --- | --- | ---: | --- |',
  ];
  for (const item of records) lines.push('| ' + [item.caso, item.solicitud.metodo, item.obtenido.status, item.resultado].join(' | ') + ' |');
  lines.push('', '## Comprobaciones directas sobre MongoDB', '');
  for (const item of checks) lines.push('- ' + item.caso + ': ' + item.resultado + '.');
  lines.push('', '## Evidencia de solicitudes y respuestas', '',
    'El archivo [http.json](evidencias/integracion/http.json) conserva metodo, ruta, cuerpo enviado,',
    'HTTP esperado y cuerpo real devuelto para cada peticion. Los ids se obtienen de las respuestas,',
    'no de ids fijos de Atlas. Cualquier asercion fallida termina el comando con codigo distinto de cero.',
    'Los archivos solo se escriben despues de que todas las comprobaciones pasaron.', '',
    '## Ejemplo del flujo verificado', '',
    'Se crea Mouse a 150000 centavos y Cuaderno a 20000. Un pedido de dos Mouse y un',
    'Cuaderno devuelve totalCentavos=320000 calculado por el servidor.',
    'Luego se cambia Mouse a 190000 y el nombre del cliente: el pedido conserva sus datos historicos.',
    'Al completarlo, el reporte separa tecnologia=300000 y libreria=20000; no duplica el total.',
    'La baja de cliente/producto no borra el historial. La baja del pedido lo excluye del reporte.', '',
    '## Pendiente para el cierre grupal', '',
    '- Revision cruzada de Javier ejecutando los comandos.',
    '- Incorporar al informe capturas reales de frontend/Atlas realizadas por el equipo.',
    '- Integrar la evidencia de restauracion de Brenda cuando cierre sus pruebas.', '');
  await writeFile(new URL('../../../docs/pruebas-integracion.md', import.meta.url), lines.join('\n'));
  console.log(JSON.stringify({ peticionesHTTP: records.length, comprobacionesMongo: checks.length, resultado: 'APROBADO', evidencia: 'docs/evidencias/integracion/http.json' }));
} finally {
  if (client) await client.close();
  if (server) await server.stop();
}
