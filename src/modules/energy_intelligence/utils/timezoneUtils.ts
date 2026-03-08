/**
 * Peru timezone offset: UTC-5 (no daylight saving time)
 */
const PERU_OFFSET_MS = -5 * 60 * 60 * 1000;

/** Returns a Date object adjusted to Peru local time (for getUTC* methods to return Peru values) */
const toPeruDate = (isoString: string): Date => {
  const utc = new Date(isoString).getTime();
  return new Date(utc + PERU_OFFSET_MS);
};

export const formatTimePeru = (isoString: string): string => {
  const d = toPeruDate(isoString);
  return `${d.getUTCHours().toString().padStart(2, '0')}:${d.getUTCMinutes().toString().padStart(2, '0')}`;
};

export const formatFullDatePeru = (isoString: string): string => {
  const d = toPeruDate(isoString);
  const dia = d.getUTCDate().toString().padStart(2, '0');
  const mes = (d.getUTCMonth() + 1).toString().padStart(2, '0');
  const año = d.getUTCFullYear();
  const hora = d.getUTCHours().toString().padStart(2, '0');
  const min = d.getUTCMinutes().toString().padStart(2, '0');
  return `${dia}/${mes}/${año} ${hora}:${min} (PET)`;
};

export const getPeruHour = (isoString: string): number => {
  return toPeruDate(isoString).getUTCHours();
};
