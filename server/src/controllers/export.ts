import { Router, Request, Response } from 'express';
import { Bill, BillItem, BusinessSettings } from '../models';
import puppeteer from 'puppeteer';
import ExcelJS from 'exceljs';

const router = Router();

// Helper to convert numbers to words
const numberToWords = (num: number): string => {
  if (num === 0) return 'Rupees Zero Only';
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty ', 'Thirty ', 'Forty ', 'Fifty ', 'Sixty ', 'Seventy ', 'Eighty ', 'Ninety '];
  const inWords = (n: number): string => {
    let str = '';
    if (n > 9999999) { str += inWords(Math.floor(n / 10000000)) + 'Crore '; n %= 10000000; }
    if (n > 99999) { str += inWords(Math.floor(n / 100000)) + 'Lakh '; n %= 100000; }
    if (n > 999) { str += inWords(Math.floor(n / 1000)) + 'Thousand '; n %= 1000; }
    if (n > 99) { str += a[Math.floor(n / 100)] + 'Hundred '; n %= 100; }
    if (n > 0) {
      if (str !== '') str += 'and ';
      if (n < 20) str += a[n];
      else { str += b[Math.floor(n / 10)]; if (n % 10 > 0) str += a[n % 10]; }
    }
    return str.trim();
  };
  return 'Rupees ' + inWords(Math.floor(num)) + ' Only';
};

