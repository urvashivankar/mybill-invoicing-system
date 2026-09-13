import { Router, Request, Response } from 'express';
import { Bill, BillItem } from '../models';
import { Op } from 'sequelize';

const router = Router();

router.get('/sales', async (req: Request, res: Response) => {
  try {
    const { fromDate, toDate } = req.query;
    
    const whereClause: any = { userId: req.userId };
    if (fromDate && toDate) {
      // Assuming fromDate and toDate are ISO strings like 2026-09-01T00:00:00.000Z
      whereClause.invoiceDate = {
        [Op.between]: [new Date(fromDate as string), new Date(toDate as string)]
      };
    }

    const bills = await Bill.findAll({
      where: whereClause,
      include: [{ model: BillItem, as: 'items' }],
      order: [['invoiceDate', 'ASC']]
    });

    let totalSales = 0;
    let totalTax = 0;
    let totalPaid = 0;
    let totalOutstanding = 0;
    let totalDiscount = 0;

    for (const bill of bills) {
      totalSales += bill.dataValues.grandTotal || 0;
      totalTax += bill.dataValues.taxAmount || 0;
      totalPaid += bill.dataValues.amountPaid || 0;
      totalOutstanding += (bill.dataValues.grandTotal || 0) - (bill.dataValues.amountPaid || 0);
      totalDiscount += bill.dataValues.discount || 0;
    }

    res.json({
      summary: {
        totalBills: bills.length,
        totalSales,
        totalTax,
        totalPaid,
        totalOutstanding,
        totalDiscount
      },
      bills
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
