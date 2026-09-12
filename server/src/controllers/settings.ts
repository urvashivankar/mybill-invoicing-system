import { Router, Request, Response } from 'express';
import { BusinessSettings } from '../models';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const settings = await BusinessSettings.findOne();
    res.json(settings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/', async (req: Request, res: Response) => {
  try {
    const settings = await BusinessSettings.findOne();
    if (settings) {
      await settings.update(req.body);
      res.json(settings);
    } else {
      res.status(404).json({ error: 'Settings not found' });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
