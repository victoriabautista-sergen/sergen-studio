import type { Hoja4Data, Hoja4Item, ReportData } from "../types";

type Hoja2Data = ReportData["hoja2_data"];
type Hoja3Data = ReportData["hoja3_data"];

const normalizeText = (value: string) =>
  (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim();

const isEnergyDescription = (normalizedDescription: string) =>
  normalizedDescription.includes("ENERG") && !normalizedDescription.includes("REACT");

const matchesConfiguredName = (normalizedDescription: string, configuredName: string) => {
  const normalizedName = normalizeText(configuredName);
  return normalizedName.length > 0 && normalizedDescription.includes(normalizedName);
};

const looksLikeHfp = (normalizedDescription: string) =>
  normalizedDescription.includes("FUERA DE PUNTA") ||
  normalizedDescription.includes("HORA FUERA DE PUNTA") ||
  /\bHFP\b/.test(normalizedDescription) ||
  /\bFP\b/.test(normalizedDescription);

const looksLikeHp = (normalizedDescription: string) =>
  normalizedDescription.includes("HORA PUNTA") ||
  /\bHP\b/.test(normalizedDescription) ||
  (normalizedDescription.includes(" PUNTA") && !normalizedDescription.includes("FUERA"));

export const getEnergyItemType = (
  descripcion: string,
  nombreHp: string,
  nombreHfp: string
): "hp" | "hfp" | null => {
  const normalizedDescription = normalizeText(descripcion);
  if (!normalizedDescription) return null;

  if (matchesConfiguredName(normalizedDescription, nombreHfp)) return "hfp";
  if (matchesConfiguredName(normalizedDescription, nombreHp)) return "hp";

  if (!isEnergyDescription(normalizedDescription)) return null;

  if (looksLikeHfp(normalizedDescription)) return "hfp";
  if (looksLikeHp(normalizedDescription)) return "hp";

  return null;
};

const buildRecalculatedItems = (h2: Hoja2Data, h3: Hoja3Data): Hoja4Item[] => {
  const items = h3.items ?? [];

  return items.map((item) => {
    const energyType = getEnergyItemType(item.descripcion, h3.nombre_hp, h3.nombre_hfp);
    const isHP = energyType === "hp";
    const isHFP = energyType === "hfp";
    const isEnergy = isHP || isHFP;

    let tipo: "gravado" | "exonerado" | "inafecta" = "gravado";
    if (item.tipo === "exonerado") {
      tipo = "exonerado";
    } else if (item.tipo === "inafecta" || (item.tipo as string) === "inafecto") {
      tipo = "inafecta";
    }

    let valor_unitario_calc = item.valor_unitario;
    let valor_venta_calc = item.valor_venta;

    if (isHP && h2.precio_calculado_hp > 0) {
      valor_unitario_calc = h2.precio_calculado_hp;
      valor_venta_calc = +(item.cantidad * h2.precio_calculado_hp).toFixed(2);
    } else if (isHFP && h2.precio_calculado_hfp > 0) {
      valor_unitario_calc = h2.precio_calculado_hfp;
      valor_venta_calc = +(item.cantidad * h2.precio_calculado_hfp).toFixed(2);
    }

    return {
      descripcion: item.descripcion,
      unidad: item.unidad,
      cantidad: item.cantidad,
      tipo,
      valor_unitario_original: item.valor_unitario,
      valor_venta_original: item.valor_venta,
      valor_unitario_calc,
      valor_venta_calc,
      is_energy: isEnergy,
    };
  });
};

export const calculateHoja4Data = ({
  h2,
  h3,
}: {
  h2: Hoja2Data;
  h3: Hoja3Data;
}): Partial<Hoja4Data> | null => {
  if (!h3.items?.length) return null;

  const calc_hp = h2.precio_calculado_hp || 0;
  const calc_hfp = h2.precio_calculado_hfp || 0;

  if (!calc_hp && !calc_hfp) return null;

  const fact_hp = h3.precio_hp_facturado || 0;
  const fact_hfp = h3.precio_hfp_facturado || 0;
  const diff_hp = +(fact_hp - calc_hp).toFixed(5);
  const diff_hfp = +(fact_hfp - calc_hfp).toFixed(5);

  const items_recalculados = buildRecalculatedItems(h2, h3);

  let diff_gravado = 0;
  let diff_no_gravado = 0;

  items_recalculados.forEach((item) => {
    if (!item.is_energy) return;

    const diff_venta = item.valor_venta_calc - item.valor_venta_original;
    if (item.tipo === "exonerado" || item.tipo === "inafecta") {
      diff_no_gravado += diff_venta;
    } else {
      diff_gravado += diff_venta;
    }
  });

  const subtotal_afecto = +((h3.op_gravadas || 0) + diff_gravado).toFixed(2);
  const subtotal_exonerado = +((h3.op_inafectas || 0) + (h3.op_exonerada || 0) + diff_no_gravado).toFixed(2);
  const igv_recalculado = +(subtotal_afecto * 0.18).toFixed(2);
  const total_recalculado = +(subtotal_afecto + igv_recalculado + subtotal_exonerado).toFixed(2);

  const energiaHP = h3.items.find(
    (item) => getEnergyItemType(item.descripcion, h3.nombre_hp, h3.nombre_hfp) === "hp"
  );
  const energiaHFP = h3.items.find(
    (item) => getEnergyItemType(item.descripcion, h3.nombre_hp, h3.nombre_hfp) === "hfp"
  );
  const cantHP = energiaHP?.cantidad || 0;
  const cantHFP = energiaHFP?.cantidad || 0;

  const total_hoja3 = h3.importe_total || 0;
  const impacto = +Math.abs(total_hoja3 - total_recalculado).toFixed(2);
  const pagoMas = total_hoja3 > total_recalculado;
  const conclusion = `Considerando las cantidades facturadas de ${cantHP.toLocaleString("es-PE")} kWh (HP) y ${cantHFP.toLocaleString("es-PE")} kWh (HFP), la diferencia de precios representa un impacto económico de S/ ${impacto.toLocaleString("es-PE", { minimumFractionDigits: 2 })} que el cliente ${pagoMas ? "pagó de más" : "ahorró"} respecto al precio calculado según contrato.`;

  return {
    items_recalculados,
    subtotal_afecto,
    subtotal_exonerado,
    igv_recalculado,
    total_recalculado,
    precio_calculado_hp: calc_hp,
    precio_calculado_hfp: calc_hfp,
    precio_facturado_hp: fact_hp,
    precio_facturado_hfp: fact_hfp,
    diferencia_hp: diff_hp,
    diferencia_hfp: diff_hfp,
    impacto_economico: impacto,
    conclusion,
  };
};
