
const MAIN_PAGE_URL = 'https://www.coes.org.pe/Portal/portalinformacion/demanda';
const EXPORT_URL = 'https://www.coes.org.pe/Portal/portalinformacion/ExportarPronosticoTiempoReal';

const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache',
  'sec-ch-ua': '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"Windows"',
};

export const fetchMainPage = async (): Promise<string | null> => {
  console.log('Visitando página principal:', MAIN_PAGE_URL);

  const response = await fetch(MAIN_PAGE_URL, {
    method: 'GET',
    headers: {
      ...BROWSER_HEADERS,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'sec-fetch-dest': 'document',
      'sec-fetch-mode': 'navigate',
      'sec-fetch-site': 'none',
      'sec-fetch-user': '?1',
      'upgrade-insecure-requests': '1',
    },
    redirect: 'follow',
  });

  if (!response.ok) {
    throw new Error(`Error accediendo a la página principal: ${response.status}`);
  }

  const cookies = response.headers.get('set-cookie');
  if (!cookies) {
    console.log('No se recibieron cookies de la página principal');
  } else {
    console.log('Cookies obtenidas:', cookies);
  }

  return cookies;
};

export const downloadExcelFile = async (cookies: string | null): Promise<ArrayBuffer> => {
  console.log('Descargando archivo desde:', EXPORT_URL);

  const response = await fetch(EXPORT_URL, {
    method: 'GET',
    headers: {
      ...BROWSER_HEADERS,
      'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Referer': MAIN_PAGE_URL,
      'Cookie': cookies || '',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-origin',
    },
    redirect: 'follow',
  });

  console.log('Estado de la respuesta:', response.status);
  console.log('Headers de la respuesta:', Object.fromEntries(response.headers.entries()));

  if (!response.ok) {
    const responseText = await response.text();
    console.error('Contenido de la respuesta de error:', responseText);
    throw new Error(`Error en la descarga: ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get('content-type');
  console.log('Tipo de contenido recibido:', contentType);

  const arrayBuffer = await response.arrayBuffer();
  console.log('Tamaño del archivo:', arrayBuffer.byteLength, 'bytes');

  if (arrayBuffer.byteLength === 0) {
    throw new Error('El archivo descargado está vacío');
  }

  return arrayBuffer;
};
