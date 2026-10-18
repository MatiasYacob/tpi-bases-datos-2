import { active, stamp } from '../repositories/resources.js';
import { id, integer, keys } from './validation.js';
import { invalid, missing, ApiError } from './errors.js';
export async function buildOrder(db, body) {
  keys(body, ['clienteId', 'items']);
  const clienteId = id(body.clienteId, 'clienteId');
  if (!Array.isArray(body.items) || body.items.length < 1 || body.items.length > 50) invalid('items');
  const seen = new Set();
  const requested = body.items.map((item, i) => {
    keys(item, ['productoId', 'cantidad'], 'items[' + i + ']');
    const productoId = id(item.productoId, 'items[' + i + '].productoId');
    const key = productoId.toHexString();
    if (seen.has(key)) invalid('items', 'Productos repetidos');
    seen.add(key);
    return { productoId, cantidad: integer(item.cantidad, 'items[' + i + '].cantidad', 1, 100) };
  });
  const customer = await active(db, 'clientes', clienteId);
  if (!customer) missing();
  const items = [];
  let totalCentavos = 0;
  for (const item of requested) {
    const product = await active(db, 'productos', item.productoId);
    if (!product) missing();
    const subtotalCentavos = integer(product.precioCentavos * item.cantidad, 'items', 1);
    totalCentavos = integer(totalCentavos + subtotalCentavos, 'totalCentavos');
    items.push({ ...item, nombre: product.nombre, categoria: product.categoria, precioUnitarioCentavos: product.precioCentavos, subtotalCentavos });
  }
  return stamp({ clienteId, cliente: { nombre: customer.nombre, apellido: customer.apellido, email: customer.email }, estado: 'pendiente', items, totalCentavos });
}
export function transition(current, next) {
  const transitions = { pendiente: ['confirmado', 'cancelado'], confirmado: ['completado', 'cancelado'], completado: [], cancelado: [] };
  if (!transitions[current]?.includes(next)) throw new ApiError(409, 'TRANSICION_INVALIDA', 'Transicion de estado invalida');
}
export function reportPipeline(query) {
  return [
    { $match: { activo: true, estado: 'completado', ...query } },
    { $unwind: '$items' },
    { $group: { _id: '$items.categoria', unidadesVendidas: { $sum: '$items.cantidad' }, importeCentavos: { $sum: '$items.subtotalCentavos' } } },
    { $project: { _id: 0, categoria: '$_id', unidadesVendidas: 1, importeCentavos: 1 } },
    { $sort: { categoria: 1 } },
  ];
}
