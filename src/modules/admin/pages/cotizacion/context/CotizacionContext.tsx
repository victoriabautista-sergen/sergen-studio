import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { CotizacionData, defaultCotizacionData, BRAND_CONFIG } from "../types";
import { supabase } from "@/integrations/supabase/client";

interface CotizacionContextType {
  data: CotizacionData;
  updateData: <K extends keyof CotizacionData>(key: K, value: CotizacionData[K]) => void;
  setData: React.Dispatch<React.SetStateAction<CotizacionData>>;
  resetData: () => void;
  advanceCorrelative: () => Promise<void>;
}

const CotizacionContext = createContext<CotizacionContextType | null>(null);

export const useCotizacionContext = () => {
  const ctx = useContext(CotizacionContext);
  if (!ctx) throw new Error("useCotizacionContext must be used within CotizacionProvider");
  return ctx;
};

// Generate default validity: 15 days from today
const getDefaultValidez = () => {
  const d = new Date();
  d.setDate(d.getDate() + 15);
  return d.toLocaleDateString("es-PE");
};

const CORRELATIVE_STORAGE_KEY = "cotizacion_correlative_sequence";

interface CorrelativeSequence {
  period: string;
  nextNumber: number;
}

const getCurrentPeriod = () => {
  const now = new Date();
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
};

const formatCorrelativeNumber = (_period: string, nextNumber: number) => {
  return `COT-${String(nextNumber).padStart(4, "0")}`;
};

const readCorrelativeSequence = (): CorrelativeSequence => {
  const currentPeriod = getCurrentPeriod();

  if (typeof window === "undefined") {
    return { period: currentPeriod, nextNumber: 1 };
  }

  try {
    const storedValue = window.localStorage.getItem(CORRELATIVE_STORAGE_KEY);

    if (!storedValue) {
      return { period: currentPeriod, nextNumber: 1 };
    }

    const parsed = JSON.parse(storedValue) as Partial<CorrelativeSequence>;

    if (parsed.period === currentPeriod && typeof parsed.nextNumber === "number" && parsed.nextNumber > 0) {
      return {
        period: parsed.period,
        nextNumber: parsed.nextNumber,
      };
    }
  } catch {
    // Fallback to a new monthly sequence when localStorage is unavailable or invalid.
  }

  return { period: currentPeriod, nextNumber: 1 };
};

const writeCorrelativeSequence = (sequence: CorrelativeSequence) => {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(CORRELATIVE_STORAGE_KEY, JSON.stringify(sequence));
  } catch {
    // Ignore storage write failures and keep runtime state functional.
  }
};

const generateCorrelativeNumber = async (): Promise<string> => {
  const sequence = readCorrelativeSequence();
  return formatCorrelativeNumber(sequence.period, sequence.nextNumber);
};

const reserveNextCorrelativeNumber = async (): Promise<string> => {
  const currentSequence = readCorrelativeSequence();
  const nextSequence = {
    period: currentSequence.period,
    nextNumber: currentSequence.nextNumber + 1,
  };

  writeCorrelativeSequence(nextSequence);

  return formatCorrelativeNumber(nextSequence.period, nextSequence.nextNumber);
};

export const CotizacionProvider = ({ children }: { children: React.ReactNode }) => {
  const [data, setData] = useState<CotizacionData>({
    ...defaultCotizacionData,
    validez: getDefaultValidez(),
  });

  const loadCurrentCorrelative = useCallback(async () => {
    const numero = await generateCorrelativeNumber();
    setData(prev => ({ ...prev, numero_cotizacion: numero }));
  }, []);

  // Generate correlative number on mount
  useEffect(() => {
    void loadCurrentCorrelative();
  }, [loadCurrentCorrelative]);

  const updateData = useCallback(<K extends keyof CotizacionData>(key: K, value: CotizacionData[K]) => {
    setData(prev => {
      const next = { ...prev, [key]: value };

      // When brand changes, update bank info and direccion
      if (key === "marca") {
        const marca = value as CotizacionData["marca"];
        const config = BRAND_CONFIG[marca];
        next.cuenta_bancaria = config.cuenta_bancaria;
        next.cci = config.cci;
        next.direccion = config.direccion;
      }

      // Recalculate totals when items change
      if (key === "items" || key === "impuesto_pct" || key === "otros") {
        const items = key === "items" ? (value as CotizacionData["items"]) : next.items;
        const subtotal = items.reduce((sum, item) => sum + item.total, 0);
        const impuesto_pct = key === "impuesto_pct" ? (value as number) : next.impuesto_pct;
        const otros = key === "otros" ? (value as number) : next.otros;
        next.subtotal = subtotal;
        next.imponible = subtotal;
        next.total_impuesto = subtotal * (impuesto_pct / 100);
        next.total = subtotal + next.total_impuesto + otros;
      }
      return next;
    });
  }, []);

  const advanceCorrelative = useCallback(async () => {
    const numero = await reserveNextCorrelativeNumber();
    setData(prev => ({ ...prev, numero_cotizacion: numero }));
  }, []);

  const resetData = useCallback(() => {
    setData({
      ...defaultCotizacionData,
      validez: getDefaultValidez(),
      numero_cotizacion: "",
    });
    void loadCurrentCorrelative();
  }, [loadCurrentCorrelative]);

  return (
    <CotizacionContext.Provider value={{ data, updateData, setData, resetData, advanceCorrelative }}>
      {children}
    </CotizacionContext.Provider>
  );
};
