import { useState, useEffect } from 'react';
import EnergyShell from '../components/EnergyShell';
import { useReports } from '../hooks/useReports';
import { ReportsList } from '../components/reports/ReportsList';
import { ReportUploadCard } from '../components/reports/ReportUploadCard';
import { ReportDateSelector } from '../components/reports/ReportDateSelector';
import type { Report } from '../hooks/useReports';

const ReportesPage = () => {
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);

  const { reports, isLoading, uploading, deletingId, error, handleFileUpload, handleDelete, fetchReports } =
    useReports();

  const parseReportFilename = (filename: string) => {
    const parts = filename.split(' ');
    if (parts.length >= 2) {
      return { month: parts[0].toUpperCase(), year: parts[1].replace('-', '').trim() };
    }
    return null;
  };

  const getAvailableYears = () => {
    if (!reports || reports.length === 0) return [];
    const years = new Set<string>();
    reports.forEach(r => {
      const parsed = parseReportFilename(r.filename);
      if (parsed?.year) years.add(parsed.year);
    });
    return Array.from(years).sort((a, b) => parseInt(b) - parseInt(a));
  };

  const updateAvailableMonths = (year: string | null) => {
    if (!year || !reports) {
      setAvailableMonths([]);
      return;
    }
    const months = new Set<string>();
    reports.forEach(r => {
      const parsed = parseReportFilename(r.filename);
      if (parsed?.year === year) months.add(parsed.month);
    });
    setAvailableMonths(Array.from(months));
  };

  const filterReports = () => {
    if (!reports || !selectedYear) {
      setFilteredReports([]);
      return;
    }
    const filtered = reports.filter(r => {
      const parsed = parseReportFilename(r.filename);
      if (!parsed) return false;
      if (selectedYear && selectedMonth) return parsed.year === selectedYear && parsed.month === selectedMonth;
      return parsed.year === selectedYear;
    });
    setFilteredReports(filtered);
  };

  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    setSelectedMonth(null);
    updateAvailableMonths(year);
  };

  const handleClearFilters = () => {
    setSelectedYear(null);
    setSelectedMonth(null);
    setAvailableMonths([]);
  };

  useEffect(() => { filterReports(); }, [selectedYear, selectedMonth, reports]);
  useEffect(() => { if (selectedYear) updateAvailableMonths(selectedYear); }, [reports, selectedYear]);

  const getDisplayTitle = () => {
    if (selectedYear && selectedMonth) return `Reportes - ${selectedMonth} ${selectedYear}`;
    if (selectedYear) return `Reportes - ${selectedYear}`;
    return 'Reportes';
  };

  return (
    <EnergyShell>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Reportes</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <ReportDateSelector
            availableYears={getAvailableYears()}
            availableMonths={availableMonths}
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            onYearChange={handleYearChange}
            onMonthChange={setSelectedMonth}
            onClearFilters={handleClearFilters}
          />
          <ReportUploadCard uploading={uploading} onFileUpload={handleFileUpload} className="mt-4" />
        </div>

        <div className="lg:col-span-3">
          <h2 className="text-xl font-semibold mb-4">{getDisplayTitle()}</h2>
          <ReportsList
            reports={selectedYear ? filteredReports : reports}
            isLoading={isLoading}
            deletingId={deletingId}
            error={error}
            onDelete={handleDelete}
            onRetry={fetchReports}
          />
        </div>
      </div>
    </EnergyShell>
  );
};

export default ReportesPage;
