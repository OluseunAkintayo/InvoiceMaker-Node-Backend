import { Request, Response, Router } from "express";
import { db } from '../db';
import validate from "../lib/validate";
import InvoiceSchema from "../Models/Invoice";
import { IInvoiceFields } from "../lib/types";
import { ObjectId } from "mongodb";
import { checkToken, RequestExt } from "../lib/checkToken";
import { collections } from "../db/collections";

const InvoiceController = Router();


InvoiceController.post("/create", checkToken, validate(InvoiceSchema), async (req: Request, res: Response) => {
  const invoice: IInvoiceFields = {
    ...req.body,
    created_by: new ObjectId((req as RequestExt).user.id)
  };
  const invoices = db?.collection(collections.invoices);
  try {
    const response = await invoices?.insertOne(invoice);
    res.status(201).json({ success: true, message: "Invoice " + response?.insertedId + " created", data: response });
  } catch (error) {
    res.status(500).json({ success: false, error });
  }
});


InvoiceController.get("/list", checkToken, async (req: Request, res: Response) => {
  const user_id = new ObjectId((req as RequestExt).user.id);
  try {
    const invoices = await db?.collection(collections.invoices).find({ created_by: user_id }).toArray();
    const invoices_modified = invoices?.map((item) => {
      const { invoice_number, customer_name, invoice_items, created_at, due_date } = item;
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
        created_at: created_at,
        due_date: due_date
      }
    });
    res.status(200).json({ success: true, data: invoices_modified });
  } catch (error) {
    console.log({ error });
    res.status(500).json({ success: false, error });
  }
});


InvoiceController.get("/view/:id", checkToken, async (req: Request, res: Response) => {
  const user_id = new ObjectId((req as RequestExt).user.id);
  const invoice_id = new ObjectId(req.params.id);
  try {
    const invoice = await db?.collection(collections.invoices).findOne({ _id: invoice_id }) as IInvoiceFields;
    if (user_id.toString() !== invoice.created_by.toString()) {
      res.status(403).json({ success: false, message: "User is not permitted to view this invoice" });
      return;
    }
    res.status(200).json({ success: true, data: invoice });
  } catch (error) {
    console.log({ error });
    res.status(500).json({ success: false, error });
  }
});


InvoiceController.patch("/:id/settle", checkToken, async (req: Request, res: Response) => {
  const user_id = new ObjectId((req as RequestExt).user.id);
  const invoice_id = new ObjectId(req.params.id);
  const invoice = await db?.collection(collections.invoices).findOne({ _id: invoice_id }) as IInvoiceFields;
  const user = await db?.collection(collections.users).findOne({ _id: user_id });
  if (!user) {
    res.status(403).json({ success: false, message: "User not found" });
    return;
  }
  if (!invoice) {
    res.status(403).json({ success: false, message: "Invoice not found" });
    return;
  }
  if (user_id.toString() !== invoice.created_by.toString()) {
    res.status(403).json({ success: false, message: "Invoice cannot be modified by this user" });
    return;
  }

  try {
    const response = await db?.collection(collections.invoices).updateOne(
      { _id: invoice_id },
      {
        $set: {
          status: 'pending',
          modified_at: new Date().toISOString()
        }
      }
    );
    res.status(200).json({ success: true, data: response });
  } catch (error) {
    res.status(500).json({ success: false, error });
  }
});


InvoiceController.delete("/:id/delete", checkToken, async (req: Request, res: Response) => {
  const invoice_id = new ObjectId(req.params.id);
  const user_id = new ObjectId((req as RequestExt).user.id);
  const found_invoice = await db?.collection(collections.invoices).findOne({ _id: invoice_id }) as IInvoiceFields;
  if (!found_invoice) {
    res.status(400).json({ success: false, message: "Invoice not found" });
    return;
  }
  if (user_id.toString() !== found_invoice.created_by.toString()) {
    res.status(400).json({ success: false, message: "Operation not permitted: user cannot delete this invoice" });
    return;
  }
  try {
    await db?.collection(collections.deleted_invoices).insertOne(found_invoice);
    const response = await db?.collection(collections.invoices).deleteOne({ _id: invoice_id });
    res.status(200).json({ success: true, message: "Invoice deleted suceessfully", data: response });
  } catch (error) {
    res.status(500).json({ success: false, error });
  }
});


InvoiceController.get("/deleted_items", checkToken, async (req: Request, res: Response) => {
  const user_id = new ObjectId((req as RequestExt).user.id);
  if (!user_id) {
    res.status(400).json({ success: false, message: "User not found" });
    return;
  }
  try {
    const invoices = await db?.collection(collections.deleted_invoices).find({ created_by: user_id }).toArray();
    res.status(200).json({ success: true, data: invoices });
  } catch (error) {
    res.status(500).json({ success: false, error });
  }
});


InvoiceController.post("/restore/:id", checkToken, async (req: Request, res: Response) => {
  const invoice_id = new ObjectId(req.params.id);
  const user_id = new ObjectId((req as RequestExt).user.id);
  const found_invoice = await db?.collection(collections.deleted_invoices).findOne({ _id: invoice_id }) as IInvoiceFields;
  if (!found_invoice) {
    res.status(400).json({ success: false, message: "Invoice not found" });
    return;
  }
  if (user_id.toString() !== found_invoice.created_by.toString()) {
    res.status(400).json({ success: false, message: "Operation not permitted: user cannot restore this invoice" });
    return;
  }
  try {
    await db?.collection(collections.invoices).insertOne(found_invoice);
    const response = await db?.collection(collections.deleted_invoices).deleteOne({ _id: invoice_id });
    res.status(200).json({ success: true, message: "Invoice restored suceessfully", data: response });
  } catch (error) {
    res.status(500).json({ success: false, error });
  }
});


export default InvoiceController;
