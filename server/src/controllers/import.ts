import { Router, Request, Response } from 'express';
import multer from 'multer';
import * as XLSX from 'xlsx';
import Tesseract from 'tesseract.js';
// @ts-ignore
import pdfParse from 'pdf-parse';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Endpoint to import items
// Intelligent PDF/OCR text extraction
function attemptTextExtraction(text: string) {
  const lines = text.split('\n');
  const results = [];
  
  for (const line of lines) {
    let trimmed = line.trim();
    if (!trimmed) continue;
    
    // Ignore common headers/footers
    const lower = trimmed.toLowerCase();
    if (lower.includes('annexure') || lower.includes('price list') || lower.includes('sr. no.') || lower.includes('description') || lower.includes('bank details') || lower.includes('invoice')) {
      continue;
    }

    // Pattern: [SrNo] [ItemName...] [Qty/Unit...] [Rate]
    // SrNo could be missing or attached to text: "1Split AC" or "1 Split AC"
    // Rate is at the end.
    
    // 1. Strict match: [SrNo] [Name] [Qty Unit] [Rate]
    const strictMatch = trimmed.match(/^(\d+)\s+(.+?)\s+([\d\.\,\s]+(?:[a-zA-Z]+)?)\s+([\d\.\,]+)$/);
    if (strictMatch) {
      const name = strictMatch[2].trim();
      const qtyUnitRaw = strictMatch[3].trim();
      let qty = 1;
      let unit = '';
      
      const qtyMatch = qtyUnitRaw.match(/^([\d\.]+)\s*(.*)$/);
      if (qtyMatch) {
        qty = parseFloat(qtyMatch[1]) || 1;
        unit = qtyMatch[2].trim();
      }
      
      const rateStr = strictMatch[4].replace(/,/g, '');
      const rate = parseFloat(rateStr);
      
      results.push({
        name: name,
        unit: unit,
        defaultQty: qty,
        rate: isNaN(rate) ? null : rate,
        srNo: strictMatch[1]
      });
      continue;
    }

    // 2. Ultra Loose: Any line that has some text and some numbers anywhere
    const textPart = trimmed.replace(/[\d\.\,]/g, '').trim();
    if (textPart.length > 5) {
       const numbers = trimmed.match(/[\d\.\,]+/g)?.map(n => parseFloat(n.replace(/,/g, ''))).filter(n => !isNaN(n)) || [];
       if (numbers.length > 0) {
         let srNo = '';
         let qty = 1;
         let rate = numbers[numbers.length - 1];

         // If the line started with a number, that's the Sr No
         if (trimmed.match(/^\d/)) {
           srNo = numbers[0].toString();
           if (numbers.length >= 3) {
             qty = numbers[1];
           } else if (numbers.length === 2 && rate.toString().startsWith('1') && rate > 100) {
             qty = 1;
             rate = parseFloat(rate.toString().substring(1));
           }
         } else {
           // Line didn't start with number. This means format is usually: [Name] [SrNo] [Qty/Rate]
           if (numbers.length >= 2) {
             srNo = numbers[0].toString(); // First number is SrNo
             
             if (numbers.length >= 3) {
               qty = numbers[1]; // Middle number is Qty
               rate = numbers[2];
             } else {
               // Only 2 numbers: SrNo and a Merged Qty+Rate (e.g. [2, 1700])
               const combined = numbers[1];
               if (combined.toString().startsWith('1') && combined > 100) {
                 qty = 1;
                 rate = parseFloat(combined.toString().substring(1));
               } else {
                 rate = combined;
               }
             }
           } else if (numbers.length === 1) {
             // Only 1 number, assume it's the rate
             const combined = numbers[0];
             if (combined.toString().startsWith('1') && combined > 1000) {
                 qty = 1;
                 rate = parseFloat(combined.toString().substring(1));
             } else {
                 rate = combined;
             }
           }
         }

         // Clean up item name by removing trailing numbers that were caught as text
         let finalName = textPart.replace(/[\[\]\|\_\-\™\;]/g, '').replace(/\s+/g, ' ').trim();
         if (finalName.endsWith(' 1')) finalName = finalName.slice(0, -2);
         if (finalName.startsWith('1 ')) finalName = finalName.slice(2);
         
         // Intelligent Unit Extraction
         let unit = '';
         const nameLower = finalName.toLowerCase();
         if (nameLower.includes('feet')) {
            unit = 'Feet';
            finalName = finalName.replace(/feet/i, '').trim();
         } else if (nameLower.includes('mtr') || nameLower.includes('meter')) {
            unit = 'Meter';
         } else if (nameLower.includes('service') || nameLower.includes('repair') || nameLower.includes('install') || nameLower.includes('charge') || nameLower.includes('testing')) {
            unit = 'Service';
         } else if (nameLower.includes('visit')) {
            unit = 'Visit';
         } else if (nameLower.includes('job')) {
            unit = 'Job';
         }

         results.push({
           name: finalName,
           unit: unit,
           defaultQty: qty,
           rate: rate,
           srNo: srNo
         });
         continue;
       }
    }
  }
  
  if (results.length === 0) {
    return [{ error: "Could not reliably extract the table. Please review the file or upload a clearer image/PDF." }];
  }
  
  return results;
}

