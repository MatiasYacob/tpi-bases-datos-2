// #============# Estructura BSON e indices de las tres colecciones #============#
const string = { bsonType: 'string', minLength: 1 };
const money = { bsonType: ['int', 'long', 'double'], minimum: 1, maximum: Number.MAX_SAFE_INTEGER, multipleOf: 1 };
const oid = { bsonType: 'objectId' };
const category = { enum: ['tecnologia', 'libreria', 'hogar'] };
const shape = (properties, required = Object.keys(properties)) => ({ bsonType: 'object', additionalProperties: false, ...(required.length ? { required } : {}), properties });
const common = { _id: oid, activo: { bsonType: 'bool' }, createdAt: { bsonType: 'date' }, updatedAt: { bsonType: 'date' }, deletedAt: { bsonType: ['date', 'null'] } };
const customerSnapshot = shape({ nombre: string, apellido: string, email: string });
export const schemas = {
  clientes: shape({ ...common, nombre: string, apellido: string, email: string, contacto: shape({ telefono: { bsonType: 'string' }, direccion: { bsonType: 'string' } }, []) }),
  productos: shape({ ...common, nombre: string, descripcion: { bsonType: 'string' }, categoria: category, precioCentavos: money }),
  pedidos: shape({ ...common, clienteId: oid, cliente: customerSnapshot, estado: { enum: ['pendiente', 'confirmado', 'completado', 'cancelado'] },
    items: { bsonType: 'array', minItems: 1, maxItems: 50, items: shape({
      productoId: oid, nombre: string, categoria: category, precioUnitarioCentavos: money,
      cantidad: { ...money, maximum: 100 }, subtotalCentavos: money,
    }) }, totalCentavos: money }),
};
export async function initialize(db) {
  const existing = new Set((await db.listCollections({}, { nameOnly: true }).toArray()).map(c => c.name));
  for (const [name, schema] of Object.entries(schemas)) {
    const options = { validator: { $jsonSchema: schema }, validationLevel: 'strict', validationAction: 'error' };
    if (existing.has(name)) await db.command({ collMod: name, ...options });
    else await db.createCollection(name, options);
  }
  await db.collection('clientes').createIndex({ email: 1 }, { unique: true });
  await db.collection('productos').createIndex({ activo: 1, categoria: 1, createdAt: -1, _id: -1 });
  await db.collection('pedidos').createIndex({ activo: 1, createdAt: -1, _id: -1 });
  await db.collection('pedidos').createIndex({ clienteId: 1, activo: 1, estado: 1, createdAt: -1, _id: -1 });
}
