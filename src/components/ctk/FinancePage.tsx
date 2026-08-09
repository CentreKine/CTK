import React, { useState } from 'react';
import { 
  Search, Plus, X, DollarSign, TrendingUp, TrendingDown,
  Save, Calendar, ArrowUpRight, ArrowDownRight, Loader2
} from 'lucide-react';
import { Transaction, generateId, formatDate, formatMontant } from '@/lib/ctk-data';

interface FinancePageProps {
  transactions: Transaction[];
  onAdd: (transaction: Transaction) => Promise<void>;
  userRole: 'admin' | 'agent';
}

const FinancePage: React.FC<FinancePageProps> = ({ transactions, onAdd, userRole }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    type: 'entree' as 'entree' | 'sortie',
    categorie: '',
    description: '',
    montant: 0,
    date: new Date().toISOString().split('T')[0]
  });

  const categoriesEntree = [
    'Soins kinésithérapie',
    'Abonnements gym',
    'Consultations',
    'Vente de produits',
    'Autres revenus'
  ];

  const categoriesSortie = [
    'Salaires',
    'Loyer',
    'Électricité',
    'Eau',
    'Fournitures médicales',
    'Équipements',
    'Entretien',
    'Marketing',
    'Assurances',
    'Taxes',
    'Autres dépenses'
  ];

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.categorie.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || t.type === filterType;
    return matchesSearch && matchesType;
  });

  const totalEntrees = transactions.filter(t => t.type === 'entree').reduce((sum, t) => sum + t.montant, 0);
  const totalSorties = transactions.filter(t => t.type === 'sortie').reduce((sum, t) => sum + t.montant, 0);
  const solde = totalEntrees - totalSorties;

  const thisMonth = new Date().toISOString().slice(0, 7);
  const entreesMonth = transactions
    .filter(t => t.type === 'entree' && t.date.startsWith(thisMonth))
    .reduce((sum, t) => sum + t.montant, 0);
  const sortiesMonth = transactions
    .filter(t => t.type === 'sortie' && t.date.startsWith(thisMonth))
    .reduce((sum, t) => sum + t.montant, 0);

  const generateReference = () => {
    const random = Math.random().toString(36).substr(2, 6).toUpperCase();
    return `TRX-${random}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const newTransaction: Transaction = {
        id: generateId(),
        type: formData.type,
        categorie: formData.categorie,
        description: formData.description,
        montant: formData.montant,
        date: formData.date,
        reference: generateReference()
      };

      await onAdd(newTransaction);
      setShowModal(false);
      setFormData({
        type: 'entree',
        categorie: '',
        description: '',
        montant: 0,
        date: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      console.error('Error adding transaction:', error);
      alert('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  // Group transactions by category for chart
  const entriesbyCategory = transactions
    .filter(t => t.type === 'entree')
    .reduce((acc, t) => {
      acc[t.categorie] = (acc[t.categorie] || 0) + t.montant;
      return acc;
    }, {} as Record<string, number>);

  const expensesByCategory = transactions
    .filter(t => t.type === 'sortie')
    .reduce((acc, t) => {
      acc[t.categorie] = (acc[t.categorie] || 0) + t.montant;
      return acc;
    }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Gestion Financière</h1>
          <p className="text-gray-500 mt-1">Suivi des entrées et sorties</p>
        </div>
        {userRole === 'admin' && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Nouvelle Transaction
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-green-600">{formatMontant(totalEntrees)}</p>
              <p className="text-sm text-gray-500">Total Entrées</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-lg">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-red-600">{formatMontant(totalSorties)}</p>
              <p className="text-sm text-gray-500">Total Sorties</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg ${solde >= 0 ? 'bg-blue-100' : 'bg-orange-100'}`}>
              <DollarSign className={`w-6 h-6 ${solde >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
            </div>
            <div>
              <p className={`text-xl font-bold ${solde >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                {formatMontant(solde)}
              </p>
              <p className="text-sm text-gray-500">Solde</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-purple-600">{formatMontant(entreesMonth - sortiesMonth)}</p>
              <p className="text-sm text-gray-500">Ce mois</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenus par catégorie */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <ArrowUpRight className="w-5 h-5 text-green-600" />
            Revenus par catégorie
          </h2>
          <div className="space-y-3">
            {Object.entries(entriesbyCategory).map(([cat, montant]) => {
              const percentage = (montant / totalEntrees) * 100;
              return (
                <div key={cat}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{cat}</span>
                    <span className="font-medium text-gray-800">{formatMontant(montant)}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {Object.keys(entriesbyCategory).length === 0 && (
              <p className="text-gray-500 text-center py-4">Aucune entrée enregistrée</p>
            )}
          </div>
        </div>

        {/* Dépenses par catégorie */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <ArrowDownRight className="w-5 h-5 text-red-600" />
            Dépenses par catégorie
          </h2>
          <div className="space-y-3">
            {Object.entries(expensesByCategory).map(([cat, montant]) => {
              const percentage = totalSorties > 0 ? (montant / totalSorties) * 100 : 0;
              return (
                <div key={cat}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{cat}</span>
                    <span className="font-medium text-gray-800">{formatMontant(montant)}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {Object.keys(expensesByCategory).length === 0 && (
              <p className="text-gray-500 text-center py-4">Aucune sortie enregistrée</p>
            )}
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
              placeholder="Rechercher par description ou catégorie..."
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
            <option value="entree">Entrées</option>
            <option value="sortie">Sorties</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Référence</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Type</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Catégorie</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Description</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Date</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">Montant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                      {transaction.reference}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      transaction.type === 'entree' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {transaction.type === 'entree' ? (
                        <ArrowUpRight className="w-3 h-3" />
                      ) : (
                        <ArrowDownRight className="w-3 h-3" />
                      )}
                      {transaction.type === 'entree' ? 'Entrée' : 'Sortie'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{transaction.categorie}</td>
                  <td className="px-6 py-4 text-sm text-gray-800">{transaction.description}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{formatDate(transaction.date)}</td>
                  <td className={`px-6 py-4 text-right font-bold ${
                    transaction.type === 'entree' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'entree' ? '+' : '-'}{formatMontant(transaction.montant)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredTransactions.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Aucune transaction trouvée</p>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-800">Nouvelle Transaction</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'entree', categorie: '' })}
                    className={`p-3 rounded-lg border-2 flex items-center justify-center gap-2 transition-all ${
                      formData.type === 'entree' 
                        ? 'border-green-500 bg-green-50 text-green-700' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <ArrowUpRight className="w-5 h-5" />
                    Entrée
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'sortie', categorie: '' })}
                    className={`p-3 rounded-lg border-2 flex items-center justify-center gap-2 transition-all ${
                      formData.type === 'sortie' 
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie *</label>
                <select
                  required
                  value={formData.categorie}
                  onChange={(e) => setFormData({ ...formData, categorie: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Sélectionner une catégorie</option>
                  {(formData.type === 'entree' ? categoriesEntree : categoriesSortie).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <input
                  type="text"
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Description de la transaction"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Montant (FCFA) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.montant}
                  onChange={(e) => setFormData({ ...formData, montant: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
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
    </div>
  );
};

export default FinancePage;
