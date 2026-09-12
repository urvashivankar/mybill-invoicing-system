import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Bill, BusinessSettings } from '../types';
import { numberToWords } from './numberToWords';

export const generatePDF = (bill: Bill, settings: BusinessSettings) => {
  const doc = new jsPDF();
  
  // Top Header Row
  if (settings.logoImage) {
    try {
      doc.addImage(settings.logoImage, 'PNG', 14, 15, 30, 30, undefined, 'FAST');
    } catch (e) {
      console.warn('Failed to add logo to PDF', e);
    }
  }

  // Company Name
  doc.setFontSize(24);
  doc.setTextColor(30, 64, 175); // Dark blue
  doc.setFont("helvetica", "bold");
  const nameStartX = settings.logoImage ? 50 : 14;
  doc.text(settings.businessName, nameStartX, 25);
  
  // Company Address & Contact
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.setFont("helvetica", "normal");
  let yPos = 32;
  if (settings.address) { doc.text(settings.address, nameStartX, yPos); yPos += 5; }
  const contact = [];
  if (settings.phone) contact.push(`Ph: ${settings.phone}`);
  if (settings.email) contact.push(`Email: ${settings.email}`);
  if (contact.length > 0) { doc.text(contact.join(' | '), nameStartX, yPos); yPos += 5; }
  if (settings.gstNumber) { doc.text(`GSTIN: ${settings.gstNumber}`, nameStartX, yPos); }

  // Invoice Title
  doc.setFontSize(28);
  doc.setTextColor(15, 23, 42);
  doc.text('INVOICE', 196, 25, { align: 'right' });
  
  // Invoice Meta
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(`Invoice No:`, 140, 35);
  doc.setFont("helvetica", "normal");
  doc.text(bill.billNumber, 196, 35, { align: 'right' });

  doc.setFont("helvetica", "bold");
  doc.text(`Date:`, 140, 41);
  doc.setFont("helvetica", "normal");
  doc.text(new Date(bill.date).toLocaleDateString(), 196, 41, { align: 'right' });

  if (bill.orderDate) {
    doc.setFont("helvetica", "bold");
    doc.text(`Order Date:`, 140, 47);
    doc.setFont("helvetica", "normal");
    doc.text(new Date(bill.orderDate).toLocaleDateString(), 196, 47, { align: 'right' });
  }

  if (bill.challanDate) {
    doc.setFont("helvetica", "bold");
    doc.text(`Challan Date:`, 140, 53);
    doc.setFont("helvetica", "normal");
    doc.text(new Date(bill.challanDate).toLocaleDateString(), 196, 53, { align: 'right' });
  }

  // Divider line
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.line(14, 60, 196, 60);

  // Bill To section
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text('Bill To:', 14, 70);
  
  doc.setFontSize(10);
  doc.text(bill.customerName, 14, 76);
  doc.setFont("helvetica", "normal");
  if (bill.customerDetails?.address) doc.text(bill.customerDetails.address, 14, 82);
  let billToY = bill.customerDetails?.address ? 88 : 82;
  if (bill.customerDetails?.mobile) { doc.text(`Phone: ${bill.customerDetails.mobile}`, 14, billToY); billToY += 6; }
  if (bill.customerDetails?.gstNumber) { doc.text(`GSTIN: ${bill.customerDetails.gstNumber}`, 14, billToY); }

  // Items Table
  const tableColumn = ["Sr.No", "Particular (Description & Specification)", "Qty", "Rate", "Amount"];
  const tableRows = bill.items.map((item, index) => [
    (index + 1).toString(),
    item.name,
    item.quantity.toString(),
    item.rate.toFixed(2),
    item.total.toFixed(2)
  ]);

  // @ts-ignore
  doc.autoTable({
    startY: 95,
    head: [tableColumn],
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold', halign: 'center' },
    columnStyles: {
      0: { halign: 'center', cellWidth: 15 },
      1: { cellWidth: 'auto' },
      2: { halign: 'center', cellWidth: 20 },
      3: { halign: 'right', cellWidth: 30 },
      4: { halign: 'right', cellWidth: 35 }
    },
    styles: { fontSize: 9, cellPadding: 4, lineColor: [203, 213, 225] }
  });

  // @ts-ignore
  const finalY = doc.lastAutoTable.finalY;

  // Amount in Words & Bank details on Left, Totals on Right
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text('Amount in Words:', 14, finalY + 10);
  doc.setFont("helvetica", "normal");
  doc.text(numberToWords(bill.grandTotal), 14, finalY + 15);

  const activeBank = bill.bankDetailsSnapshot || settings.bankDetails;
  
  if (activeBank && activeBank.bankName) {
    doc.setFont("helvetica", "bold");
    doc.text('Bank Details', 14, finalY + 25);
    doc.setFont("helvetica", "normal");
    doc.text(`Bank Name: ${activeBank.bankName}`, 14, finalY + 30);
    doc.text(`Branch: ${activeBank.branch}`, 14, finalY + 35);
    doc.text(`Account No: ${activeBank.accountNo}`, 14, finalY + 40);
    doc.text(`IFSC Code: ${activeBank.ifscCode}`, 14, finalY + 45);
  }

  // Totals calculations block
  let totalY = finalY + 10;
  
  doc.text('Subtotal:', 140, totalY);
  doc.text(bill.subtotal.toFixed(2), 196, totalY, { align: 'right' });
  totalY += 6;

  if (bill.taxTotal > 0) {
    doc.text('Tax (GST):', 140, totalY);
    doc.text(bill.taxTotal.toFixed(2), 196, totalY, { align: 'right' });
    totalY += 6;
  }
  
  if (bill.discount > 0) {
    doc.text('Discount:', 140, totalY);
    doc.text(`-${bill.discount.toFixed(2)}`, 196, totalY, { align: 'right' });
    totalY += 6;
  }

  doc.setFillColor(241, 245, 249);
  doc.rect(130, totalY, 66, 10, 'F');
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text('Grand Total:', 140, totalY + 7);
  doc.text(`Rs. ${bill.grandTotal.toFixed(2)}`, 196, totalY + 7, { align: 'right' });

  // Signature Block
  let sigY = Math.max(finalY + 50, totalY + 30);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(`For ${settings.businessName}`, 196, sigY, { align: 'right' });
  
  if (settings.signatureImage) {
    try {
      doc.addImage(settings.signatureImage, 'PNG', 156, sigY + 5, 40, 15, undefined, 'FAST');
    } catch (e) {
      console.warn('Failed to add signature', e);
    }
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text('Authorised Signature', 196, sigY + 28, { align: 'right' });

  // Notes
  if (bill.notes || settings.defaultNotes) {
    const notesText = bill.notes || settings.defaultNotes || '';
    doc.setFont("helvetica", "bold");
    doc.text('Terms & Conditions:', 14, sigY + 10);
    doc.setFont("helvetica", "normal");
    const splitNotes = doc.splitTextToSize(notesText, 100);
    doc.text(splitNotes, 14, sigY + 15);
  }

  doc.save(`${bill.billNumber}_Invoice.pdf`);
};
