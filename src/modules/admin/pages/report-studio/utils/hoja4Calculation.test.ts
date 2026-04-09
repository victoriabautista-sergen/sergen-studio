import { describe, expect, it } from "vitest";
import { defaultReportData } from "../types";
import { calculateHoja4Data } from "./hoja4Calculation";

describe("calculateHoja4Data", () => {
  it("reemplaza los valores de energía de la Hoja 3 con los precios calculados de la Hoja 2", () => {
    const result = calculateHoja4Data({
      h2: {
        ...defaultReportData.hoja2_data,
        precio_calculado_hp: 0.1124,
        precio_calculado_hfp: 0.1124,
      },
      h3: {
        ...defaultReportData.hoja3_data,
        precio_hp_facturado: 0.1381,
        precio_hfp_facturado: 0.1381,
        op_gravadas: 552.4,
        importe_total: 651.83,
        items: [
          {
            descripcion: "Cargo por energia activa en horas punta",
            unidad: "kWh",
            cantidad: 2000,
            valor_unitario: 0.1381,
            valor_venta: 276.2,
            tipo: "gravado",
          },
          {
            descripcion: "Cargo por energia activa en horas fuera de punta",
            unidad: "kWh",
            cantidad: 2000,
            valor_unitario: 0.1381,
            valor_venta: 276.2,
            tipo: "gravado",
          },
        ],
      },
    });

    expect(result?.items_recalculados[0].is_energy).toBe(true);
    expect(result?.items_recalculados[0].valor_unitario_calc).toBeCloseTo(0.1124, 5);
    expect(result?.items_recalculados[1].is_energy).toBe(true);
    expect(result?.items_recalculados[1].valor_unitario_calc).toBeCloseTo(0.1124, 5);
    expect(result?.subtotal_afecto).toBeCloseTo(449.6, 2);
  });
});
