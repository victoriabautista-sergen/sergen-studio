export type CotizacionMarca = "sergen" | "incoser";

export interface CotizacionItem {
  descripcion: string;
  codigo: string;
  precio_unitario: number;
  cantidad: number;
  precio_venta: number;
  total: number;
}

export interface CotizacionData {
  id?: string;
  marca: CotizacionMarca;
  // Header info
  fecha: string;
  numero_cotizacion: string;
  validez: string;
  // Company info
  direccion: string;
  asesor: string;
  telefono: string;
  correo: string;
  // Client info
  empresa_cliente: string;
  contacto_cliente: string;
  ubicacion_cliente: string;
  // Items
  items: CotizacionItem[];
  // Totals
  subtotal: number;
  imponible: number;
  impuesto_pct: number;
  total_impuesto: number;
  otros: number;
  total: number;
  // Terms
  terminos_items: string[];
  cuenta_bancaria: string;
  cci: string;
}

export const BRAND_CONFIG: Record<CotizacionMarca, { razon_social: string; cuenta_bancaria: string; cci: string; direccion: string }> = {
  sergen: {
    razon_social: "Ingeniería y consultoría SERGEN",
    cuenta_bancaria: "BCP SOLES: 194-1053206-0-43",
    cci: "CCI BCP SOLES: 00219400105320604390",
    direccion: "Platinium Plaza - San Isidro - Lima",
  },
  incoser: {
    razon_social: "INCOSER S.A.C.",
    cuenta_bancaria: "BCP SOLES: 194-2654871-0-15",
    cci: "CCI BCP SOLES: 00219400265487101595",
    direccion: "Platinium Plaza - San Isidro - Lima",
  },
};

export const defaultCotizacionData: CotizacionData = {
  marca: "sergen",
  fecha: new Date().toLocaleDateString("es-PE"),
  numero_cotizacion: "",
  validez: "",
  direccion: BRAND_CONFIG.sergen.direccion,
  asesor: "",
  telefono: "",
  correo: "",
  empresa_cliente: "",
  contacto_cliente: "",
  ubicacion_cliente: "",
  items: [
    {
      descripcion: "",
      codigo: "",
      precio_unitario: 0,
      cantidad: 1,
      precio_venta: 0,
      total: 0,
    },
  ],
  subtotal: 0,
  imponible: 0,
  impuesto_pct: 18,
  total_impuesto: 0,
  otros: 0,
  total: 0,
  terminos: `1. Forma de pago:\n   a) 50% al finalizar el servicio.\n   b) 50% finalizando el servicio.\n2. Los pagos a la concesionaria y/o trámites municipales serán asumidos y gestionados por el cliente.`,
  cuenta_bancaria: BRAND_CONFIG.sergen.cuenta_bancaria,
  cci: BRAND_CONFIG.sergen.cci,
};