const getHtmlTemplate = (bill: any, settings: any, isQuotation = false) => {
  const tpl = bill.templateType || 'classic';
  const primaryColor = tpl === 'color' ? '#4F46E5' : '#1F2937';
  
  let itemsHtml = '';
  if (bill.dataValues && bill.dataValues.items) {
    bill.dataValues.items.forEach((item: any, i: number) => {
      itemsHtml += `
        <tr>
          <td style="text-align: center;">${i + 1}</td>
          <td>${item.itemName}</td>
          <td style="text-align: center;">${item.quantity}</td>
          <td style="text-align: center;">${item.rate.toFixed(2)}</td>
          <td style="text-align: right;">${item.amount.toFixed(2)}</td>
        </tr>
      `;
    });
  } else if (bill.items) {
    bill.items.forEach((item: any, i: number) => {
      itemsHtml += `
        <tr>
          <td style="text-align: center;">${i + 1}</td>
          <td>${item.itemName}</td>
          <td style="text-align: center;">${item.quantity}</td>
          <td style="text-align: center;">${Number(item.rate).toFixed(2)}</td>
          <td style="text-align: right;">${Number(item.amount).toFixed(2)}</td>
        </tr>
      `;
    });
  }

  const sigHtml = settings.signatureImage 
    ? `<img src="${settings.signatureImage}" alt="Signature" style="max-height: 60px; max-width: 150px; display: block; margin-left: auto;" />`
    : `<div style="height: 60px;"></div>`;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
          body {
            font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 40px;
            color: #111827;
            font-size: 13px;
          }
          table { width: 100%; border-collapse: collapse; }
          .header-table {
            border: 2px solid ${primaryColor};
            margin-bottom: 25px;
            border-radius: 4px;
          }
          .header-table td { padding: 8px 12px; }
          .meta-col { border-left: 1px solid #D1D5DB; width: 35%; }
          .meta-row { display: flex; justify-content: space-between; padding: 4px 0; }
          .meta-label { font-weight: 600; color: #4B5563; }
          .meta-value { font-weight: 600; text-align: right; }
          
          .items-table {
            border: 2px solid ${primaryColor};
            margin-bottom: 30px;
          }
          .items-table th {
            background-color: ${primaryColor};
            color: #ffffff;
            padding: 10px 12px;
            font-weight: 600;
            text-align: left;
            border-bottom: 2px solid ${primaryColor};
          }
          .items-table th:first-child, .items-table td:first-child { text-align: center; }
          .items-table td {
            padding: 10px 12px;
            border-bottom: 1px solid #E5E7EB;
            border-right: 1px solid #E5E7EB;
          }
          .items-table td:last-child, .items-table th:last-child { border-right: none; }
          
          .totals-row td {
            padding: 12px;
            background-color: #F9FAFB;
          }
          .grand-total-label { font-size: 15px; font-weight: 700; text-align: right; }
          .grand-total-value { font-size: 16px; font-weight: 700; color: ${primaryColor}; text-align: right; }
          
          .words-row td {
            padding: 12px;
            font-style: italic;
            color: #4B5563;
            text-align: right !important;
          }
          
          .bottom-section {
            display: flex;
            justify-content: space-between;
            margin-top: 20px;
          }
          .bank-box {
            width: 48%;
            border: 2px solid ${primaryColor};
            border-radius: 4px;
            overflow: hidden;
          }
          .bank-header {
            background-color: ${primaryColor};
            color: white;
            padding: 8px;
            font-weight: 600;
            text-align: center;
          }
          .bank-table td {
            padding: 6px 10px;
            border-bottom: 1px solid #E5E7EB;
          }
          .bank-table tr:last-child td { border-bottom: none; }
          .bank-label {
            background-color: #F9FAFB;
            font-weight: 600;
            color: #4B5563;
            width: 120px;
            border-right: 1px solid #E5E7EB;
          }
          
          .sig-box {
            width: 40%;
            text-align: right;
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
          }
          .sig-business { font-weight: 700; font-size: 14px; margin-bottom: 15px; }
          .sig-line { font-weight: 600; color: #4B5563; margin-top: 10px; }
          
          .terms-box {
            margin-top: 20px;
            padding: 12px;
            border: 1px solid #D1D5DB;
            border-radius: 4px;
            background-color: #F9FAFB;
          }
          .terms-title { font-weight: 700; margin-bottom: 8px; color: ${primaryColor}; }
          .terms-text { white-space: pre-wrap; font-size: 12px; color: #4B5563; line-height: 1.4; }
        </style>
      </head>
      <body>
        <table class="header-table">
          <tr>
            <td colspan="2" style="text-align: center; padding: 15px; border-bottom: 1px solid #D1D5DB;">
              <span style="font-size: 28px; font-weight: 700; color: ${primaryColor}; letter-spacing: 1px;">${isQuotation ? 'QUOTATION' : 'INVOICE'}</span>
            </td>
          </tr>
          <tr>
            <td style="width: 65%; vertical-align: top; padding: 15px;">
              <div style="font-size: 24px; font-weight: 800; color: ${primaryColor}; text-transform: uppercase;">${settings.businessName}</div>
              <div style="margin-top: 5px; color: #4B5563;">${settings.address ? settings.address.replace(/\n/g, '<br/>') : ''}</div>
              ${settings.phone ? `<div style="margin-top: 5px; color: #4B5563;">Phone: ${settings.phone}</div>` : ''}
              ${settings.email ? `<div style="margin-top: 5px; color: #4B5563;">Email: ${settings.email}</div>` : ''}
              ${settings.gstNumber ? `<div style="margin-top: 5px; color: #4B5563;">GSTIN: ${settings.gstNumber}</div>` : ''}
            </td>
            <td class="meta-col" style="vertical-align: top; padding: 15px;">
              <div style="font-size: 28px; font-weight: 800; letter-spacing: 2px; color: #111827; margin-bottom: 15px; text-align: right;">${isQuotation ? 'QUOTATION' : 'INVOICE'}</div>
              <div class="meta-row"><span class="meta-label">${isQuotation ? 'Quotation No:' : 'Invoice No:'}</span> <span class="meta-value" style="color: ${primaryColor};">${isQuotation ? bill.quotationNumber : bill.billNumber}</span></div>
              <div class="meta-row"><span class="meta-label">Date:</span> <span class="meta-value">${new Date(isQuotation ? bill.quotationDate : bill.invoiceDate).toLocaleDateString()}</span></div>
              ${isQuotation && bill.validUntil ? `<div class="meta-row"><span class="meta-label">Valid Until:</span> <span class="meta-value">${new Date(bill.validUntil).toLocaleDateString()}</span></div>` : ''}
              <div class="meta-row" style="margin-top: 10px; border-top: 1px solid #E5E7EB; padding-top: 10px;">
                <span class="meta-label">Vendor Code:</span> <span class="meta-value">${bill.vendorCode || '-'}</span>
              </div>
              <div class="meta-row"><span class="meta-label">W.O NO:</span> <span class="meta-value">${bill.woNumber || '-'}</span></div>
              <div class="meta-row"><span class="meta-label">W.O Date:</span> <span class="meta-value">${bill.woDate ? new Date(bill.woDate).toLocaleDateString() : '-'}</span></div>
            </td>
          </tr>
          <tr>
            <td colspan="2" style="border-top: 1px solid #D1D5DB; padding: 15px;">
              <div style="background-color: ${primaryColor}; color: white; display: inline-block; padding: 4px 12px; font-weight: 600; margin-bottom: 10px; border-radius: 3px;">Bill To</div><br/>
              <div style="font-weight: 600; font-size: 15px; margin-bottom: 5px;">${bill.customerSnapshot?.name || bill.customerName || 'Customer'}</div>
              <div style="color: #4B5563; line-height: 1.5;">
                ${bill.customerSnapshot?.address || ''}<br/>
                ${bill.customerSnapshot?.phone ? `Phone: ${bill.customerSnapshot.phone}` : ''}
                ${bill.customerSnapshot?.gstNumber ? `<br/>GSTIN: ${bill.customerSnapshot.gstNumber}` : ''}
              </div>
            </td>
            </td>
          </tr>
        </table>
        
        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 5%;">Sr.No</th>
              <th style="width: 45%;">Particular (Description & Specification)</th>
              <th style="width: 10%; text-align: center;">Qty</th>
              <th style="width: 15%; text-align: center;">Rate</th>
              <th style="width: 25%; text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
            <tr class="totals-row">
              <td colspan="4" class="grand-total-label">Grand Total</td>
              <td class="grand-total-value">₹ ${bill.grandTotal.toFixed(2)}</td>
            </tr>
            <tr class="words-row">
              <td colspan="5">
                <span style="font-weight: 600; color: #111827;">Amount in Words:</span> ${numberToWords(bill.grandTotal)}
              </td>
            </tr>
          </tbody>
        </table>

        ${bill.notes ? `
        <div class="terms-box">
          <div class="terms-title">Terms & Conditions / Notes:</div>
          <div class="terms-text">${bill.notes}</div>
        </div>
        ` : ''}

        <div class="bottom-section">
          <div class="bank-box">
            <div class="bank-header">BANK DETAILS</div>
            <table class="bank-table">
              <tr><td class="bank-label">Bank Name:</td><td>${settings.bankName || '-'}</td></tr>
              <tr><td class="bank-label">Branch:</td><td>${settings.branch || '-'}</td></tr>
              <tr><td class="bank-label">Account No:</td><td>${settings.accountNumber || '-'}</td></tr>
              <tr><td class="bank-label">IFSC Code:</td><td>${settings.ifscCode || '-'}</td></tr>
              <tr><td class="bank-label">PAN No:</td><td>${settings.panNumber || '-'}</td></tr>
            </table>
          </div>
          <div class="sig-box">
            <div class="sig-business">For ${settings.businessName || 'Business Name'}</div>
            ${sigHtml}
            <div class="sig-line">Authorised Signature</div>
          </div>
        </div>
      </body>
    </html>
  `;
};

router.get('/:id/pdf', async (req: Request, res: Response) => {
  try {
    const bill = await Bill.findOne({ where: { id: req.params.id, userId: req.userId }, include: [{ model: BillItem, as: 'items' }] });
    let settings = await BusinessSettings.findOne({ where: { userId: req.userId } });
    if (!settings) settings = {} as any;
    
    if (!bill) return res.status(404).json({ error: 'Bill not found' });
    
    if (req.query.template) {
      bill.templateType = req.query.template as string;
    }

    const html = getHtmlTemplate(bill, settings);

    // We avoid Puppeteer entirely. Native browser printing is 100% reliable for desktop apps.
    const printHtml = html.replace('</body>', `
      <script>
        window.onload = function() {
          setTimeout(() => {
            window.print();
          }, 500);
        }
      </script>
      </body>
    `);

    res.set('Content-Type', 'text/html');
    res.send(printHtml);
  } catch (error: any) {
    console.error("PDF Generation Error:", error);
    res.status(500).send(`<h3>Error generating PDF</h3><p>${error.message}</p>`);
  }
});

const generateExcelWorkbook = async (bill: any, settings: any, res: Response, isQuotation = false) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(isQuotation ? 'Quotation' : 'Invoice');

  const tpl = bill.templateType || 'classic';
  const primaryColor = tpl === 'color' ? '4F46E5' : '1F2937'; // Indigo or very Dark Gray
  const lightBg = 'F3F4F6'; 
  const borderColor = 'E5E7EB'; // Very light gray for soft grid
  
  // Set modern font everywhere
  worksheet.properties.defaultRowHeight = 22;

  const setCellFont = (cell: ExcelJS.Cell, size=11, bold=false, color='000000', italic=false) => {
    cell.font = { name: 'Segoe UI', size, bold, color: { argb: color }, italic };
  };

  // === TOP INVOICE HEADER BLOCK ===
  worksheet.mergeCells('A2:C2');
  const invTitle = worksheet.getCell('A2');
  invTitle.value = isQuotation ? 'QUOTATION' : 'INVOICE';
  setCellFont(invTitle, 22, true, primaryColor);
  invTitle.alignment = { horizontal: 'center', vertical: 'middle' };
  
  worksheet.getCell('D2').value = isQuotation ? 'Quotation No:' : 'Invoice No:';
  setCellFont(worksheet.getCell('D2'), 11, true);
  worksheet.getCell('D2').alignment = { horizontal: 'right', vertical: 'middle' };
  worksheet.getCell('E2').value = isQuotation ? bill.quotationNumber : bill.billNumber;
  setCellFont(worksheet.getCell('E2'), 12, true, primaryColor);
  worksheet.getCell('E2').alignment = { horizontal: 'center', vertical: 'middle' };

  worksheet.mergeCells('A3:C3');
  worksheet.getCell('A3').value = 'Bill To';
  setCellFont(worksheet.getCell('A3'), 12, true, 'FFFFFF');
  worksheet.getCell('A3').alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getCell('A3').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: primaryColor } };

  worksheet.getCell('D3').value = 'Date:';
  setCellFont(worksheet.getCell('D3'), 11, true);
  worksheet.getCell('D3').alignment = { horizontal: 'right', vertical: 'middle' };
  worksheet.getCell('E3').value = new Date(isQuotation ? bill.quotationDate : bill.invoiceDate).toLocaleDateString();
  setCellFont(worksheet.getCell('E3'), 11);
  worksheet.getCell('E3').alignment = { horizontal: 'center', vertical: 'middle' };

  worksheet.mergeCells('A4:C6');
  const customerAddress = `${bill.customerSnapshot?.name || bill.customerName || 'Customer'}\n${bill.customerSnapshot?.address || ''}\n${bill.customerSnapshot?.phone ? `Phone: ${bill.customerSnapshot.phone}` : ''}`.trim();
  worksheet.getCell('A4').value = customerAddress;
  setCellFont(worksheet.getCell('A4'), 11);
  worksheet.getCell('A4').alignment = { vertical: 'top', wrapText: true, indent: 1 };
  worksheet.getRow(4).height = 50; 

  let startItemRowOffset = 0;
  if (isQuotation && bill.validUntil) {
    worksheet.getCell('D4').value = 'Valid Until:';
    setCellFont(worksheet.getCell('D4'), 11, true);
    worksheet.getCell('D4').alignment = { horizontal: 'right', vertical: 'middle' };
    worksheet.getCell('E4').value = new Date(bill.validUntil).toLocaleDateString();
    setCellFont(worksheet.getCell('E4'), 11);
    worksheet.getCell('E4').alignment = { horizontal: 'center', vertical: 'middle' };
    startItemRowOffset = 1;
  }

  worksheet.getCell(`D${4 + startItemRowOffset}`).value = 'Vendor Code:';
  setCellFont(worksheet.getCell(`D${4 + startItemRowOffset}`), 11, true);
  worksheet.getCell(`D${4 + startItemRowOffset}`).alignment = { horizontal: 'right', vertical: 'middle' };
  worksheet.getCell(`E${4 + startItemRowOffset}`).value = bill.vendorCode || '-';
  setCellFont(worksheet.getCell(`E${4 + startItemRowOffset}`), 11);
  worksheet.getCell(`E${4 + startItemRowOffset}`).alignment = { horizontal: 'center', vertical: 'middle' };

  worksheet.getCell(`D${5 + startItemRowOffset}`).value = 'W.O NO:';
  setCellFont(worksheet.getCell(`D${5 + startItemRowOffset}`), 11, true);
  worksheet.getCell(`D${5 + startItemRowOffset}`).alignment = { horizontal: 'right', vertical: 'middle' };
  worksheet.getCell(`E${5 + startItemRowOffset}`).value = bill.woNumber || '-';
  setCellFont(worksheet.getCell(`E${5 + startItemRowOffset}`), 11);
  worksheet.getCell(`E${5 + startItemRowOffset}`).alignment = { horizontal: 'center', vertical: 'middle' };

  worksheet.getCell(`D${6 + startItemRowOffset}`).value = 'W.O Date:';
  setCellFont(worksheet.getCell(`D${6 + startItemRowOffset}`), 11, true);
  worksheet.getCell(`D${6 + startItemRowOffset}`).alignment = { horizontal: 'right', vertical: 'middle' };
  worksheet.getCell(`E${6 + startItemRowOffset}`).value = bill.woDate ? new Date(bill.woDate).toLocaleDateString() : '-';
  setCellFont(worksheet.getCell(`E${6 + startItemRowOffset}`), 11);
  worksheet.getCell(`E${6 + startItemRowOffset}`).alignment = { horizontal: 'center', vertical: 'middle' };

  // Clean outer borders for the header block (No inner grid)
  const headerOutline = { style: 'medium', color: { argb: primaryColor } } as ExcelJS.BorderStyle;
  const headerThin = { style: 'thin', color: { argb: primaryColor } } as ExcelJS.BorderStyle;
  
  // Top border
  for(let c=1; c<=5; c++) worksheet.getCell(2, c).border = { top: headerOutline };
  // Bottom border
  const bottomHeaderRow = 6 + startItemRowOffset;
  for(let c=1; c<=5; c++) worksheet.getCell(bottomHeaderRow, c).border = { ...worksheet.getCell(bottomHeaderRow, c).border, bottom: headerOutline };
  // Left border
  for(let r=2; r<=bottomHeaderRow; r++) worksheet.getCell(r, 1).border = { ...worksheet.getCell(r, 1).border, left: headerOutline };
  // Right border
  for(let r=2; r<=bottomHeaderRow; r++) worksheet.getCell(r, 5).border = { ...worksheet.getCell(r, 5).border, right: headerOutline };
  // Vertical divider between Bill To and Meta
  for(let r=2; r<=bottomHeaderRow; r++) worksheet.getCell(r, 3).border = { ...worksheet.getCell(r, 3).border, right: headerThin };

  // === TABLE HEADER ===
  let currentRow = 8 + startItemRowOffset;
  const headerRow = worksheet.getRow(currentRow);
  headerRow.height = 25;
  headerRow.values = ['Sr.No', 'Particular (Description & Specification)', 'Qty', 'Rate', 'Amount'];
  headerRow.eachCell((cell) => {
    setCellFont(cell, 11, true, 'FFFFFF');
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: primaryColor } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = { top: headerOutline, bottom: headerOutline, left: headerThin, right: headerThin };
    });

  // === ITEMS ===
  currentRow++;
  const itemBorder = { style: 'thin', color: { argb: borderColor } } as ExcelJS.BorderStyle;
  
  const itemsList = bill.dataValues?.items || bill.items || [];
  itemsList.forEach((item: any, i: number) => {
    const row = worksheet.getRow(currentRow);
    row.values = [i + 1, item.itemName, item.quantity, item.rate, item.amount];
    
    row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(2).alignment = { vertical: 'middle', indent: 1 };
    row.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(4).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(5).alignment = { horizontal: 'right', vertical: 'middle' };
      
      row.getCell(4).numFmt = '#,##0.00';
      row.getCell(5).numFmt = '#,##0.00';
      
      for(let c=1; c<=5; c++) {
        setCellFont(row.getCell(c), 11);
        row.getCell(c).border = { bottom: itemBorder, left: headerThin, right: headerThin };
      }
      currentRow++;
    });

    // Close the table with a strong border
    for(let c=1; c<=5; c++) {
      worksheet.getCell(currentRow-1, c).border = { ...worksheet.getCell(currentRow-1, c).border, bottom: headerOutline };
    }

    // === TOTALS ===
    worksheet.mergeCells(`A${currentRow}:D${currentRow}`);
    const grandTotalLabel = worksheet.getCell(`A${currentRow}`);
    grandTotalLabel.value = 'Grand Total';
    setCellFont(grandTotalLabel, 13, true);
    grandTotalLabel.alignment = { horizontal: 'right', vertical: 'middle', indent: 1 };
    grandTotalLabel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: lightBg } };

    const grandTotalVal = worksheet.getCell(`E${currentRow}`);
    grandTotalVal.value = bill.grandTotal;
    setCellFont(grandTotalVal, 14, true, primaryColor);
    grandTotalVal.alignment = { horizontal: 'right', vertical: 'middle' };
    grandTotalVal.numFmt = '₹ #,##0.00';
    grandTotalVal.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: lightBg } };
    
    worksheet.getCell(`A${currentRow}`).border = { top: headerOutline, bottom: headerOutline, left: headerOutline };
    worksheet.getCell(`E${currentRow}`).border = { top: headerOutline, bottom: headerOutline, right: headerOutline };
    worksheet.getRow(currentRow).height = 32;
    currentRow++;

    worksheet.mergeCells(`A${currentRow}:E${currentRow}`);
    const amtWords = worksheet.getCell(`A${currentRow}`);
    amtWords.value = `Amount in Words: ${numberToWords(bill.grandTotal)}`;
    setCellFont(amtWords, 11, false, '4B5563', true);
    amtWords.alignment = { horizontal: 'right', vertical: 'middle', indent: 1 };
    amtWords.border = { bottom: headerThin, left: headerOutline, right: headerOutline };
    worksheet.getRow(currentRow).height = 25;
    
    currentRow += 2;

    if (bill.notes) {
      worksheet.mergeCells(`A${currentRow}:E${currentRow}`);
      const termsTitle = worksheet.getCell(`A${currentRow}`);
      termsTitle.value = 'Terms & Conditions / Notes:';
      setCellFont(termsTitle, 11, true, primaryColor);
      currentRow++;

      const notesLines = bill.notes.split('\n').length;
      const termsEndRow = currentRow + notesLines - 1;
      worksheet.mergeCells(`A${currentRow}:E${termsEndRow}`);
      const termsVal = worksheet.getCell(`A${currentRow}`);
      termsVal.value = bill.notes;
      setCellFont(termsVal, 10, false, '4B5563');
      termsVal.alignment = { vertical: 'top', wrapText: true };
      
      // Auto-size the row based on the number of lines (approx 15 points per line)
      for (let r = currentRow; r <= termsEndRow; r++) {
        worksheet.getRow(r).height = 15;
      }
      
      currentRow = termsEndRow + 2;
    }

    // === BANK DETAILS ===
    if (!isQuotation) {
      worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
      const bankHeader = worksheet.getCell(`A${currentRow}`);
      bankHeader.value = 'BANK DETAILS';
      setCellFont(bankHeader, 11, true, 'FFFFFF');
      bankHeader.alignment = { horizontal: 'center', vertical: 'middle' };
      bankHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: primaryColor } };
      worksheet.getCell(`A${currentRow}`).border = { top: headerOutline, left: headerOutline, right: headerOutline };
      currentRow++;

      const addBankRow = (label: string, value: string, isLast=false) => {
        worksheet.getCell(`A${currentRow}`).value = label;
        setCellFont(worksheet.getCell(`A${currentRow}`), 10, true, '4B5563');
        worksheet.getCell(`A${currentRow}`).alignment = { horizontal: 'right', vertical: 'middle' };
        worksheet.getCell(`A${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: lightBg } };
        
        worksheet.getCell(`B${currentRow}`).value = value;
        setCellFont(worksheet.getCell(`B${currentRow}`), 10, true);
        worksheet.getCell(`B${currentRow}`).alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
        
        const bStyle = isLast ? headerOutline : itemBorder;
        worksheet.getCell(`A${currentRow}`).border = { left: headerOutline, bottom: bStyle };
        worksheet.getCell(`B${currentRow}`).border = { right: headerOutline, bottom: bStyle };
        currentRow++;
      };

      addBankRow('Bank Name:', (settings as any).bankName || '-');
      addBankRow('Branch:', (settings as any).branch || '-');
      addBankRow('Account No:', (settings as any).accountNumber || '-');
      addBankRow('IFSC Code:', (settings as any).ifscCode || '-');
      addBankRow('PAN No:', (settings as any).panNumber || '-', true);
    }

    // === SIGNATURES ===
    const sigStart = currentRow + 2; 
    worksheet.getCell(`E${sigStart}`).value = `For ${(settings as any).businessName || 'Business Name'}`;
    setCellFont(worksheet.getCell(`E${sigStart}`), 12, true, '000000', true);
    worksheet.getCell(`E${sigStart}`).alignment = { horizontal: 'right', vertical: 'middle' };
    
    worksheet.getCell(`E${sigStart + 3}`).value = 'Authorised Signature';
    setCellFont(worksheet.getCell(`E${sigStart + 3}`), 11, true, '4B5563', true);
    worksheet.getCell(`E${sigStart + 3}`).alignment = { horizontal: 'right', vertical: 'middle' };

    // === COLUMN SIZING ===
    worksheet.getColumn(1).width = 10;
    worksheet.getColumn(2).width = 45;
    worksheet.getColumn(3).width = 12;
    worksheet.getColumn(4).width = 15;
    worksheet.getColumn(5).width = 25; 

    const filename = isQuotation ? bill.quotationNumber : bill.billNumber;
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename=${filename}.xlsx`,
    });
    
    await workbook.xlsx.write(res);
    res.end();
};

router.get('/:id/excel', async (req: Request, res: Response) => {
  try {
    const bill = await Bill.findOne({ where: { id: req.params.id, userId: req.userId }, include: [{ model: BillItem, as: 'items' }] });
    let settings = await BusinessSettings.findOne({ where: { userId: req.userId } });
    if (!settings) settings = {} as any;
    
    if (!bill) return res.status(404).json({ error: 'Bill not found' });
    
    await generateExcelWorkbook(bill, settings, res, false);
  } catch (error: any) {
    console.error("Excel Generation Error:", error);
    res.status(500).json({ error: error.message });
  }
});

import { Quotation, QuotationItem } from '../models';

// --- Distinct Quotation HTML Template ---
const getQuotationHtmlTemplate = (qt: any, settings: any) => {
  const sData = settings.dataValues || settings;
  const qtData = qt.dataValues || qt;
  const tpl = qtData.templateType || 'classic';
  
  const isColor = tpl === 'color';
  const primaryColor = isColor ? '#0d9488' : '#000000'; // teal for modern, black for classic
  const accentBg = isColor ? '#f0fdfa' : '#ffffff';     
  const borderColor = isColor ? '#d1fae5' : '#000000';
  const tableHeaderBg = isColor ? '#0d9488' : '#ffffff';
  const tableHeaderColor = isColor ? '#ffffff' : '#000000';

  let itemsHtml = '';
  const items = (qtData.items) || qt.items || [];
  items.forEach((item: any, i: number) => {
    // Drop trailing .00 for Qty but keep decimals if like 1.5
    const qtyStr = Number(item.quantity).toString();
    itemsHtml += `
      <tr>
        <td style="text-align:center;padding:9px 10px;border:1px solid ${borderColor};">${i + 1}</td>
        <td style="padding:9px 10px;border:1px solid ${borderColor};">${item.itemName || item.name}</td>
        <td style="text-align:center;padding:9px 10px;border:1px solid ${borderColor};">${qtyStr} ${item.unit || ''}</td>
        <td style="text-align:right;padding:9px 10px;border:1px solid ${borderColor};">${Number(item.rate).toFixed(2)}</td>
        <td style="text-align:right;padding:9px 10px;border:1px solid ${borderColor};font-weight:600;">${Number(item.amount).toFixed(2)}</td>
      </tr>`;
  });

  const sigHtml = sData.signatureImage 
    ? `<img src="${sData.signatureImage}" alt="Signature" style="max-height:55px;max-width:140px;display:block;margin-left:auto;" />`
    : `<div style="height:55px;"></div>`;

  const validUntilBadge = qtData.validUntil
    ? `<span style="background:${isColor?accentBg:'#fff'};color:${primaryColor};border:1px solid ${primaryColor};padding:3px 10px;border-radius:20px;font-size:12px;font-weight:600;display:inline-block;margin-top:6px;">Valid Until: ${new Date(qtData.validUntil).toLocaleDateString('en-IN', {day:'2-digit',month:'short',year:'numeric'})}</span>`
    : '';

  return `<!DOCTYPE html>
  <html>
  <head><meta charset="utf-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
    * { box-sizing: border-box; margin:0; padding:0; }
    body { font-family: 'Inter', 'Segoe UI', sans-serif; padding:36px; color:#111827; font-size:13px; }
    .qt-stamp { background:${isColor?primaryColor:'#fff'}; color:${isColor?'#fff':'#000'}; border:${isColor?'none':'2px solid #000'}; text-align:center; padding:12px; font-size:26px; font-weight:800; letter-spacing:4px; margin-bottom:24px; border-radius:4px; }
    .meta-grid { display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:20px; }
    .meta-box { border:1px solid ${borderColor}; border-radius:6px; padding:14px; background:${accentBg}; }
    .meta-box h4 { font-size:11px; text-transform:uppercase; letter-spacing:1px; color:#6b7280; margin-bottom:8px; }
    .meta-row { display:flex; justify-content:space-between; margin-bottom:4px; font-size:13px; }
    .meta-label { color:#4b5563; font-weight:600; }
    .meta-value { font-weight:700; color:#111827; }
    .section-title { font-size:11px; text-transform:uppercase; letter-spacing:1px; color:#6b7280; font-weight:700; margin-bottom:8px; }
    .items-table { width:100%; border-collapse:collapse; margin-bottom:20px; border:1px solid ${borderColor}; border-radius:4px; overflow:hidden; }
    .items-table th { background:${tableHeaderBg}; color:${tableHeaderColor}; padding:10px; font-size:12px; font-weight:600; text-align:left; border:1px solid ${borderColor}; }
    .items-table th:first-child, .items-table td:first-child { text-align:center; width:6%; }
    .items-table th:nth-child(3), .items-table td:nth-child(3) { text-align:center; width:12%; }
    .items-table th:nth-child(4), .items-table td:nth-child(4) { text-align:right; width:14%; }
    .items-table th:last-child, .items-table td:last-child { text-align:right; width:18%; }
    .total-row td { background:${isColor?'#f9fafb':'#fff'}; padding:12px 10px; font-weight:700; font-size:15px; border:1px solid ${borderColor}; border-top:2px solid ${primaryColor}; }
    .words-cell { padding:10px; font-style:italic; color:#4b5563; font-size:12px; border:1px solid ${borderColor}; }
    .bottom { display:flex; justify-content:space-between; margin-top:20px; gap:20px; }
    .sig-box { text-align:right; display:flex; flex-direction:column; justify-content:flex-end; min-width:180px; margin-left:auto; }
    .sig-business { font-weight:700; font-size:14px; color:#111827; margin-bottom:12px; }
    .sig-line { font-size:12px; font-weight:600; color:#4b5563; margin-top:8px; }
    .notes-box { margin:20px 0; padding:12px; border:1px solid ${borderColor}; border-radius:6px; background:${accentBg}; }
    .notes-title { font-weight:700; color:${primaryColor}; font-size:12px; margin-bottom:6px; }
    .notes-text { font-size:12px; color:#4b5563; white-space:pre-wrap; line-height:1.5; }
  </style></head>
  <body>
    <div class="qt-stamp">QUOTATION</div>
    <div class="meta-grid">
      <div class="meta-box">
        <h4>From</h4>
        <div style="font-size:16px;font-weight:800;color:${primaryColor};margin-bottom:6px;">${sData.businessName || ''}</div>
        <div style="color:#4b5563;font-size:12px;line-height:1.6;">${sData.address ? sData.address.replace(/\n/g,'<br/>') : ''}</div>
        ${sData.phone ? `<div style="margin-top:4px;font-size:12px;">Phone: ${sData.phone}</div>` : ''}
        ${sData.email ? `<div style="font-size:12px;">Email: ${sData.email}</div>` : ''}
        ${sData.gstNumber ? `<div style="font-size:12px;margin-top:4px;"><b>GSTIN:</b> ${sData.gstNumber}</div>` : ''}
      </div>
      <div class="meta-box">
        <h4>Quotation Details</h4>
        <div class="meta-row"><span class="meta-label">Quotation No:</span><span class="meta-value" style="color:${primaryColor};">${qtData.quotationNumber}</span></div>
        <div class="meta-row"><span class="meta-label">Date:</span><span class="meta-value">${new Date(qtData.quotationDate).toLocaleDateString('en-IN', {day:'2-digit',month:'short',year:'numeric'})}</span></div>
        ${validUntilBadge ? `<div style="margin-top:8px;">${validUntilBadge}</div>` : ''}
        <hr style="margin:10px 0;border-color:${borderColor};"/>
        <h4 style="margin-bottom:6px;">Bill To</h4>
        <div style="font-weight:700;font-size:14px;">${qtData.customerSnapshot?.name || 'Customer'}</div>
        <div style="font-size:12px;color:#4b5563;line-height:1.5;margin-top:4px;">
          ${qtData.customerSnapshot?.address ? qtData.customerSnapshot.address.replace(/\n/g,'<br/>') : ''}
          ${qtData.customerSnapshot?.phone ? `<br/>Phone: ${qtData.customerSnapshot.phone}` : ''}
          ${qtData.customerSnapshot?.email ? `<br/>Email: ${qtData.customerSnapshot.email}` : ''}
          ${qtData.customerSnapshot?.gstNumber ? `<br/>GSTIN: ${qtData.customerSnapshot.gstNumber}` : ''}
        </div>
      </div>
    </div>

    <div class="section-title">Items &amp; Services</div>
    <table class="items-table">
      <thead><tr>
        <th>Sr</th><th>Particulars / Description</th><th>Qty</th><th>Rate (₹)</th><th>Amount (₹)</th>
      </tr></thead>
      <tbody>
        ${itemsHtml}
        ${qtData.discount > 0 ? `
        <tr>
          <td colspan="4" style="text-align:right;padding:8px 10px;border:1px solid ${borderColor};">Subtotal:</td>
          <td style="text-align:right;padding:8px 10px;border:1px solid ${borderColor};">₹ ${Number(qtData.subtotal).toFixed(2)}</td>
        </tr>
        <tr>
          <td colspan="4" style="text-align:right;padding:8px 10px;border:1px solid ${borderColor};">Discount:</td>
          <td style="text-align:right;padding:8px 10px;border:1px solid ${borderColor};">- ₹ ${Number(qtData.discount).toFixed(2)}</td>
        </tr>
        ` : ''}
        ${qtData.taxAmount > 0 ? `
        <tr>
          <td colspan="4" style="text-align:right;padding:8px 10px;border:1px solid ${borderColor};">Tax / GST:</td>
          <td style="text-align:right;padding:8px 10px;border:1px solid ${borderColor};">₹ ${Number(qtData.taxAmount).toFixed(2)}</td>
        </tr>
        ` : ''}
        <tr class="total-row">
          <td colspan="4" style="text-align:right;">Grand Total:</td>
          <td>₹ ${Number(qtData.grandTotal).toFixed(2)}</td>
        </tr>
        <tr><td colspan="5" class="words-cell"><b>Amount in Words:</b> ${numberToWords(qtData.grandTotal || 0)}</td></tr>
      </tbody>
    </table>

    ${qtData.notes ? `<div class="notes-box"><div class="notes-title">Terms &amp; Conditions / Notes:</div><div class="notes-text">${qtData.notes}</div></div>` : ''}

    <div class="bottom">
      <div class="sig-box">
        <div class="sig-business">For ${sData.businessName || 'Business Name'}</div>
        ${sigHtml}
        <div class="sig-line">Authorised Signature</div>
      </div>
    </div>
  </body></html>`;
};

router.get('/quotation/:id/pdf', async (req: Request, res: Response) => {
  try {
    const qt = await Quotation.findOne({ where: { id: req.params.id, userId: req.userId }, include: [{ model: QuotationItem, as: 'items' }] });
    let settings = await BusinessSettings.findOne({ where: { userId: req.userId } });
    if (!settings) settings = {} as any;

    if (!qt) return res.status(404).json({ error: 'Quotation not found' });

    const html = getQuotationHtmlTemplate(qt, settings);

    // Use the same reliable browser-print approach as bills
    const printHtml = html.replace('</body>', `
      <script>
        window.onload = function() {
          setTimeout(() => { window.print(); }, 500);
        }
      </script>
      </body>
    `);

    res.set('Content-Type', 'text/html');
    res.send(printHtml);
  } catch (error: any) {
    console.error('Quotation PDF Error:', error);
    res.status(500).send(`<h3>Error generating Quotation PDF</h3><p>${error.message}</p>`);
  }
});

router.get('/quotation/:id/excel', async (req: Request, res: Response) => {
  try {
    const qt = await Quotation.findOne({ where: { id: req.params.id, userId: req.userId }, include: [{ model: QuotationItem, as: 'items' }] });
    let settings = await BusinessSettings.findOne({ where: { userId: req.userId } });
    if (!settings) settings = {} as any;
    
    if (!qt) return res.status(404).json({ error: 'Quotation not found' });
    
    await generateExcelWorkbook(qt, settings, res, true);
  } catch (error: any) {
    console.error("Excel Generation Error:", error);
    res.status(500).json({ error: error.message });
  }
});

import { Op } from 'sequelize';

router.get('/report/sales/excel', async (req: Request, res: Response) => {
  try {
    const { fromDate, toDate } = req.query;
    
    const whereClause: any = { userId: req.userId };
    if (fromDate && toDate) {
      whereClause.invoiceDate = {
        [Op.between]: [new Date(fromDate as string), new Date(toDate as string)]
      };
    }

    const bills = await Bill.findAll({
      where: whereClause,
      order: [['invoiceDate', 'ASC']]
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sales Report');
    worksheet.properties.defaultRowHeight = 22;

    const setCellFont = (cell: ExcelJS.Cell, size=11, bold=false, color='000000') => {
      cell.font = { name: 'Segoe UI', size, bold, color: { argb: color } };
    };

    // Report Header
    worksheet.mergeCells('A1:G1');
    worksheet.getCell('A1').value = 'Sales Report';
    setCellFont(worksheet.getCell('A1'), 16, true, '4F46E5');
    worksheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };

    worksheet.mergeCells('A2:G2');
    if (fromDate && toDate) {
      worksheet.getCell('A2').value = `Period: ${new Date(fromDate as string).toLocaleDateString()} to ${new Date(toDate as string).toLocaleDateString()}`;
    } else {
      worksheet.getCell('A2').value = 'Period: All Time';
    }
    setCellFont(worksheet.getCell('A2'), 11, false, '4B5563');
    worksheet.getCell('A2').alignment = { horizontal: 'center', vertical: 'middle' };

    // Table Headers
    const headerRow = worksheet.getRow(4);
    headerRow.values = ['Date', 'Invoice No', 'Customer Name', 'Total Sales', 'Amount Paid', 'Balance Due', 'Status'];
    headerRow.eachCell(cell => {
      setCellFont(cell, 11, true, 'FFFFFF');
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '4F46E5' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    // Populate Data
    let currentRow = 5;
    for (const bill of bills) {
      const row = worksheet.getRow(currentRow);
      row.values = [
        new Date(bill.dataValues.invoiceDate).toLocaleDateString(),
        bill.dataValues.billNumber,
        bill.dataValues.customerSnapshot?.name || bill.dataValues.customerName || 'Customer',
        bill.dataValues.grandTotal || 0,
        bill.dataValues.amountPaid || 0,
        bill.dataValues.balanceDue || 0,
        bill.dataValues.paymentStatus || 'Unpaid'
      ];
      
      row.getCell(4).numFmt = '#,##0.00';
      row.getCell(5).numFmt = '#,##0.00';
      row.getCell(6).numFmt = '#,##0.00';
      
      row.getCell(1).alignment = { horizontal: 'center' };
      row.getCell(2).alignment = { horizontal: 'center' };
      row.getCell(7).alignment = { horizontal: 'center' };
      
      currentRow++;
    }

    // Adjust column widths
    worksheet.getColumn(1).width = 15;
    worksheet.getColumn(2).width = 15;
    worksheet.getColumn(3).width = 30;
    worksheet.getColumn(4).width = 15;
    worksheet.getColumn(5).width = 15;
    worksheet.getColumn(6).width = 15;
    worksheet.getColumn(7).width = 15;

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename=SalesReport.xlsx`,
    });
    
    await workbook.xlsx.write(res);
    res.end();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
