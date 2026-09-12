import { Router, Request, Response } from 'express';
import { Bill, BillItem, BusinessSettings } from '../models';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const bills = await Bill.findAll({ 
      include: [{ model: BillItem, as: 'items' }],
      order: [['invoiceDate', 'DESC'], ['createdAt', 'DESC']]
    });
    res.json(bills);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

const getNextBillNumber = async () => {
  const settings = await BusinessSettings.findOne();
  const prefix = settings?.dataValues?.invoicePrefix || 'INV-';
  
  const bills = await Bill.findAll({ attributes: ['billNumber'] });
  let maxNum = 0;
  for (const b of bills) {
    const billNum = b.dataValues.billNumber;
    if (billNum.startsWith(prefix)) {
      const numStr = billNum.substring(prefix.length);
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
    const nextBillNumber = await getNextBillNumber();
    res.json({ nextBillNumber });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const bill = await Bill.findByPk(req.params.id, {
      include: [{ model: BillItem, as: 'items' }]
    });
    if (!bill) return res.status(404).json({ error: 'Not found' });
    res.json(bill);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { items, ...billData } = req.body;
    
    // Auto-generate Bill Number if not provided
    if (!billData.billNumber) {
      billData.billNumber = await getNextBillNumber();
    }

    // Initialize payment fields
    if (billData.amountPaid === undefined) billData.amountPaid = 0;
    billData.balanceDue = (billData.grandTotal || 0) - billData.amountPaid;
    if (billData.balanceDue <= 0 && billData.grandTotal > 0) {
      billData.paymentStatus = 'Paid';
    } else if (billData.amountPaid > 0) {
      billData.paymentStatus = 'Partially Paid';
    } else {
      billData.paymentStatus = 'Unpaid';
    }

    const bill = await Bill.create(billData);
    
    if (items && items.length > 0) {
      const billItems = items.map((i: any) => ({ ...i, billId: bill.dataValues.id }));
      await BillItem.bulkCreate(billItems);
    }
    
    const createdBill = await Bill.findByPk(bill.dataValues.id, {
      include: [{ model: BillItem, as: 'items' }]
    });
    
    res.json(createdBill);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const bill = await Bill.findByPk(req.params.id);
    if (!bill) return res.status(404).json({ error: 'Not found' });
    
    const { items, ...billData } = req.body;
    
    // Re-calculate payment fields if grandTotal changes
    const amountPaid = bill.dataValues.amountPaid || 0;
    const newGrandTotal = billData.grandTotal !== undefined ? billData.grandTotal : bill.dataValues.grandTotal;
    billData.balanceDue = newGrandTotal - amountPaid;
    if (billData.balanceDue <= 0 && newGrandTotal > 0) {
      billData.paymentStatus = 'Paid';
    } else if (amountPaid > 0) {
      billData.paymentStatus = 'Partially Paid';
    } else {
      billData.paymentStatus = 'Unpaid';
    }

    await bill.update(billData);

    if (items) {
      // Very simple replace-all logic for items on update
      await BillItem.destroy({ where: { billId: bill.dataValues.id } });
      const billItems = items.map((i: any) => {
        delete i.id; // ensure new ID is generated
        return { ...i, billId: bill.dataValues.id };
      });
      await BillItem.bulkCreate(billItems);
    }

    const updatedBill = await Bill.findByPk(bill.dataValues.id, {
      include: [{ model: BillItem, as: 'items' }]
    });
    
    res.json(updatedBill);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const bill = await Bill.findByPk(req.params.id);
    if (!bill) return res.status(404).json({ error: 'Not found' });
    
    await bill.destroy();
    res.json({ message: 'Deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/bulk-delete', async (req: Request, res: Response) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) return res.status(400).json({ error: 'Invalid ids' });
    
    await Bill.destroy({ where: { id: ids } });
    res.json({ message: `${ids.length} bills deleted successfully` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
