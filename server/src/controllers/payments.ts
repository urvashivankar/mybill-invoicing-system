import { Router, Request, Response } from 'express';
import { Bill, Payment } from '../models';

const router = Router();

// Get payments for a specific bill
router.get('/:billId', async (req: Request, res: Response) => {
  try {
    const bill = await Bill.findOne({ where: { id: req.params.billId, userId: req.userId } });
    if (!bill) {
      return res.status(404).json({ error: 'Bill not found' });
    }

    const payments = await Payment.findAll({
      where: { billId: req.params.billId, userId: req.userId },
      order: [['paymentDate', 'ASC']]
    });
    res.json(payments);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Record a new payment
router.post('/', async (req: Request, res: Response) => {
  try {
    const { billId, amount, paymentDate, notes } = req.body;
    
    if (!billId || amount === undefined) {
      return res.status(400).json({ error: 'billId and amount are required' });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: 'Payment amount must be greater than 0' });
    }

    const bill = await Bill.findOne({ where: { id: billId, userId: req.userId } });
    if (!bill) {
      return res.status(404).json({ error: 'Bill not found' });
    }

    const currentAmountPaid = bill.dataValues.amountPaid || 0;
    const grandTotal = bill.dataValues.grandTotal || 0;

    // Validate that payment does not exceed grand total
    if (currentAmountPaid + amount > grandTotal + 0.01) { // 0.01 for floating point safety
      return res.status(400).json({ error: 'Payment amount exceeds the balance due' });
    }

    // Create payment record
    const payment = await Payment.create({
      userId: req.userId,
      billId,
      amount,
      paymentDate: paymentDate || new Date(),
      notes
    });

    // Update bill
    const newAmountPaid = currentAmountPaid + amount;
    const newBalanceDue = grandTotal - newAmountPaid;
    
    let newPaymentStatus = 'Unpaid';
    if (newBalanceDue <= 0.01) {
      newPaymentStatus = 'Paid';
    } else if (newAmountPaid > 0) {
      newPaymentStatus = 'Partially Paid';
    }

    await bill.update({
      amountPaid: newAmountPaid,
      balanceDue: Math.max(0, newBalanceDue),
      paymentStatus: newPaymentStatus
    });

    // Return the updated bill to sync frontend
    const updatedBill = await Bill.findOne({ where: { id: billId, userId: req.userId } });

    res.json({ payment, bill: updatedBill });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
