import React, { createContext, useContext, useState, useCallback } from "react";
import { CotizacionData, defaultCotizacionData } from "../types";

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

export const CotizacionProvider = ({ children }: { children: React.ReactNode }) => {
  const [data, setData] = useState<CotizacionData>(defaultCotizacionData);

  const updateData = useCallback(<K extends keyof CotizacionData>(key: K, value: CotizacionData[K]) => {
    setData(prev => {
      const next = { ...prev, [key]: value };
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
    setData(defaultCotizacionData);
  }, []);

  return (
    <CotizacionContext.Provider value={{ data, updateData, setData, resetData }}>
      {children}
    </CotizacionContext.Provider>
  );
};
