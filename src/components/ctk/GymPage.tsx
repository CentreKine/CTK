import React, { useState } from 'react';
import { 
  Search, Plus, Eye, X, Dumbbell, User, Calendar, Clock,
  Save, CheckCircle, AlertCircle, CreditCard, Printer, Loader2
} from 'lucide-react';
import { 
  AbonnementClient, Client, ABONNEMENTS_GYM,
  generateId, formatDate, formatMontant 
} from '@/lib/ctk-data';

interface GymPageProps {
  abonnements: AbonnementClient[];
  onAdd: (abo: AbonnementClient) => Promise<void>;
  onUpdate: (abo: AbonnementClient) => Promise<void>;
  clients: Client[];
  userRole: 'admin' | 'agent';
}

const GymPage: React.FC<GymPageProps> = ({ 
  abonnements, onAdd, onUpdate, clients, userRole 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatut, setFilterStatut] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingAbonnement, setViewingAbonnement] = useState<AbonnementClient | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    clientId: '',
    type: 'mensuel',
    dateDebut: new Date().toISOString().split('T')[0]
  });

  const filteredAbonnements = abonnements.filter(abo => {
    const matchesSearch = abo.clientNom.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatut = filterStatut === 'all' || abo.statut === filterStatut;
    return matchesSearch && matchesStatut;
  });

  const openAddModal = () => {
    setFormData({
      clientId: '',
      type: 'mensuel',
      dateDebut: new Date().toISOString().split('T')[0]
    });
    setShowModal(true);
  };

  const openViewModal = (abo: AbonnementClient) => {
    setViewingAbonnement(abo);
    setShowViewModal(true);
  };

  const calculateDateFin = (dateDebut: string, type: string): string => {
    const aboType = ABONNEMENTS_GYM.find(a => a.type === type);
    if (!aboType) return dateDebut;
    
    const date = new Date(dateDebut);
    date.setDate(date.getDate() + aboType.dureeJours);
    return date.toISOString().split('T')[0];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const client = clients.find(c => c.id === formData.clientId);
      const aboType = ABONNEMENTS_GYM.find(a => a.type === formData.type);

      if (!client || !aboType) return;

      const newAbonnement: AbonnementClient = {
        id: generateId(),
        clientId: formData.clientId,
        clientNom: `${client.prenom} ${client.nom}`,
        type: aboType.nom,
        dateDebut: formData.dateDebut,
        dateFin: calculateDateFin(formData.dateDebut, formData.type),
        montant: aboType.tarif,
        paye: false,
        statut: 'actif'
      };

      await onAdd(newAbonnement);
      setShowModal(false);
    } catch (error) {
      console.error('Error adding abonnement:', error);
      alert('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'actif':
        return { bg: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Actif' };
      case 'expire':
        return { bg: 'bg-red-100 text-red-700', icon: AlertCircle, label: 'Expiré' };
      case 'suspendu':
        return { bg: 'bg-yellow-100 text-yellow-700', icon: Clock, label: 'Suspendu' };
      default:
        return { bg: 'bg-gray-100 text-gray-700', icon: AlertCircle, label: statut };
    }
  };

  const printCarte = (abo: AbonnementClient) => {
    const printContent = `
      <html>
        <head>
          <title>Carte d'Abonnement Gym - CTK</title>
          <style>
            @page { size: A4 portrait; margin: 5mm; }
            body { font-family: Arial, sans-serif; margin: 0; padding: 0; color: #111; background: #fff; }
            .sheet { display: flex; flex-direction: column; gap: 4mm; width: 100%; min-height: calc(297mm - 10mm); }
            .card {
              border: 2px solid #16a34a;
              border-radius: 14px;
              padding: 14px;
              background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
              box-sizing: border-box;
              page-break-inside: avoid;
              min-height: 80mm;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
            }
            .header { text-align: center; margin-bottom: 10px; }
            .logo { font-size: 18px; font-weight: bold; color: #16a34a; }
            .subtitle { color: #666; font-size: 9px; }
            .gym-badge {
              background: #16a34a;
              color: white;
              padding: 4px 10px;
              border-radius: 20px;
              display: inline-block;
              margin-top: 6px;
              font-size: 10px;
            }
            .member-name {
              font-size: 16px;
              font-weight: bold;
              text-align: center;
              margin: 10px 0;
              color: #166534;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              margin: 7px 0;
              padding: 5px 0;
              border-bottom: 1px dashed #86efac;
              font-size: 10px;
            }
            .label { color: #666; }
            .value { font-weight: bold; color: #166534; }
            .validity {
              text-align: center;
              margin-top: 10px;
              padding: 8px;
              background: white;
              border-radius: 8px;
              font-size: 10px;
            }
            .copy-tag { font-size: 10px; font-weight: 700; color: #166534; text-align: right; margin-bottom: 6px; }
          </style>
        </head>
        <body>
          <div class="sheet">
            ${[1,2,3].map(copy => `
              <div class="card">
                <div class="copy-tag">Exemplaire ${copy}</div>
                <div class="header">
                  <div class="logo">CTK</div>
                  <div class="subtitle">Centre de Traitement en Kinésithérapie - N'Djamena, Tchad</div>
                  <div class="gym-badge">ABONNEMENT GYM</div>
                </div>
                <div class="member-name">${abo.clientNom}</div>
                <div class="info-row">
                  <span class="label">Type:</span>
                  <span class="value">${abo.type}</span>
                </div>
                <div class="info-row">
                  <span class="label">Début:</span>
                  <span class="value">${formatDate(abo.dateDebut)}</span>
                </div>
                <div class="info-row">
                  <span class="label">Fin:</span>
                  <span class="value">${formatDate(abo.dateFin)}</span>
                </div>
                <div class="validity">
                  <strong>Montant: ${formatMontant(abo.montant)}</strong>
                </div>
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

  const activeCount = abonnements.filter(a => a.statut === 'actif').length;
  const expiredCount = abonnements.filter(a => a.statut === 'expire').length;
  const totalRevenue = abonnements.filter(a => a.paye).reduce((sum, a) => sum + a.montant, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Abonnements Gym</h1>
          <p className="text-gray-500 mt-1">{abonnements.length} abonnements</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Nouvel Abonnement
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{activeCount}</p>
              <p className="text-sm text-gray-500">Abonnements actifs</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{expiredCount}</p>
              <p className="text-sm text-gray-500">Abonnements expirés</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <CreditCard className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{formatMontant(totalRevenue)}</p>
              <p className="text-sm text-gray-500">Revenus gym</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tarifs Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Dumbbell className="w-5 h-5 text-green-600" />
          Tarifs des Abonnements
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {ABONNEMENTS_GYM.map((abo) => (
            <div key={abo.type} className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200 text-center hover:shadow-md transition-shadow">
              <h3 className="font-semibold text-gray-800 text-lg">{abo.nom}</h3>
              <p className="text-3xl font-bold text-green-600 my-2">{formatMontant(abo.tarif)}</p>
              <p className="text-sm text-gray-500">{abo.dureeJours} jours</p>
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
              placeholder="Rechercher par nom..."
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
            <option value="actif">Actif</option>
            <option value="expire">Expiré</option>
            <option value="suspendu">Suspendu</option>
          </select>
        </div>
      </div>

      {/* Abonnements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAbonnements.map((abo) => {
          const statutInfo = getStatutBadge(abo.statut);
          return (
            <div key={abo.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              <div className="bg-gradient-to-r from-green-600 to-green-500 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <Dumbbell className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-white">
                      <h3 className="font-semibold">{abo.clientNom}</h3>
                      <p className="text-green-100 text-sm">{abo.type}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statutInfo.bg}`}>
                    {statutInfo.label}
                  </span>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Début:</span>
                  <span className="font-medium text-gray-800">{formatDate(abo.dateDebut)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Fin:</span>
                  <span className="font-medium text-gray-800">{formatDate(abo.dateFin)}</span>
                </div>
                <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-100">
                  <span className="text-gray-500">Montant:</span>
                  <span className="font-bold text-green-600">{formatMontant(abo.montant)}</span>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    abo.paye ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {abo.paye ? 'Payé' : 'Non payé'}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openViewModal(abo)}
                      className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Voir détails"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => printCarte(abo)}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Imprimer carte"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredAbonnements.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-500">
          <Dumbbell className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Aucun abonnement trouvé</p>
        </div>
      )}

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-800">Nouvel Abonnement Gym</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client *</label>
                <select
                  required
                  value={formData.clientId}
                  onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Sélectionner un client</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.prenom} {client.nom}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type d'abonnement *</label>
                <select
                  required
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {ABONNEMENTS_GYM.map(abo => (
                    <option key={abo.type} value={abo.type}>
                      {abo.nom} - {formatMontant(abo.tarif)} ({abo.dureeJours} jours)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date de début *</label>
                <input
                  type="date"
                  required
                  value={formData.dateDebut}
                  onChange={(e) => setFormData({ ...formData, dateDebut: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              {formData.type && (
                <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Montant:</span>
                    <span className="text-xl font-bold text-green-600">
                      {formatMontant(ABONNEMENTS_GYM.find(a => a.type === formData.type)?.tarif || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-2 text-sm">
                    <span className="text-gray-500">Date de fin:</span>
                    <span className="text-gray-700">{formatDate(calculateDateFin(formData.dateDebut, formData.type))}</span>
                  </div>
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
      {showViewModal && viewingAbonnement && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="bg-gradient-to-r from-green-600 to-green-500 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-xl font-semibold text-white">Détails Abonnement</h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                  <Dumbbell className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mt-3">{viewingAbonnement.clientNom}</h3>
                <p className="text-green-600 font-medium">{viewingAbonnement.type}</p>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-500">Date début:</span>
                  <span className="font-medium">{formatDate(viewingAbonnement.dateDebut)}</span>
                </div>
                <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-500">Date fin:</span>
                  <span className="font-medium">{formatDate(viewingAbonnement.dateFin)}</span>
                </div>
                <div className="flex justify-between p-3 bg-green-50 rounded-lg">
                  <span className="text-gray-600">Montant:</span>
                  <span className="font-bold text-green-600">{formatMontant(viewingAbonnement.montant)}</span>
                </div>
              </div>
              <div className="flex justify-center pt-4">
                <button
                  onClick={() => printCarte(viewingAbonnement)}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  Imprimer la carte
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GymPage;