function processExcelData(json: any[]) {
  const results = [];
  for (const row of json) {
    // Find keys ignoring case and spaces
    const keys = Object.keys(row);
    let nameKey = keys.find(k => k.toLowerCase().includes('name') || k.toLowerCase().includes('description') || k.toLowerCase().includes('item') || k.toLowerCase().includes('particular'));
    let rateKey = keys.find(k => k.toLowerCase().includes('rate') || k.toLowerCase().includes('price') || k.toLowerCase().includes('amount'));
    let qtyKey = keys.find(k => k.toLowerCase().includes('qty') || k.toLowerCase().includes('quantity'));
    let unitKey = keys.find(k => k.toLowerCase().includes('unit'));
    let codeKey = keys.find(k => k.toLowerCase().includes('code') || k.toLowerCase() === 'sr. no.' || k.toLowerCase() === 'sr no' || k.toLowerCase() === 'sn');

    if (!nameKey) continue; // Skip rows without name

    const name = String(row[nameKey] || '').trim();
    if (!name || name.toLowerCase().includes('description') || name.toLowerCase().includes('sr. no.')) continue;

    const rateStr = String(row[rateKey!] || '').replace(/,/g, '');
    const rate = parseFloat(rateStr);
    
    results.push({
      name: name,
      unit: unitKey ? String(row[unitKey] || '') : '',
      defaultQty: qtyKey ? (parseFloat(String(row[qtyKey])) || 1) : 1,
      rate: isNaN(rate) ? null : rate,
      itemCode: codeKey ? String(row[codeKey] || '') : ''
    });
  }
  return results;
}

// Endpoint to import items
router.post('/items', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const ext = req.file.originalname.split('.').pop()?.toLowerCase();
    let extractedData: any[] = [];

    if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet);
      extractedData = processExcelData(json);
    } 
    else if (ext === 'pdf') {
      const data = await pdfParse(req.file.buffer);
      extractedData = attemptTextExtraction(data.text);
    } 
    else if (ext === 'png' || ext === 'jpg' || ext === 'jpeg' || ext === 'webp') {
      return res.status(400).json({ error: "Image OCR is reading the table grid lines as random letters (like 'TFeet') and mangling the numbers. Please upload your original DIGITAL PDF file which extracts perfectly!" });
    } 
    else {
      return res.status(400).json({ error: 'Unsupported file format' });
    }

    if (extractedData.length > 0 && extractedData[0].error) {
      return res.status(400).json(extractedData[0]);
    }

    res.json(extractedData);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to import an entire bill
router.post('/bill', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const ext = req.file.originalname.split('.').pop()?.toLowerCase();
    let extractedData: any[] = [];

    if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      extractedData = XLSX.utils.sheet_to_json(sheet);
    } else {
      const text = ext === 'pdf' ? (await pdfParse(req.file.buffer)).text : (await Tesseract.recognize(req.file.buffer, 'eng')).data.text;
      const parsedItems = attemptTextExtraction(text);
      
      if (parsedItems.length > 0 && (parsedItems[0] as any).error) {
        return res.status(400).json(parsedItems[0]);
      }
      
      // Remap for bill preview
      extractedData = parsedItems.map((item: any) => ({
        "Customer Name": "Extracted Customer (Review Needed)",
        "Item Name": item.name,
        "Rate": item.rate,
        "Qty": item.defaultQty,
        "Unit": item.unit
      }));
    }

    res.json(extractedData);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
