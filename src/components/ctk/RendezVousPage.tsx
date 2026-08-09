import React, { useState } from 'react';
import { 
  Search, Plus, Edit2, Trash2, X, Calendar, Clock, User,
  Save, CheckCircle, AlertCircle, XCircle, Phone, Loader2
} from 'lucide-react';
import { RendezVous, Client, Personnel, generateId, formatDate } from '@/lib/ctk-data';

interface RendezVousPageProps {
  rendezvous: RendezVous[];
  onAdd: (rdv: RendezVous) => Promise<void>;
  onUpdate: (rdv: RendezVous) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  clients: Client[];
  personnel: Personnel[];
  userRole: 'admin' | 'agent';
}

const RendezVousPage: React.FC<RendezVousPageProps> = ({ 
  rendezvous, onAdd, onUpdate, onDelete, clients, personnel, userRole 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatut, setFilterStatut] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [editingRdv, setEditingRdv] = useState<RendezVous | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    clientId: '',
    personnelId: '',
    date: new Date().toISOString().split('T')[0],
    heure: '09:00',
    duree: 30,
    motif: '',
    notes: ''
  });

  const kinesitherapeutes = personnel.filter(p => 
    p.poste.toLowerCase().includes('kinésithérapeute') && p.statut === 'actif'
  );

  const filteredRendezvous = rendezvous.filter(rdv => {
    const matchesSearch = rdv.clientNom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rdv.personnelNom.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatut = filterStatut === 'all' || rdv.statut === filterStatut;
    const matchesDate = !filterDate || rdv.date === filterDate;
    return matchesSearch && matchesStatut && matchesDate;
  });

  const sortedRendezvous = [...filteredRendezvous].sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.heure}`);
    const dateB = new Date(`${b.date}T${b.heure}`);
    return dateA.getTime() - dateB.getTime();
  });

  const today = new Date().toISOString().split('T')[0];
  const rdvAujourdhui = rendezvous.filter(r => r.date === today);
  const rdvEnAttente = rendezvous.filter(r => r.statut === 'planifie' || r.statut === 'confirme');

  const openAddModal = () => {
    setEditingRdv(null);
    setFormData({
      clientId: '',
      personnelId: '',
      date: new Date().toISOString().split('T')[0],
      heure: '09:00',
      duree: 30,
      motif: '',
      notes: ''
    });
    setShowModal(true);
  };

  const openEditModal = (rdv: RendezVous) => {
    if (userRole === 'agent') return;
    setEditingRdv(rdv);
    setFormData({
      clientId: rdv.clientId,
      personnelId: rdv.personnelId,
      date: rdv.date,
      heure: rdv.heure,
      duree: rdv.duree,
      motif: rdv.motif,
      notes: rdv.notes
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const client = clients.find(c => c.id === formData.clientId);
      const kine = personnel.find(p => p.id === formData.personnelId);

      if (!client || !kine) return;

      if (editingRdv) {
        await onUpdate({
          ...editingRdv,
          ...formData,
          clientNom: `${client.prenom} ${client.nom}`,
          personnelNom: `${kine.prenom} ${kine.nom}`
        });
      } else {
        const newRdv: RendezVous = {
          id: generateId(),
          clientId: formData.clientId,
          clientNom: `${client.prenom} ${client.nom}`,
          personnelId: formData.personnelId,
          personnelNom: `${kine.prenom} ${kine.nom}`,
          date: formData.date,
          heure: formData.heure,
          duree: formData.duree,
          motif: formData.motif,
          statut: 'planifie',
          notes: formData.notes
        };
        await onAdd(newRdv);
      }
      setShowModal(false);
    } catch (error) {
      console.error('Error saving rdv:', error);
      alert('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const updateStatut = async (id: string, statut: RendezVous['statut']) => {
    const rdv = rendezvous.find(r => r.id === id);
    if (rdv) {
      try {
        await onUpdate({ ...rdv, statut });
      } catch (error) {
        console.error('Error updating rdv:', error);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (userRole === 'agent') return;
    if (confirm('Êtes-vous sûr de vouloir supprimer ce rendez-vous ?')) {
      try {
        await onDelete(id);
      } catch (error) {
        console.error('Error deleting rdv:', error);
        alert('Erreur lors de la suppression');
      }
    }
  };

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'planifie':
        return { bg: 'bg-blue-100 text-blue-700', icon: Clock, label: 'Planifié' };
      case 'confirme':
        return { bg: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Confirmé' };
      case 'en_cours':
        return { bg: 'bg-yellow-100 text-yellow-700', icon: Clock, label: 'En cours' };
      case 'termine':
        return { bg: 'bg-gray-100 text-gray-700', icon: CheckCircle, label: 'Terminé' };
      case 'annule':
        return { bg: 'bg-red-100 text-red-700', icon: XCircle, label: 'Annulé' };
      default:
        return { bg: 'bg-gray-100 text-gray-700', icon: AlertCircle, label: statut };
    }
  };

  const motifs = [
    'Consultation initiale',
    'Séance de kinésithérapie',
    'Rééducation',
    'Massage thérapeutique',
    'Suivi post-opératoire',
    'Bilan fonctionnel',
    'Autre'
  ];

  const heures = [];
  for (let h = 8; h <= 18; h++) {
    heures.push(`${h.toString().padStart(2, '0')}:00`);
    heures.push(`${h.toString().padStart(2, '0')}:30`);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Gestion des Rendez-vous</h1>
          <p className="text-gray-500 mt-1">{rendezvous.length} rendez-vous</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Nouveau RDV
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{rdvAujourdhui.length}</p>
              <p className="text-sm text-gray-500">Aujourd'hui</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{rdvEnAttente.length}</p>
              <p className="text-sm text-gray-500">En attente</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <User className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{kinesitherapeutes.length}</p>
              <p className="text-sm text-gray-500">Kinés disponibles</p>
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
              placeholder="Rechercher par patient ou kinésithérapeute..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <select
            value={filterStatut}
            onChange={(e) => setFilterStatut(e.target.value)}
            className="px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="all">Tous les statuts</option>
            <option value="planifie">Planifié</option>
            <option value="confirme">Confirmé</option>
            <option value="en_cours">En cours</option>
            <option value="termine">Terminé</option>
            <option value="annule">Annulé</option>
          </select>
        </div>
      </div>

      {/* RDV List */}
      <div className="space-y-4">
        {sortedRendezvous.map((rdv) => {
          const statutInfo = getStatutBadge(rdv.statut);
          const StatutIcon = statutInfo.icon;
          const client = clients.find(c => c.id === rdv.clientId);
          const isToday = rdv.date === today;
          
          return (
            <div 
              key={rdv.id} 
              className={`bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow ${
                isToday ? 'border-green-200' : 'border-gray-100'
              }`}
            >
              <div className="flex flex-col md:flex-row">
                <div className={`p-4 md:p-6 md:w-32 flex flex-row md:flex-col items-center justify-center gap-2 ${
                  isToday ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-800'
                }`}>
                  <span className="text-2xl font-bold">{rdv.heure}</span>
                  <span className="text-sm opacity-80">{formatDate(rdv.date)}</span>
                </div>

                <div className="flex-1 p-4 md:p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">{rdv.clientNom}</h3>
                        <p className="text-sm text-gray-500">{rdv.motif}</p>
                        {client && (
                          <p className="text-sm text-gray-400 flex items-center gap-1 mt-1">
                            <Phone className="w-3 h-3" />
                            {client.telephone}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col md:items-end gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statutInfo.bg}`}>
                          <StatutIcon className="w-3 h-3" />
                          {statutInfo.label}
                        </span>
                        <span className="text-sm text-gray-500">{rdv.duree} min</span>
                      </div>
                      <p className="text-sm text-gray-600">Kiné: {rdv.personnelNom}</p>
                    </div>
                  </div>

                  {rdv.notes && (
                    <p className="mt-3 text-sm text-gray-500 bg-gray-50 p-2 rounded">
                      Note: {rdv.notes}
                    </p>
                  )}

                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                    {rdv.statut === 'planifie' && (
                      <button
                        onClick={() => updateStatut(rdv.id, 'confirme')}
                        className="px-3 py-1.5 text-sm bg-green-100 text-green-700 hover:bg-green-200 rounded-lg transition-colors"
                      >
                        Confirmer
                      </button>
                    )}
                    {rdv.statut === 'confirme' && (
                      <button
                        onClick={() => updateStatut(rdv.id, 'en_cours')}
                        className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg transition-colors"
                      >
                        Démarrer
                      </button>
                    )}
                    {rdv.statut === 'en_cours' && (
                      <button
                        onClick={() => updateStatut(rdv.id, 'termine')}
                        className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        Terminer
                      </button>
                    )}
                    {(rdv.statut === 'planifie' || rdv.statut === 'confirme') && (
                      <button
                        onClick={() => updateStatut(rdv.id, 'annule')}
                        className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        Annuler
                      </button>
                    )}
                    {userRole === 'admin' && (
                      <>
                        <button
                          onClick={() => openEditModal(rdv)}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors ml-auto"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(rdv.id)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {sortedRendezvous.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-500">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Aucun rendez-vous trouvé</p>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-800">
                {editingRdv ? 'Modifier Rendez-vous' : 'Nouveau Rendez-vous'}
              </h2>
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
                  <select
                    required
                    value={formData.heure}
                    onChange={(e) => setFormData({ ...formData, heure: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    {heures.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Durée (minutes)</label>
                  <select
                    value={formData.duree}
                    onChange={(e) => setFormData({ ...formData, duree: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value={15}>15 min</option>
                    <option value={30}>30 min</option>
                    <option value={45}>45 min</option>
                    <option value={60}>1 heure</option>
                    <option value={90}>1h30</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Motif *</label>
                  <select
                    required
                    value={formData.motif}
                    onChange={(e) => setFormData({ ...formData, motif: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Sélectionner</option>
                    {motifs.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Notes supplémentaires..."
                />
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
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {editingRdv ? 'Mettre à jour' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RendezVousPage;
