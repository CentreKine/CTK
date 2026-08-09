import React, { useState } from 'react';
import { 
  Search, Plus, Edit2, Trash2, Eye, X, User, Phone, Mail, 
  MapPin, Calendar, Briefcase, Save, DollarSign, Loader2
} from 'lucide-react';
import { Personnel, generateId, formatDate, formatMontant } from '@/lib/ctk-data';

interface PersonnelPageProps {
  personnel: Personnel[];
  onAdd: (p: Personnel) => Promise<void>;
  onUpdate: (p: Personnel) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  userRole: 'admin' | 'agent';
}

const PersonnelPage: React.FC<PersonnelPageProps> = ({ personnel, onAdd, onUpdate, onDelete, userRole }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingPersonnel, setEditingPersonnel] = useState<Personnel | null>(null);
  const [viewingPersonnel, setViewingPersonnel] = useState<Personnel | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<Personnel>>({
    nom: '', prenom: '', poste: '', specialite: '', telephone: '',
    email: '', adresse: '', dateEmbauche: '', salaire: 0, statut: 'actif'
  });

  const filteredPersonnel = personnel.filter(p =>
    `${p.nom} ${p.prenom}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.poste.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.specialite.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openAddModal = () => {
    setEditingPersonnel(null);
    setFormData({
      nom: '', prenom: '', poste: '', specialite: '', telephone: '',
      email: '', adresse: '', dateEmbauche: '', salaire: 0, statut: 'actif'
    });
    setShowModal(true);
  };

  const openEditModal = (p: Personnel) => {
    if (userRole === 'agent') return;
    setEditingPersonnel(p);
    setFormData(p);
    setShowModal(true);
  };

  const openViewModal = (p: Personnel) => {
    setViewingPersonnel(p);
    setShowViewModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingPersonnel) {
        await onUpdate({ ...editingPersonnel, ...formData } as Personnel);
      } else {
        const newPersonnel: Personnel = {
          ...formData as Personnel,
          id: generateId(),
        };
        await onAdd(newPersonnel);
      }
      setShowModal(false);
    } catch (error) {
      console.error('Error saving personnel:', error);
      alert('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (userRole === 'agent') return;
    if (confirm('Êtes-vous sûr de vouloir supprimer ce membre du personnel ?')) {
      try {
        await onDelete(id);
      } catch (error) {
        console.error('Error deleting personnel:', error);
        alert('Erreur lors de la suppression');
      }
    }
  };

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'actif':
        return 'bg-green-100 text-green-700';
      case 'conge':
        return 'bg-yellow-100 text-yellow-700';
      case 'inactif':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const postes = [
    'Kinésithérapeute Chef',
    'Kinésithérapeute',
    'Kinésithérapeute Assistant',
    'Réceptionniste',
    'Comptable',
    'Agent d\'entretien',
    'Secrétaire médical',
    'Coach sportif',
    'Infirmier',
    'Autre'
  ];

  const specialites = [
    'Neurologie',
    'Traumatologie',
    'Orthopédie',
    'Pédiatrie',
    'Gériatrie',
    'Respiratoire',
    'Sportive',
    'Accueil',
    'Administration',
    'Autre'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Gestion du Personnel</h1>
          <p className="text-gray-500 mt-1">{personnel.length} membres du personnel</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Nouveau Personnel
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, poste ou spécialité..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Personnel Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPersonnel.map((p) => (
          <div key={p.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
            <div className="bg-gradient-to-r from-green-600 to-green-500 p-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-white text-xl font-bold">
                  {p.prenom[0]}{p.nom[0]}
                </div>
                <div className="text-white">
                  <h3 className="font-semibold text-lg">{p.prenom} {p.nom}</h3>
                  <p className="text-green-100 text-sm">{p.poste}</p>
                </div>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Briefcase className="w-4 h-4 text-green-600" />
                <span>{p.specialite}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="w-4 h-4 text-green-600" />
                <span>{p.telephone}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="w-4 h-4 text-green-600" />
                <span className="truncate">{p.email}</span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatutBadge(p.statut)}`}>
                  {p.statut === 'actif' ? 'Actif' : p.statut === 'conge' ? 'En congé' : 'Inactif'}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openViewModal(p)}
                    className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="Voir détails"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  {userRole === 'admin' && (
                    <>
                      <button
                        onClick={() => openEditModal(p)}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredPersonnel.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-500">
          <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Aucun personnel trouvé</p>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-800">
                {editingPersonnel ? 'Modifier Personnel' : 'Nouveau Personnel'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                  <input
                    type="text"
                    required
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
                  <input
                    type="text"
                    required
                    value={formData.prenom}
                    onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Poste *</label>
                  <select
                    required
                    value={formData.poste}
                    onChange={(e) => setFormData({ ...formData, poste: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Sélectionner un poste</option>
                    {postes.map(poste => (
                      <option key={poste} value={poste}>{poste}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Spécialité</label>
                  <select
                    value={formData.specialite}
                    onChange={(e) => setFormData({ ...formData, specialite: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Sélectionner une spécialité</option>
                    {specialites.map(spec => (
                      <option key={spec} value={spec}>{spec}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone *</label>
                  <input
                    type="tel"
                    required
                    value={formData.telephone}
                    onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                  <input
                    type="text"
                    value={formData.adresse}
                    onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date d'embauche *</label>
                  <input
                    type="date"
                    required
                    value={formData.dateEmbauche}
                    onChange={(e) => setFormData({ ...formData, dateEmbauche: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Salaire (FCFA)</label>
                  <input
                    type="number"
                    value={formData.salaire}
                    onChange={(e) => setFormData({ ...formData, salaire: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                  <select
                    value={formData.statut}
                    onChange={(e) => setFormData({ ...formData, statut: e.target.value as 'actif' | 'conge' | 'inactif' })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="actif">Actif</option>
                    <option value="conge">En congé</option>
                    <option value="inactif">Inactif</option>
                  </select>
                </div>
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
                  {editingPersonnel ? 'Mettre à jour' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && viewingPersonnel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-green-600 to-green-500 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-xl font-semibold text-white">Fiche Personnel</h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto rounded-full bg-green-500 flex items-center justify-center text-white text-2xl font-bold">
                  {viewingPersonnel.prenom[0]}{viewingPersonnel.nom[0]}
                </div>
                <h3 className="text-xl font-bold text-gray-800 mt-3">
                  {viewingPersonnel.prenom} {viewingPersonnel.nom}
                </h3>
                <p className="text-gray-500">{viewingPersonnel.poste}</p>
                <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${getStatutBadge(viewingPersonnel.statut)}`}>
                  {viewingPersonnel.statut === 'actif' ? 'Actif' : viewingPersonnel.statut === 'conge' ? 'En congé' : 'Inactif'}
                </span>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Briefcase className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700">Spécialité: {viewingPersonnel.specialite}</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Phone className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700">{viewingPersonnel.telephone}</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Mail className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700">{viewingPersonnel.email}</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <MapPin className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700">{viewingPersonnel.adresse || 'Non renseigné'}</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700">Embauché le {formatDate(viewingPersonnel.dateEmbauche)}</span>
                </div>
                {userRole === 'admin' && (
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <span className="text-green-700 font-medium">Salaire: {formatMontant(viewingPersonnel.salaire)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonnelPage;
