import { ObjectId } from 'mongodb';
import { stamp } from '../repositories/resources.js';
import { buildOrder } from '../services/orders.js';
// Identificadores reservados para que repetir seed no cree duplicados ni borre datos.
const fixed = (number) => new ObjectId(number.toString(16).padStart(24, '0'));
export async function seed(db) {
  for (let i = 1; i <= 3; i++) {
    const _id = fixed(i);
    const doc = stamp({ nombre: ['Ana', 'Bruno', 'Carla'][i - 1], apellido: 'Demo', email: 'demo' + i + '@example.com', contacto: {} });
    if (i === 3) Object.assign(doc, { activo: false, deletedAt: new Date() });
    await db.collection('clientes').updateOne({ _id }, { $setOnInsert: doc }, { upsert: true });
  }
  const categories = ['tecnologia', 'libreria', 'hogar'];
  for (let i = 1; i <= 9; i++) {
    const doc = stamp({ nombre: 'Producto demo ' + i, descripcion: 'Dato ficticio', categoria: categories[(i - 1) % 3], precioCentavos: i * 10000 });
    if (i === 9) Object.assign(doc, { activo: false, deletedAt: new Date() });
    await db.collection('productos').updateOne({ _id: fixed(100 + i) }, { $setOnInsert: doc }, { upsert: true });
  }
  const states = ['pendiente', 'confirmado', 'completado', 'cancelado', 'completado', 'pendiente'];
  for (let i = 1; i <= 6; i++) {
    const _id = fixed(200 + i);
    if (await db.collection('pedidos').findOne({ _id })) continue;
    const doc = await buildOrder(db, { clienteId: fixed(1).toHexString(), items: [{ productoId: fixed(100 + i).toHexString(), cantidad: i }] });
    doc.estado = states[i - 1];
    if (i === 6) Object.assign(doc, { activo: false, deletedAt: new Date() });
    await db.collection('pedidos').updateOne({ _id }, { $setOnInsert: doc }, { upsert: true });
  }
}
