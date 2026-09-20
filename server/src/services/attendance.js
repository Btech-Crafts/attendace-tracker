import { ACADEMIC_START_DATE, toDateOnly } from '../lib/date.js';

export function buildWorkingPeriodContext({ timetable, holidays, endDateOnly, startDateOnly = ACADEMIC_START_DATE }) {
  const holidaySet = new Set((holidays || []).map((holiday) => toDateOnly(holiday.date)));
  const subjectTotals = new Map();
  const periodTotals = new Map();
  let totalPeriods = 0;

  const cursor = new Date(`${startDateOnly}T00:00:00.000Z`);
  const end = new Date(`${endDateOnly}T00:00:00.000Z`);

  while (cursor <= end) {
    const dateOnly = toDateOnly(cursor);
    const dayOfWeek = cursor.getUTCDay();

    if (dayOfWeek >= 1 && dayOfWeek <= 5 && !holidaySet.has(dateOnly)) {
      const dayEntries = (timetable || []).filter((entry) => entry.dayOfWeek === dayOfWeek);
      totalPeriods += dayEntries.length;

      for (const entry of dayEntries) {
        const periodKey = `${entry.subjectName}__${entry.periodNumber}`;
        const subjectBucket = subjectTotals.get(entry.subjectName) || { subjectName: entry.subjectName, total: 0 };
        const periodBucket = periodTotals.get(periodKey) || {
          subjectName: entry.subjectName,
          periodNumber: entry.periodNumber,
          total: 0
        };

        subjectBucket.total += 1;
        periodBucket.total += 1;

        subjectTotals.set(entry.subjectName, subjectBucket);
        periodTotals.set(periodKey, periodBucket);
      }
    }

    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return {
    totalPeriods,
    subjectTotals: Array.from(subjectTotals.values()),
    periodTotals: Array.from(periodTotals.values())
  };
}

export function buildAttendanceSummary(logs) {
  const subjectTotals = new Map();
  const periodTotals = new Map();
  const attendedPeriods = (logs || []).filter((entry) => entry.attended).length;

  for (const entry of (logs || [])) {
    const subjectBucket = subjectTotals.get(entry.subjectName) || { subjectName: entry.subjectName, attended: 0 };
    const periodKey = `${entry.subjectName}__${entry.periodNumber}`;
    const periodBucket = periodTotals.get(periodKey) || {
      subjectName: entry.subjectName,
      periodNumber: entry.periodNumber,
      attended: 0
    };

    if (entry.attended) {
      subjectBucket.attended += 1;
      periodBucket.attended += 1;
    }

    subjectTotals.set(entry.subjectName, subjectBucket);
    periodTotals.set(periodKey, periodBucket);
  }

  return {
    attendedPeriods,
    subjectTotals: Array.from(subjectTotals.values()),
    periodTotals: Array.from(periodTotals.values())
  };
}

export function buildDayMetrics({ totalPeriods, attendedPeriods, targetPercentage }) {
  const percentage = totalPeriods === 0 ? 0 : (attendedPeriods / totalPeriods) * 100;
  const target = targetPercentage / 100;
  const ratio = totalPeriods === 0 ? 0 : attendedPeriods / totalPeriods;

  let bunkMeter;
  if (totalPeriods === 0) {
    bunkMeter = {
      mode: 'safe-skips',
      value: 0,
      message: 'Mark a few periods to unlock bunk guidance.'
    };
  } else if (ratio >= target) {
    const safeSkips = Math.max(0, Math.floor(attendedPeriods / target - totalPeriods));
    bunkMeter = {
      mode: 'safe-skips',
      value: safeSkips,
      message: `You can safely skip ${safeSkips} upcoming period${safeSkips === 1 ? '' : 's'} and stay at or above ${targetPercentage}%.`
    };
  } else {
    const requiredAttends = Math.ceil((target * totalPeriods - attendedPeriods) / (1 - target));
    bunkMeter = {
      mode: 'must-attend',
      value: requiredAttends,
      message: `Attend the next ${requiredAttends} consecutive period${requiredAttends === 1 ? '' : 's'} to recover ${targetPercentage}% attendance.`
    };
  }

  return {
    totalPeriods,
    attendedPeriods,
    percentage,
    bunkMeter
  };
}

export function buildSubjectSnapshots(workingContext, attendanceSummary) {
  const lookup = new Map();

  const workingTotals = (workingContext && workingContext.subjectTotals) ? workingContext.subjectTotals : [];
  const summaryTotals = (attendanceSummary && attendanceSummary.subjectTotals) ? attendanceSummary.subjectTotals : [];

  for (const entry of workingTotals) {
    lookup.set(entry.subjectName, {
      subjectName: entry.subjectName,
      attended: 0,
      total: entry.total
    });
  }

  for (const entry of summaryTotals) {
    const bucket = lookup.get(entry.subjectName) || {
      subjectName: entry.subjectName,
      attended: 0,
      total: 0
    };
    bucket.attended = entry.attended;
    if (bucket.total === 0) {
      bucket.total = entry.attended;
    }
    lookup.set(entry.subjectName, bucket);
  }

  return Array.from(lookup.values())
    .map((item) => ({
      ...item,
      percentage: item.total === 0 ? 0 : (item.attended / item.total) * 100
    }))
    .sort((left, right) => left.subjectName.localeCompare(right.subjectName));
}

export function buildBreakdown(workingContext, attendanceSummary) {
  const grouped = new Map();
  
  const workingPeriods = (workingContext && workingContext.periodTotals) ? workingContext.periodTotals : [];
  const summaryPeriods = (attendanceSummary && attendanceSummary.periodTotals) ? attendanceSummary.periodTotals : [];

  const lookup = new Map(summaryPeriods.map((entry) => [`${entry.subjectName}__${entry.periodNumber}`, entry.attended]));

  for (const entry of workingPeriods) {
    const key = `${entry.subjectName}__${entry.periodNumber}`;
    grouped.set(key, {
      subjectName: entry.subjectName,
      periodNumber: entry.periodNumber,
      attended: lookup.get(key) || 0,
      total: entry.total
    });
  }

  return Array.from(grouped.values())
    .map((item) => ({
      ...item,
      percentage: item.total === 0 ? 0 : (item.attended / item.total) * 100
    }))
    .sort((left, right) => {
      if (left.subjectName === right.subjectName) {
        return left.periodNumber - right.periodNumber;
      }
      return left.subjectName.localeCompare(right.subjectName);
    });
}