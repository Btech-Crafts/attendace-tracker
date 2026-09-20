export function toDateOnly(value) {
  const date = new Date(value);
  return date.toISOString().slice(0, 10);
}

export const ACADEMIC_START_DATE = '2026-06-15';

export function isBeforeAcademicStart(dateOnly) {
  return dateOnly < ACADEMIC_START_DATE;
}

export function fromDateOnly(value) {
  return new Date(`${value}T00:00:00.000Z`);
}

export function dayOfWeekFromDateOnly(value) {
  return new Date(`${value}T00:00:00.000Z`).getUTCDay();
}

export function monthBounds(year, monthIndex) {
  const start = new Date(Date.UTC(year, monthIndex, 1));
  const end = new Date(Date.UTC(year, monthIndex + 1, 0));
  return {
    start: toDateOnly(start),
    end: toDateOnly(end)
  };
}

export function todayDateOnly() {
  return toDateOnly(new Date());
}
