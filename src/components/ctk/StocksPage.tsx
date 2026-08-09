import React, { useState } from 'react';
import { 
  Search, Plus, Edit2, Trash2, X, Package, AlertTriangle,
  Save, ArrowUpRight, ArrowDownRight, History, Loader2
} from 'lucide-react';
import { Stock, MouvementStock, generateId, formatDate, formatMontant } from '@/lib/ctk-data';

interface StocksPageProps {
  stocks: Stock[];
  onAddStock: (stock: Stock) => Promise<void>;
  onUpdateStock: (stock: Stock) => Promise<void>;
  onDeleteStock: (id: string) => Promise<void>;
  mouvements: MouvementStock[];
  onAddMouvement: (mouvement: MouvementStock) => Promise<void>;
  userRole: 'admin' | 'agent';
}

const StocksPage: React.FC<StocksPageProps> = ({ 
  stocks, onAddStock, onUpdateStock, onDeleteStock, mouvements, onAddMouvement, userRole 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showMouvementModal, setShowMouvementModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [editingStock, setEditingStock] = useState<Stock | null>(null);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    nom: '',
    categorie: '',
    quantite: 0,
    unite: '',
    prixUnitaire: 0,
    seuilAlerte: 5,
    fournisseur: ''
  });
  const [mouvementData, setMouvementData] = useState({
    type: 'entree' as 'entree' | 'sortie',
    quantite: 0,
    motif: ''
  });

  const categories = [
    'Équipements médicaux',
    'Consommables',
    'Huiles et crèmes',
    'Matériel de bureau',
    'Produits d\'entretien',
    'Équipements gym',
    'Autres'
  ];

  const unites = ['unité', 'boîte', 'litre', 'kg', 'paquet', 'rouleau', 'flacon'];

  const filteredStocks = stocks.filter(s =>
    s.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.categorie.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stocksEnAlerte = stocks.filter(s => s.quantite <= s.seuilAlerte);
  const valeurTotale = stocks.reduce((sum, s) => sum + (s.quantite * s.prixUnitaire), 0);

  const openAddModal = () => {
    setEditingStock(null);
    setFormData({
      nom: '',
      categorie: '',
      quantite: 0,
      unite: '',
      prixUnitaire: 0,
      seuilAlerte: 5,
      fournisseur: ''
    });
    setShowModal(true);
  };

  const openEditModal = (stock: Stock) => {
    if (userRole === 'agent') return;
    setEditingStock(stock);
    setFormData({
      nom: stock.nom,
      categorie: stock.categorie,
      quantite: stock.quantite,
      unite: stock.unite,
      prixUnitaire: stock.prixUnitaire,
      seuilAlerte: stock.seuilAlerte,
      fournisseur: stock.fournisseur
    });
    setShowModal(true);
  };

  const openMouvementModal = (stock: Stock) => {
    setSelectedStock(stock);
    setMouvementData({ type: 'entree', quantite: 0, motif: '' });
    setShowMouvementModal(true);
  };

  const openHistoryModal = (stock: Stock) => {
    setSelectedStock(stock);
    setShowHistoryModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingStock) {
        await onUpdateStock({ ...editingStock, ...formData } as Stock);
      } else {
        const newStock: Stock = {
          ...formData,
          id: generateId(),
          dateAjout: new Date().toISOString().split('T')[0]
        };
        await onAddStock(newStock);
      }
      setShowModal(false);
    } catch (error) {
      console.error('Error saving stock:', error);
      alert('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const handleMouvement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStock) return;
    setSaving(true);

    try {
      const newQuantite = mouvementData.type === 'entree'
        ? selectedStock.quantite + mouvementData.quantite
        : selectedStock.quantite - mouvementData.quantite;

      if (newQuantite < 0) {
        alert('Quantité insuffisante en stock');
        setSaving(false);
        return;
      }

      // Update stock
      await onUpdateStock({ ...selectedStock, quantite: newQuantite });

      // Add mouvement
      const newMouvement: MouvementStock = {
        id: generateId(),
        stockId: selectedStock.id,
        stockNom: selectedStock.nom,
        type: mouvementData.type,
        quantite: mouvementData.quantite,
        motif: mouvementData.motif,
        date: new Date().toISOString().split('T')[0],
        utilisateur: userRole === 'admin' ? 'Admin' : 'Agent'
      };
      await onAddMouvement(newMouvement);

      setShowMouvementModal(false);
    } catch (error) {
      console.error('Error processing mouvement:', error);
      alert('Erreur lors du traitement');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (userRole === 'agent') return;
    if (confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) {
      try {
        await onDeleteStock(id);
      } catch (error) {
        console.error('Error deleting stock:', error);
        alert('Erreur lors de la suppression');
      }
    }
  };

  const stockMouvements = selectedStock 
    ? mouvements.filter(m => m.stockId === selectedStock.id)
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Gestion des Stocks</h1>
          <p className="text-gray-500 mt-1">{stocks.length} articles en stock</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Nouvel Article
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{stocks.length}</p>
              <p className="text-sm text-gray-500">Articles</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{stocksEnAlerte.length}</p>
              <p className="text-sm text-gray-500">En alerte</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Package className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-green-600">{formatMontant(valeurTotale)}</p>
              <p className="text-sm text-gray-500">Valeur totale</p>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {stocksEnAlerte.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-red-700 mb-3">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-semibold">Articles en rupture ou en alerte</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {stocksEnAlerte.map(s => (
              <span key={s.id} className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                {s.nom} ({s.quantite} {s.unite})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par nom ou catégorie..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Stocks Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Article</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Catégorie</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Quantité</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Prix Unit.</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Valeur</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Statut</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredStocks.map((stock) => {
                const isLow = stock.quantite <= stock.seuilAlerte;
                return (
                  <tr key={stock.id} className={`hover:bg-gray-50 transition-colors ${isLow ? 'bg-red-50' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          isLow ? 'bg-red-100' : 'bg-green-100'
                        }`}>
                          <Package className={`w-5 h-5 ${isLow ? 'text-red-600' : 'text-green-600'}`} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{stock.nom}</p>
                          <p className="text-sm text-gray-500">{stock.fournisseur}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{stock.categorie}</td>
                    <td className="px-6 py-4">
                      <span className={`font-semibold ${isLow ? 'text-red-600' : 'text-gray-800'}`}>
                        {stock.quantite} {stock.unite}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{formatMontant(stock.prixUnitaire)}</td>
                    <td className="px-6 py-4 font-medium text-gray-800">
                      {formatMontant(stock.quantite * stock.prixUnitaire)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        isLow ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {isLow ? 'Alerte' : 'OK'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openMouvementModal(stock)}
                          className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Mouvement"
                        >
                          <ArrowUpRight className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openHistoryModal(stock)}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Historique"
                        >
                          <History className="w-4 h-4" />
                        </button>
                        {userRole === 'admin' && (
                          <>
                            <button
                              onClick={() => openEditModal(stock)}
                              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Modifier"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(stock.id)}
                              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredStocks.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Aucun article trouvé</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-800">
                {editingStock ? 'Modifier Article' : 'Nouvel Article'}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l'article *</label>
                <input
                  type="text"
                  required
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie *</label>
                <select
                  required
                  value={formData.categorie}
                  onChange={(e) => setFormData({ ...formData, categorie: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Sélectionner</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantité *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.quantite}
                    onChange={(e) => setFormData({ ...formData, quantite: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unité *</label>
                  <select
                    required
                    value={formData.unite}
                    onChange={(e) => setFormData({ ...formData, unite: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Sélectionner</option>
                    {unites.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prix unitaire (FCFA)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.prixUnitaire}
                    onChange={(e) => setFormData({ ...formData, prixUnitaire: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Seuil d'alerte</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.seuilAlerte}
                    onChange={(e) => setFormData({ ...formData, seuilAlerte: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fournisseur</label>
                <input
                  type="text"
                  value={formData.fournisseur}
                  onChange={(e) => setFormData({ ...formData, fournisseur: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
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
                  {editingStock ? 'Mettre à jour' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mouvement Modal */}
      {showMouvementModal && selectedStock && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-800">Mouvement de Stock</h2>
              <button
                onClick={() => setShowMouvementModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleMouvement} className="p-6 space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Article</p>
                <p className="font-semibold text-gray-800">{selectedStock.nom}</p>
                <p className="text-sm text-gray-600">Stock actuel: {selectedStock.quantite} {selectedStock.unite}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type de mouvement</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setMouvementData({ ...mouvementData, type: 'entree' })}
                    className={`p-3 rounded-lg border-2 flex items-center justify-center gap-2 transition-all ${
                      mouvementData.type === 'entree' 
                        ? 'border-green-500 bg-green-50 text-green-700' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <ArrowUpRight className="w-5 h-5" />
                    Entrée
                  </button>
                  <button
                    type="button"
                    onClick={() => setMouvementData({ ...mouvementData, type: 'sortie' })}
                    className={`p-3 rounded-lg border-2 flex items-center justify-center gap-2 transition-all ${
                      mouvementData.type === 'sortie' 
                        ? 'border-red-500 bg-red-50 text-red-700' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <ArrowDownRight className="w-5 h-5" />
                    Sortie
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantité *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={mouvementData.quantite}
                  onChange={(e) => setMouvementData({ ...mouvementData, quantite: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Motif *</label>
                <input
                  type="text"
                  required
                  value={mouvementData.motif}
                  onChange={(e) => setMouvementData({ ...mouvementData, motif: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Ex: Réapprovisionnement, Utilisation patient..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowMouvementModal(false)}
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
                  Valider
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && selectedStock && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-xl font-semibold text-white">Historique - {selectedStock.nom}</h2>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              {stockMouvements.length > 0 ? (
                <div className="space-y-3">
                  {stockMouvements.map(m => (
                    <div key={m.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                      <div className={`p-2 rounded-full ${
                        m.type === 'entree' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {m.type === 'entree' ? (
                          <ArrowUpRight className="w-4 h-4 text-green-600" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">
                          {m.type === 'entree' ? '+' : '-'}{m.quantite} {selectedStock.unite}
                        </p>
                        <p className="text-sm text-gray-500">{m.motif}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">{formatDate(m.date)}</p>
                        <p className="text-xs text-gray-400">{m.utilisateur}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">Aucun mouvement enregistré</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StocksPage;
