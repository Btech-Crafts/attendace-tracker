import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { fromDateOnly, toDateOnly } from '../lib/date.js';
import { combineHolidayRules, holidayNameForRecurringDate, isRecurringHoliday } from '../lib/holidays.js';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  const holidays = await prisma.holiday.findMany({
    orderBy: { date: 'asc' }
  });

  const specificHolidays = combineHolidayRules(holidays);

  return res.json({
    holidays: specificHolidays,
    recurring: ['Sunday', 'Saturday']
  });
});

router.post('/', requireAuth, async (req, res) => {
  const { date, holidayName } = req.body;

  if (!date || !holidayName) {
    return res.status(400).json({ message: 'Date and holiday name are required' });
  }

  const holiday = await prisma.holiday.upsert({
    where: { date: fromDateOnly(date) },
    update: {
      holidayName,
      isOfficial: false,
      createdByUserId: req.user.id
    },
    create: {
      date: fromDateOnly(date),
      holidayName,
      isOfficial: false,
      createdByUserId: req.user.id
    }
  });

  return res.status(201).json({
    holiday: {
      ...holiday,
      date: toDateOnly(holiday.date)
    }
  });
});

export function resolveHolidayForDate(dateOnly, holidayRecord) {
  if (holidayRecord) {
    return {
      isHoliday: true,
      holidayName: holidayRecord.holidayName,
      isRecurring: false,
      holiday: {
        ...holidayRecord,
        date: toDateOnly(holidayRecord.date)
      }
    };
  }

  if (isRecurringHoliday(dateOnly)) {
    return {
      isHoliday: true,
      holidayName: holidayNameForRecurringDate(dateOnly),
      isRecurring: true,
      holiday: null
    };
  }

  return {
    isHoliday: false,
    holidayName: null,
    isRecurring: false,
    holiday: null
  };
}

export default router;
