
export const parseNumber = (value: string | number): number => {
  try {
    if (typeof value === 'number') return value;
    if (!value) return 0;
    
    // Limpiar el string de caracteres no numéricos excepto punto y coma
    const cleanValue = value.toString()
      .replace(/[^\d.,\-]/g, '') // Mantener solo dígitos, punto, coma y signo negativo
      .replace(',', '.'); // Convertir coma a punto decimal
    
    const number = parseFloat(cleanValue);
    
    if (isNaN(number)) {
      console.log('No se pudo parsear el valor:', value);
      return 0;
    }
    
    return number;
  } catch (error) {
    console.error('Error parseando número:', value, error);
    return 0;
  }
};

export const formatDate = (date: Date): string => {
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
};
