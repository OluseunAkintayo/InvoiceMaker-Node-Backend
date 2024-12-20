import { object, string, number, array, date } from 'yup';

const InvoiceSchema = object({
  invoice_number: string().required('Required'),
  biller_name: string().required('Required'),
  biller_address: string().required('Required'),
  biller_email: string().required('Required'),
  customer_name: string().required('Required'),
  customer_address: string(),
  customer_email: string(),
  invoice_items: array().of(
    object({
      description: string().required('Required'),
      quantity: string().required('Required'),
      rate: string().required('Required')
    })
  ),
  bill_date: date().required('Required'),
  due_date: date().required('Required'),
  tax: string(),
  shipping: string(),
  discount: number().typeError('Must be a number').required('Required'),
  amount_paid: number(),
  due_balance: number(),
  currency: string().required('Required'),
  notes: string(),
  status: string().oneOf(["pending", "settled"], "Invalid status value").required('Required'),
  created_at: string().required('Required'),
  modifed_at: string(),
  created_by: string(),
  deleted_at: string()
});

export default InvoiceSchema;
