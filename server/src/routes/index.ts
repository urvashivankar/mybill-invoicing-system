import { Router } from 'express';
import settingsRouter from '../controllers/settings';
import customersRouter from '../controllers/customers';
import itemsRouter from '../controllers/items';
import billsRouter from '../controllers/bills';
import importRouter from '../controllers/import';
import exportRouter from '../controllers/export';
import paymentsRouter from '../controllers/payments';
import quotationsRouter from '../controllers/quotations';
import reportsRouter from '../controllers/reports';

const router = Router();

router.use('/settings', settingsRouter);
router.use('/customers', customersRouter);
router.use('/items', itemsRouter);
router.use('/bills', billsRouter);
router.use('/import', importRouter);
router.use('/export', exportRouter);
router.use('/payments', paymentsRouter);
router.use('/quotations', quotationsRouter);
router.use('/reports', reportsRouter);

export default router;
