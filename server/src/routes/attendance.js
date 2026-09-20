import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { fromDateOnly, isBeforeAcademicStart, toDateOnly } from '../lib/date.js';
import { holidayNameForRecurringDate, isRecurringHoliday, nextHolidayFromDate } from '../lib/holidays.js';
import { 
  buildWorkingPeriodContext, 
  buildAttendanceSummary, 
  buildBreakdown, 
  buildDayMetrics, 
  buildSubjectSnapshots 
} from '../services/attendance.js';

const router = Router();

async function loadLogsForUser(userId) {
  return prisma.attendanceLog.findMany({
    where: { userId },
    orderBy: [
      { date: 'asc' },
      { periodNumber: 'asc' }
    ]
  });
}

async function ensureNotHoliday(dateOnly) {
  if (isBeforeAcademicStart(dateOnly)) {
    const error = new Error('College starts on June 15; attendance cannot be recorded before that date');
    error.status = 409;
    throw error;
  }

  const holiday = await prisma.holiday.findUnique({ where: { date: fromDateOnly(dateOnly) } });
  if (holiday || isRecurringHoliday(dateOnly)) {
    const error = new Error('Holiday dates are disabled');
    error.status = 409;
    throw error;
  }
}

router.get('/day', requireAuth, async (req, res) => {
  const dateOnly = req.query.date;
  if (!dateOnly) {
    return res.status(400).json({ message: 'Date is required' });
  }

  if (isBeforeAcademicStart(dateOnly)) {
    return res.json({
      date: dateOnly,
      isHoliday: true,
      isBeforeAcademicStart: true,
      holiday: { date: dateOnly, holidayName: 'College starts on June 15', isOfficial: true },
      periods: []
    });
  }

  const dayOfWeek = new Date(`${dateOnly}T12:00:00.000Z`).getUTCDay();
  const [schedule, logs, holiday] = await Promise.all([
    prisma.timetable.findMany({
      where: { userId: req.user.id, dayOfWeek },
      orderBy: { periodNumber: 'asc' }
    }),
    prisma.attendanceLog.findMany({
      where: { userId: req.user.id, date: fromDateOnly(dateOnly) },
      orderBy: { periodNumber: 'asc' }
    }),
    prisma.holiday.findUnique({ where: { date: fromDateOnly(dateOnly) } })
  ]);

  const isWeekendHoliday = isRecurringHoliday(dateOnly);

  return res.json({
    date: dateOnly,
    isHoliday: Boolean(holiday) || isWeekendHoliday,
    holiday: holiday
      ? { ...holiday, date: toDateOnly(holiday.date) }
      : isWeekendHoliday
        ? { date: dateOnly, holidayName: holidayNameForRecurringDate(dateOnly), isOfficial: true }
        : null,
    periods: (schedule || []).map((entry) => {
      const log = logs.find((item) => item.periodNumber === entry.periodNumber);
      return {
        periodNumber: entry.periodNumber,
        subjectName: entry.subjectName,
        attended: log ? log.attended : false
      };
    })
  });
});

