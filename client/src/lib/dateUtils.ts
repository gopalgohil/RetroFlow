/**
 * Formats a date string (YYYY-MM-DD or ISO) to "dd/mm/yy" format (e.g., 10/09/26)
 */
export function formatDateDMY(dateStr?: string | null): string {
  if (!dateStr) return '';

  // Extract YYYY-MM-DD via regex to avoid UTC/local timezone shifts
  const match = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const [, year, month, day] = match;
    const shortYear = year.slice(-2);
    return `${day}/${month}/${shortYear}`;
  }

  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const shortYear = String(d.getFullYear()).slice(-2);
  return `${day}/${month}/${shortYear}`;
}
