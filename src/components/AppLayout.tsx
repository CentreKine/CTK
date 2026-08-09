import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useDatabase } from '@/hooks/useDatabase';
import clientStorage from '@/lib/clientStorage';
import { Menu, Bell, Search, User, Database, Wifi, WifiOff, Loader2, LogOut, RefreshCw } from 'lucide-react';

// Import all components
import Sidebar from './ctk/Sidebar';
import LoginPage from './ctk/LoginPage';
import Dashboard, { DashboardRecentActivity, DashboardAppointment, DashboardRevenuePoint } from './ctk/Dashboard';
import ClientsPage from './ctk/ClientsPage';
import PersonnelPage from './ctk/PersonnelPage';
import KinesitherapiePage from './ctk/KinesitherapiePage';
import FicheSuiviPage from './ctk/FicheSuiviPage';
import GymPage from './ctk/GymPage';
import PaiementsPage from './ctk/PaiementsPage';
import FinancePage from './ctk/FinancePage';
import StocksPage from './ctk/StocksPage';
import RendezVousPage from './ctk/RendezVousPage';
import StatistiquesPage from './ctk/StatistiquesPage';
import UtilisateursPage from './ctk/UtilisateursPage';
import ReportsPage from './ctk/ReportsPage';
import NotificationCenter from './NotificationCenter';


// Import data types
import { 
  Client, Personnel, Soin, AbonnementClient, Paiement, 
  Transaction, Stock, MouvementStock, RendezVous, User as UserType,
  generateId
} from '@/lib/ctk-data';
import { NotificationManager, ActivityLogger } from '@/lib/notificationManager';

