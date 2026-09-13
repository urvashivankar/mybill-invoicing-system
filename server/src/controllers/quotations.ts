import { Router, Request, Response } from 'express';
import { Quotation, QuotationItem, Bill, BillItem, BusinessSettings } from '../models';
import { Op } from 'sequelize';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const search = (req.query.search as string) || '';
    const status = (req.query.status as string) || '';
    const offset = (page - 1) * limit;

    let whereClause: any = { userId: req.userId };
    if (search) {
      whereClause = {
        ...whereClause,
        [Op.or]: [
          { quotationNumber: { [Op.like]: `%${search}%` } },
          { customerSnapshot: { [Op.like]: `%${search}%` } }
        ]
      };
    }
    if (status) {
      whereClause.status = status;
    }

    const { count, rows } = await Quotation.findAndCountAll({
      where: whereClause,
      include: [{ model: QuotationItem, as: 'items' }],
      order: [['quotationDate', 'DESC'], ['createdAt', 'DESC']],
      limit: limit === -1 ? undefined : limit,
      offset: limit === -1 ? undefined : offset
    });

    if (req.query.page) {
      res.json({ total: count, page, limit, totalPages: limit === -1 ? 1 : Math.ceil(count / limit), data: rows });
    } else {
      res.json(rows);
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

const getNextQuotationNumber = async (userId: string) => {
  const prefix = 'QT-';
  const quotations = await Quotation.findAll({ attributes: ['quotationNumber'], where: { userId } });
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
    const nextNumber = await getNextQuotationNumber(req.userId as string);
    res.json({ nextNumber });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const qt = await Quotation.findOne({
      where: { id: req.params.id, userId: req.userId },
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
    qtData.userId = req.userId;
    
    if (!qtData.quotationNumber) {
      qtData.quotationNumber = await getNextQuotationNumber(req.userId as string);
    }

    const qt = await Quotation.create(qtData);
    
    if (items && items.length > 0) {
      const qtItems = items.map((i: any) => ({ ...i, quotationId: qt.dataValues.id }));
      await QuotationItem.bulkCreate(qtItems);
    }
    
    const createdQt = await Quotation.findOne({
      where: { id: qt.dataValues.id, userId: req.userId },
      include: [{ model: QuotationItem, as: 'items' }]
    });
    
    res.json(createdQt);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const qt = await Quotation.findOne({ where: { id: req.params.id, userId: req.userId } });
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

    const updatedQt = await Quotation.findOne({
      where: { id: qt.dataValues.id, userId: req.userId },
      include: [{ model: QuotationItem, as: 'items' }]
    });
    
    res.json(updatedQt);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const qt = await Quotation.findOne({ where: { id: req.params.id, userId: req.userId } });
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
    const qt = await Quotation.findOne({
      where: { id: req.params.id, userId: req.userId },
      include: [{ model: QuotationItem, as: 'items' }]
    });
    if (!qt) return res.status(404).json({ error: 'Not found' });

    // Generate new Bill Number
    const settings = await BusinessSettings.findOne({ where: { userId: req.userId } });
    const prefix = settings?.dataValues?.invoicePrefix || 'INV-';
    const bills = await Bill.findAll({ attributes: ['billNumber'], where: { userId: req.userId } });
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
      userId: req.userId,
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

    const createdBill = await Bill.findOne({
      where: { id: newBill.dataValues.id, userId: req.userId },
      include: [{ model: BillItem, as: 'items' }]
    });

    res.json(createdBill);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
