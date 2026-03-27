import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { CotizacionData, defaultCotizacionData, BRAND_CONFIG } from "../types";
import { supabase } from "@/integrations/supabase/client";

interface CotizacionContextType {
  data: CotizacionData;
  updateData: <K extends keyof CotizacionData>(key: K, value: CotizacionData[K]) => void;
  setData: React.Dispatch<React.SetStateAction<CotizacionData>>;
  resetData: () => void;
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

// Generate next correlative number: COT-YYYYMM-NNN
const generateCorrelativeNumber = async (): Promise<string> => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const count = String(Math.floor(Math.random() * 900) + 100);
  return `COT-${month}-${count}`;
};

export const CotizacionProvider = ({ children }: { children: React.ReactNode }) => {
  const [data, setData] = useState<CotizacionData>({
    ...defaultCotizacionData,
    validez: getDefaultValidez(),
  });

  // Generate correlative number on mount
  useEffect(() => {
    generateCorrelativeNumber().then(num => {
      setData(prev => ({ ...prev, numero_cotizacion: num }));
    });
  }, []);

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

  const resetData = useCallback(() => {
    setData({
      ...defaultCotizacionData,
      validez: getDefaultValidez(),
    });
    generateCorrelativeNumber().then(num => {
      setData(prev => ({ ...prev, numero_cotizacion: num }));
    });
  }, []);

  return (
    <CotizacionContext.Provider value={{ data, updateData, setData, resetData }}>
      {children}
    </CotizacionContext.Provider>
  );
};
