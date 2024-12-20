import dayjs from "dayjs";
import { collections, getCollection } from "../db/collections";
import { IInvoiceFields, IInvoiceResponse, IRecentInvoices } from "../lib/types";
import { ObjectId, WithId } from "mongodb";

interface ServiceResponse {
  success: boolean;
  data?: unknown;
  error?: unknown;
  message?: string;
}

class InvoiceService {
  async create(invoice: IInvoiceFields) {
    const invoices = getCollection(collections.invoices);
    try {
      const new_invoice = await invoices.insertOne(invoice);
      return { success: true, data: new_invoice };
    } catch (error) {
      return { success: false, error };
    }
  }

  async listAll(): Promise<ServiceResponse> {
    try {
      const invoices = await getCollection(collections.invoices).find().toArray();
      return { success: true, data: invoices };
    } catch (error) {
      return { success: false, error };
    }
  }


  async list(user_id: ObjectId): Promise<{ success: boolean, data?: Array<WithId<IInvoiceResponse>>, error?: unknown }> {
    try {
      const invoices = await getCollection(collections.invoices).find({ created_by: user_id }).toArray();
      const invoices_modified = invoices?.map((item) => {
        const { invoice_number, customer_name, invoice_items, created_at, due_date, status, currency, } = item;
        return {
          _id: item._id,
          invoice_number: invoice_number,
          customer_name: customer_name,
          items_count: invoice_items?.length,
          invoice_total: invoice_items.reduce((totals: number, invoice_item: { quantity: string; rate: string; }) => {
            const qty = Number(invoice_item.quantity);
            const rate = Number(invoice_item.rate);
            return totals + qty * rate;
          }, 0).toLocaleString(),
          status, currency,
          created_at: dayjs(created_at).format("D MMM YYYY"),
          due_date
        }
      });
      return { success: true, data: invoices_modified };
    } catch (error) {
      return { success: false, error };
    }
  }

  async listRecent(user_id: ObjectId): Promise<{ success: boolean, data?: Array<WithId<IRecentInvoices>>, error?: unknown }> {
    try {
      const invoices = await getCollection(collections.invoices).find({ created_by: user_id }).sort({ created_at: -1 }).limit(5).toArray();
      const invoices_modified = invoices?.map((item) => {
        const { invoice_number, customer_name, invoice_items, status, created_at, currency } = item;
        return {
          _id: item._id,
          invoice_number: invoice_number,
          customer_name: customer_name,
          invoice_total: invoice_items.reduce((totals: number, invoice_item: { quantity: string; rate: string; }) => {
            const qty = Number(invoice_item.quantity);
            const rate = Number(invoice_item.rate);
            return totals + qty * rate;
          }, 0).toLocaleString(),
          status, currency,
          created_at: dayjs(created_at).format("D MMM YYYY")
        }
      });
      return { success: true, data: invoices_modified };
    } catch (error) {
      return { success: false, error };
    }
  }

  async view({ user_id, invoice_id }: { user_id: ObjectId, invoice_id: ObjectId }): Promise<ServiceResponse> {
    try {
      const invoice = await getCollection(collections.invoices).findOne({ _id: invoice_id }) as IInvoiceFields;
      if (user_id.toString() !== invoice.created_by.toString()) {
        return { success: false, message: "User is not permitted to view this invoice" };
      }
      return { success: true, data: invoice };
    } catch (error) {
      return { success: false, error };
    }
  }

  async settle({ user_id, invoice_id, status }: { user_id: ObjectId, invoice_id: ObjectId, status: string }) {
    const invoice = await getCollection(collections.invoices).findOne({ _id: invoice_id }) as IInvoiceFields;
    const user = await getCollection(collections.users).findOne({ _id: user_id });
    console.log({status});
    if (!user) {
      return { success: false, message: "User not found" };
    }

    if (!invoice) {
      return { success: false, message: "Invoice not found" };
    }

    if (user_id.toString() !== invoice.created_by.toString()) {
      return { success: false, message: "Invoice cannot be modified by this user" };
    }

    try {
      const response = await getCollection(collections.invoices).updateOne(
        { _id: invoice_id },
        {
          $set: {
            status: status,
            modified_at: new Date().toISOString()
          }
        }
      );
      return { success: true, data: response }
    } catch (error) {
      return { success: false, error };
    }
  }

