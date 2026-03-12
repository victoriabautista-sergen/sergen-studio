import EnergyShell from '../components/EnergyShell';

const HistoricoPage = () => (
  <EnergyShell>
    <div className="mb-6">
      <h1 className="text-3xl font-bold text-gray-800">Histórico COES</h1>
      <p className="text-gray-500 mt-1">Datos históricos de demanda del sistema eléctrico</p>
    </div>
    <div className="text-center py-16">
      <p className="text-gray-500">
        Los datos históricos son gestionados por el scraper externo y se visualizan en el dashboard de Potencia Máxima.
      </p>
    </div>
  </EnergyShell>
);

export default HistoricoPage;
