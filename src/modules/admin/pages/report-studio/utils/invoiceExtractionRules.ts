import type { FacturaItem } from "../types";

const EXTRACTION_RULE_HINTS = [
  "PRECIO",
  "PRECIOS",
  "HP",
  "HFP",
  "KWH",
  "VALOR UNITARIO",
  "PUNTA",
  "FUERA DE PUNTA",
  "SELECCIONAR",
  "GRUPO",
];

const normalizeText = (value: string) =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();

export const mergeExtractionRules = (...segments: Array<string | null | undefined>) => {
  const lines = segments.flatMap((segment) =>
    (segment ?? "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
  );

  return Array.from(new Set(lines)).join("\n");
};

export const looksLikeExtractionRule = (value: string) => {
  const normalized = normalizeText(value);
  return value.trim().length > 40 || EXTRACTION_RULE_HINTS.some((hint) => normalized.includes(hint));
};

export const splitStoredRuleEntries = (values: string[] = []) =>
  values.reduce(
    (acc, value) => {
      const cleaned = value.trim();
      if (!cleaned) return acc;

      if (looksLikeExtractionRule(cleaned)) {
        acc.ruleHints.push(cleaned);
      } else {
        acc.taxKeywords.push(cleaned.toUpperCase());
      }

      return acc;
    },
    { taxKeywords: [] as string[], ruleHints: [] as string[] }
  );

const extractMinimumPriceFromRules = (rules: string) => {
  if (!rules.trim()) return null;

  const normalized = rules.replace(/,/g, ".");
  const patterns = [
    /ambos precios[^0-9><]{0,40}(?:>=|>|mayor(?:es)?(?:\s+a|\s+de)?|superior(?:es)?(?:\s+a|\s+de)?|minim(?:o|os)?(?:\s+de)?)[^0-9]{0,10}([0-9]+(?:\.[0-9]+)?)/i,
    /\b(?:hp|hfp|precio|precios)\b[^0-9><]{0,30}(?:>=|>|mayor(?:es)?(?:\s+a|\s+de)?|superior(?:es)?(?:\s+a|\s+de)?|minim(?:o|os)?(?:\s+de)?)[^0-9]{0,10}([0-9]+(?:\.[0-9]+)?)/i,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    const value = Number(match?.[1]);
    if (Number.isFinite(value) && value > 0) return value;
  }

  return null;
};

const isEnergyItem = (descripcion: string) => {
  const normalized = normalizeText(descripcion);
  return normalized.includes("ENERG") && !normalized.includes("REACT");
};

const isHpItem = (descripcion: string) => {
  const normalized = normalizeText(descripcion);
  return isEnergyItem(descripcion) && (
    normalized.includes("HORA PUNTA") ||
    (normalized.includes(" PUNTA") && !normalized.includes("FUERA")) ||
    /\bHP\b/.test(normalized)
  );
};

const isHfpItem = (descripcion: string) => {
  const normalized = normalizeText(descripcion);
  return isEnergyItem(descripcion) && (
    normalized.includes("FUERA DE PUNTA") ||
    normalized.includes("HORA FUERA DE PUNTA") ||
    /\bHFP\b/.test(normalized) ||
    /\bFP\b/.test(normalized)
  );
};

const roundPrice = (value: number) => Number(value.toFixed(6));

const sumPrices = (items: FacturaItem[], predicate: (descripcion: string) => boolean) => {
  const total = items.reduce((sum, item) => (predicate(item.descripcion) ? sum + item.valor_unitario : sum), 0);
  return total > 0 ? roundPrice(total) : null;
};

interface ResolveExtractedInvoicePricesInput {
  items?: FacturaItem[];
  precioHp?: number | null;
  precioHfp?: number | null;
  rules?: string | null;
}

export const resolveExtractedInvoicePrices = ({
  items = [],
  precioHp,
  precioHfp,
  rules,
}: ResolveExtractedInvoicePricesInput) => {
  const minPrice = extractMinimumPriceFromRules(rules ?? "");
  const currentHp = typeof precioHp === "number" ? precioHp : null;
  const currentHfp = typeof precioHfp === "number" ? precioHfp : null;

  if (!minPrice || items.length === 0) {
    return { precioHp: currentHp, precioHfp: currentHfp, adjusted: false };
  }

  if ((currentHp ?? 0) >= minPrice && (currentHfp ?? 0) >= minPrice) {
    return { precioHp: currentHp, precioHfp: currentHfp, adjusted: false };
  }

  const summedHp = sumPrices(items, isHpItem);
  const summedHfp = sumPrices(items, isHfpItem);

  const nextHp = currentHp !== null && currentHp >= minPrice
    ? currentHp
    : summedHp !== null && summedHp >= minPrice
      ? summedHp
      : currentHp;

  const nextHfp = currentHfp !== null && currentHfp >= minPrice
    ? currentHfp
    : summedHfp !== null && summedHfp >= minPrice
      ? summedHfp
      : currentHfp;

  return {
    precioHp: nextHp,
    precioHfp: nextHfp,
    adjusted: nextHp !== currentHp || nextHfp !== currentHfp,
  };
};