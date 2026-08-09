import React, { useState } from 'react';
import { 
  Search, Plus, X, CreditCard, User, Calendar,
  Save, Printer, FileText, CheckCircle, Loader2
} from 'lucide-react';
import { 
  Paiement, Soin, AbonnementClient,
  generateId, formatDate, formatMontant 
} from '@/lib/ctk-data';

interface PaiementsPageProps {
  paiements: Paiement[];
  onAddPaiement: (paiement: Paiement) => Promise<void>;
  onUpdatePaiement: (paiement: Paiement) => Promise<void>;
  soins: Soin[];
  onUpdateSoin: (soin: Soin) => Promise<void>;
  abonnements: AbonnementClient[];
  onUpdateAbonnement: (abo: AbonnementClient) => Promise<void>;
  userRole: 'admin' | 'agent';
}

const PaiementsPage: React.FC<PaiementsPageProps> = ({ 
  paiements, onAddPaiement, onUpdatePaiement, soins, onUpdateSoin, abonnements, onUpdateAbonnement, userRole 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [showRapportModal, setShowRapportModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    type: 'soin' as 'soin' | 'abonnement' | 'autre',
    itemId: '',
    modePaiement: 'especes' as 'especes' | 'mobile_money' | 'carte' | 'virement',
    description: '',
    nombreSeances: 1,
    pourcentage: 100
  });

  const unpaidSoins = soins.filter(s => !s.paye && (s.statut === 'termine' || s.statut === 'en_cours'));
  const paidSoins = soins.filter(s => s.paye);
  const unpaidAbonnements = abonnements.filter(a => !a.paye);

  const filteredPaiements = paiements.filter(p => {
    const matchesSearch = p.clientNom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.reference.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || p.type === filterType;
    return matchesSearch && matchesType;
  });

  const generateReference = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.random().toString(36).substr(2, 5).toUpperCase();
    return `CTK-${year}${month}${day}-${random}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      let clientId = '';
      let clientNom = '';
      let montant = 0;
      let description = formData.description;

      if (formData.type === 'soin') {
        const soin = soins.find(s => s.id === formData.itemId);
        if (!soin) {
          alert('Soin introuvable !');
          return;
        }
        
        // Vérifier que le soin n'est pas déjà payé
        if (soin.paye) {
          alert('Ce soin a déjà été payé !');
          return;
        }
        
        clientId = soin.clientId;
        clientNom = soin.clientNom;
        const base = soin.tarif * formData.nombreSeances;
        const percent = Math.max(0, Math.min(100, Number(formData.pourcentage || 100)));
        montant = Math.round(base * (percent / 100));
        description = `Soin: ${soin.acteName} (${formData.nombreSeances} séance${formData.nombreSeances > 1 ? 's' : ''}) - ${percent}%`;
        
        // Mettre à jour le soin en préservant son statut actuel s'il est en_cours
        await onUpdateSoin({ 
          ...soin, 
          paye: true,
          statut: soin.statut === 'en_cours' ? 'en_cours' : 'termine'
        });
      } else if (formData.type === 'abonnement') {
        const abo = abonnements.find(a => a.id === formData.itemId);
        if (!abo) {
          alert('Abonnement introuvable !');
          return;
        }
        
        // Vérifier que l'abonnement n'est pas déjà payé
        if (abo.paye) {
          alert('Cet abonnement a déjà été payé !');
          return;
        }
        
        clientId = abo.clientId;
        clientNom = abo.clientNom;
        const baseAbo = abo.montant * formData.nombreSeances;
        const percentAbo = Math.max(0, Math.min(100, Number(formData.pourcentage || 100)));
        montant = Math.round(baseAbo * (percentAbo / 100));
        description = `Abonnement Gym: ${abo.type} (${formData.nombreSeances} séance${formData.nombreSeances > 1 ? 's' : ''}) - ${percentAbo}%`;
        await onUpdateAbonnement({ ...abo, paye: true });
      } else {
        clientNom = 'Autre';
        montant = 0;
      }

      const newPaiement: Paiement = {
        id: generateId(),
        reference: generateReference(),
        type: formData.type,
        clientId: clientId || formData.itemId,
        clientNom,
        description,
        montant,
        date: new Date().toISOString().split('T')[0],
        modePaiement: formData.modePaiement,
        recu: false
      };

      await onAddPaiement(newPaiement);
      setShowModal(false);
    } catch (error) {
      console.error('Error adding paiement:', error);
      alert('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const printRecu = async (paiement: Paiement) => {
    const getModeText = (mode: Paiement['modePaiement']) => {
      if (mode === 'especes') return 'Espèces';
      if (mode === 'mobile_money') return 'Mobile Money';
      if (mode === 'carte') return 'Carte bancaire';
      return 'Virement';
    };

    const printContent = `
      <html>
        <head>
          <title>Facture - CTK</title>
          <style>
            @page { size: A4 portrait; margin: 5mm; }
            body { font-family: Inter, Arial, sans-serif; margin: 0; padding: 0; color: #111; background: #fff; }
            .sheet { display: flex; flex-direction: column; gap: 4mm; width: 100%; min-height: calc(297mm - 10mm); }
            .invoice { border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 10px; box-sizing: border-box; page-break-inside: avoid; min-height: 80mm; display: flex; flex-direction: column; justify-content: space-between; }
            .invoice-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; gap: 10px; }
            .logo-section { flex-shrink: 0; }
            .logo-section img { max-width: 80px; height: auto; }
            .info-section { flex: 1; }
            .brand { font-size: 14px; font-weight: 800; color: #16a34a; letter-spacing: 0.5px; }
            .subtitle { margin-top: 2px; font-size: 8px; color: #4b5563; }
            .tag { background: #16a34a; color: #fff; padding: 2px 6px; border-radius: 999px; font-size: 8px; font-weight: 700; letter-spacing: 0.2px; }
            .section { margin-top: 6px; margin-bottom: 6px; }
            .section-title { font-weight: 700; font-size: 10px; color: #111827; margin-bottom: 4px; }
            .line { margin-top: 4px; margin-bottom: 4px; display: flex; justify-content: space-between; font-size: 9px; gap: 4px; }
            .line strong { color: #111827; }
            .total { background: #ecfdf3; border: 1px solid #d1fae5; padding: 7px; border-radius: 6px; text-align: right; margin-top: 8px; font-weight: 700; color: #065f46; font-size: 9px; }
            .small-footer { margin-top: 6px; font-size: 8px; color: #64748b; text-align: center; }
            .copy-title { font-size: 10px; margin-bottom: 6px; font-weight: 700; color: #0f172a; }
          </style>
        </head>
        <body>
          <div class="sheet">
            ${[1,2,3].map(copy => `
              <div class="invoice">
                <div class="invoice-header">
                  <div class="logo-section">
                    <img src="https://d64gsuwffb70l.cloudfront.net/696faca652fe36008fa92531_1768926542042_42a9b869.png" alt="Logo CTK">
                  </div>
                  <div class="info-section">
                    <div class="brand">CTK Kiné & Gym</div>
                    <div class="subtitle">Centre de Traitement en Kinésithérapie - N'Djamena, Tchad</div>
                  </div>
                  <div class="tag">COPIE ${copy}</div>
                </div>

                <div class="section">
                  <div class="section-title">Facture</div>
                  <div class="line"><span>Réf.</span><strong>${paiement.reference}</strong></div>
                  <div class="line"><span>Date</span><strong>${formatDate(paiement.date)}</strong></div>
                  <div class="line"><span>Client</span><strong>${paiement.clientNom}</strong></div>
                  <div class="line"><span>Type</span><strong>${paiement.type}</strong></div>
                </div>

                <div class="section">
                  <div class="section-title">Détails</div>
                  <div class="line"><span>Description</span><strong>${paiement.description}</strong></div>
                  <div class="line"><span>Mode de paiement</span><strong>${getModeText(paiement.modePaiement)}</strong></div>
                </div>

                <div class="total">Montant à payer: ${formatMontant(paiement.montant)}</div>
                <div style="margin-top: 12px; padding: 10px; background: #fef3c7; border: 1px solid #fcd34d; border-radius: 4px; font-size: 8px; color: #78350f; line-height: 1.4;">
                  <strong>Note Importante :</strong> Afin de garantir votre rééducation, vos séances doivent être suivi régulièrement. Ce forfait expire après 30 jours consécutifs sans soins, sauf en cas d'accord préalable ou d'absence signalée au cabinet. Passant ce délai, les séances restantes seront perdues
                </div>
                <div class="small-footer">Merci pour votre confiance. CTK - Centre de traitement kiné</div>
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
      printWindow.focus();
      printWindow.print();
    }

    try {
      await onUpdatePaiement({ ...paiement, recu: true });
    } catch (error) {
      console.error('Error updating paiement:', error);
    }
  };

  const getWeeklyReport = () => {
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    return paiements.filter(p => {
      const pDate = new Date(p.date);
      return pDate >= weekAgo && pDate <= today;
    });
  };

  const printWeeklyReport = () => {
    const weeklyPaiements = getWeeklyReport();
    const total = weeklyPaiements.reduce((sum, p) => sum + p.montant, 0);
    const bySoin = weeklyPaiements.filter(p => p.type === 'soin');
    const byAbonnement = weeklyPaiements.filter(p => p.type === 'abonnement');

    const printContent = `
      <html>
        <head>
          <title>Rapport Hebdomadaire - CTK</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 28px; font-weight: bold; color: #16a34a; }
            .report-title { font-size: 20px; margin-top: 10px; }
            .summary { 
              display: flex; 
              justify-content: space-around; 
              margin: 30px 0;
              padding: 20px;
              background: #f0fdf4;
              border-radius: 10px;
            }
            .summary-item { text-align: center; }
            .summary-value { font-size: 24px; font-weight: bold; color: #16a34a; }
            .summary-label { color: #666; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background: #16a34a; color: white; }
            .total-row { font-weight: bold; background: #f0fdf4; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">CTK</div>
            <div class="report-title">Rapport Hebdomadaire des Paiements</div>
            <p>Période: ${formatDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())} - ${formatDate(new Date().toISOString())}</p>
          </div>
          <div class="summary">
            <div class="summary-item">
              <div class="summary-value">${weeklyPaiements.length}</div>
              <div class="summary-label">Paiements</div>
            </div>
            <div class="summary-item">
              <div class="summary-value">${bySoin.length}</div>
              <div class="summary-label">Soins</div>
            </div>
            <div class="summary-item">
              <div class="summary-value">${byAbonnement.length}</div>
              <div class="summary-label">Abonnements</div>
            </div>
            <div class="summary-item">
              <div class="summary-value">${formatMontant(total)}</div>
              <div class="summary-label">Total</div>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Référence</th>
                <th>Date</th>
                <th>Client</th>
                <th>Type</th>
                <th>Montant</th>
              </tr>
            </thead>
            <tbody>
              ${weeklyPaiements.map(p => `
                <tr>
                  <td>${p.reference}</td>
                  <td>${formatDate(p.date)}</td>
                  <td>${p.clientNom}</td>
                  <td>${p.type}</td>
                  <td>${formatMontant(p.montant)}</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td colspan="4">TOTAL</td>
                <td>${formatMontant(total)}</td>
              </tr>
            </tbody>
          </table>
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

  const totalJour = paiements
    .filter(p => p.date === new Date().toISOString().split('T')[0])
    .reduce((sum, p) => sum + p.montant, 0);

  const totalSemaine = getWeeklyReport().reduce((sum, p) => sum + p.montant, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Gestion des Paiements</h1>
          <p className="text-gray-500 mt-1">{paiements.length} paiements enregistrés</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowRapportModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm"
          >
            <FileText className="w-5 h-5" />
            Rapport Hebdo
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Nouveau Paiement
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <CreditCard className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{formatMontant(totalJour)}</p>
              <p className="text-sm text-gray-500">Aujourd'hui</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{formatMontant(totalSemaine)}</p>
              <p className="text-sm text-gray-500">Cette semaine</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <FileText className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{unpaidSoins.length}</p>
              <p className="text-sm text-gray-500">Soins non payés</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <User className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{unpaidAbonnements.length}</p>
              <p className="text-sm text-gray-500">Abos non payés</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par client ou référence..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="all">Tous les types</option>
            <option value="soin">Soins</option>
            <option value="abonnement">Abonnements</option>
            <option value="autre">Autres</option>
          </select>
        </div>
      </div>

      {/* Paiements Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Référence</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Client</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Description</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Date</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Mode</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Montant</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPaiements.map((paiement) => (
                <tr key={paiement.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm text-green-600 bg-green-50 px-2 py-1 rounded">
                      {paiement.reference}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-800">{paiement.clientNom}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{paiement.description}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{formatDate(paiement.date)}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                      {paiement.modePaiement === 'especes' ? 'Espèces' : 
                       paiement.modePaiement === 'mobile_money' ? 'Mobile Money' :
                       paiement.modePaiement === 'carte' ? 'Carte' : 'Virement'}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-green-600">{formatMontant(paiement.montant)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => printRecu(paiement)}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Printer className="w-4 h-4" />
                        Reçu
                      </button>
                      {paiement.recu && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredPaiements.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Aucun paiement trouvé</p>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-800">Nouveau Paiement</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type de paiement *</label>
                <select
                  required
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any, itemId: '' })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="soin">Soin de kinésithérapie</option>
                  <option value="abonnement">Abonnement Gym</option>
                </select>
              </div>
              
              {formData.type === 'soin' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Soin à payer *</label>
                    <select
                      required
                      value={formData.itemId}
                      onChange={(e) => setFormData({ ...formData, itemId: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Sélectionner un soin</option>
                      {unpaidSoins.map(soin => (
                        <option key={soin.id} value={soin.id}>
                          {soin.clientNom} - {soin.acteName} ({formatMontant(soin.tarif)}/séance)
                        </option>
                      ))}
                    </select>
                    {unpaidSoins.length === 0 && (
                      <p className="text-sm text-yellow-600 mt-1">Aucun soin en attente de paiement</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de séances *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={formData.nombreSeances}
                      onChange={(e) => setFormData({ ...formData, nombreSeances: parseInt(e.target.value) || 1 })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    {formData.itemId && (
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <p className="text-sm text-gray-600 mb-2">Détails du soin sélectionné:</p>
                        <div className="space-y-1">
                          <p className="text-sm">
                            <span className="font-medium">Patient:</span> {soins.find(s => s.id === formData.itemId)?.clientNom}
                          </p>
                          <p className="text-sm">
                            <span className="font-medium">Acte:</span> {soins.find(s => s.id === formData.itemId)?.acteName}
                          </p>
                          <p className="text-sm">
                            <span className="font-medium">Tarif unitaire:</span> {formatMontant(soins.find(s => s.id === formData.itemId)?.tarif || 0)}
                          </p>
                          <p className="text-sm font-bold text-green-600">
                            Total: {formatMontant((soins.find(s => s.id === formData.itemId)?.tarif || 0) * formData.nombreSeances)}
                          </p>
                          <p className="text-xs text-gray-500">
                            Avec {formData.pourcentage}%: {formatMontant(Math.round(((soins.find(s => s.id === formData.itemId)?.tarif || 0) * formData.nombreSeances) * (formData.pourcentage / 100)))}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {formData.type === 'abonnement' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Abonnement à payer *</label>
                    <select
                      required
                      value={formData.itemId}
                      onChange={(e) => setFormData({ ...formData, itemId: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Sélectionner un abonnement</option>
                      {unpaidAbonnements.map(abo => (
                        <option key={abo.id} value={abo.id}>
                          {abo.clientNom} - {abo.type} ({formatMontant(abo.montant)}/séance)
                        </option>
                      ))}
                    </select>
                    {unpaidAbonnements.length === 0 && (
                      <p className="text-sm text-yellow-600 mt-1">Aucun abonnement en attente de paiement</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de séances *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={formData.nombreSeances}
                      onChange={(e) => setFormData({ ...formData, nombreSeances: parseInt(e.target.value) || 1 })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    {formData.itemId && (
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <p className="text-sm text-gray-600 mb-2">Détails de l'abonnement sélectionné:</p>
                        <div className="space-y-1">
                          <p className="text-sm">
                            <span className="font-medium">Client:</span> {abonnements.find(a => a.id === formData.itemId)?.clientNom}
                          </p>
                          <p className="text-sm">
                            <span className="font-medium">Type:</span> {abonnements.find(a => a.id === formData.itemId)?.type}
                          </p>
                          <p className="text-sm">
                            <span className="font-medium">Tarif unitaire:</span> {formatMontant(abonnements.find(a => a.id === formData.itemId)?.montant || 0)}
                          </p>
                          <p className="text-sm font-bold text-green-600">
                            Total: {formatMontant((abonnements.find(a => a.id === formData.itemId)?.montant || 0) * formData.nombreSeances)}
                          </p>
                          <p className="text-xs text-gray-500">
                            Avec {formData.pourcentage}%: {formatMontant(Math.round(((abonnements.find(a => a.id === formData.itemId)?.montant || 0) * formData.nombreSeances) * (formData.pourcentage / 100)))}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              <div>                <label className="block text-sm font-medium text-gray-700 mb-1">Pourcentage de paiement *</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    required
                    min="1"
                    max="100"
                    value={formData.pourcentage}
                    onChange={(e) => setFormData({ ...formData, pourcentage: Number(e.target.value) || 100 })}
                    className="w-24 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-600">%</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Entrez 100 pour plein tarif, 80 pour 20% de réduction, etc.</p>
              </div>

              <div>                <label className="block text-sm font-medium text-gray-700 mb-1">Mode de paiement *</label>
                <select
                  required
                  value={formData.modePaiement}
                  onChange={(e) => setFormData({ ...formData, modePaiement: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="especes">Espèces</option>
                  <option value="mobile_money">Mobile Money</option>
                  <option value="carte">Carte bancaire</option>
                  <option value="virement">Virement bancaire</option>
                </select>
              </div>

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
                  disabled={!formData.itemId || saving}
                  className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* Rapport Modal */}
      {showRapportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-xl font-semibold text-white">Rapport Hebdomadaire</h2>
              <button
                onClick={() => setShowRapportModal(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-green-50 rounded-lg text-center">
                  <p className="text-3xl font-bold text-green-600">{getWeeklyReport().length}</p>
                  <p className="text-sm text-gray-600">Paiements</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg text-center">
                  <p className="text-3xl font-bold text-blue-600">{formatMontant(totalSemaine)}</p>
                  <p className="text-sm text-gray-600">Total</p>
                </div>
              </div>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {getWeeklyReport().map(p => (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-800">{p.clientNom}</p>
                      <p className="text-sm text-gray-500">{p.description}</p>
                    </div>
                    <p className="font-bold text-green-600">{formatMontant(p.montant)}</p>
                  </div>
                ))}
              </div>
              <div className="flex justify-center pt-6">
                <button
                  onClick={printWeeklyReport}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Printer className="w-5 h-5" />
                  Imprimer le rapport
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaiementsPage;
