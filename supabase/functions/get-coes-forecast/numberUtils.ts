
export function parseNumber(value: any): number | null {
  if (value === null || value === undefined || value === '') return null;
  
  if (typeof value === 'number') return value;
  
  if (typeof value === 'string') {
    const cleanValue = value.trim().replace(',', '.');
    const number = parseFloat(cleanValue);
    return isNaN(number) ? null : number;
  }
  
  return null;
}
