import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { dayOfWeekFromDateOnly } from '../lib/date.js';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  const date = req.query.date;
  const dayOfWeek = req.query.dayOfWeek ? Number(req.query.dayOfWeek) : date ? dayOfWeekFromDateOnly(date) : new Date().getDay();

  const entries = await prisma.timetable.findMany({
    where: {
      userId: req.user.id,
      dayOfWeek
    },
    orderBy: { periodNumber: 'asc' }
  });

  return res.json({ entries });
});

export default router;
