
export const extractCoesData = async () => {
  try {
    // Intentar descargar directamente el archivo Excel
    const today = new Date();
    const formatDateStr = (date: Date) => {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}${month}${year}`;
    };

    // URL corregida para apuntar a la sección de demanda
    const excelUrl = `https://www.coes.org.pe/Portal/portalinformacion/demanda/demanda_${formatDateStr(today)}.xlsx`;
    
    console.log('Intentando descargar Excel desde:', excelUrl);

    const response = await fetch(excelUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      console.error('Error de respuesta:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });
      throw new Error(`Error al descargar el archivo: ${response.statusText}`);
    }

    // Procesar el archivo Excel
    const arrayBuffer = await response.arrayBuffer();
    
    console.log('Tamaño del archivo descargado:', arrayBuffer.byteLength);
    console.log('Headers de respuesta:', Object.fromEntries(response.headers.entries()));

    // Por ahora retornamos datos de ejemplo para probar la estructura
    return [{
      fecha: new Date().toISOString(),
      reprogramacion_diaria: 0,
      ejecutado: 0
    }];

  } catch (error) {
    console.error('Error en la extracción de datos:', error);
    throw error;
  }
};
