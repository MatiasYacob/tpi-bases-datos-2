// #============# Evidencia reproducible de indices, sin conexion a Atlas #============#
// Proposito: comparar consultas del backend antes/despues de sus indices.
// Entradas: datos ficticios deterministas. Salidas: JSON y resumen Markdown.
// Solo escribe en MongoDB temporal propio y docs/evidencias/indices/.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient, ObjectId } from 'mongodb';
import { initialize } from '../config/schema.js';
import { listing } from '../services/validation.js';

const directory = new URL('../../../docs/evidencias/indices/', import.meta.url);
const id = n => new ObjectId(n.toString(16).padStart(24, '0'));
const categories = ['tecnologia', 'libreria', 'hogar'];
const states = ['pendiente', 'confirmado', 'completado', 'cancelado'];
const baseDate = Date.parse('2026-01-01T00:00:00Z');
function base(n, inactive = false) {
  const date = new Date(baseDate + n * 60000);
  return { activo: !inactive, createdAt: date, updatedAt: date, deletedAt: inactive ? date : null };
}
function planDetails(plan) {
  const stages = new Set(), indexes = new Set();
  function visit(value) {
    if (!value || typeof value !== 'object') return;
    if (typeof value.stage === 'string') stages.add(value.stage);
    if (typeof value.indexName === 'string') indexes.add(value.indexName);
    for (const child of Object.values(value)) {
      if (Array.isArray(child)) child.forEach(visit); else visit(child);
    }
  }
  visit(plan);
  return { etapas: [...stages], indices: [...indexes] };
}
async function measure(db, spec) {
  // Se reutilizan filtros/paginacion validados del backend; no se fuerza hint.
  const { filter, pagina, limite } = listing(spec.query, spec.collection);
  const cursor = () => db.collection(spec.collection).find(filter)
    .sort({ createdAt: -1, _id: -1 }).skip((pagina - 1) * limite).limit(limite);
  const explain = await cursor().explain('executionStats');
  const rows = await cursor().toArray();
  const stats = explain.executionStats;
  assert.equal(explain.ok, 1);
  assert.equal(stats.nReturned, rows.length);
  assert.ok(rows.length > 0, 'El caso debe devolver datos');
  return {
    consulta: { coleccion: spec.collection, filtro: filter, orden: { createdAt: -1, _id: -1 }, pagina, limite },
    ids: rows.map(row => row._id.toHexString()),
    resumen: { ...planDetails(explain.queryPlanner.winningPlan), devueltos: stats.nReturned,
      documentosExaminados: stats.totalDocsExamined, clavesExaminadas: stats.totalKeysExamined,
      tiempoMs: stats.executionTimeMillis },
    queryPlanner: explain.queryPlanner,
    executionStats: stats,
  };
}
let server, client;
try {
  server = await MongoMemoryServer.create({ binary: { version: '7.0.24' } });
  client = await new MongoClient(server.getUri()).connect();
  const db = client.db('tpi_evidencia_indices');
  // Tres colecciones relacionadas con los mismos campos BSON del proyecto.
  const customers = Array.from({ length: 100 }, (_, n) => ({
    _id: id(n + 1), ...base(n), nombre: 'Cliente ' + n, apellido: 'Ficticio',
    email: 'cliente' + n + '@example.com', contacto: {},
  }));
  const products = Array.from({ length: 10000 }, (_, n) => ({
    _id: id(1000 + n), ...base(n, n % 10 === 0), nombre: 'Producto ' + n,
    descripcion: 'Muestra sintetica', categoria: categories[n % 3], precioCentavos: 10000 + n,
  }));
  const orders = Array.from({ length: 20000 }, (_, n) => {
    const customer = customers[n % customers.length];
    const product = products[n % products.length];
    return {
      _id: id(100000 + n), ...base(n, n % 11 === 0), clienteId: customer._id,
      cliente: { nombre: customer.nombre, apellido: customer.apellido, email: customer.email },
      estado: states[Math.floor(n / 100) % states.length],
      items: [{ productoId: product._id, nombre: product.nombre, categoria: product.categoria,
        precioUnitarioCentavos: product.precioCentavos, cantidad: 1, subtotalCentavos: product.precioCentavos }],
      totalCentavos: product.precioCentavos,
    };
  });
  await db.collection('clientes').insertMany(customers);
  await db.collection('productos').insertMany(products);
  await db.collection('pedidos').insertMany(orders);
  const specs = [
    { nombre: 'Productos activos por categoria', collection: 'productos', query: { categoria: 'tecnologia', limite: '10' } },
    { nombre: 'Pedidos activos generales', collection: 'pedidos', query: { limite: '10' } },
    { nombre: 'Pedidos de un cliente por estado y fecha', collection: 'pedidos', query: {
      clienteId: id(2).toHexString(), estado: 'completado',
      desde: '2026-01-05T00:00:00Z', hasta: '2026-01-14T00:00:00Z', limite: '10' } },
    { nombre: 'Control: productos sin filtro de categoria', collection: 'productos', query: { limite: '10' } },
  ];
  const before = [];
  for (const spec of specs) before.push(await measure(db, spec));
  // Primero habia solo _id_; ahora se crean exactamente los indices del proyecto.
  await initialize(db);
  const cases = [];
  for (let i = 0; i < specs.length; i++) {
    const after = await measure(db, specs[i]);
    assert.deepEqual(after.ids, before[i].ids, 'El indice no debe cambiar resultados ni orden');
    cases.push({ nombre: specs[i].nombre, antes: before[i], despues: after });
  }
  for (const item of cases.slice(0, 3)) {
    assert.ok(item.antes.resumen.etapas.includes('COLLSCAN'));
    assert.ok(item.despues.resumen.etapas.includes('IXSCAN'));
    assert.ok(!item.despues.resumen.etapas.includes('SORT'));
    assert.ok(item.despues.resumen.documentosExaminados < item.antes.resumen.documentosExaminados);
  }
  // Verificar tambien la funcion de integridad del indice unique.
  const duplicate = { ...customers[0], _id: id(999999) };
  await assert.rejects(db.collection('clientes').insertOne(duplicate), err => err.code === 11000);
  const indexes = {};
  for (const name of ['clientes', 'productos', 'pedidos']) indexes[name] = await db.collection(name).listIndexes().toArray();
  const build = await db.command({ buildInfo: 1 });
  const evidence = {
    generadoUtc: new Date().toISOString(), entorno: 'MongoDB temporal local, sin Atlas ni .env',
    node: process.version, mongodb: build.version,
    muestra: { clientes: customers.length, productos: products.length, pedidos: orders.length },
    metodo: 'Mismos datos y consultas; antes solo _id_; despues initialize(db); sin hint; resultados y orden comparados',
    emailDuplicado: 'rechazado con codigo 11000', indices: indexes, casos: cases,
  };
  const lines = [
    '# Evidencia de indices: explain executionStats', '',
    'Ejecucion UTC: ' + evidence.generadoUtc + '. Node ' + evidence.node + '; MongoDB ' + evidence.mongodb + '.', '',
    '## Alcance', '',
    'Prueba local real, reproducible y aislada. No representa una medicion de Atlas.',
    'Muestra sintetica determinista: 100 clientes, 10000 productos y 20000 pedidos.',
    'Se reutilizan los filtros y paginacion del backend y los indices de config/schema.js.',
    'Antes: solo indice _id_. Despues: indices reales del proyecto. No se usa hint.',
    'Cada consulta devuelve 10 documentos; se verifican los mismos ids en el mismo orden.',
    'El caso por cliente/estado incluye intervalo de fechas. El frontend actualmente',
    'descarga todos los listados; estos casos corresponden a los endpoints del backend.', '',
    '## Resultados', '',
    '| Consulta | Fase | Etapas | Docs examinados | Claves examinadas | Devueltos | ms |',
    '| --- | --- | --- | ---: | ---: | ---: | ---: |',
  ];
  for (const item of cases) for (const phase of ['antes', 'despues']) {
    const s = item[phase].resumen;
    lines.push('| ' + [item.nombre, phase, s.etapas.join(' / '), s.documentosExaminados, s.clavesExaminadas, s.devueltos, s.tiempoMs].join(' | ') + ' |');
  }
  lines.push('', '## Interpretacion para la defensa', '',
    '- COLLSCAN recorre documentos de la coleccion. IXSCAN recorre claves de un indice.',
    '- FETCH recupera el documento: estas consultas devuelven documentos completos y no son consultas cubiertas.',
    '- SORT indica ordenamiento explicito. En los tres casos principales el indice tambien resuelve el orden.',
    '- En productos, activo y categoria fijan el prefijo; createdAt e _id resuelven el orden.',
    '- En pedidos generales, activo fija el prefijo; las fechas e ids resuelven el orden.',
    '- En pedidos por cliente/estado, las igualdades clienteId/activo/estado preceden al rango y orden temporal.',
    '- Sin categoria, el indice de productos no garantiza el orden global por fecha porque categoria esta en medio.',
    '  Ese caso de control muestra por que un indice no mejora todas las variantes de una consulta.',
    '- Las claves examinadas se cuentan aparte de los documentos. La comparacion usa ambas metricas.',
    '- Los milisegundos son observaciones de una ejecucion local, afectados por cache y seleccion de plan.',
    '  No constituyen un benchmark ni permiten prometer el mismo tiempo o factor de mejora en Atlas.',
    '- Los indices tienen costo de almacenamiento y mantenimiento en las escrituras.',
    '- El indice unico de email tambien protege integridad: se comprobo rechazo de duplicado (11000).',
    '- No se modifican los indices productivos ni se corrige un esquema sobre Atlas en este ensayo.', '',
    '## Reproducir', '',
    'Desde backend: npm ci y npm run evidence:indexes.',
    'Requiere las dependencias de desarrollo. Descarga MongoDB 7.0.24 oficial si no esta en cache.',
    'No requiere .env. El proceso inicia su propio MongoDB temporal y lo cierra en finally.',
    'Sobrescribe solo docs/evidencias/indices/explain.json y este resumen con la nueva medicion.',
    'La salida JSON conserva consultas, planes ganadores/rechazados y executionStats para auditar.',
    'Los resultados numericos pueden variar segun entorno; las comprobaciones se ejecutan en cada ensayo.', '',
    'Referencia: https://www.mongodb.com/docs/v7.0/reference/explain-results/', '');
  await mkdir(directory, { recursive: true });
  await writeFile(new URL('explain.json', directory), JSON.stringify(evidence, null, 2) + '\n', 'utf8');
  await writeFile(new URL('README.md', directory), lines.join('\n'), 'utf8');
  console.table(cases.flatMap(item => ['antes', 'despues'].map(phase => ({ consulta: item.nombre, fase: phase, ...item[phase].resumen, etapas: item[phase].resumen.etapas.join('/'), indices: item[phase].resumen.indices.join(',') }))));
  console.log('Evidencia guardada en ' + fileURLToPath(directory));
} finally {
  if (client) await client.close();
  if (server) await server.stop();
}
