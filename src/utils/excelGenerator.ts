import * as XLSX from 'xlsx';
import { Bill, BusinessSettings } from '../types';
import { numberToWords } from './numberToWords';

export const generateExcel = (bill: Bill, settings: BusinessSettings) => {
  const wsData: any[][] = [];

  // Helper to add empty rows
  const addEmptyRow = () => wsData.push([]);

  // Company Info
  wsData.push([settings.businessName]);
  if (settings.address) wsData.push([settings.address]);
  wsData.push([`Phone: ${settings.phone} | Email: ${settings.email}`]);
  if (settings.gstNumber) wsData.push([`GSTIN: ${settings.gstNumber}`]);
  
  addEmptyRow();

  // INVOICE Title
  wsData.push(["", "", "INVOICE"]);
  addEmptyRow();

  // Meta details
  wsData.push(["Invoice No:", bill.billNumber, "", "Date:", new Date(bill.date).toLocaleDateString()]);
  if (bill.orderDate || bill.challanDate) {
    wsData.push([
      "Order Date:", bill.orderDate ? new Date(bill.orderDate).toLocaleDateString() : "", 
      "", 
      "Challan Date:", bill.challanDate ? new Date(bill.challanDate).toLocaleDateString() : ""
    ]);
  }
  
  addEmptyRow();

  // Bill To
  wsData.push(["Bill To:"]);
  wsData.push([bill.customerName]);
  if (bill.customerDetails?.address) wsData.push([bill.customerDetails.address]);
  if (bill.customerDetails?.mobile) wsData.push([`Phone: ${bill.customerDetails.mobile}`]);
  if (bill.customerDetails?.gstNumber) wsData.push([`GSTIN: ${bill.customerDetails.gstNumber}`]);

  addEmptyRow();
  addEmptyRow();

  // Table Headers
  wsData.push(["Sr.No", "Particular (Description & Specification)", "Qty", "Rate", "Amount"]);

  // Table Items
  const itemsStartRow = wsData.length + 1; // Excel is 1-indexed
  bill.items.forEach((item, index) => {
    // We add formula for amount = C*D
    const rowNum = itemsStartRow + index;
    wsData.push([
      index + 1,
      item.name,
      item.quantity,
      item.rate,
      { t: 'n', f: `C${rowNum}*D${rowNum}`, v: item.total }
    ]);
  });

  addEmptyRow();

  // Totals & Bank & Words
  const activeBank = bill.bankDetailsSnapshot || settings.bankDetails;
  
  const subtotalRow = wsData.length + 1;
  wsData.push([
    "Amount in Words:", 
    numberToWords(bill.grandTotal), 
    "", 
    "Subtotal:", 
    bill.subtotal
  ]);

  wsData.push([
    activeBank?.bankName ? "Bank Details" : "", 
    "", 
    "", 
    "Tax (GST):", 
    bill.taxTotal
  ]);
  
  wsData.push([
    activeBank?.bankName ? `Bank Name: ${activeBank.bankName}` : "", 
    "", 
    "", 
    "Discount:", 
    bill.discount
  ]);
  
  wsData.push([
    activeBank?.branch ? `Branch: ${activeBank.branch}` : "", 
    "", 
    "", 
    "Grand Total:", 
    { t: 'n', f: `E${subtotalRow}+E${subtotalRow+1}-E${subtotalRow+2}`, v: bill.grandTotal }
  ]);
  
  wsData.push([activeBank?.accountNo ? `Account No: ${activeBank.accountNo}` : ""]);
  wsData.push([activeBank?.ifscCode ? `IFSC Code: ${activeBank.ifscCode}` : ""]);

  addEmptyRow();
  addEmptyRow();

  // Signature block
  wsData.push(["", "", "", `For ${settings.businessName}`]);
  addEmptyRow();
  addEmptyRow();
  wsData.push(["", "", "", "Authorised Signature"]);

  // Notes
  if (bill.notes || settings.defaultNotes) {
    addEmptyRow();
    wsData.push(["Terms & Conditions:"]);
    wsData.push([bill.notes || settings.defaultNotes]);
  }

  // Generate Worksheet
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Column Widths
  ws['!cols'] = [
    { wch: 8 },  // Sr.No
    { wch: 45 }, // Particulars
    { wch: 10 }, // Qty
    { wch: 15 }, // Rate
    { wch: 20 }, // Amount
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Invoice");
  
  XLSX.writeFile(wb, `${bill.billNumber}_Invoice.xlsx`);
};
