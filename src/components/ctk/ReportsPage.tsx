import React, { useState } from 'react';
import { FileText, Download, Printer, Calendar, TrendingUp, BarChart3 } from 'lucide-react';
import { Client, Paiement, FicheSuivi, Transaction, Stock, formatDate, formatMontant } from '@/lib/ctk-data';
import { ReportGenerator, ActivityReport } from '@/lib/reportGenerator';
import { useAuth } from '@/contexts/AuthContext';

interface ReportsPageProps {
  clients: Client[];
  paiements: Paiement[];
  fiches: FicheSuivi[];
  transactions: Transaction[];
  stocks: Stock[];
}

const ReportsPage: React.FC<ReportsPageProps> = ({
  clients,
  paiements,
  fiches,
  transactions,
  stocks
}) => {
  const { currentUser } = useAuth();
  const [selectedReport, setSelectedReport] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [generatedReport, setGeneratedReport] = useState<ActivityReport | null>(null);

  const generateReport = () => {
    if (!currentUser) return;

    let report: ActivityReport;
    switch (selectedReport) {
      case 'daily':
        report = ReportGenerator.generateDailyReport(
          clients, paiements, fiches, transactions, stocks,
          currentUser.id, `${currentUser.prenom} ${currentUser.nom}`
        );
        break;
      case 'weekly':
        report = ReportGenerator.generateWeeklyReport(
          clients, paiements, fiches, transactions, stocks,
          currentUser.id, `${currentUser.prenom} ${currentUser.nom}`
        );
        break;
      case 'monthly':
        report = ReportGenerator.generateMonthlyReport(
          clients, paiements, fiches, transactions, stocks,
          currentUser.id, `${currentUser.prenom} ${currentUser.nom}`
        );
        break;
    }

    setGeneratedReport(report);

    // Save to localStorage
    const reports = JSON.parse(localStorage.getItem('ctk_reports') || '[]');
    reports.push(report);
    if (reports.length > 50) reports.shift();
    localStorage.setItem('ctk_reports', JSON.stringify(reports));
  };

  const savedReports = JSON.parse(localStorage.getItem('ctk_reports') || '[]');

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <BarChart3 className="w-8 h-8 text-green-600" />
        <h1 className="text-2xl font-bold">Rapports d'Activité</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report Generation Panel */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow">
          <h2 className="text-lg font-semibold mb-4">Générer un Rapport</h2>

          <div className="space-y-4">
            {/* Report Type Selection */}
            <div>
              <label className="block text-sm font-medium mb-3">Type de Rapport</label>
              <div className="grid grid-cols-3 gap-3">
                {['daily', 'weekly', 'monthly'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedReport(type as any)}
                    className={`p-4 rounded-lg border-2 transition-all text-center cursor-pointer ${
                      selectedReport === type
                        ? 'border-green-600 bg-green-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <Calendar className="w-5 h-5 mx-auto mb-2" />
                    <div className="font-semibold text-sm">
                      {type === 'daily' ? 'Journalier' : type === 'weekly' ? 'Hebdomadaire' : 'Mensuel'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Summary Preview */}
            {generatedReport && (
              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border border-green-200">
                <h3 className="font-semibold mb-3 text-green-900">Résumé du Rapport</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded p-2">
                    <div className="text-xs text-gray-600">Clients</div>
                    <div className="text-xl font-bold text-green-600">{generatedReport.summary.totalClients}</div>
                  </div>
                  <div className="bg-white rounded p-2">
                    <div className="text-xs text-gray-600">Paiements</div>
                    <div className="text-xl font-bold text-green-600">{generatedReport.summary.totalPaiements}</div>
                  </div>
                  <div className="bg-white rounded p-2">
                    <div className="text-xs text-gray-600">Montant</div>
                    <div className="text-xl font-bold text-green-600">{formatMontant(generatedReport.summary.totalAmount)}</div>
                  </div>
                  <div className="bg-white rounded p-2">
                    <div className="text-xs text-gray-600">Fiches</div>
                    <div className="text-xl font-bold text-green-600">{generatedReport.summary.totalFiches}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Generate Button */}
            <button
              onClick={generateReport}
              className="w-full bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              📊 Générer le Rapport
            </button>

            {/* Actions */}
            {generatedReport && (
              <div className="flex gap-2">
                <button
                  onClick={() => ReportGenerator.printReport(generatedReport)}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  Imprimer
                </button>
                <button
                  onClick={() => ReportGenerator.downloadReportAsHTML(generatedReport)}
                  className="flex-1 flex items-center justify-center gap-2 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Télécharger
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Statistics Panel */}
        <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-6 shadow border border-green-200">
          <h3 className="font-semibold mb-4 text-green-900">📈 Statistiques</h3>
          <div className="space-y-3">
            <div className="bg-white rounded-lg p-3 border-l-4 border-green-600">
              <div className="text-xs text-gray-600">Total Clients</div>
              <div className="text-2xl font-bold text-green-600">{clients.length}</div>
            </div>
            <div className="bg-white rounded-lg p-3 border-l-4 border-blue-600">
              <div className="text-xs text-gray-600">Fiches Créées</div>
              <div className="text-2xl font-bold text-blue-600">{fiches.length}</div>
            </div>
            <div className="bg-white rounded-lg p-3 border-l-4 border-yellow-600">
              <div className="text-xs text-gray-600">Paiements</div>
              <div className="text-2xl font-bold text-yellow-600">{paiements.length}</div>
            </div>
            <div className="bg-white rounded-lg p-3 border-l-4 border-purple-600">
              <div className="text-xs text-gray-600">Transactions</div>
              <div className="text-2xl font-bold text-purple-600">{transactions.length}</div>
            </div>
            <div className="bg-white rounded-lg p-3 border-l-4 border-orange-600">
              <div className="text-xs text-gray-600">Total Revenus</div>
              <div className="text-2xl font-bold text-orange-600">
                {formatMontant(paiements.reduce((sum, p) => sum + p.montant, 0))}
              </div>
            </div>
            <div className="bg-white rounded-lg p-3 border-l-4 border-red-600">
              <div className="text-xs text-gray-600">Articles en Stock</div>
              <div className="text-2xl font-bold text-red-600">{stocks.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Saved Reports */}
      {savedReports.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-green-600" />
            Rapports Précédents ({savedReports.length})
          </h2>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {savedReports.map((report: ActivityReport) => (
              <div
                key={report.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div>
                  <div className="font-medium">{report.date}</div>
                  <div className="text-sm text-gray-600">
                    {report.type === 'daily' ? '📅 Journalier' : report.type === 'weekly' ? '📆 Hebdomadaire' : '📈 Mensuel'} • {formatDate(report.generatedAt)}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => ReportGenerator.printReport(report)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Imprimer"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => ReportGenerator.downloadReportAsHTML(report)}
                    className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                    title="Télécharger"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
