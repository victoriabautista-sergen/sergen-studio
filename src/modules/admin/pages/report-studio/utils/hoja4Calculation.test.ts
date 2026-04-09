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

  it("reemplaza solo los ítems HP/HFP seleccionados cuando hay varios cargos de energía", () => {
    const result = calculateHoja4Data({
      h2: {
        ...defaultReportData.hoja2_data,
        precio_calculado_hp: 0.1124,
        precio_calculado_hfp: 0.1124,
      },
      h3: {
        ...defaultReportData.hoja3_data,
        nombre_hp: "ENERGÍA ACTIVA EN HORA PUNTA",
        nombre_hfp: "ENERGÍA ACTIVA EN HORA FUERA DE PUNTA",
        precio_hp_facturado: 0.1381,
        precio_hfp_facturado: 0.1381,
        items: [
          {
            descripcion: "ENERGÍA ACTIVA SST HORA PUNTA",
            unidad: "NIU",
            cantidad: 63194.5,
            valor_unitario: 0.1381,
            valor_venta: 8727.16,
            tipo: "gravado",
          },
          {
            descripcion: "ENERGÍA ACTIVA SST HORA PUNTA MT1",
            unidad: "NIU",
            cantidad: 63732,
            valor_unitario: 0.023886,
            valor_venta: 1522.3,
            tipo: "gravado",
          },
          {
            descripcion: "ENERGÍA ACTIVA DE GENERACIÓN FP MT1",
            unidad: "NIU",
            cantidad: 314628,
            valor_unitario: 0.1381,
            valor_venta: 43450.13,
            tipo: "gravado",
          },
          {
            descripcion: "ENERGÍA ACTIVA SST FUERA DE PUNTA MT1",
            unidad: "NIU",
            cantidad: 317302,
            valor_unitario: 0.023886,
            valor_venta: 7579.08,
            tipo: "gravado",
          },
        ],
        op_gravadas: 61278.67,
        importe_total: 72308.83,
      },
    });

    expect(result?.items_recalculados.filter((item) => item.is_energy)).toHaveLength(2);
    expect(result?.items_recalculados[0].is_energy).toBe(true);
    expect(result?.items_recalculados[0].valor_unitario_calc).toBeCloseTo(0.1124, 4);
    expect(result?.items_recalculados[1].is_energy).toBe(false);
    expect(result?.items_recalculados[1].valor_unitario_calc).toBeCloseTo(0.023886, 6);
    expect(result?.items_recalculados[2].is_energy).toBe(true);
    expect(result?.items_recalculados[2].valor_unitario_calc).toBeCloseTo(0.1124, 4);
    expect(result?.items_recalculados[3].is_energy).toBe(false);
    expect(result?.items_recalculados[3].valor_unitario_calc).toBeCloseTo(0.023886, 6);
  });
});
