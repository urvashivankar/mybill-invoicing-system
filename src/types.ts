export interface Item {
  id: string;
  itemName: string;
  itemCode?: string;
  unit: string;
  rate: number;
  gst?: number; // percentage
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  gstNumber?: string;
}

export interface BillItem {
  id: string;
  itemId?: string;
  name: string;
  quantity: number;
  unit: string;
  rate: number;
  tax?: number; // percentage
  amount: number;
}

export interface BankDetails {
  bankName: string;
  branch: string;
  accountNumber: string;
  ifscCode: string;
}

export interface Bill {
  id: string;
  billNumber: string;
  invoiceDate: string;
  orderDate?: string;
  vendorCode?: string;
  woNumber?: string;
  woDate?: string;
  customerId: string;
  customerName: string;
  customerSnapshot?: Customer;
  items: BillItem[];
  subtotal: number;
  taxAmount: number;
  discount: number;
  grandTotal: number;
  amountInWords?: string;
  notes?: string;
  templateType?: string;
  bankDetailsSnapshot?: BankDetails;
  
  // Payment Tracking
  amountPaid?: number;
  balanceDue?: number;
  paymentStatus?: 'Unpaid' | 'Partially Paid' | 'Paid';
}

export interface Payment {
  id: string;
  billId: string;
  amount: number;
  paymentDate: string;
  notes?: string;
}

export interface QuotationItem {
  id: string;
  itemId?: string;
  name: string;
  quantity: number;
  unit: string;
  rate: number;
  tax?: number; // percentage
  amount: number;
}

export interface Quotation {
  id: string;
  quotationNumber: string;
  quotationDate: string;
  validUntil?: string;
  customerId: string;
  customerName: string;
  customerSnapshot?: Customer;
  items: QuotationItem[];
  subtotal: number;
  taxAmount: number;
  discount: number;
  grandTotal: number;
  amountInWords?: string;
  notes?: string;
  templateType?: string;
  bankDetailsSnapshot?: BankDetails;
  status: 'Draft' | 'Sent' | 'Accepted' | 'Rejected' | 'Converted';
  convertedToBillId?: string;
}

export interface BusinessSettings {
  businessName: string;
  address?: string;
  phone?: string;
  email?: string;
  gstNumber?: string;
  panNumber?: string;
  logo?: string; // Base64
  letterhead?: string; // Base64
  signature?: string; // Base64
  bankName?: string;
  branch?: string;
  accountNumber?: string;
  ifscCode?: string;
  invoicePrefix?: string;
  defaultNotes?: string;
  defaultTax?: number;
  defaultTemplate?: string;
}
