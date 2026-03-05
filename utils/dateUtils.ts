/**
 * Parse a date string in YYYY-MM-DD format to a Date object in local timezone
 * Avoids timezone issues with MySQL DATE fields
 */
export const parseLocalDate = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

/**
 * Get a local date at midnight (00:00:00)
 */
export const getLocalDateAtMidnight = (date: Date = new Date()): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Check if a date string matches a specific year and month
 */
export const isDateInMonth = (dateString: string, month: number, year: number): boolean => {
  const date = parseLocalDate(dateString);
  return date.getMonth() === month && date.getFullYear() === year;
};

/**
 * Get the date as a string in YYYY-MM-DD format
 */
export const formatDateToString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
