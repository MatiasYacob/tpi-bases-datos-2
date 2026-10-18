import 'dotenv/config';
import { MongoClient } from 'mongodb';
export async function connect() {
  if (!process.env.MONGODB_URI) throw new Error('Configurar MONGODB_URI en backend/.env');
  const name = process.env.MONGODB_DB || 'tpi_tienda';
  if (name !== 'tpi_tienda') throw new Error('Este backend solo utiliza tpi_tienda');
  const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
  try {
    await client.connect();
    const db = client.db(name);
    await db.command({ ping: 1 });
    return { client, db };
  } catch (err) { await client.close(); throw err; }
}
