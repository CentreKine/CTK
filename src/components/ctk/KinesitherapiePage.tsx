import React, { useState } from 'react';
import { 
  Search, Plus, Eye, X, Stethoscope, User, Calendar, Clock,
  Save, CheckCircle, XCircle, AlertCircle, FileText, Printer, Loader2
} from 'lucide-react';
import { 
  Soin, Client, Personnel, ACTES_KINESITHERAPIE, 
  generateId, formatDate, formatMontant 
} from '@/lib/ctk-data';

interface KinesitherapiePageProps {
  soins: Soin[];
  onAddSoin: (soin: Soin) => Promise<void>;
  onUpdateSoin: (soin: Soin) => Promise<void>;
  clients: Client[];
  personnel: Personnel[];
  userRole: 'admin' | 'agent';
}

const KinesitherapiePage: React.FC<KinesitherapiePageProps> = ({ 
  soins, onAddSoin, onUpdateSoin, clients, personnel, userRole 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatut, setFilterStatut] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingSoin, setViewingSoin] = useState<Soin | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    clientId: '',
    acteCode: '',
    personnelId: '',
    date: new Date().toISOString().split('T')[0],
    heure: '09:00',
    notes: ''
  });

  const kinesitherapeutes = personnel.filter(p => 
    p.poste.toLowerCase().includes('kinésithérapeute') && p.statut === 'actif'
  );

  const filteredSoins = soins.filter(soin => {
    const matchesSearch = soin.clientNom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      soin.acteName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatut = filterStatut === 'all' || soin.statut === filterStatut;
    return matchesSearch && matchesStatut;
  });

  const openAddModal = () => {
    setFormData({
      clientId: '',
      acteCode: '',
      personnelId: '',
      date: new Date().toISOString().split('T')[0],
      heure: '09:00',
      notes: ''
    });
    setShowModal(true);
  };

  const openViewModal = (soin: Soin) => {
    setViewingSoin(soin);
    setShowViewModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const client = clients.find(c => c.id === formData.clientId);
      const acte = ACTES_KINESITHERAPIE.find(a => a.code === formData.acteCode);
      const kine = personnel.find(p => p.id === formData.personnelId);

      if (!client || !acte || !kine) return;

      const newSoin: Soin = {
        id: generateId(),
        clientId: formData.clientId,
        clientNom: `${client.prenom} ${client.nom}`,
        acteCode: formData.acteCode,
        acteName: acte.pathologie,
        tarif: acte.tarif,
        personnelId: formData.personnelId,
        personnelNom: `${kine.prenom} ${kine.nom}`,
        date: formData.date,
        heure: formData.heure,
        notes: formData.notes,
        statut: 'en_attente',
        paye: false
      };

      await onAddSoin(newSoin);
      setShowModal(false);
    } catch (error) {
      console.error('Error adding soin:', error);
      alert('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const updateStatut = async (id: string, statut: Soin['statut']) => {
    const soin = soins.find(s => s.id === id);
    if (soin) {
      try {
        await onUpdateSoin({ ...soin, statut });
      } catch (error) {
        console.error('Error updating soin:', error);
      }
    }
  };

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'en_attente':
        return { bg: 'bg-yellow-100 text-yellow-700', icon: AlertCircle, label: 'En attente' };
      case 'en_cours':
        return { bg: 'bg-blue-100 text-blue-700', icon: Clock, label: 'En cours' };
      case 'termine':
        return { bg: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Terminé' };
      case 'annule':
        return { bg: 'bg-red-100 text-red-700', icon: XCircle, label: 'Annulé' };
      default:
        return { bg: 'bg-gray-100 text-gray-700', icon: AlertCircle, label: statut };
    }
  };

  const printFiche = (soin: Soin) => {
    const printContent = `
      <html>
        <head>
          <title>Fiche de Soin - CTK</title>
          <style>
            @page { size: A4 portrait; margin: 5mm; }
            body { font-family: Arial, sans-serif; margin: 0; padding: 0; color: #111; background: #fff; }
            .sheet { display: flex; flex-direction: column; gap: 4mm; width: 100%; min-height: calc(297mm - 10mm); }
            .copy { border: 1px solid #d1d5db; border-radius: 10px; padding: 10px; box-sizing: border-box; page-break-inside: avoid; min-height: 80mm; display: flex; flex-direction: column; justify-content: space-between; }
            .header { text-align: center; margin-bottom: 10px; }
            .logo { font-size: 18px; font-weight: bold; color: #16a34a; }
            .subtitle { color: #666; font-size: 9px; }
            .section { margin: 10px 0; padding: 8px; border: 1px solid #ddd; border-radius: 8px; }
            .label { font-weight: bold; color: #333; font-size: 10px; }
            .value { margin-left: 6px; font-size: 10px; }
            .total { font-size: 12px; font-weight: bold; color: #16a34a; text-align: right; margin-top: 10px; }
            .copy-tag { font-size: 10px; font-weight: 700; color: #166534; text-align: right; margin-bottom: 6px; }
          </style>
        </head>
        <body>
          <div class="sheet">
            ${[1,2,3].map(copy => `
              <div class="copy">
                <div class="copy-tag">Exemplaire ${copy}</div>
                <div class="header">
                  <div class="logo">CTK</div>
                  <div class="subtitle">Centre de Traitement en Kinésithérapie - N'Djamena, Tchad</div>
                  <hr/>
                  <h3 style="margin: 6px 0 0; font-size: 13px;">Fiche de Soin</h3>
                </div>
                <div class="section">
                  <p style="margin: 4px 0;"><span class="label">Patient:</span><span class="value">${soin.clientNom}</span></p>
                  <p style="margin: 4px 0;"><span class="label">Date:</span><span class="value">${formatDate(soin.date)}</span></p>
                  <p style="margin: 4px 0;"><span class="label">Heure:</span><span class="value">${soin.heure}</span></p>
                </div>
                <div class="section">
                  <p style="margin: 4px 0;"><span class="label">Acte:</span><span class="value">${soin.acteCode} - ${soin.acteName}</span></p>
                  <p style="margin: 4px 0;"><span class="label">Kinésithérapeute:</span><span class="value">${soin.personnelNom}</span></p>
                  <p style="margin: 4px 0;"><span class="label">Notes:</span><span class="value">${soin.notes || 'Aucune'}</span></p>
                </div>
                <div class="total">Montant: ${formatMontant(soin.tarif)}</div>
                <p style="text-align: center; margin-top: 12px; color: #666; font-size: 9px;">
                  Merci de votre confiance - CTK
                </p>
              </div>
            `).join('')}
          </div>
        </body>
      </html>
    `;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Service Kinésithérapie</h1>
          <p className="text-gray-500 mt-1">{soins.length} soins enregistrés</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Nouveau Soin
        </button>
      </div>

      {/* Actes Reference Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-green-600" />
          Tarifs des Actes de Kinésithérapie
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {ACTES_KINESITHERAPIE.map((acte) => (
            <div key={acte.code} className="p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-green-200 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-green-600 bg-green-50 px-2 py-0.5 rounded">{acte.code}</span>
                <span className="text-sm font-semibold text-gray-800">{formatMontant(acte.tarif)}</span>
              </div>
              <p className="text-sm text-gray-600 mt-1 truncate" title={acte.pathologie}>{acte.pathologie}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par patient ou acte..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterStatut}
            onChange={(e) => setFilterStatut(e.target.value)}
            className="px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="all">Tous les statuts</option>
            <option value="en_attente">En attente</option>
            <option value="en_cours">En cours</option>
            <option value="termine">Terminé</option>
            <option value="annule">Annulé</option>
          </select>
        </div>
      </div>

      {/* Soins Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Patient</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Acte</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Kinésithérapeute</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Date/Heure</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Tarif</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Statut</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredSoins.map((soin) => {
                const statutInfo = getStatutBadge(soin.statut);
                const StatutIcon = statutInfo.icon;
                return (
                  <tr key={soin.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-green-600" />
                        </div>
                        <span className="font-medium text-gray-800">{soin.clientNom}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <span className="text-xs font-mono text-green-600 bg-green-50 px-2 py-0.5 rounded">{soin.acteCode}</span>
                        <p className="text-sm text-gray-600 mt-1">{soin.acteName}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{soin.personnelNom}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p className="text-gray-800">{formatDate(soin.date)}</p>
                        <p className="text-gray-500">{soin.heure}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-800">{formatMontant(soin.tarif)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statutInfo.bg}`}>
                        <StatutIcon className="w-3 h-3" />
                        {statutInfo.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openViewModal(soin)}
                          className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Voir détails"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => printFiche(soin)}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Imprimer"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        {soin.statut === 'en_attente' && (
                          <button
                            onClick={() => updateStatut(soin.id, 'en_cours')}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Démarrer"
                          >
                            <Clock className="w-4 h-4" />
                          </button>
                        )}
                        {soin.statut === 'en_cours' && (
                          <button
                            onClick={() => updateStatut(soin.id, 'termine')}
                            className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Terminer"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredSoins.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Stethoscope className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Aucun soin trouvé</p>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-800">Nouveau Soin</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient *</label>
                <select
                  required
                  value={formData.clientId}
                  onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Sélectionner un patient</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.prenom} {client.nom}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Acte de Kinésithérapie *</label>
                <select
                  required
                  value={formData.acteCode}
                  onChange={(e) => setFormData({ ...formData, acteCode: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Sélectionner un acte</option>
                  {ACTES_KINESITHERAPIE.map(acte => (
                    <option key={acte.code} value={acte.code}>
                      {acte.code} - {acte.pathologie} ({formatMontant(acte.tarif)})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kinésithérapeute *</label>
                <select
                  required
                  value={formData.personnelId}
                  onChange={(e) => setFormData({ ...formData, personnelId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Sélectionner un kinésithérapeute</option>
                  {kinesitherapeutes.map(kine => (
                    <option key={kine.id} value={kine.id}>
                      {kine.prenom} {kine.nom} - {kine.specialite}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Heure *</label>
                  <input
                    type="time"
                    required
                    value={formData.heure}
                    onChange={(e) => setFormData({ ...formData, heure: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Notes cliniques..."
                />
              </div>
              {formData.acteCode && (
                <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                  <p className="text-sm text-gray-600">Tarif de l'acte:</p>
                  <p className="text-xl font-bold text-green-600">
                    {formatMontant(ACTES_KINESITHERAPIE.find(a => a.code === formData.acteCode)?.tarif || 0)}
                  </p>
                </div>
              )}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && viewingSoin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="bg-gradient-to-r from-green-600 to-green-500 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-xl font-semibold text-white">Détails du Soin</h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{viewingSoin.clientNom}</p>
                  <p className="text-sm text-gray-500">Patient</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Code Acte</p>
                  <p className="font-mono text-green-600">{viewingSoin.acteCode}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Tarif</p>
                  <p className="font-semibold text-gray-800">{formatMontant(viewingSoin.tarif)}</p>
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">Acte</p>
                <p className="text-gray-800">{viewingSoin.acteName}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">Kinésithérapeute</p>
                <p className="text-gray-800">{viewingSoin.personnelNom}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Date</p>
                  <p className="text-gray-800">{formatDate(viewingSoin.date)}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Heure</p>
                  <p className="text-gray-800">{viewingSoin.heure}</p>
                </div>
              </div>
              {viewingSoin.notes && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Notes</p>
                  <p className="text-gray-800">{viewingSoin.notes}</p>
                </div>
              )}
              <div className="flex justify-center pt-4">
                <button
                  onClick={() => printFiche(viewingSoin)}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  Imprimer la fiche
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KinesitherapiePage;
