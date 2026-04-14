import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/core/auth/hooks/useAuth';
import EnergyShell from '../components/EnergyShell';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Zap, DollarSign, Activity, BarChart2 } from 'lucide-react';

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

interface InvoiceRow {
  id: string;
  client_id: string;
  invoice_number: string | null;
  period_start: string | null;
  period_end: string | null;
  total_amount: number | null;
  energy_kwh: number | null;
  demand_kw: number | null;
  created_at: string;
}

const AnaliticaPage = () => {
  const { user } = useAuth();
  const [selectedYear, setSelectedYear] = useState<string>('all');

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['invoices-analytics', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('period_start', { ascending: true });
      if (error) throw error;
      return (data || []) as InvoiceRow[];
    },
    enabled: !!user,
  });

  const availableYears = useMemo(() => {
    const years = new Set<string>();
    invoices.forEach(inv => {
      if (inv.period_start) years.add(new Date(inv.period_start).getFullYear().toString());
    });
    return Array.from(years).sort((a, b) => parseInt(b) - parseInt(a));
  }, [invoices]);

  const filtered = useMemo(() => {
    if (selectedYear === 'all') return invoices;
    return invoices.filter(inv => inv.period_start && new Date(inv.period_start).getFullYear().toString() === selectedYear);
  }, [invoices, selectedYear]);

  // KPIs
  const kpis = useMemo(() => {
    const totalCost = filtered.reduce((s, i) => s + (i.total_amount || 0), 0);
    const totalEnergy = filtered.reduce((s, i) => s + (i.energy_kwh || 0), 0);
    const maxDemand = Math.max(0, ...filtered.map(i => i.demand_kw || 0));
    const avgCost = filtered.length ? totalCost / filtered.length : 0;
    return { totalCost, totalEnergy, maxDemand, avgCost, count: filtered.length };
  }, [filtered]);

  // Monthly chart data
  const monthlyData = useMemo(() => {
    const map = new Map<string, { month: string; costo: number; energia: number; demanda: number }>();
    filtered.forEach(inv => {
      if (!inv.period_start) return;
      const d = new Date(inv.period_start);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
      const existing = map.get(key) || { month: label, costo: 0, energia: 0, demanda: 0 };
      existing.costo += inv.total_amount || 0;
      existing.energia += inv.energy_kwh || 0;
      existing.demanda = Math.max(existing.demanda, inv.demand_kw || 0);
      map.set(key, existing);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v);
  }, [filtered]);

  // Period comparison (current vs previous)
  const comparison = useMemo(() => {
    if (monthlyData.length < 2) return null;
    const current = monthlyData[monthlyData.length - 1];
    const previous = monthlyData[monthlyData.length - 2];
    const costChange = previous.costo ? ((current.costo - previous.costo) / previous.costo) * 100 : 0;
    const energyChange = previous.energia ? ((current.energia - previous.energia) / previous.energia) * 100 : 0;
    return { current, previous, costChange, energyChange };
  }, [monthlyData]);

  const formatCurrency = (v: number) => `S/ ${v.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formatNumber = (v: number) => v.toLocaleString('es-PE', { maximumFractionDigits: 0 });

  return (
    <EnergyShell>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Analítica</h1>
        {availableYears.length > 0 && (
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filtrar año" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {availableYears.map(y => (
                <SelectItem key={y} value={y}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {isLoading ? (
        <div className="text-muted-foreground text-center py-20">Cargando datos...</div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <BarChart2 className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Sin datos de facturación</h3>
          <p className="text-muted-foreground text-sm">
            Sube facturas al sistema para visualizar analíticas de consumo, costos y demanda.
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard icon={DollarSign} label="Costo Total" value={formatCurrency(kpis.totalCost)} color="text-emerald-600" />
            <KpiCard icon={Zap} label="Energía Total" value={`${formatNumber(kpis.totalEnergy)} kWh`} color="text-blue-600" />
            <KpiCard icon={Activity} label="Demanda Máxima" value={`${formatNumber(kpis.maxDemand)} kW`} color="text-orange-600" />
            <KpiCard icon={DollarSign} label="Costo Promedio / Factura" value={formatCurrency(kpis.avgCost)} color="text-purple-600" />
          </div>

          {/* Comparison */}
          {comparison && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ComparisonCard
                label="Variación de Costo"
                current={formatCurrency(comparison.current.costo)}
                previous={formatCurrency(comparison.previous.costo)}
                change={comparison.costChange}
                currentLabel={comparison.current.month}
                previousLabel={comparison.previous.month}
              />
              <ComparisonCard
                label="Variación de Energía"
                current={`${formatNumber(comparison.current.energia)} kWh`}
                previous={`${formatNumber(comparison.previous.energia)} kWh`}
                change={comparison.energyChange}
                currentLabel={comparison.current.month}
                previousLabel={comparison.previous.month}
              />
            </div>
          )}

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-5">
              <h3 className="font-semibold text-foreground mb-4">Evolución de Costos</h3>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                  <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Line type="monotone" dataKey="costo" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} name="Costo (S/)" />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-5">
              <h3 className="font-semibold text-foreground mb-4">Consumo Mensual de Energía</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                  <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                  <Tooltip formatter={(v: number) => `${formatNumber(v)} kWh`} />
                  <Bar dataKey="energia" fill="hsl(210 80% 55%)" radius={[4, 4, 0, 0]} name="Energía (kWh)" />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-5 lg:col-span-2">
              <h3 className="font-semibold text-foreground mb-4">Demanda Máxima por Mes</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                  <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                  <Tooltip formatter={(v: number) => `${formatNumber(v)} kW`} />
                  <Bar dataKey="demanda" fill="hsl(25 95% 53%)" radius={[4, 4, 0, 0]} name="Demanda (kW)" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </div>
      )}
    </EnergyShell>
  );
};

function KpiCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string; color: string }) {
  return (
    <Card className="p-4 flex items-center gap-4">
      <div className={`h-10 w-10 rounded-lg bg-muted flex items-center justify-center ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-bold text-foreground">{value}</p>
      </div>
    </Card>
  );
}

function ComparisonCard({ label, current, previous, change, currentLabel, previousLabel }: {
  label: string; current: string; previous: string; change: number; currentLabel: string; previousLabel: string;
}) {
  const isUp = change > 0;
  return (
    <Card className="p-4">
      <h4 className="text-sm font-medium text-muted-foreground mb-3">{label}</h4>
      <div className="flex items-center gap-3">
        {isUp ? <TrendingUp className="h-5 w-5 text-red-500" /> : <TrendingDown className="h-5 w-5 text-emerald-500" />}
        <span className={`text-lg font-bold ${isUp ? 'text-red-500' : 'text-emerald-500'}`}>
          {change > 0 ? '+' : ''}{change.toFixed(1)}%
        </span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div>
          <p className="text-muted-foreground text-xs">{currentLabel}</p>
          <p className="font-semibold text-foreground">{current}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">{previousLabel}</p>
          <p className="font-semibold text-foreground">{previous}</p>
        </div>
      </div>
    </Card>
  );
}

export default AnaliticaPage;
