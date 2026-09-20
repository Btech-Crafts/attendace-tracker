import { fromDateOnly, toDateOnly } from './date.js';

export function isRecurringHoliday(dateOnly) {
  const day = new Date(`${dateOnly}T00:00:00.000Z`).getUTCDay();
  return day === 0 || day === 6;
}

export function isWeekend(dateOnly) {
  return isRecurringHoliday(dateOnly);
}

export function holidayRecordToDateKey(holiday) {
  return {
    ...holiday,
    date: toDateOnly(holiday.date)
  };
}

export function combineHolidayRules(holidays) {
  return holidays.map(holidayRecordToDateKey);
}

export function holidayNameForRecurringDate(dateOnly) {
  const day = new Date(`${dateOnly}T00:00:00.000Z`).getUTCDay();
  if (day === 6) return 'Saturday';
  if (day === 0) return 'Sunday';
  return null;
}

export function nextHolidayFromDate(startDateOnly, specificHolidays) {
  const specificSet = new Map(
    specificHolidays.map((holiday) => [toDateOnly(holiday.date), holiday.holidayName])
  );

  const cursor = new Date(`${startDateOnly}T00:00:00.000Z`);
  cursor.setUTCDate(cursor.getUTCDate() + 1);

  for (let index = 0; index < 800; index += 1) {
    const dateOnly = toDateOnly(cursor);
    if (specificSet.has(dateOnly)) {
      return {
        date: dateOnly,
        holidayName: specificSet.get(dateOnly),
        isOfficial: true,
        isRecurring: false
      };
    }

    if (isWeekend(dateOnly)) {
      return {
        date: dateOnly,
        holidayName: holidayNameForRecurringDate(dateOnly),
        isOfficial: true,
        isRecurring: true
      };
    }

    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return null;
}
