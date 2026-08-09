import React from 'react';
import { 
  Users, UserPlus, Stethoscope, Dumbbell, CreditCard, 
  TrendingUp, Calendar, Package, ArrowUpRight, ArrowDownRight,
  Clock, CheckCircle, AlertCircle
} from 'lucide-react';
import { formatMontant } from '@/lib/ctk-data';

export interface DashboardRecentActivity {
  id: string;
  type: 'soin' | 'paiement' | 'rdv';
  title: string;
  description: string;
  date: string;
  time: string;
  status: 'success' | 'warning' | 'pending';
}

export interface DashboardAppointment {
  id: string;
  client: string;
  heure: string;
  type: string;
  kine: string;
}

export interface DashboardRevenuePoint {
  day: string;
  date: string;
  montant: number;
}

interface DashboardProps {
  stats: {
    totalClients: number;
    totalPersonnel: number;
    soinsAujourdhui: number;
    rdvAujourdhui: number;
    revenusJour: number;
    revenusSemaine: number;
    revenusMois: number;
    abonnementsActifs: number;
    stocksAlerte: number;
  };
  recentActivities: DashboardRecentActivity[];
  todayAppointments: DashboardAppointment[];
  revenueSeries: DashboardRevenuePoint[];
}

const Dashboard: React.FC<DashboardProps> = ({ stats, recentActivities, todayAppointments, revenueSeries }) => {
  const statCards = [
    {
      title: 'Total Clients',
      value: stats.totalClients,
      icon: UserPlus,
      color: 'from-blue-500 to-blue-600',
      change: '+12%',
      positive: true
    },
    {
      title: 'Personnel Actif',
      value: stats.totalPersonnel,
      icon: Users,
      color: 'from-purple-500 to-purple-600',
      change: '+2',
      positive: true
    },
    {
      title: "Soins Aujourd'hui",
      value: stats.soinsAujourdhui,
      icon: Stethoscope,
      color: 'from-green-500 to-green-600',
      change: '+5',
      positive: true
    },
    {
      title: "RDV Aujourd'hui",
      value: stats.rdvAujourdhui,
      icon: Calendar,
      color: 'from-orange-500 to-orange-600',
      change: '8 restants',
      positive: true
    },
    {
      title: 'Revenus du Jour',
      value: formatMontant(stats.revenusJour),
      icon: CreditCard,
      color: 'from-emerald-500 to-emerald-600',
      change: '+18%',
      positive: true
    },
    {
      title: 'Revenus Semaine',
      value: formatMontant(stats.revenusSemaine),
      icon: TrendingUp,
      color: 'from-cyan-500 to-cyan-600',
      change: '+25%',
      positive: true
    },
    {
      title: 'Abonnements Gym',
      value: stats.abonnementsActifs,
      icon: Dumbbell,
      color: 'from-pink-500 to-pink-600',
      change: '+8',
      positive: true
    },
    {
      title: 'Stocks en Alerte',
      value: stats.stocksAlerte,
      icon: Package,
      color: 'from-red-500 to-red-600',
      change: 'À réapprovisionner',
      positive: false
    },
  ];

  const inactiveMessage = 'Fonctionnalité inactive : les données ne sont pas disponibles actuellement.';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Tableau de Bord</h1>
          <p className="text-gray-500 mt-1">Bienvenue au Centre de Traitement en Kinésithérapie - N'Djamena, Tchad</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 bg-white px-4 py-2 rounded-lg shadow-sm">
          <Clock className="w-4 h-4" />
          <span>{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-5 border border-gray-100">
              <div className="flex items-start justify-between">
                <div className={`p-3 rounded-lg bg-gradient-to-br ${stat.color}`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className={`flex items-center text-sm ${stat.positive ? 'text-green-600' : 'text-red-600'}`}>
                  {stat.positive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  <span>{stat.change}</span>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                <p className="text-sm text-gray-500 mt-1">{stat.title}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-green-600" />
            Activités Récentes
          </h2>
          <div className="space-y-4">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                  <div className={`p-2 rounded-full ${
                    activity.status === 'success' ? 'bg-green-100' :
                    activity.status === 'warning' ? 'bg-yellow-100' : 'bg-blue-100'
                  }`}>
                    {activity.status === 'success' ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : activity.status === 'warning' ? (
                      <AlertCircle className="w-4 h-4 text-yellow-600" />
                    ) : (
                      <Clock className="w-4 h-4 text-blue-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">{activity.title}</p>
                    <p className="text-sm text-gray-500 truncate">{activity.description}</p>
                    <p className="text-xs text-gray-400 mt-1">{activity.date} • {activity.time}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center">
                <p className="text-sm font-medium text-gray-800 mb-2">Aucune activité récente</p>
                <p className="text-sm text-gray-500">Il n'y a pas encore d'activités enregistrées pour le moment.</p>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Appointments */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-green-600" />
            Rendez-vous du Jour
          </h2>
          <div className="space-y-3">
            {todayAppointments.length > 0 ? (
              todayAppointments.map((rdv) => (
                <div key={rdv.id} className="flex items-center gap-4 p-3 rounded-lg bg-gradient-to-r from-gray-50 to-white border border-gray-100 hover:border-green-200 transition-colors">
                  <div className="text-center bg-green-600 text-white px-3 py-2 rounded-lg min-w-[60px]">
                    <span className="text-sm font-bold">{rdv.heure}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">{rdv.client}</p>
                    <p className="text-sm text-gray-500">{rdv.type}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-400">{rdv.kine}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center">
                <p className="text-sm font-medium text-gray-800 mb-2">Aucun rendez-vous aujourd'hui</p>
                <p className="text-sm text-gray-500">Il n'y a pas de rendez-vous planifiés pour la journée.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-600" />
          Aperçu des Revenus
        </h2>
        <div className="h-64 grid grid-cols-7 gap-2 px-2 py-4">
          {revenueSeries.map((point) => (
            <div key={point.date} className="flex flex-col items-center justify-end gap-2">
              <div className="w-full rounded-t-lg bg-gradient-to-t from-green-600 to-green-400 transition-all" style={{ height: `${Math.min(100, point.montant / 1000 + 10)}%` }} />
              <span className="text-xs text-gray-500">{point.day}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div className="rounded-xl bg-emerald-50 p-4">
            <p className="text-xs uppercase tracking-wider text-gray-500">Revenus du jour</p>
            <p className="mt-2 text-lg font-semibold text-gray-800">{formatMontant(stats.revenusJour)}</p>
          </div>
          <div className="rounded-xl bg-cyan-50 p-4">
            <p className="text-xs uppercase tracking-wider text-gray-500">Revenus de la semaine</p>
            <p className="mt-2 text-lg font-semibold text-gray-800">{formatMontant(stats.revenusSemaine)}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wider text-gray-500">Revenus du mois</p>
            <p className="mt-2 text-lg font-semibold text-gray-800">{formatMontant(stats.revenusMois)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