router.put('/day', requireAuth, async (req, res, next) => {
  try {
    const { date, periods } = req.body;

    if (!date || !Array.isArray(periods)) {
      return res.status(400).json({ message: 'Date and periods are required' });
    }

    await ensureNotHoliday(date);

    const schedule = await prisma.timetable.findMany({
      where: { userId: req.user.id, dayOfWeek: new Date(`${date}T00:00:00.000Z`).getUTCDay() }
    });

    const scheduleMap = new Map(schedule.map((entry) => [entry.periodNumber, entry.subjectName]));
    const normalizedDate = fromDateOnly(date);

    const upserts = periods.map((period) =>
      prisma.attendanceLog.upsert({
        where: {
          userId_date_periodNumber: {
            userId: req.user.id,
            date: normalizedDate,
            periodNumber: period.periodNumber
          }
        },
        update: {
          subjectName: scheduleMap.get(period.periodNumber) || period.subjectName,
          attended: Boolean(period.attended)
        },
        create: {
          userId: req.user.id,
          date: normalizedDate,
          periodNumber: period.periodNumber,
          subjectName: scheduleMap.get(period.periodNumber) || period.subjectName,
          attended: Boolean(period.attended)
        }
      })
    );

    await prisma.$transaction(upserts);

    return res.json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

router.get('/summary', requireAuth, async (req, res) => {
  const dateOnly = toDateOnly(new Date());
  const [logs, timetable, holidays] = await Promise.all([
    loadLogsForUser(req.user.id),
    prisma.timetable.findMany({ where: { userId: req.user.id } }),
    prisma.holiday.findMany()
  ]);

  const workingContext = buildWorkingPeriodContext({ timetable, holidays, endDateOnly: dateOnly });
  const attendanceSummary = buildAttendanceSummary(logs);

  const metrics = buildDayMetrics({
    totalPeriods: workingContext.totalPeriods,
    attendedPeriods: attendanceSummary.attendedPeriods,
    targetPercentage: req.user.targetPercentage
  });

  return res.json({
    ...metrics,
    subjectSnapshots: buildSubjectSnapshots(workingContext, attendanceSummary),
    targetPercentage: req.user.targetPercentage
  });
});

router.get('/analytics', requireAuth, async (req, res) => {
  const dateOnly = toDateOnly(new Date());
  const [logs, timetable, holidays] = await Promise.all([
    loadLogsForUser(req.user.id),
    prisma.timetable.findMany({ where: { userId: req.user.id } }),
    prisma.holiday.findMany()
  ]);

  const workingContext = buildWorkingPeriodContext({ timetable, holidays, endDateOnly: dateOnly });
  const attendanceSummary = buildAttendanceSummary(logs);

  const metrics = buildDayMetrics({
    totalPeriods: workingContext.totalPeriods,
    attendedPeriods: attendanceSummary.attendedPeriods,
    targetPercentage: req.user.targetPercentage
  });
  
  const breakdown = buildBreakdown(workingContext, attendanceSummary);

  return res.json({
    summary: {
      totalPeriods: metrics.totalPeriods,
      attendedPeriods: metrics.attendedPeriods,
      percentage: metrics.percentage,
      targetPercentage: req.user.targetPercentage
    },
    breakdown
  });
});

router.get('/dashboard', requireAuth, async (req, res) => {
  const dateOnly = req.query.date || toDateOnly(new Date());
  const [logs, timetable, todaySchedule, todayHoliday, holidays] = await Promise.all([
    loadLogsForUser(req.user.id),
    prisma.timetable.findMany({ where: { userId: req.user.id } }),
    prisma.timetable.findMany({
      where: {
        userId: req.user.id,
        dayOfWeek: new Date(`${dateOnly}T00:00:00.000Z`).getUTCDay()
      },
      orderBy: { periodNumber: 'asc' }
    }),
    prisma.holiday.findUnique({ where: { date: fromDateOnly(dateOnly) } }),
    prisma.holiday.findMany({ orderBy: { date: 'asc' } })
  ]);

  const workingContext = buildWorkingPeriodContext({ timetable, holidays, endDateOnly: dateOnly });
  const attendanceSummary = buildAttendanceSummary(logs);

  const metrics = buildDayMetrics({
    totalPeriods: workingContext.totalPeriods,
    attendedPeriods: attendanceSummary.attendedPeriods,
    targetPercentage: req.user.targetPercentage
  });
  
  const subjectSnapshots = buildSubjectSnapshots(workingContext, attendanceSummary);
  
  const logMap = new Map(
    (await prisma.attendanceLog.findMany({
      where: { userId: req.user.id, date: fromDateOnly(dateOnly) }
    })).map((entry) => [entry.periodNumber, entry])
  );

  return res.json({
    date: dateOnly,
    isHoliday: Boolean(todayHoliday) || isRecurringHoliday(dateOnly),
    todaySchedule: todaySchedule.map((entry) => ({
      periodNumber: entry.periodNumber,
      subjectName: entry.subjectName,
      attended: Boolean(logMap.get(entry.periodNumber)?.attended)
    })),
    summary: {
      totalPeriods: metrics.totalPeriods,
      attendedPeriods: metrics.attendedPeriods,
      percentage: metrics.percentage,
      targetPercentage: req.user.targetPercentage
    },
    subjectSnapshots,
    bunkMeter: metrics.bunkMeter,
    nextHoliday: nextHolidayFromDate(dateOnly, holidays),
    holidays: holidays.map((holiday) => ({
      ...holiday,
      date: toDateOnly(holiday.date)
    }))
  });
});

export default router;