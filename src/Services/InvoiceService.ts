import dayjs from "dayjs";
import { collections, getCollection } from "../db/collections";
import { IInvoiceFields } from "../lib/types";
import { ObjectId } from "mongodb";

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

  async list(user_id: ObjectId) {
    try {
      const invoices = await getCollection(collections.invoices).find({ createdBy: user_id }).toArray();
      const invoices_modified = invoices?.map((item) => {
        const { invoiceNumber, customerName, invoiceItems, createdAt, dueDate, status, currency, } = item;
        return {
          _id: item._id,
          invoiceNumber: invoiceNumber,
          customerName: customerName,
          itemsCount: invoiceItems?.length,
          invoiceTotal: invoiceItems.reduce((totals: number, invoice_item: { quantity: string; rate: string; }) => {
            const qty = Number(invoice_item.quantity);
            const rate = Number(invoice_item.rate);
            return totals + qty * rate;
          }, 0).toLocaleString(),
          status, currency,
          createdAt, dueDate
        }
      });
      return { success: true, data: invoices_modified };
    } catch (error) {
      return { success: false, error };
    }
  }

  async listRecent(user_id: ObjectId) {
    try {
      const invoices = await getCollection(collections.invoices).find({ createdBy: user_id }).sort({ createdAt: -1 }).limit(5).toArray();
      const invoices_modified = invoices?.map((item) => {
        const { invoiceNumber, customerName, invoiceItems, status, createdAt, currency } = item;
        return {
          _id: item._id,
          invoiceNumber: invoiceNumber,
          customerName: customerName,
          invoiceTotal: invoiceItems.reduce((totals: number, invoice_item: { quantity: string; rate: string; }) => {
            const qty = Number(invoice_item.quantity);
            const rate = Number(invoice_item.rate);
            return totals + qty * rate;
          }, 0).toLocaleString(),
          status, currency,
          createdAt: dayjs(createdAt).format("D MMM YYYY")
        }
      });
      return { success: true, data: invoices_modified };
    } catch (error) {
      return { success: false, error };
    }
  }

  async view({ user_id, invoice_id }: { user_id: ObjectId, invoice_id: ObjectId }) {
    try {
      const invoice = await getCollection(collections.invoices).findOne({ _id: invoice_id }) as IInvoiceFields;
      if (user_id.toString() !== invoice.createdBy.toString()) {
        return { success: false, message: "User is not permitted to view this invoice" };
      }
      return { success: true, data: invoice };
    } catch (error) {
      return { success: false, error };
    }
  }

  async settle({ user_id, invoice_id }: { user_id: ObjectId, invoice_id: ObjectId }) {
    const invoice = await getCollection(collections.invoices).findOne({ _id: invoice_id }) as IInvoiceFields;
    const user = await getCollection(collections.users).findOne({ _id: user_id });
    if (!user) {
      return { success: false, message: "User not found" };
    }

    if (!invoice) {
      return { success: false, message: "Invoice not found" };
    }

    if (user_id.toString() !== invoice.createdBy.toString()) {
      return { success: false, message: "Invoice cannot be modified by this user" };
    }

    try {
      const response = await getCollection(collections.invoices).updateOne(
        { _id: invoice_id },
        {
          $set: {
            status: 'settled',
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

    if (user_id.toString() !== found_invoice.createdBy.toString()) {
      return { success: false, message: "Operation not permitted: user cannot delete this invoice" };
    }

    try {
      await getCollection(collections.deleted_invoices).insertOne(found_invoice);
      await getCollection(collections.invoices).deleteOne({ _id: invoice_id });
      return { success: true, message: "Invoice deleted suceessfully" };
    } catch (error) {
      return { success: false, error };
    }
  }

  async listDeleted(user_id: ObjectId) {
    if (!user_id) return { success: false, message: "User not found" };
    try {
      const invoices = await getCollection(collections.deleted_invoices).find({ createdBy: user_id }).toArray();
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
    if (user_id.toString() !== found_invoice.createdBy.toString()) {
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
}

export default InvoiceService;
