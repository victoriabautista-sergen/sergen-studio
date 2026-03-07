
export function parseExcelDate(date: any): string {
  if (!date) return '';
  
  if (date instanceof Date) {
    return new Date(
      Date.UTC(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        date.getHours(),
        date.getMinutes()
      )
    ).toISOString();
  }
  
  if (typeof date === 'number') {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const utcDate = new Date(excelEpoch.getTime() + (date * 24 * 60 * 60 * 1000));
    return new Date(
      Date.UTC(
        utcDate.getFullYear(),
        utcDate.getMonth(),
        utcDate.getDate(),
        utcDate.getHours(),
        utcDate.getMinutes()
      )
    ).toISOString();
  }
  
  try {
    const parsedDate = new Date(date);
    if (!isNaN(parsedDate.getTime())) {
      return new Date(
        Date.UTC(
          parsedDate.getFullYear(),
          parsedDate.getMonth(),
          parsedDate.getDate(),
          parsedDate.getHours(),
          parsedDate.getMinutes()
        )
      ).toISOString();
    }
  } catch (error) {
    console.error('Error parsing date:', error);
  }
  
  return '';
}
