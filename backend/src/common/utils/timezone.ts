import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';

export const SAO_PAULO_TIMEZONE = 'America/Sao_Paulo';

const ISO_TZ_REGEX = /(Z|[+-]\d{2}:\d{2})$/;

export function parseDateInSaoPaulo(value: string): Date {
  if (!value) {
    throw new Error('Data inválida para conversão de fuso horário');
  }

  const hasTime = value.includes('T');
  const hasTimezone = ISO_TZ_REGEX.test(value);

  if (!hasTime) {
    return fromZonedTime(`${value}T00:00:00`, SAO_PAULO_TIMEZONE);
  }

  if (hasTimezone) {
    return new Date(value);
  }

  return fromZonedTime(value, SAO_PAULO_TIMEZONE);
}

export function formatDateInSaoPaulo(date: Date, pattern: string): string {
  return formatInTimeZone(date, SAO_PAULO_TIMEZONE, pattern);
}

export function formatIsoSaoPaulo(date: Date): string {
  return formatInTimeZone(date, SAO_PAULO_TIMEZONE, "yyyy-MM-dd'T'HH:mm:ss.SSSXXX");
}

export function endOfYearInSaoPaulo(date: Date): Date {
  const ano = Number(formatInTimeZone(date, SAO_PAULO_TIMEZONE, 'yyyy'));
  return fromZonedTime(`${ano}-12-31T23:59:59.999`, SAO_PAULO_TIMEZONE);
}

export function nowInSaoPaulo(): Date {
  const agora = formatInTimeZone(
    new Date(),
    SAO_PAULO_TIMEZONE,
    "yyyy-MM-dd'T'HH:mm:ss.SSS",
  );
  return fromZonedTime(agora, SAO_PAULO_TIMEZONE);
}
