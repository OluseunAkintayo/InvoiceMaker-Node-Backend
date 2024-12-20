import { InsertOneResult, ObjectId } from "mongodb";

export interface IUser {
  display_name?: string;
  username: string;
  email: string;
  passcode: string;
  created_at: string;
  modifedAt?: string;
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
  deleted_at?: string;
}

export interface IInvoiceResponse {
  _id: ObjectId;
  invoice_number: string;
  customer_name: string;
  items_count: number;
  invoice_total: string;
  status: string;
  currency: string;
  created_at: string;
  due_date?: string;
}

export type IRecentInvoices = Omit<IInvoiceResponse, "items_count" | "due_date">

export interface IAuthService {
  signup(userDto: IUserDto): Promise<{
    success: boolean;
    message: string;
    data?: InsertOneResult<Document>;
  }>;

  login(arg0: IUserDto): Promise<{
    success: boolean;
    data?: ILoginResponse;
    message?: string;
    error?: unknown;
  }>;
}


