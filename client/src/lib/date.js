export function toLocalDateInput(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const ACADEMIC_START_DATE = '2026-06-15';

export function isBeforeAcademicStart(dateOnly) {
  return dateOnly < ACADEMIC_START_DATE;
}
