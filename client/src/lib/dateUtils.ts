export function parseDateParts(dateStr?: string | null): {
  year: number;
  month: number;
  day: number;
  date: Date;
} | null {
  if (!dateStr) return null;
  const match = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    const day = parseInt(match[3], 10);
    return { year, month, day, date: new Date(year, month, day) };
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate(), date: d };
}

export function formatDateDMY(dateStr?: string | null): string {
  if (!dateStr) return '';

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

export function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '';
  const parsed = parseDateParts(dateStr);
  if (!parsed) return String(dateStr);
  const m = parsed.date.toLocaleDateString('en-US', { month: 'short' });
  return `${m} ${parsed.day}, ${parsed.year}`;
}

export function formatRetroDateRange(
  startDate?: string | null,
  endDate?: string | null,
  fallbackDate?: string | null
): string {
  const start = parseDateParts(startDate) || parseDateParts(fallbackDate);
  let end = parseDateParts(endDate);

  if (!start && !end) return '';

  if (start && !end) {
    // If only start date is provided, default ending date to the end of that month dynamically
    const lastDay = new Date(start.year, start.month + 1, 0);
    end = {
      year: lastDay.getFullYear(),
      month: lastDay.getMonth(),
      day: lastDay.getDate(),
      date: lastDay,
    };
  } else if (!start && end) {
    const m = end.date.toLocaleDateString('en-US', { month: 'short' });
    return `${m} ${end.day}, ${end.year}`;
  }

  const startMonth = start!.date.toLocaleDateString('en-US', { month: 'short' });
  const endMonth = end!.date.toLocaleDateString('en-US', { month: 'short' });

  if (start!.year === end!.year) {
    if (start!.month === end!.month && start!.day === end!.day) {
      return `${startMonth} ${start!.day}, ${start!.year}`;
    }
    return `${startMonth} ${start!.day} – ${endMonth} ${end!.day}, ${start!.year}`;
  }
  return `${startMonth} ${start!.day}, ${start!.year} – ${endMonth} ${end!.day}, ${end!.year}`;
}

