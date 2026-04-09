import { describe, expect, it } from "vitest";

import { resolveExtractedInvoicePrices, splitStoredRuleEntries } from "./invoiceExtractionRules";

describe("invoiceExtractionRules", () => {
  it("separa reglas de extracción mal guardadas de conceptos tributarios", () => {
    const result = splitStoredRuleEntries([
      "FISE",
      "AMBOS PRECIOS DEBEN SER MAYOR A 0.10",
    ]);

    expect(result.taxKeywords).toEqual(["FISE"]);
    expect(result.ruleHints).toEqual(["AMBOS PRECIOS DEBEN SER MAYOR A 0.10"]);
  });

  it("corrige solo el precio inválido cuando la regla exige que ambos sean mayores a 0.10", () => {
    const result = resolveExtractedInvoicePrices({
      items: [
        { descripcion: "ENERGÍA ACTIVA SST HORA PUNTA", unidad: "NIU", cantidad: 1, valor_unitario: 0.1381, valor_venta: 1 },
        { descripcion: "ENERGÍA ACTIVA SST HORA PUNTA MT1", unidad: "NIU", cantidad: 1, valor_unitario: 0.023886, valor_venta: 1 },
        { descripcion: "ENERGÍA ACTIVA DE GENERACIÓN FP MT1", unidad: "NIU", cantidad: 1, valor_unitario: 0.1381, valor_venta: 1 },
        { descripcion: "ENERGÍA ACTIVA SST FUERA DE PUNTA MT1", unidad: "NIU", cantidad: 1, valor_unitario: 0.023886, valor_venta: 1 },
      ],
      precioHp: 0.1381,
      precioHfp: 0.023886,
      rules: "Ambos precios deben ser mayor a 0.10",
    });

    expect(result.adjusted).toBe(true);
    expect(result.precioHp).toBeCloseTo(0.1381, 6);
    expect(result.precioHfp).toBeCloseTo(0.161986, 6);
  });
});