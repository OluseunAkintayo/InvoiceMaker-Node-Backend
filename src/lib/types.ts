import { ObjectId } from "mongodb";

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
    id: string;
    email: string;
  }
}

export interface IProfile {
  user_id: ObjectId;
  org_name: string;
  org_address: string;
  org_email: string;
  org_phone: string;
  created_at: string;
  org_logo: string;
}

export interface IInvoiceItem {
  description: string;
  quantity: string;
  rate: string;
  tax?: string;
}

export interface IInvoiceFields {
  _id?: ObjectId;
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
  status: string;
  created_by: ObjectId;
}