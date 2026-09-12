import { Router, Request, Response } from 'express';
import { Quotation, QuotationItem, Bill, BillItem, BusinessSettings } from '../models';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const quotations = await Quotation.findAll({ 
      include: [{ model: QuotationItem, as: 'items' }],
      order: [['quotationDate', 'DESC'], ['createdAt', 'DESC']]
    });
    res.json(quotations);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

const getNextQuotationNumber = async () => {
  const prefix = 'QT-';
  const quotations = await Quotation.findAll({ attributes: ['quotationNumber'] });
  let maxNum = 0;
  for (const q of quotations) {
    const qtNum = q.dataValues.quotationNumber;
    if (qtNum.startsWith(prefix)) {
      const numStr = qtNum.substring(prefix.length);
      const num = parseInt(numStr, 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  }
  return `${prefix}${(maxNum + 1).toString().padStart(4, '0')}`;
};

router.get('/next-number', async (req: Request, res: Response) => {
  try {
    const nextNumber = await getNextQuotationNumber();
    res.json({ nextNumber });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const qt = await Quotation.findByPk(req.params.id, {
      include: [{ model: QuotationItem, as: 'items' }]
    });
    if (!qt) return res.status(404).json({ error: 'Not found' });
    res.json(qt);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { items, ...qtData } = req.body;
    
    if (!qtData.quotationNumber) {
      qtData.quotationNumber = await getNextQuotationNumber();
    }

    const qt = await Quotation.create(qtData);
    
    if (items && items.length > 0) {
      const qtItems = items.map((i: any) => ({ ...i, quotationId: qt.dataValues.id }));
      await QuotationItem.bulkCreate(qtItems);
    }
    
    const createdQt = await Quotation.findByPk(qt.dataValues.id, {
      include: [{ model: QuotationItem, as: 'items' }]
    });
    
    res.json(createdQt);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const qt = await Quotation.findByPk(req.params.id);
    if (!qt) return res.status(404).json({ error: 'Not found' });
    
    const { items, ...qtData } = req.body;
    await qt.update(qtData);

    if (items) {
      await QuotationItem.destroy({ where: { quotationId: qt.dataValues.id } });
      const qtItems = items.map((i: any) => {
        delete i.id;
        return { ...i, quotationId: qt.dataValues.id };
      });
      await QuotationItem.bulkCreate(qtItems);
    }

    const updatedQt = await Quotation.findByPk(qt.dataValues.id, {
      include: [{ model: QuotationItem, as: 'items' }]
    });
    
    res.json(updatedQt);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const qt = await Quotation.findByPk(req.params.id);
    if (!qt) return res.status(404).json({ error: 'Not found' });
    
    await qt.destroy();
    res.json({ message: 'Deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Convert Quotation to Bill
router.post('/:id/convert', async (req: Request, res: Response) => {
  try {
    const qt = await Quotation.findByPk(req.params.id, {
      include: [{ model: QuotationItem, as: 'items' }]
    });
    if (!qt) return res.status(404).json({ error: 'Not found' });

    // Generate new Bill Number
    const settings = await BusinessSettings.findOne();
    const prefix = settings?.dataValues?.invoicePrefix || 'INV-';
    const bills = await Bill.findAll({ attributes: ['billNumber'] });
    let maxNum = 0;
    for (const b of bills) {
      const billNum = b.dataValues.billNumber;
      if (billNum.startsWith(prefix)) {
        const numStr = billNum.substring(prefix.length);
        const num = parseInt(numStr, 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    }
    const newBillNumber = `${prefix}${(maxNum + 1).toString().padStart(4, '0')}`;

    // Create the Bill
    const billData = {
      billNumber: newBillNumber,
      invoiceDate: new Date(),
      customerId: qt.dataValues.customerId,
      customerSnapshot: qt.dataValues.customerSnapshot,
      subtotal: qt.dataValues.subtotal,
      taxAmount: qt.dataValues.taxAmount,
      discount: qt.dataValues.discount,
      grandTotal: qt.dataValues.grandTotal,
      amountInWords: qt.dataValues.amountInWords,
      notes: qt.dataValues.notes,
      templateType: qt.dataValues.templateType,
      bankDetailsSnapshot: qt.dataValues.bankDetailsSnapshot,
      amountPaid: 0,
      balanceDue: qt.dataValues.grandTotal,
      paymentStatus: qt.dataValues.grandTotal > 0 ? 'Unpaid' : 'Paid'
    };

    const newBill = await Bill.create(billData);

    // Create Bill Items
    const items = qt.dataValues.items || [];
    if (items.length > 0) {
      const billItems = items.map((i: any) => ({
        billId: newBill.dataValues.id,
        itemId: i.itemId,
        itemName: i.itemName,
        description: i.description,
        quantity: i.quantity,
        unit: i.unit,
        rate: i.rate,
        gst: i.gst,
        amount: i.amount
      }));
      await BillItem.bulkCreate(billItems);
    }

    // Mark quotation as converted
    await qt.update({
      status: 'Converted',
      convertedToBillId: newBill.dataValues.id
    });

    const createdBill = await Bill.findByPk(newBill.dataValues.id, {
      include: [{ model: BillItem, as: 'items' }]
    });

    res.json(createdBill);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