const AppLayout: React.FC = () => {
  const { currentUser, isLoggedIn, login, logout, getUserName, isAdmin } = useAuth();
  const isMobile = useIsMobile();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Use database hook
  const db = useDatabase();

  // Start automatic sync (poll + focus) when component mounts
  useEffect(() => {
    let mounted = true;
    (async () => {
      const sync = await import('@/lib/sync');
      sync.startAutoSync(db, 60000);
    })();
    return () => {
      (async () => { const sync = await import('@/lib/sync'); sync.stopAutoSync(); })();
      mounted = false;
    };
  }, [db]);
  
  // Navigation state
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Calculate dashboard stats
  const today = new Date().toISOString().split('T')[0];

  const dashboardStats = {
    totalClients: db.clients.length || 0,
    totalPersonnel: db.personnel.filter(p => p.statut === 'actif').length || 0,
    soinsAujourdhui: db.soins.filter(s => s.date === today).length || 0,
    rdvAujourdhui: db.rendezvous.filter(r => r.date === today).length || 0,
    revenusJour: db.paiements
      .filter(p => p.date === today)
      .reduce((sum, p) => sum + p.montant, 0) || 0,
    revenusSemaine: db.paiements.reduce((sum, p) => sum + p.montant, 0) || 0,
    revenusMois: db.paiements.reduce((sum, p) => sum + p.montant, 0) || 0,
    abonnementsActifs: db.abonnements.filter(a => a.statut === 'actif').length || 0,
    stocksAlerte: db.stocks.filter(s => s.quantite <= s.seuilAlerte).length || 0
  };

  const getDayLabel = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', { weekday: 'short' });
  };

  const recentActivities = useMemo<DashboardRecentActivity[]>(() => {
    const events: DashboardRecentActivity[] = [];

    db.soins.forEach((soin) => {
      events.push({
        id: `soin-${soin.id}`,
        type: 'soin',
        title: 'Soin',
        description: `${soin.clientNom} · ${soin.acteName}`,
        date: soin.date,
        time: soin.heure,
        status: soin.statut === 'termine' ? 'success' : soin.statut === 'en_cours' ? 'pending' : 'warning'
      });
    });

    db.paiements.forEach((paiement) => {
      events.push({
        id: `paiement-${paiement.id}`,
        type: 'paiement',
        title: 'Paiement reçu',
        description: `${paiement.clientNom} · ${paiement.montant.toLocaleString('fr-FR')} FCFA`,
        date: paiement.date,
        time: '00:00',
        status: 'success'
      });
    });

    db.rendezvous.forEach((rdv) => {
      events.push({
        id: `rdv-${rdv.id}`,
        type: 'rdv',
        title: 'Rendez-vous planifié',
        description: `${rdv.clientNom} · ${rdv.motif}`,
        date: rdv.date,
        time: rdv.heure,
        status: 'pending'
      });
    });

    return events
      .sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time || '00:00'}`);
        const dateB = new Date(`${b.date}T${b.time || '00:00'}`);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 5);
  }, [db.soins, db.paiements, db.rendezvous]);

  const todayAppointments = useMemo<DashboardAppointment[]>(() => {
    return db.rendezvous
      .filter((rdv) => rdv.date === today)
      .sort((a, b) => a.heure.localeCompare(b.heure))
      .map((rdv) => ({
        id: rdv.id,
        client: rdv.clientNom,
        heure: rdv.heure,
        type: rdv.motif,
        kine: rdv.personnelNom
      }));
  }, [db.rendezvous, today]);

  const revenueSeries = useMemo<DashboardRevenuePoint[]>(() => {
    const baseDate = new Date(today);
    const days = Array.from({ length: 7 }, (_, index) => {
      const current = new Date(baseDate);
      current.setDate(baseDate.getDate() - (6 - index));
      const dateKey = current.toISOString().split('T')[0];
      const montant = db.paiements
        .filter((paiement) => paiement.date === dateKey)
        .reduce((sum, paiement) => sum + paiement.montant, 0);
      return {
        day: getDayLabel(dateKey),
        date: dateKey,
        montant
      };
    });
    return days;
  }, [db.paiements, today]);

  const handleLogin = async (email: string, password: string) => {
    setLoginError('');
    const result = await login(email, password);
    if (result.success) {
      setCurrentPage('dashboard');
    } else {
      setLoginError(result.error || 'Erreur de connexion');
    }
  };

  const handleLogout = () => {
    logout();
    setCurrentPage('dashboard');
  };

  // Wrapper functions for state setters that use database operations
  const setClients = (updater: React.SetStateAction<Client[]>) => {
    // This is handled by the database hook
  };

  const handleClientAdd = async (client: Client) => {
    try {
      await db.addClient(client);
      ActivityLogger.log('CREATE', 'CLIENT', client.id, currentUser?.id || '', currentUser?.prenom || '', `Client créé: ${client.prenom} ${client.nom}`);
      NotificationManager.success('✅ Client Créé', `${client.prenom} ${client.nom} a été ajouté avec succès`);
    } catch (error) {
      NotificationManager.error('❌ Erreur', 'Impossible d\'ajouter le client');
    }
  };

  const handleClientUpdate = async (client: Client) => {
    try {
      await db.updateClient(client);
      ActivityLogger.log('UPDATE', 'CLIENT', client.id, currentUser?.id || '', currentUser?.prenom || '', `Client mis à jour: ${client.prenom} ${client.nom}`);
      NotificationManager.success('✅ Mis à Jour', `Le client a été modifié avec succès`);
    } catch (error) {
      NotificationManager.error('❌ Erreur', 'Impossible de modifier le client');
    }
  };

  const handleClientDelete = async (id: string) => {
    try {
      await db.deleteClient(id);
      ActivityLogger.log('DELETE', 'CLIENT', id, currentUser?.id || '', currentUser?.prenom || '', 'Client supprimé');
      NotificationManager.success('✅ Supprimé', `Le client a été supprimé`);
    } catch (error) {
      NotificationManager.error('❌ Erreur', 'Impossible de supprimer le client');
    }
  };

  const handlePersonnelAdd = async (p: Personnel) => {
    await db.addPersonnel(p);
  };

  const handlePersonnelUpdate = async (p: Personnel) => {
    await db.updatePersonnel(p);
  };

  const handlePersonnelDelete = async (id: string) => {
    await db.deletePersonnel(id);
  };

  const handleSoinAdd = async (soin: Soin) => {
    await db.addSoin(soin);
  };

  const handleSoinUpdate = async (soin: Soin) => {
    await db.updateSoin(soin);
  };

  const handleAbonnementAdd = async (abo: AbonnementClient) => {
    await db.addAbonnement(abo);
  };

  const handleAbonnementUpdate = async (abo: AbonnementClient) => {
    await db.updateAbonnement(abo);
  };

  const handlePaiementAdd = async (paiement: Paiement) => {
    try {
      await db.addPaiement(paiement);
      ActivityLogger.log('CREATE', 'PAIEMENT', paiement.id, currentUser?.id || '', currentUser?.prenom || '', `Paiement: ${paiement.montant}`);
      NotificationManager.success('💳 Paiement Enregistré', `Montant: ${paiement.montant}`);
    } catch (error) {
      NotificationManager.error('❌ Erreur', 'Impossible d\'enregistrer le paiement');
    }
  };

  const handlePaiementUpdate = async (paiement: Paiement) => {
    try {
      await db.updatePaiement(paiement);
      ActivityLogger.log('UPDATE', 'PAIEMENT', paiement.id, currentUser?.id || '', currentUser?.prenom || '', 'Paiement mis à jour');
      NotificationManager.success('✅ Paiement Mis à Jour', 'Les modifications ont été sauvegardées');
    } catch (error) {
      NotificationManager.error('❌ Erreur', 'Impossible de modifier le paiement');
    }
  };

  const handleTransactionAdd = async (transaction: Transaction) => {
    try {
      await db.addTransaction(transaction);
      ActivityLogger.log('CREATE', 'TRANSACTION', transaction.id, currentUser?.id || '', currentUser?.prenom || '', `${transaction.type}: ${transaction.montant}`);
      NotificationManager.success('📊 Transaction Créée', `${transaction.type === 'entree' ? 'Entrée' : 'Sortie'}: ${transaction.montant}`);
    } catch (error) {
      NotificationManager.error('❌ Erreur', 'Impossible de créer la transaction');
    }
  };

  const handleStockAdd = async (stock: Stock) => {
    await db.addStock(stock);
  };

  const handleStockUpdate = async (stock: Stock) => {
    await db.updateStock(stock);
  };

  const handleStockDelete = async (id: string) => {
    await db.deleteStock(id);
  };

  const handleMouvementAdd = async (mouvement: MouvementStock) => {
    await db.addMouvement(mouvement);
  };

  const handleRendezvousAdd = async (rdv: RendezVous) => {
    await db.addRendezvous(rdv);
  };

  const handleRendezvousUpdate = async (rdv: RendezVous) => {
    await db.updateRendezvous(rdv);
  };

  const handleRendezvousDelete = async (id: string) => {
    await db.deleteRendezvous(id);
  };

  const handleUtilisateurAdd = async (user: UserType) => {
    try {
      await db.addUtilisateur(user);
      ActivityLogger.log('CREATE', 'UTILISATEUR', user.id, currentUser?.id || '', currentUser?.prenom || '', `Utilisateur créé: ${user.prenom} ${user.nom}`);
      NotificationManager.success('👤 Utilisateur Créé', `${user.prenom} ${user.nom} a été ajouté`);
    } catch (error) {
      NotificationManager.error('❌ Erreur', 'Impossible de créer l\'utilisateur');
    }
  };

  const handleUtilisateurUpdate = async (user: UserType) => {
    try {
      await db.updateUtilisateur(user);
      ActivityLogger.log('UPDATE', 'UTILISATEUR', user.id, currentUser?.id || '', currentUser?.prenom || '', 'Utilisateur mis à jour');
      NotificationManager.success('✅ Utilisateur Mis à Jour', 'Les modifications ont été sauvegardées');
    } catch (error) {
      NotificationManager.error('❌ Erreur', 'Impossible de modifier l\'utilisateur');
    }
  };

  const handleUtilisateurDelete = async (id: string) => {
    await db.deleteUtilisateur(id);
  };

  // Show loading screen
  if (db.loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-green-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block p-4 bg-gray-800/50 rounded-full mb-4 backdrop-blur-sm border border-green-500/30">
            <img 
              src="https://d64gsuwffb70l.cloudfront.net/696faca652fe36008fa92531_1768926542042_42a9b869.png"
              alt="CTK Logo"
              className="w-24 h-24"
            />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">CTK</h1>
          <p className="text-green-400 mb-4">Centre de Traitement en Kinésithérapie - N'Djamena, Tchad</p>
          <div className="flex items-center justify-center gap-2 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Chargement des données...</span>
          </div>
        </div>
      </div>
    );
  }

  // SÉCURITÉ DE SECOURS : Si les données sont vides, forcer le rechargement
  if (db.clients.length === 0 && db.personnel.length === 0) {
    console.log('🚨 DONNÉES VIDES DÉTECTÉES - Demande de rechargement sans effacement...');
    // IMPORTANT: Ne pas effacer le localStorage automatiquement (risque de perte de données).
    // Demander au hook de recharger proprement les données une fois et afficher un message d'attente.
    try {
      if (typeof db.reloadData === 'function') {
        db.reloadData();
      }
    } catch (e) {
      console.warn('Erreur lors du rechargement des données:', e);
    }
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Chargement des données...</h2>
          <p className="text-sm text-gray-500 mt-2">Les données sont en cours de récupération — veuillez patienter.</p>
        </div>
      </div>
    );
  }

  // Show login page if not logged in
  if (!isLoggedIn) {
    return (
      <LoginPage 
        onLogin={handleLogin}
        error={loginError}
        email={loginEmail}
        password={loginPassword}
        onEmailChange={setLoginEmail}
        onPasswordChange={setLoginPassword}
      />
    );
  }

  // Render current page content
  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <Dashboard
            stats={dashboardStats}
            recentActivities={recentActivities}
            todayAppointments={todayAppointments}
            revenueSeries={revenueSeries}
          />
        );
      case 'clients':
        return (
          <ClientsPage 
            clients={db.clients} 
            onAdd={handleClientAdd}
            onUpdate={handleClientUpdate}
            onDelete={handleClientDelete}
            userRole={currentUser?.role || 'agent'} 
          />
        );
      case 'personnel':
        return (
          <PersonnelPage 
            personnel={db.personnel} 
            onAdd={handlePersonnelAdd}
            onUpdate={handlePersonnelUpdate}
            onDelete={handlePersonnelDelete}
            userRole={currentUser?.role || 'agent'} 
          />
        );
      case 'kinesitherapie':
        return (
          <KinesitherapiePage 
            soins={db.soins} 
            onAddSoin={handleSoinAdd}
            onUpdateSoin={handleSoinUpdate}
            clients={db.clients} 
            personnel={db.personnel}
            userRole={currentUser?.role || 'agent'}
          />
        );
      case 'fiches_suivi':
        return (
          <FicheSuiviPage clients={db.clients} />
        );
      case 'gym':
        return (
          <GymPage 
            abonnements={db.abonnements} 
            onAdd={handleAbonnementAdd}
            onUpdate={handleAbonnementUpdate}
            clients={db.clients}
            userRole={currentUser?.role || 'agent'}
          />
        );
      case 'paiements':
        return (
          <PaiementsPage 
            paiements={db.paiements}
            onAddPaiement={handlePaiementAdd}
            onUpdatePaiement={handlePaiementUpdate}
            soins={db.soins}
            onUpdateSoin={handleSoinUpdate}
            abonnements={db.abonnements}
            onUpdateAbonnement={handleAbonnementUpdate}
            userRole={currentUser?.role || 'agent'}
          />
        );
      case 'finance':
        return (
          <FinancePage 
            transactions={db.transactions}
            onAdd={handleTransactionAdd}
            userRole={currentUser?.role || 'agent'}
          />
        );
      case 'stocks':
        return (
          <StocksPage 
            stocks={db.stocks}
            onAddStock={handleStockAdd}
            onUpdateStock={handleStockUpdate}
            onDeleteStock={handleStockDelete}
            mouvements={db.mouvements}
            onAddMouvement={handleMouvementAdd}
            userRole={currentUser?.role || 'agent'}
          />
        );
      case 'rendezvous':
        return (
          <RendezVousPage 
            rendezvous={db.rendezvous}
            onAdd={handleRendezvousAdd}
            onUpdate={handleRendezvousUpdate}
            onDelete={handleRendezvousDelete}
            clients={db.clients}
            personnel={db.personnel}
            userRole={currentUser?.role || 'agent'}
          />
        );
      case 'statistiques':
        return (
          <StatistiquesPage 
            clients={db.clients}
            personnel={db.personnel}
            soins={db.soins}
            abonnements={db.abonnements}
            paiements={db.paiements}
            transactions={db.transactions}
            rendezvous={db.rendezvous}
          />
        );
      case 'rapports':
        return (
          <ReportsPage
            clients={db.clients}
            paiements={db.paiements}
            fiches={db.fichesSuivi}
            transactions={db.transactions}
            stocks={db.stocks}
          />
        );
      case 'utilisateurs':
        return (
          <UtilisateursPage 
            utilisateurs={db.utilisateurs}
            onAdd={handleUtilisateurAdd}
            onUpdate={handleUtilisateurUpdate}
            onDelete={handleUtilisateurDelete}
          />
        );
      default:
        return <Dashboard stats={dashboardStats} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NotificationCenter />
      {/* Sidebar overlay for mobile */}
      {isMobile && mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        currentPage={currentPage}
        setCurrentPage={(page) => {
          setCurrentPage(page);
          if (isMobile) setMobileSidebarOpen(false);
        }}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        userRole={currentUser?.role || 'agent'}
        onLogout={() => {
          if (isMobile) setMobileSidebarOpen(false);
          handleLogout();
        }}
        isMobile={isMobile}
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
      />

      {/* Main Content */}
      <div className={`transition-all duration-300 ${isMobile ? 'ml-0' : sidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
        {/* Top Header */}
        <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  if (isMobile) {
                    setMobileSidebarOpen((open) => !open);
                  } else {
                    setSidebarCollapsed((collapsed) => !collapsed);
                  }
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
                aria-label="Menu"
              >
                <Menu className="w-5 h-5 text-gray-600" />
              </button>
              <div className="hidden md:flex items-center gap-2 bg-gray-100 rounded-lg px-4 py-2 w-64">
                <Search className="w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  className="bg-transparent border-none outline-none text-sm text-gray-600 w-full"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-4">
                {/* Database connection indicator */}
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                db.isConnected 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-yellow-100 text-yellow-700'
              }`}>
                {db.isConnected ? (
                  <>
                    <Database className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Base de données connectée</span>
                    <Wifi className="w-3.5 h-3.5" />
                  </>
                ) : (
                  <>
                    <Database className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Mode hors ligne</span>
                    <WifiOff className="w-3.5 h-3.5" />
                  </>
                )}
              </div>

              {/* Sync controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    setSyncing(true);
                    try {
                      const { lastSync } = await (await import('@/lib/sync')).syncNow(db);
                      setLastSync(lastSync);
                    } catch (e) {
                      console.error('Sync error', e);
                    } finally { setSyncing(false); }
                  }}
                  title="Synchroniser maintenant"
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
                >
                  <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline text-xs">Sync</span>
                </button>
                <button
                  onClick={async () => {
                    // Export local DB as JSON download
                    const data = await clientStorage.exportAll();
                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `ctk-data-${new Date().toISOString()}.json`;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    URL.revokeObjectURL(url);
                  }}
                  title="Exporter les données locales"
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
                >
                  <span className="hidden sm:inline text-xs">Export</span>
                </button>
                <input
                  id="import-db-file"
                  type="file"
                  accept="application/json"
                  style={{ display: 'none' }}
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    try {
                      const txt = await f.text();
                      const obj = JSON.parse(txt);
                      await clientStorage.importAll(obj, true);
                      await db.reloadData();
                      NotificationManager.success('Import réussi', 'Les données ont été importées');
                    } catch (err) {
                      NotificationManager.error('Import échoué', 'Le fichier est invalide');
                    }
                  }}
                />
                <label htmlFor="import-db-file" className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer text-xs hidden sm:inline">Import</label>
                <div className="text-xs text-gray-400">{lastSync ? `Dernière sync: ${new Date(lastSync).toLocaleString()}` : ''}</div>
              </div>

              <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold ${
                currentUser?.role === 'admin' ? 'bg-yellow-500' : 'bg-blue-500'
              }`}>
                <User className="w-5 h-5" />
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-gray-800">
                  {currentUser?.role === 'admin' ? 'Administrateur' : 'Agent'}
                </p>
                <p className="text-xs text-gray-500">{currentUser?.prenom || 'Utilisateur'}</p>
              </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          {renderPage()}
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-100 bg-white px-6 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
            <p>© 2026 CTK - Centre de Traitement en Kinésithérapie. Tous droits réservés.</p>
            <div className="flex items-center gap-4">
              <span>Version 1.0</span>
              <span>|</span>
              <span>Support: support@ctk.ci</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default AppLayout;
