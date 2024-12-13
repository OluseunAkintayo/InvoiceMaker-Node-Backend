import { Request, Response, Router } from "express";
import { db } from '../db';
import dayjs from "dayjs";
import validate from "../lib/validate";
import InvoiceSchema from "../Models/Invoice";

const InvoiceController = Router();


InvoiceController.post("/create", validate(InvoiceSchema), async (req: Request, res: Response) => {
  
});

export default InvoiceController;
