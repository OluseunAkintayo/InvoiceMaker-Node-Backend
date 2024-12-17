import { object, string, number, array, date } from 'yup';

const InvoiceSchema = object({
  invoiceNumber: string().required('Required'),
  billerName: string().required('Required'),
  billerAddress: string().required('Required'),
  billerEmail: string().required('Required'),
  customerName: string().required('Required'),
  customerAddress: string(),
  customerEmail: string(),
  invoiceItems: array().of(
    object({
      description: string().required('Required'),
      quantity: string().required('Required'),
      rate: string().required('Required')
    })
  ),
  billDate: date().required('Required'),
  dueDate: date().required('Required'),
  tax: string(),
  shipping: string(),
  discount: number().typeError('Must be a number').required('Required'),
  amountPaid: number(),
  dueBalance: number(),
  currency: string().required('Required'),
  notes: string(),
  status: string().oneOf(["pending", "settled"], "Invalid status value").required('Required'),
  createdAt: string().required('Required'),
  modifedAt: string(),
  createdBy: string()
});

export default InvoiceSchema;
