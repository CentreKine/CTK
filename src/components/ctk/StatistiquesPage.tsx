import React, { useState } from 'react';
import { 
  BarChart3, TrendingUp, Users, Stethoscope, DollarSign,
  Calendar, Dumbbell, Package, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { 
  Client, Personnel, Soin, AbonnementClient, Paiement, 
  Transaction, RendezVous, ACTES_KINESITHERAPIE, formatMontant 
} from '@/lib/ctk-data';

interface StatistiquesPageProps {
  clients: Client[];
  personnel: Personnel[];
  soins: Soin[];
  abonnements: AbonnementClient[];
  paiements: Paiement[];
  transactions: Transaction[];
  rendezvous: RendezVous[];
}

const StatistiquesPage: React.FC<StatistiquesPageProps> = ({
  clients, personnel, soins, abonnements, paiements, transactions, rendezvous
}) => {
  const [periode, setPeriode] = useState<'jour' | 'semaine' | 'mois' | 'annee'>('mois');

  const today = new Date();
  const thisMonth = today.toISOString().slice(0, 7);
  const thisYear = today.getFullYear().toString();

  // Filter data by period
  const filterByPeriode = (date: string) => {
    const d = new Date(date);
    switch (periode) {
      case 'jour':
        return date === today.toISOString().split('T')[0];
      case 'semaine':
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        return d >= weekAgo && d <= today;
      case 'mois':
        return date.startsWith(thisMonth);
      case 'annee':
        return date.startsWith(thisYear);
      default:
        return true;
    }
  };

  const filteredSoins = soins.filter(s => filterByPeriode(s.date));
  const filteredPaiements = paiements.filter(p => filterByPeriode(p.date));
  const filteredTransactions = transactions.filter(t => filterByPeriode(t.date));
  const filteredRdv = rendezvous.filter(r => filterByPeriode(r.date));

  // Calculate statistics
  const totalRevenus = filteredPaiements.reduce((sum, p) => sum + p.montant, 0);
  const totalEntrees = filteredTransactions.filter(t => t.type === 'entree').reduce((sum, t) => sum + t.montant, 0);
  const totalSorties = filteredTransactions.filter(t => t.type === 'sortie').reduce((sum, t) => sum + t.montant, 0);
  const benefice = totalEntrees - totalSorties;

  // Soins par acte
  const soinsByActe = ACTES_KINESITHERAPIE.map(acte => ({
    ...acte,
    count: filteredSoins.filter(s => s.acteCode === acte.code).length,
    revenue: filteredSoins.filter(s => s.acteCode === acte.code).reduce((sum, s) => sum + s.tarif, 0)
  })).filter(a => a.count > 0).sort((a, b) => b.count - a.count);

  // Soins par kinésithérapeute
  const soinsByKine = personnel
    .filter(p => p.poste.toLowerCase().includes('kinésithérapeute'))
    .map(kine => ({
      nom: `${kine.prenom} ${kine.nom}`,
      count: filteredSoins.filter(s => s.personnelId === kine.id).length,
      revenue: filteredSoins.filter(s => s.personnelId === kine.id).reduce((sum, s) => sum + s.tarif, 0)
    }))
    .filter(k => k.count > 0)
    .sort((a, b) => b.count - a.count);

  // RDV stats
  const rdvTermines = filteredRdv.filter(r => r.statut === 'termine').length;
  const rdvAnnules = filteredRdv.filter(r => r.statut === 'annule').length;
  const tauxRealisation = filteredRdv.length > 0 
    ? Math.round((rdvTermines / filteredRdv.length) * 100) 
    : 0;

  // Abonnements actifs
  const abonnementsActifs = abonnements.filter(a => a.statut === 'actif').length;
  const revenusGym = abonnements.filter(a => a.paye).reduce((sum, a) => sum + a.montant, 0);

  // Nouveaux clients ce mois
  const nouveauxClients = clients.filter(c => c.dateInscription.startsWith(thisMonth)).length;

  const periodeLabels = {
    jour: "Aujourd'hui",
    semaine: 'Cette semaine',
    mois: 'Ce mois',
    annee: 'Cette année'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Statistiques & Historique</h1>
          <p className="text-gray-500 mt-1">Analyse des performances de CTK</p>
        </div>
        <div className="flex gap-2">
          {(['jour', 'semaine', 'mois', 'annee'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriode(p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                periode === p 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {periodeLabels[p]}
            </button>
          ))}
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Revenus</p>
              <p className="text-2xl font-bold mt-1">{formatMontant(totalRevenus)}</p>
            </div>
            <div className="p-3 bg-white/20 rounded-lg">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-3 text-green-100 text-sm">
            <ArrowUpRight className="w-4 h-4" />
            <span>{filteredPaiements.length} paiements</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Soins réalisés</p>
              <p className="text-2xl font-bold mt-1">{filteredSoins.length}</p>
            </div>
            <div className="p-3 bg-white/20 rounded-lg">
              <Stethoscope className="w-6 h-6" />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-3 text-blue-100 text-sm">
            <TrendingUp className="w-4 h-4" />
            <span>{formatMontant(filteredSoins.reduce((s, soin) => s + soin.tarif, 0))}</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Rendez-vous</p>
              <p className="text-2xl font-bold mt-1">{filteredRdv.length}</p>
            </div>
            <div className="p-3 bg-white/20 rounded-lg">
              <Calendar className="w-6 h-6" />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-3 text-purple-100 text-sm">
            <span>{tauxRealisation}% réalisés</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Bénéfice net</p>
              <p className="text-2xl font-bold mt-1">{formatMontant(benefice)}</p>
            </div>
            <div className="p-3 bg-white/20 rounded-lg">
              <BarChart3 className="w-6 h-6" />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-3 text-orange-100 text-sm">
            {benefice >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            <span>{benefice >= 0 ? 'Positif' : 'Négatif'}</span>
          </div>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total clients</p>
              <p className="text-xl font-bold text-gray-800">{clients.length}</p>
            </div>
          </div>
          <p className="text-xs text-green-600 mt-2">+{nouveauxClients} ce mois</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Personnel actif</p>
              <p className="text-xl font-bold text-gray-800">
                {personnel.filter(p => p.statut === 'actif').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-pink-100 rounded-lg">
              <Dumbbell className="w-5 h-5 text-pink-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Abonnés gym</p>
              <p className="text-xl font-bold text-gray-800">{abonnementsActifs}</p>
            </div>
          </div>
          <p className="text-xs text-pink-600 mt-2">{formatMontant(revenusGym)} revenus</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Package className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">RDV annulés</p>
              <p className="text-xl font-bold text-gray-800">{rdvAnnules}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Soins par acte */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-green-600" />
            Soins par type d'acte
          </h2>
          {soinsByActe.length > 0 ? (
            <div className="space-y-4">
              {soinsByActe.slice(0, 6).map((acte) => {
                const maxCount = Math.max(...soinsByActe.map(a => a.count));
                const percentage = (acte.count / maxCount) * 100;
                return (
                  <div key={acte.code}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 truncate flex-1" title={acte.pathologie}>
                        <span className="font-mono text-green-600 mr-2">{acte.code}</span>
                        {acte.pathologie}
                      </span>
                      <span className="font-medium text-gray-800 ml-2">{acte.count}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-green-400 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{formatMontant(acte.revenue)}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">Aucun soin sur cette période</p>
          )}
        </div>

        {/* Performance kinésithérapeutes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Performance des kinésithérapeutes
          </h2>
          {soinsByKine.length > 0 ? (
            <div className="space-y-4">
              {soinsByKine.map((kine, index) => {
                const maxCount = Math.max(...soinsByKine.map(k => k.count));
                const percentage = (kine.count / maxCount) * 100;
                const colors = ['from-blue-500 to-blue-400', 'from-purple-500 to-purple-400', 'from-pink-500 to-pink-400'];
                return (
                  <div key={kine.nom}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">{kine.nom}</span>
                      <span className="font-medium text-gray-800">{kine.count} soins</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div 
                        className={`bg-gradient-to-r ${colors[index % colors.length]} h-2 rounded-full transition-all`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{formatMontant(kine.revenue)} générés</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">Aucune donnée sur cette période</p>
          )}
        </div>
      </div>

      {/* Financial Overview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-600" />
          Aperçu financier - {periodeLabels[periode]}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-green-50 rounded-xl">
            <div className="flex items-center gap-2 text-green-700 mb-2">
              <ArrowUpRight className="w-5 h-5" />
              <span className="font-medium">Entrées</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{formatMontant(totalEntrees)}</p>
            <p className="text-sm text-green-600 mt-1">
              {filteredTransactions.filter(t => t.type === 'entree').length} transactions
            </p>
          </div>
          <div className="p-4 bg-red-50 rounded-xl">
            <div className="flex items-center gap-2 text-red-700 mb-2">
              <ArrowDownRight className="w-5 h-5" />
              <span className="font-medium">Sorties</span>
            </div>
            <p className="text-2xl font-bold text-red-600">{formatMontant(totalSorties)}</p>
            <p className="text-sm text-red-600 mt-1">
              {filteredTransactions.filter(t => t.type === 'sortie').length} transactions
            </p>
          </div>
          <div className={`p-4 rounded-xl ${benefice >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
            <div className={`flex items-center gap-2 mb-2 ${benefice >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
              <BarChart3 className="w-5 h-5" />
              <span className="font-medium">Solde</span>
            </div>
            <p className={`text-2xl font-bold ${benefice >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
              {formatMontant(benefice)}
            </p>
            <p className={`text-sm mt-1 ${benefice >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
              {benefice >= 0 ? 'Bénéfice' : 'Déficit'}
            </p>
          </div>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-purple-600" />
          Historique des activités récentes
        </h2>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {[...filteredPaiements, ...filteredSoins.map(s => ({ ...s, date: s.date, type: 'soin' }))]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 10)
            .map((item, index) => {
              const isSoin = 'acteCode' in item;
              return (
                <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className={`p-2 rounded-full ${isSoin ? 'bg-blue-100' : 'bg-green-100'}`}>
                    {isSoin ? (
                      <Stethoscope className="w-4 h-4 text-blue-600" />
                    ) : (
                      <DollarSign className="w-4 h-4 text-green-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">
                      {isSoin ? (item as Soin).clientNom : (item as Paiement).clientNom}
                    </p>
                    <p className="text-sm text-gray-500">
                      {isSoin ? (item as Soin).acteName : (item as Paiement).description}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${isSoin ? 'text-blue-600' : 'text-green-600'}`}>
                      {formatMontant(isSoin ? (item as Soin).tarif : (item as Paiement).montant)}
                    </p>
                    <p className="text-xs text-gray-400">{item.date}</p>
                  </div>
                </div>
              );
            })}
          {filteredPaiements.length === 0 && filteredSoins.length === 0 && (
            <p className="text-gray-500 text-center py-8">Aucune activité sur cette période</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatistiquesPage;
