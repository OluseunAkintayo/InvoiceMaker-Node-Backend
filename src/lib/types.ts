import { InsertOneResult, ObjectId } from "mongodb";

export interface IUser {
  display_name?: string;
  username: string;
  email: string;
  passcode: string;
  createdAt: string;
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
  createdAt: string;
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
  invoiceNumber: string;
  billerName: string;
  billerAddress: string;
  billerEmail: string;
  customerName: string;
  customerAddress?: string;
  customerEmail?: string;
  invoiceItems: Array<IInvoiceItem>;
  billDate: Date;
  dueDate: Date;
  tax: number;
  shipping?: number;
  discount: number;
  amountPaid?: number;
  dueBalance?: number;
  currency: string;
  notes?: string;
  status: string;
  createdBy: ObjectId;
}

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


