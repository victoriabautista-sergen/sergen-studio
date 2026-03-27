export interface DatosGenerales {
  client_id: string;
  client_name: string;
  concesionaria: string;
  numero_informe: string;
  mes: string;
  anio: string;
}

export interface Hoja2Data {
  precio_base_hp: number;
  precio_base_hfp: number;
  precio_potencia: number;
  moneda: "PEN" | "USD";
  pngo: number;
  tco: number;
  ippo: number;
  png_actual: number;
  tc_actual: number;
  ipp_actual: number;
  factor_e: number;
  factor_perdida: number;
  formula: string;
  precio_actualizado_hp: number;
  precio_actualizado_hfp: number;
  precio_calculado_hp: number;
  precio_calculado_hfp: number;
}

export interface Hoja3Data {
  nombre_hp: string;
  nombre_hfp: string;
  incluir_otros_cargos: boolean;
  factura_file_url: string;
  numero_factura: string;
  precio_hp_facturado: number;
  precio_hfp_facturado: number;
  otros_cargos: number;
}

export interface Hoja4Data {
  precio_calculado_hp: number;
  precio_calculado_hfp: number;
  precio_facturado_hp: number;
  precio_facturado_hfp: number;
  diferencia_hp: number;
  diferencia_hfp: number;
  impacto_economico: number;
  conclusion: string;
}

export interface Hoja5Data {
  imagen_url: string;
  fecha: string;
  hora: string;
  sein_mw: number;
  importacion: number;
  exportacion: number;
  potencia_coincidente_promedio: number;
}

export interface Hoja6Item {
  concepto: string;
  cantidad: number;
  precio_unitario: number;
  total: number;
}

export interface Hoja6Data {
  items_original: Hoja6Item[];
  items_proyectado: Hoja6Item[];
  potencia_promedio: number;
  total_original: number;
  total_proyectado: number;
  diferencia: number;
}

export interface Hoja7Data {
  dias_modulados: number;
  dias_libres: number;
  calendario_url: string;
  resumen_modulacion: string;
  conclusiones_auto: string[];
  conclusiones_manuales: string;
}

export interface ReportData {
  id?: string;
  client_id: string;
  mes: number;
  anio: number;
  datos_generales: DatosGenerales;
  hoja2_data: Hoja2Data;
  hoja3_data: Hoja3Data;
  hoja4_data: Hoja4Data;
  hoja5_data: Hoja5Data;
  hoja6_data: Hoja6Data;
  hoja7_data: Hoja7Data;
}

export const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export const defaultReportData: ReportData = {
  client_id: "",
  mes: new Date().getMonth() + 1,
  anio: new Date().getFullYear(),
  datos_generales: {
    client_id: "",
    client_name: "",
    concesionaria: "",
    numero_informe: "",
    mes: MESES[new Date().getMonth()],
    anio: String(new Date().getFullYear()),
  },
  hoja2_data: {
    precio_base_hp: 0,
    precio_base_hfp: 0,
    precio_potencia: 0,
    moneda: "PEN",
    pngo: 0,
    tco: 0,
    ippo: 0,
    png_actual: 0,
    tc_actual: 0,
    ipp_actual: 0,
    factor_perdida: 1.0,
    formula: "PB × (PNG/PNGo) × (TC/TCo) × (IPP/IPPo) × FP",
    precio_actualizado_hp: 0,
    precio_actualizado_hfp: 0,
  },
  hoja3_data: {
    nombre_hp: "Energía Hora Punta",
    nombre_hfp: "Energía Fuera de Punta",
    incluir_otros_cargos: false,
    factura_file_url: "",
    numero_factura: "",
    precio_hp_facturado: 0,
    precio_hfp_facturado: 0,
    otros_cargos: 0,
  },
  hoja4_data: {
    precio_calculado_hp: 0,
    precio_calculado_hfp: 0,
    precio_facturado_hp: 0,
    precio_facturado_hfp: 0,
    diferencia_hp: 0,
    diferencia_hfp: 0,
    impacto_economico: 0,
    conclusion: "",
  },
  hoja5_data: {
    imagen_url: "",
    fecha: "",
    hora: "",
    sein_mw: 0,
    importacion: 0,
    exportacion: 0,
    potencia_coincidente_promedio: 0,
  },
  hoja6_data: {
    items_original: [],
    items_proyectado: [],
    potencia_promedio: 0,
    total_original: 0,
    total_proyectado: 0,
    diferencia: 0,
  },
  hoja7_data: {
    dias_modulados: 0,
    dias_libres: 0,
    calendario_url: "",
    resumen_modulacion: "",
    conclusiones_auto: [],
    conclusiones_manuales: "",
  },
};
