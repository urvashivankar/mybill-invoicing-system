import { Request, Response } from 'express';
import { Bill, Customer, Item } from '../models';

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const totalBills = await Bill.count({ where: { userId: req.userId } });
    const totalCustomers = await Customer.count({ where: { userId: req.userId } });
    const totalItems = await Item.count({ where: { userId: req.userId } });
    
    const bills = await Bill.findAll({
      where: { userId: req.userId },
      attributes: ['grandTotal', 'amountPaid', 'paymentStatus']
    });

    const totalSales = bills.reduce((sum, bill) => sum + (bill.grandTotal || 0), 0);
    const totalOutstanding = bills.reduce((sum, bill) => sum + ((bill.grandTotal || 0) - (bill.amountPaid || 0)), 0);

    const recentBills = await Bill.findAll({
      where: { userId: req.userId },
      order: [['invoiceDate', 'DESC'], ['createdAt', 'DESC']],
      limit: 5,
      attributes: ['id', 'billNumber', 'customerSnapshot', 'invoiceDate', 'paymentStatus', 'grandTotal']
    });

    res.json({
      totalBills,
      totalCustomers,
      totalItems,
      totalSales,
      totalOutstanding,
      recentBills
    });
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

export default {
  getDashboardStats
};
