import { Request, response, Response, Router } from "express";
import validate from "../lib/validate";
import InvoiceSchema from "../Models/Invoice";
import { IInvoiceFields } from "../lib/types";
import { ObjectId } from "mongodb";
import { checkToken, RequestExt } from "../lib/checkToken";
import { collections, getCollection } from "../db/collections";
import InvoiceService from "../Services/InvoiceService";

const getUserId = (req: Request): ObjectId => {
  return new ObjectId((req as RequestExt).user!.id);
};

const InvoiceController = Router();

const invoiceService = new InvoiceService();


InvoiceController.post("/create", checkToken, validate(InvoiceSchema), async (req: Request, res: Response) => {
  const req_extended = (req as RequestExt);
  let user_id: ObjectId | null = null;
  if (req_extended && req_extended.user && req_extended.user.id) {
    user_id = new ObjectId(req_extended.user.id);
  }
  const invoice: IInvoiceFields = {
    ...req.body,
    createdBy: user_id
  };

  try {
    const response = await invoiceService.create(invoice);
    if (response?.success && response?.data?.insertedId) {
      res.status(201).json({ success: true, message: "Invoice " + response.data.insertedId + " created" });
      return;
    }
    res.status(400).json({ success: false, message: "Error creating invoice" });
  } catch (error) {
    res.status(500).json(error);
  }
});


InvoiceController.get("/list", checkToken, async (req: Request, res: Response) => {
  const user_id = getUserId(req);
  try {
    const response = await invoiceService.list(user_id);
    if (response?.success) {
      res.status(200).json(response);
      return;
    }
    res.status(400).json(response);
  } catch (error) {
    res.status(500).json(error);
  }
});


InvoiceController.get("/list/recent", checkToken, async (req: Request, res: Response) => {
  const user_id = getUserId(req);
  try {
    const response = await invoiceService.listRecent(user_id);
    if (response.success) {
      res.status(200).json(response);
      return;
    }
    res.status(400).json(response);
  } catch (error) {
    res.status(500).json(error);
  }
});


InvoiceController.get("/view/:id", checkToken, async (req: Request, res: Response) => {
  const user_id = getUserId(req);
  const invoice_id = new ObjectId(req.params.id);
  try {
    const invoice = await invoiceService.view({ user_id, invoice_id });
    if (invoice.success) {
      res.status(200).json({ success: true, data: invoice });
      return;
    }
    res.status(400).json(invoice);
  } catch (error) {
    res.status(500).json(error);
  }
});


InvoiceController.patch("/:id/settle", checkToken, async (req: Request, res: Response) => {
  const user_id = getUserId(req);
  const invoice_id = new ObjectId(req.params.id);
  try {
    const response = await invoiceService.settle({ user_id, invoice_id });
    if (response.success) {
      res.status(200).json(response);
      return;
    }
    res.status(400).json(response);
  } catch (error) {
    res.status(500).json(error);
  }
});


InvoiceController.delete("/:id/delete", checkToken, async (req: Request, res: Response) => {
  const invoice_id = new ObjectId(req.params.id);
  const user_id = getUserId(req);
  try {
    const response = await invoiceService.delete({ user_id, invoice_id });
    res.status(200).json({ success: true, message: "Invoice deleted suceessfully", data: response });
  } catch (error) {
    res.status(500).json({ success: false, error });
  }
});


InvoiceController.get("/deleted_items", checkToken, async (req: Request, res: Response) => {
  const user_id = getUserId(req);
  try {
    const response = await invoiceService.listDeleted(user_id);
    if (response.success) {
      res.status(200).json(response);
      return;
    }
    res.status(400).json(response);
  } catch (error) {
    res.status(500).json(error);
  }
});


InvoiceController.post("/restore/:id", checkToken, async (req: Request, res: Response) => {
  const invoice_id = new ObjectId(req.params.id);
  const user_id = getUserId(req);
  try {
    const response = await invoiceService.restore({ user_id, invoice_id });
    if (response.success) {
      res.status(200).json(response);
      return;
    }
    res.status(400).json(response);
  } catch (error) {
    res.status(500).json(error);
  }
});


export default InvoiceController;
