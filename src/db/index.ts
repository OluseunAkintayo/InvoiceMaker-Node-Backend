import { MongoClient, Db } from 'mongodb';

const uri = process.env.DB_URI;

if (!uri) {
  throw new Error('DB URI not set');
}

const client = new MongoClient(uri);

const db_name = 'invoicemaker';

let db: Db | null = null;

const main = async (): Promise<void> => {
  await client.connect();
  console.log("connection complete");
  db = client.db(db_name);
};

export { main, db }