  async delete({ user_id, invoice_id }: { user_id: ObjectId, invoice_id: ObjectId }) {
    const found_invoice = await getCollection(collections.invoices).findOne({ _id: invoice_id }) as IInvoiceFields;
    if (!found_invoice) {
      return { success: false, message: "Invoice not found" };
    }

    if (user_id.toString() !== found_invoice.created_by.toString()) {
      return { success: false, message: "Operation not permitted: user cannot delete this invoice" };
    }

    try {
      const new_invoice = {...found_invoice, deleted_at: new Date().toISOString()};
      await getCollection(collections.deleted_invoices).insertOne(new_invoice);
      await getCollection(collections.invoices).deleteOne({ _id: invoice_id });
      return { success: true, message: "Invoice deleted suceessfully" };
    } catch (error) {
      return { success: false, error };
    }
  }

  async listDeleted(user_id: ObjectId) {
    if (!user_id) return { success: false, message: "User not found" };
    try {
      const invoices = (await getCollection(collections.deleted_invoices).find({ created_by: user_id }).toArray()).map((item) => {
        const { invoice_number, customer_name, invoice_items, status, created_at, currency, deleted_at } = item;
        return {
          _id: item._id,
          invoice_number: invoice_number,
          customer_name: customer_name,
          invoice_total: invoice_items.reduce((totals: number, invoice_item: { quantity: string; rate: string; }) => {
            const qty = Number(invoice_item.quantity);
            const rate = Number(invoice_item.rate);
            return totals + qty * rate;
          }, 0).toLocaleString(),
          status, currency,
          created_at: dayjs(created_at).format("D MMM YYYY"),
          deleted_at: dayjs(deleted_at).format("D MMM YYYY h:mm A")
        }
      });
      if (invoices) {
        return { success: true, data: invoices };
      }
      return { success: false, message: "Unable to retrieve list", data: invoices };
    } catch (error) {
      return { success: false, error };
    }
  }

  async restore({ user_id, invoice_id }: { user_id: ObjectId, invoice_id: ObjectId }) {
    const found_invoice = await getCollection(collections.deleted_invoices).findOne({ _id: invoice_id }) as IInvoiceFields;
    if (!found_invoice) {
      return { success: false, message: "Invoice not found" };
    }
    if (user_id.toString() !== found_invoice.created_by.toString()) {
      return { success: false, message: "Operation not permitted: user cannot restore this invoice" };
    }

    try {
      await getCollection(collections.invoices).insertOne(found_invoice);
      await getCollection(collections.deleted_invoices).deleteOne({ _id: invoice_id });
      return { success: true, message: "Invoice restored suceessfully" };
    } catch (error) {
      return { success: false, error }
    }
  }

  async deletePermanently({ user_id, invoice_id }: { user_id: ObjectId, invoice_id: ObjectId }) {
    const found_invoice = await getCollection(collections.deleted_invoices).findOne({ _id: invoice_id }) as IInvoiceFields;
    if (!found_invoice) {
      return { success: false, message: "Invoice not found" };
    }

    if (user_id.toString() !== found_invoice.created_by.toString()) {
      return { success: false, message: "Operation not permitted: user cannot delete this invoice" };
    }

    try {
      await getCollection(collections.deleted_invoices).deleteOne({ _id: invoice_id });
      return { success: true, message: "Invoice deleted suceessfully" };
    } catch (error) {
      return { success: false, error };
    }
  }
}

export default InvoiceService;
