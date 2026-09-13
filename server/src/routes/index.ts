import { Router } from 'express';
import { signup, login } from '../controllers/auth';
import { authenticate } from '../middleware/auth';
import settingsRouter from '../controllers/settings';
import customersRouter from '../controllers/customers';
import itemsRouter from '../controllers/items';
import billsRouter from '../controllers/bills';
import importRouter from '../controllers/import';
import exportRouter from '../controllers/export';
import paymentsRouter from '../controllers/payments';
import quotationsRouter from '../controllers/quotations';
import reportsRouter from '../controllers/reports';
import dashboardController from '../controllers/dashboard';

const router = Router();

// Public auth routes
router.post('/auth/signup', signup);
router.post('/auth/login', login);

// Protected routes (apply auth middleware)
router.use(authenticate);

router.get('/dashboard/stats', dashboardController.getDashboardStats);
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
