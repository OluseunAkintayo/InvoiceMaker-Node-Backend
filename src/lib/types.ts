export interface IUser {
  display_name?: string;
  username: string;
  email: string;
  passcode: string;
  created_at: string;
  modifed_at?: string;
}

export interface IUserDto {
  email: string,
  passcode: string,
}

export interface ILoginResponse {
  access_token: string;
  expiration: string;
  user: {
    display_name?: string;
    id: string;
  }
}

export interface IInvoiceItem {
  description: string;
  quantity: string;
  rate: string;
  tax?: string;
}

export interface IInvoiceFields {
  _id: string;
  logo?: string;
  invoice_number: string;
  biller_name: string;
  biller_address: string;
  biller_email: string;
  customer_name: string;
  customer_address?: string;
  customer_email?: string;
  invoice_items: Array<IInvoiceItem>;
  bill_date: Date;
  due_date: Date;
  tax: number;
  shipping?: number;
  discount: number;
  amount_paid?: number;
  due_balance?: number;
  currency: string;
  notes?: string;
}