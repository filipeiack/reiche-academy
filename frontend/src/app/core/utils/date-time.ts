export const SAO_PAULO_TIMEZONE = 'America/Sao_Paulo';

type DateParts = {
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
  second: string;
};

function getDatePartsSaoPaulo(value: Date | string): DateParts {
  const date = typeof value === 'string' ? new Date(value) : value;
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: SAO_PAULO_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const map = parts.reduce<Record<string, string>>((acc, part) => {
    if (part.type !== 'literal') {
      acc[part.type] = part.value;
    }
    return acc;
  }, {});

  return {
    year: map['year'],
    month: map['month'],
    day: map['day'],
    hour: map['hour'],
    minute: map['minute'],
    second: map['second'],
  };
}

export function formatDateInputSaoPaulo(value: Date): string {
  const parts = getDatePartsSaoPaulo(value);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function formatDateDisplaySaoPaulo(value: Date | string): string {
  if (!value) return '-';
  const parts = getDatePartsSaoPaulo(value);
  return `${parts.day}/${parts.month}/${parts.year}`;
}

export function formatDateTimeDisplaySaoPaulo(value: Date | string): string {
  if (!value) return '-';
  const parts = getDatePartsSaoPaulo(value);
  return `${parts.day}/${parts.month}/${parts.year} ${parts.hour}:${parts.minute}`;
}

export function formatTimeDisplaySaoPaulo(value: Date | string): string {
  if (!value) return '-';
  const parts = getDatePartsSaoPaulo(value);
  return `${parts.hour}:${parts.minute}:${parts.second}`;
}

export function formatMonthYearSaoPaulo(value: Date | string): string {
  const parts = getDatePartsSaoPaulo(value);
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const mesLabel = meses[Number(parts.month) - 1] ?? '';
  return `${mesLabel}/${parts.year.slice(-2)}`;
}

export function formatIsoSaoPaulo(value: Date): string {
  const parts = getDatePartsSaoPaulo(value);
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}-03:00`;
}

export function parseDateInputSaoPaulo(value: string): Date {
  return new Date(`${value}T00:00:00-03:00`);
}

export function normalizeDateToSaoPaulo(value: Date | string): Date {
  const date = typeof value === 'string' ? new Date(value) : value;
  return parseDateInputSaoPaulo(formatDateInputSaoPaulo(date));
}
