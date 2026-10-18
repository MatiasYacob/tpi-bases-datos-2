import { ObjectId } from 'mongodb';
import { invalid } from './errors.js';
export const categories = ['tecnologia', 'libreria', 'hogar'];
export const states = ['pendiente', 'confirmado', 'completado', 'cancelado'];
export function object(value, field = 'body') {
  if (!value || typeof value !== 'object' || Array.isArray(value)) invalid(field, 'Se requiere un objeto');
}
export function keys(value, allowed, field = 'body') {
  object(value, field);
  for (const key of Object.keys(value)) if (!allowed.includes(key)) invalid(field + '.' + key, 'Campo no permitido');
}
export function text(value, field, optional = false) {
  if (typeof value !== 'string' || (!optional && !value.trim())) invalid(field);
  return value.trim();
}
export function integer(value, field, min = 1, max = Number.MAX_SAFE_INTEGER) {
  if (!Number.isSafeInteger(value) || value < min || value > max) invalid(field);
  return value;
}
export function id(value, field = 'id') {
  if (typeof value !== 'string' || !/^[a-f0-9]{24}$/i.test(value)) invalid(field, 'Identificador invalido');
  return new ObjectId(value);
}
export function member(value, values, field) {
  if (!values.includes(value)) invalid(field);
  return value;
}
export function entity(body, kind, patch = false) {
  const customer = kind === 'clientes';
  const allowed = customer ? ['nombre', 'apellido', 'email', 'contacto'] : ['nombre', 'descripcion', 'categoria', 'precioCentavos'];
  keys(body, allowed);
  if (!Object.keys(body).length) invalid('body', 'Objeto vacio');
  const result = {};
  for (const field of customer ? ['nombre', 'apellido'] : ['nombre']) {
    if (!patch || field in body) result[field] = text(body[field], field);
  }
  if (customer) {
    if (!patch || 'email' in body) {
      result.email = text(body.email, 'email').toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result.email)) invalid('email');
    }
    if ('contacto' in body) {
      keys(body.contacto, ['telefono', 'direccion'], 'contacto');
      result.contacto = {};
      for (const [key, value] of Object.entries(body.contacto)) result.contacto[key] = text(value, 'contacto.' + key, true);
    } else if (!patch) result.contacto = {};
  } else {
    if (!patch || 'categoria' in body) result.categoria = member(body.categoria, categories, 'categoria');
    if (!patch || 'precioCentavos' in body) result.precioCentavos = integer(body.precioCentavos, 'precioCentavos');
    if ('descripcion' in body) result.descripcion = text(body.descripcion, 'descripcion', true);
    else if (!patch) result.descripcion = '';
  }
  return result;
}
export function date(value, field) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value)) invalid(field, 'Fecha ISO con zona requerida');
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) invalid(field);
  const day = value.slice(0, 10);
  const calendar = new Date(day + 'T00:00:00Z');
  if (calendar.toISOString().slice(0, 10) !== day) invalid(field);
  return parsed;
}
export function dates(query) {
  const range = {};
  if (query.desde !== undefined) range.$gte = date(query.desde, 'desde');
  if (query.hasta !== undefined) range.$lt = date(query.hasta, 'hasta');
  if (range.$gte && range.$lt && range.$gte >= range.$lt) invalid('hasta', 'Intervalo invalido');
  return Object.keys(range).length ? { createdAt: range } : {};
}
export function listing(query, kind) {
  keys(query, ['pagina', 'limite', ...(kind === 'productos' ? ['categoria'] : kind === 'pedidos' ? ['clienteId', 'estado', 'desde', 'hasta'] : [])], 'query');
  const number = (value, fallback, field, max) => {
    if (value === undefined) return fallback;
    if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) invalid(field);
    return integer(Number(value), field, 1, max);
  };
  const pagina = number(query.pagina, 1, 'pagina', Number.MAX_SAFE_INTEGER);
  const limite = number(query.limite, 10, 'limite', 100);
  if (!Number.isSafeInteger((pagina - 1) * limite)) invalid('pagina');
  const filter = { activo: true };
  if (kind === 'productos' && query.categoria !== undefined) filter.categoria = member(query.categoria, categories, 'categoria');
  if (kind === 'pedidos') {
    Object.assign(filter, dates(query));
    if (query.clienteId !== undefined) filter.clienteId = id(query.clienteId, 'clienteId');
    if (query.estado !== undefined) filter.estado = member(query.estado, states, 'estado');
  }
  return { filter, pagina, limite };
}
