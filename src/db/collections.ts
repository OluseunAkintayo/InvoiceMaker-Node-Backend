import { db } from ".";

enum collection {
  invoices = "invoices",
  deleted_invoices = "deleted_invoices",
  users = "users",
  reset = "reset"
}

export const collections = {
  invoices: collection.invoices,
  deleted_invoices: collection.deleted_invoices,
  users: collection.users
}

export const getCollection = (collectionName: string) => {
  if (!db) throw new Error("Database not connected");
  return db.collection(collectionName);
};
