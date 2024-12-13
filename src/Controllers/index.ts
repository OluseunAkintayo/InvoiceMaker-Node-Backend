import { Router } from "express";
import AuthController from "./AuthController";
import InvoiceController from "./InvoiceController";

const IndexController = Router();

IndexController.use("/auth", AuthController);
IndexController.use("/invoice", InvoiceController);

export default IndexController;
