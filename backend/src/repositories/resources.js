import { ObjectId } from 'mongodb';
// #============# Acceso a documentos activos y serializacion #============#
export function serialize(value) {
  if (value instanceof ObjectId) return value.toHexString();
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(serialize);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k === '_id' ? 'id' : k, serialize(v)]));
  return value;
}
export const active = (db, kind, _id) => db.collection(kind).findOne({ _id, activo: true });
export function stamp(data) {
  const now = new Date();
  return { ...data, activo: true, createdAt: now, updatedAt: now, deletedAt: null };
}
