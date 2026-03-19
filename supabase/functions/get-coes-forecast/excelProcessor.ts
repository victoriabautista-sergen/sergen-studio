
import * as XLSX from 'https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs'
import { parseExcelDate } from './dateUtils.ts'
import { parseNumber } from './numberUtils.ts'

interface ColumnIndexes {
  fecha: number;
  reprogramacion: number;
  pronostico_diario: number;
  rango_inferior: number;
  rango_superior: number;
  demanda_real: number;
}

export interface ProcessedData {
  fecha: string;
  reprogramacion: number | null;
  pronostico_diario: number | null;
  rango_inferior: number | null;
  rango_superior: number | null;
  demanda_real: number | null;
  created_at: string;
  updated_at: string;
}

function findColumnIndexes(headerRow: any[]): ColumnIndexes {
  return {
    fecha: headerRow.findIndex((col: string) => 
      typeof col === 'string' && col.toLowerCase().includes('fecha')),
    reprogramacion: headerRow.findIndex((col: string) => 
      typeof col === 'string' && col.toLowerCase().includes('reprogramación')),
    pronostico_diario: headerRow.findIndex((col: string) => 
      typeof col === 'string' && (
        col.toLowerCase().includes('pronóstico') || 
        col.toLowerCase().includes('pronostico')
      )),
    rango_inferior: headerRow.findIndex((col: string) => 
      typeof col === 'string' && col.toLowerCase().includes('mínimo')),
    rango_superior: headerRow.findIndex((col: string) => 
      typeof col === 'string' && col.toLowerCase().includes('máximo')),
    demanda_real: headerRow.findIndex((col: string) => 
      typeof col === 'string' && col.toLowerCase().includes('ejecutado'))
  };
}

export async function processExcelData(arrayBuffer: ArrayBuffer): Promise<ProcessedData[]> {
  const workbook = XLSX.read(new Uint8Array(arrayBuffer), { 
    type: 'array',
    cellDates: true,
    dateNF: 'yyyy-mm-dd HH:mm:ss'
  });
  
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  
  const rawData = XLSX.utils.sheet_to_json(worksheet, { 
    header: 1,
    raw: true,
    dateNF: 'yyyy-mm-dd HH:mm:ss'
  });

  console.log('Datos crudos del Excel:', rawData);

  const headerRow = rawData[0];
  const columnIndexes = findColumnIndexes(headerRow);
  console.log('Índices de columnas encontrados:', columnIndexes);

  const now = new Date().toISOString();

  const processedData = rawData.slice(1)
    .filter((row: any[]) => Array.isArray(row) && row.length >= 6)
    .map((row: any[]) => {
      const fecha = parseExcelDate(row[columnIndexes.fecha]);
      if (!fecha) {
        console.log('Fila ignorada por fecha inválida:', row);
        return null;
      }

      const data = {
        fecha,
        reprogramacion: parseNumber(row[columnIndexes.reprogramacion]),
        pronostico_diario: parseNumber(row[columnIndexes.pronostico_diario]),
        rango_inferior: parseNumber(row[columnIndexes.rango_inferior]),
        rango_superior: parseNumber(row[columnIndexes.rango_superior]),
        demanda_real: parseNumber(row[columnIndexes.demanda_real]),
        created_at: now,
        updated_at: now
      };

      console.log('Fila procesada:', data);
      return data;
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  console.log('Datos procesados:', processedData);
  return processedData;
}
