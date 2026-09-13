import { Router, Request, Response } from 'express';
import { Customer } from '../models';
import { Op } from 'sequelize';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const search = (req.query.search as string) || '';
    const offset = (page - 1) * limit;

    let whereClause: any = { userId: req.userId };
    if (search) {
      whereClause = {
        ...whereClause,
        [Op.or]: [
          { name: { [Op.like]: `%${search}%` } },
          { phone: { [Op.like]: `%${search}%` } }
        ]
      };
    }

    const { count, rows } = await Customer.findAndCountAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
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

router.post('/', async (req: Request, res: Response) => {
  try {
    const data = { ...req.body, userId: req.userId };
    const customer = await Customer.create(data);
    res.json(customer);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const customer = await Customer.findOne({ where: { id: req.params.id, userId: req.userId } });
    if (!customer) return res.status(404).json({ error: 'Not found' });
    
    await customer.update(req.body);
    res.json(customer);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const customer = await Customer.findOne({ where: { id: req.params.id, userId: req.userId } });
    if (!customer) return res.status(404).json({ error: 'Not found' });
    
    await customer.destroy();
    res.json({ message: 'Deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/bulk-delete', async (req: Request, res: Response) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) return res.status(400).json({ error: 'Invalid ids' });
    
    await Customer.destroy({ where: { id: ids, userId: req.userId } });
    res.json({ message: `${ids.length} customers deleted successfully` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
