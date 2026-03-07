import EnergyShell from '../components/EnergyShell';
import { HistoricalTab } from '../components/forecast/HistoricalTab';

const HistoricoPage = () => (
  <EnergyShell>
    <div className="mb-6">
      <h1 className="text-3xl font-bold text-gray-800">Histórico COES</h1>
      <p className="text-gray-500 mt-1">Datos históricos de demanda del sistema eléctrico</p>
    </div>
    <HistoricalTab />
  </EnergyShell>
);

export default HistoricoPage;
