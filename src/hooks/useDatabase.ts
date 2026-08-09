import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, supabaseUrl, supabaseAnonKey } from '@/lib/supabase';
import clientStorage from '@/lib/clientStorage';
import { 
  Client, Personnel, Soin, AbonnementClient, Paiement, 
  Transaction, Stock, MouvementStock, RendezVous, User,
  SAMPLE_CLIENTS, SAMPLE_PERSONNEL, FicheSuivi, FicheSeance
} from '@/lib/ctk-data';

// Helper to convert database format to app format
const dbToClient = (db: any): Client => ({
  id: db.id,
  nom: db.nom,
  prenom: db.prenom,
  dateNaissance: db.date_naissance || '',
  sexe: db.sexe,
  telephone: db.telephone,
  email: db.email || '',
  adresse: db.adresse || '',
  profession: db.profession || '',
  groupeSanguin: db.groupe_sanguin || '',
  allergies: db.allergies || '',
  antecedents: db.antecedents || '',
  dateInscription: db.date_inscription,
  notes: db.notes || '',
  createdBy: db.created_by || undefined,
  updatedBy: db.updated_by || undefined,
  deletedAt: db.deleted_at || undefined
});

const clientToDb = (client: Client, createdBy?: string, updatedBy?: string) => ({
  id: client.id,
  nom: client.nom,
  prenom: client.prenom,
  date_naissance: client.dateNaissance || null,
  sexe: client.sexe,
  telephone: client.telephone,
  email: client.email || null,
  adresse: client.adresse || null,
  profession: client.profession || null,
  groupe_sanguin: client.groupeSanguin || null,
  allergies: client.allergies || null,
  antecedents: client.antecedents || null,
  date_inscription: client.dateInscription,
  notes: client.notes || null,
  created_by: createdBy || null,
  updated_by: updatedBy || null
});

const dbToPersonnel = (db: any): Personnel => ({
  id: db.id,
  nom: db.nom,
  prenom: db.prenom,
  poste: db.poste,
  specialite: db.specialite || '',
  telephone: db.telephone,
  email: db.email,
  adresse: db.adresse || '',
  dateEmbauche: db.date_embauche,
  salaire: db.salaire,
  statut: db.statut,
  createdBy: db.created_by || undefined,
  updatedBy: db.updated_by || undefined,
  deletedAt: db.deleted_at || undefined
});

const personnelToDb = (p: Personnel, createdBy?: string, updatedBy?: string) => ({
  id: p.id,
  nom: p.nom,
  prenom: p.prenom,
  poste: p.poste,
  specialite: p.specialite || null,
  telephone: p.telephone,
  email: p.email,
  adresse: p.adresse || null,
  date_embauche: p.dateEmbauche,
  salaire: p.salaire,
  statut: p.statut,
  created_by: createdBy || null,
  updated_by: updatedBy || null
});

const dbToSoin = (db: any, clients: Client[], personnel: Personnel[]): Soin => {
  const client = clients.find(c => c.id === db.client_id);
  const kine = personnel.find(p => p.id === db.personnel_id);
  return {
    id: db.id,
    clientId: db.client_id,
    clientNom: client ? `${client.prenom} ${client.nom}` : 'Inconnu',
    acteCode: db.acte_code,
    acteName: db.acte_name,
    tarif: db.tarif,
    personnelId: db.personnel_id,
    personnelNom: kine ? `${kine.prenom} ${kine.nom}` : 'Inconnu',
    date: db.date,
    heure: db.heure,
    notes: db.notes || '',
    statut: db.statut,
    paye: db.paye,
    createdBy: db.created_by || undefined,
    assignedTo: db.assigned_to || undefined,
    updatedBy: db.updated_by || undefined,
    deletedAt: db.deleted_at || undefined
  };
};

const soinToDb = (s: Soin, createdBy?: string, assignedTo?: string, updatedBy?: string) => ({
  id: s.id,
  client_id: s.clientId,
  acte_code: s.acteCode,
  acte_name: s.acteName,
  tarif: s.tarif,
  personnel_id: s.personnelId,
  date: s.date,
  heure: s.heure,
  notes: s.notes || null,
  statut: s.statut,
  paye: s.paye,
  created_by: createdBy || null,
  assigned_to: assignedTo || null,
  updated_by: updatedBy || null
});

const dbToAbonnement = (db: any, clients: Client[]): AbonnementClient => {
  const client = clients.find(c => c.id === db.client_id);
  return {
    id: db.id,
    clientId: db.client_id,
    clientNom: client ? `${client.prenom} ${client.nom}` : 'Inconnu',
    type: db.type,
    dateDebut: db.date_debut,
    dateFin: db.date_fin,
    montant: db.montant,
    paye: db.paye,
    statut: db.statut,
    createdBy: db.created_by || undefined,
    updatedBy: db.updated_by || undefined,
    deletedAt: db.deleted_at || undefined
  };
};

const abonnementToDb = (a: AbonnementClient, createdBy?: string, updatedBy?: string) => ({
  id: a.id,
  client_id: a.clientId,
  type: a.type,
  date_debut: a.dateDebut,
  date_fin: a.dateFin,
  montant: a.montant,
  paye: a.paye,
  statut: a.statut,
  created_by: createdBy || null,
  updated_by: updatedBy || null
});

const dbToPaiement = (db: any, clients: Client[]): Paiement => {
  const client = clients.find(c => c.id === db.client_id);
  return {
    id: db.id,
    reference: db.reference,
    type: db.type,
    clientId: db.client_id || '',
    clientNom: client ? `${client.prenom} ${client.nom}` : db.client_nom || 'Inconnu',
    description: db.description,
    montant: db.montant,
    date: db.date,
    modePaiement: db.mode_paiement,
    recu: db.recu,
    createdBy: db.created_by || undefined,
    deletedAt: db.deleted_at || undefined
  };
};

const paiementToDb = (p: Paiement, createdBy?: string) => ({
  id: p.id,
  reference: p.reference,
  type: p.type,
  client_id: p.clientId || null,
  client_nom: p.clientNom,
  description: p.description,
  montant: p.montant,
  date: p.date,
  mode_paiement: p.modePaiement,
  recu: p.recu,
  created_by: createdBy || null
});

const dbToTransaction = (db: any): Transaction => ({
  id: db.id,
  type: db.type,
  categorie: db.categorie,
  description: db.description,
  montant: db.montant,
  date: db.date,
  reference: db.reference,
  createdBy: db.created_by || undefined,
  deletedAt: db.deleted_at || undefined
});

const transactionToDb = (t: Transaction, createdBy?: string) => ({
  id: t.id,
  type: t.type,
  categorie: t.categorie,
  description: t.description,
  montant: t.montant,
  date: t.date,
  reference: t.reference,
  created_by: createdBy || null
});

const dbToStock = (db: any): Stock => ({
  id: db.id,
  nom: db.nom,
  categorie: db.categorie,
  quantite: db.quantite,
  unite: db.unite,
  prixUnitaire: db.prix_unitaire,
  seuilAlerte: db.seuil_alerte,
  fournisseur: db.fournisseur || '',
  dateAjout: db.date_ajout,
  createdBy: db.created_by || undefined,
  updatedBy: db.updated_by || undefined,
  deletedAt: db.deleted_at || undefined
});

const stockToDb = (s: Stock, createdBy?: string, updatedBy?: string) => ({
  id: s.id,
  nom: s.nom,
  categorie: s.categorie,
  quantite: s.quantite,
  unite: s.unite,
  prix_unitaire: s.prixUnitaire,
  seuil_alerte: s.seuilAlerte,
  fournisseur: s.fournisseur || null,
  date_ajout: s.dateAjout,
  created_by: createdBy || null,
  updated_by: updatedBy || null
});

const dbToMouvement = (db: any, stocks: Stock[]): MouvementStock => {
  const stock = stocks.find(s => s.id === db.stock_id);
  return {
    id: db.id,
    stockId: db.stock_id,
    stockNom: stock?.nom || 'Inconnu',
    type: db.type,
    quantite: db.quantite,
    motif: db.motif,
    date: db.date,
    utilisateur: db.utilisateur,
    createdBy: db.created_by || undefined,
    deletedAt: db.deleted_at || undefined
  };
};

const mouvementToDb = (m: MouvementStock, createdBy?: string) => ({
  id: m.id,
  stock_id: m.stockId,
  type: m.type,
  quantite: m.quantite,
  motif: m.motif,
  date: m.date,
  utilisateur: m.utilisateur,
  created_by: createdBy || null
});

const dbToRendezVous = (db: any, clients: Client[], personnel: Personnel[]): RendezVous => {
  const client = clients.find(c => c.id === db.client_id);
  const kine = personnel.find(p => p.id === db.personnel_id);
  return {
    id: db.id,
    clientId: db.client_id,
    clientNom: client ? `${client.prenom} ${client.nom}` : 'Inconnu',
    personnelId: db.personnel_id,
    personnelNom: kine ? `${kine.prenom} ${kine.nom}` : 'Inconnu',
    date: db.date,
    heure: db.heure,
    duree: db.duree,
    motif: db.motif,
    statut: db.statut,
    notes: db.notes || '',
    createdBy: db.created_by || undefined,
    assignedTo: db.assigned_to || undefined,
    updatedBy: db.updated_by || undefined,
    deletedAt: db.deleted_at || undefined
  };
};

const rendezVousToDb = (r: RendezVous, createdBy?: string, assignedTo?: string, updatedBy?: string) => ({
  id: r.id,
  client_id: r.clientId,
  personnel_id: r.personnelId,
  date: r.date,
  heure: r.heure,
  duree: r.duree,
  motif: r.motif,
  statut: r.statut,
  notes: r.notes || null,
  created_by: createdBy || null,
  assigned_to: assignedTo || null,
  updated_by: updatedBy || null
});

// Fiche de suivi mapping helpers
const dbToFicheSuivi = (db: any, clients: Client[]): FicheSuivi => {
  const client = clients.find(c => c.id === db.client_id);
  return {
    id: db.id,
    clientId: db.client_id,
    clientNom: client ? `${client.prenom} ${client.nom}` : 'Inconnu',
    dateCreation: db.date_creation || db.created_at || '',
    motif: db.motif || '',
    sexe: db.sexe || '',
    age: typeof db.age === 'number' ? db.age : (db.age ? Number(db.age) : 0),
    temperature: typeof db.temperature === 'number' ? db.temperature : (db.temperature ? Number(db.temperature) : 0),
    tension: db.tension || '',
    poids: typeof db.poids === 'number' ? db.poids : (db.poids ? Number(db.poids) : 0),
    douleur: db.douleur || '',
    typeDouleur: db.type_douleur || 'Autre',
    siegeDouleur: db.siege_douleur || '',
    diagnostic: db.diagnostic || '',
    examenPhysique: db.examen_physique || '',
    bilanVasculaire: db.bilan_vasculaire || '',
    bilanNeurologique: db.bilan_neurologique || '',
    bilanArticulaire: db.bilan_articulaire || '',
    bilanMusculaire: db.bilan_musculaire || '',
    evaluationFonctionnelle: db.evaluation_fonctionnelle || '',
    facteursPsychologiques: db.facteurs_psychologiques || '',
    objectifs: db.objectifs || '',
    planSoins: db.plan_soins || '',
    noteComplementaire: db.note_complementaire || '',
    createdBy: db.created_by || undefined,
    updatedBy: db.updated_by || undefined,
    deletedAt: db.deleted_at || undefined
  };
};

const ficheToDb = (f: FicheSuivi, createdBy?: string, updatedBy?: string) => ({
  id: f.id,
  client_id: f.clientId,
  date_creation: f.dateCreation,
  motif: f.motif || null,
  sexe: f.sexe || null,
  age: f.age || null,
  temperature: f.temperature || null,
  tension: f.tension || null,
  poids: f.poids || null,
  douleur: f.douleur || null,
  type_douleur: f.typeDouleur || null,
  siege_douleur: f.siegeDouleur || null,
  diagnostic: f.diagnostic || null,
  examen_physique: f.examenPhysique || null,
  bilan_vasculaire: f.bilanVasculaire || null,
  bilan_neurologique: f.bilanNeurologique || null,
  bilan_articulaire: f.bilanArticulaire || null,
  bilan_musculaire: f.bilanMusculaire || null,
  evaluation_fonctionnelle: f.evaluationFonctionnelle || null,
  facteurs_psychologiques: f.facteursPsychologiques || null,
  objectifs: f.objectifs || null,
  plan_soins: f.planSoins || null,
  note_complementaire: f.noteComplementaire || null,
  created_by: createdBy || f.createdBy || null,
  updated_by: updatedBy || f.updatedBy || null
});

// Fiche séance mapping helpers
const dbToFicheSeance = (db: any): FicheSeance => ({
  id: db.id,
  ficheId: db.fiche_id,
  date: db.date,
  traitement: db.traitement || '',
  observation: db.observation || '',
  visaKine: db.visa_kine || '',
  visaPatient: db.visa_patient || '',
  createdBy: db.created_by || undefined,
  deletedAt: db.deleted_at || undefined
});

const seanceToDb = (s: FicheSeance, createdBy?: string) => ({
  id: s.id,
  fiche_id: s.ficheId,
  date: s.date,
  traitement: s.traitement || null,
  observation: s.observation || null,
  visa_kine: s.visaKine || null,
  visa_patient: s.visaPatient || null,
  created_by: createdBy || s.createdBy || null
});

const dbToUtilisateur = (db: any): User => ({
  id: db.id,
  nom: db.nom,
  prenom: db.prenom,
  email: db.email,
  role: db.role,
  telephone: db.telephone,
  dateCreation: db.date_creation,
  actif: db.actif
});

const utilisateurToDb = (u: User) => {
  const now = new Date().toISOString();
  return {
    id: u.id,
    nom: u.nom,
    prenom: u.prenom,
    email: u.email,
    password_hash: u.password ? `local:${u.password}` : 'local-auth',
    role: u.role,
    telephone: u.telephone,
    date_creation: u.dateCreation || now.split('T')[0],
    actif: u.actif,
    created_at: now,
    updated_at: now
  };
};

// Main database hook
export function useDatabase() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // Data states
  const [clients, setClients] = useState<Client[]>([]);
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [soins, setSoins] = useState<Soin[]>([]);
  const [fichesSuivi, setFichesSuivi] = useState<FicheSuivi[]>([]);
  const [fichesSeances, setFichesSeances] = useState<FicheSeance[]>([]);
  const [abonnements, setAbonnements] = useState<AbonnementClient[]>([]);
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [mouvements, setMouvements] = useState<MouvementStock[]>([]);
  const [rendezvous, setRendezvous] = useState<RendezVous[]>([]);
  const [utilisateurs, setUtilisateurs] = useState<User[]>([]);

  const validatePaiement = (paiement: Paiement) => {
    if (!paiement.clientId) throw new Error('Client invalide pour le paiement.');
    if (!paiement.clientNom) throw new Error('Nom du client requis.');
    if (paiement.montant <= 0) throw new Error('Le montant du paiement doit être supérieur à zéro.');
    if (!['soin', 'abonnement', 'autre'].includes(paiement.type)) throw new Error('Type de paiement invalide.');
    if (!['especes', 'mobile_money', 'carte', 'virement'].includes(paiement.modePaiement)) throw new Error('Mode de paiement invalide.');
  };

  const validateTransaction = (transaction: Transaction) => {
    if (transaction.montant <= 0) throw new Error('Montant de transaction invalide.');
    if (!['entree', 'sortie'].includes(transaction.type)) throw new Error('Type de transaction invalide.');
    if (!transaction.categorie) throw new Error('Catégorie de transaction requise.');
  };

  const validateSoin = (soin: Soin) => {
    if (!soin.clientId) throw new Error('Client invalide pour le soin.');
    if (!soin.acteCode || !soin.acteName) throw new Error('Acte de soin requis.');
    if (soin.tarif <= 0) throw new Error('Tarif du soin invalide.');
    if (!['en_attente', 'en_cours', 'termine', 'annule'].includes(soin.statut)) throw new Error('Statut de soin invalide.');
  };

  const validateFicheSuivi = (fiche: FicheSuivi) => {
    if (!fiche.clientId) throw new Error('Client invalide pour la fiche de suivi.');
    if (!fiche.motif) throw new Error('Motif requis.');
    if (!fiche.diagnostic) throw new Error('Diagnostic requis.');
  };

  const validateFicheSeance = (seance: FicheSeance) => {
    if (!seance.ficheId) throw new Error('Fiche de suivi invalide pour séance.');
    if (!seance.date) throw new Error('Date de séance requise.');
  };

  const validateAbonnement = (abo: AbonnementClient) => {
    if (!abo.clientId) throw new Error('Client invalide pour l’abonnement.');
    if (!abo.type) throw new Error('Type d’abonnement requis.');
    if (abo.montant <= 0) throw new Error('Montant d’abonnement invalide.');
    if (!['actif', 'expire', 'suspendu'].includes(abo.statut)) throw new Error('Statut d’abonnement invalide.');
  };

  // Check connection and load initial data
  useEffect(() => {
    const initDatabase = async () => {
      try {
        setLoading(true);
        
        // FORCER le chargement des données par défaut immédiatement
        // Vérifier si les variables Supabase sont configurées
        if (!supabaseUrl || !supabaseAnonKey) {
          console.log('Variables Supabase non configurées, utilisation du stockage local');
          setIsConnected(false);
          await loadFromLocalStorage();
          return;
        }
        
        // Test connection
        const { error: testError } = await supabase.from('clients').select('count').limit(1);
        
        if (testError) {
          console.log('Database not connected, using local storage:', testError.message);
          setIsConnected(false);
          await loadFromLocalStorage();
        } else {
          setIsConnected(true);
          await loadAllData();
        }
      } catch (err) {
        console.error('Database init error:', err);
        setIsConnected(false);
        await loadFromLocalStorage();
      } finally {
        setLoading(false);
      }
    };

    initDatabase();
  }, []);

  // Load from local storage as fallback
  const loadFromLocalStorage = async () => {
    try {
      // Prefer IndexedDB clientStorage when available
      if (clientStorage) {
        const data = await clientStorage.exportAll();
        setClients(data.clients && data.clients.length ? data.clients.map(dbToClient) : SAMPLE_CLIENTS);
        setPersonnel(data.personnel && data.personnel.length ? data.personnel.map(dbToPersonnel) : SAMPLE_PERSONNEL);
        setSoins(data.soins && data.soins.length ? data.soins.map(s => dbToSoin(s, data.clients || [], data.personnel || [])) : getDefaultSoins());
        setAbonnements(data.abonnements && data.abonnements.length ? data.abonnements.map(a => dbToAbonnement(a, data.clients || [])) : getDefaultAbonnements());
        setPaiements(data.paiements && data.paiements.length ? data.paiements.map(p => dbToPaiement(p, data.clients || [])) : getDefaultPaiements());
        setTransactions(data.transactions && data.transactions.length ? data.transactions.map(dbToTransaction) : getDefaultTransactions());
        setStocks(data.stocks && data.stocks.length ? data.stocks.map(dbToStock) : getDefaultStocks());
        setMouvements(data.mouvements_stock && data.mouvements_stock.length ? data.mouvements_stock.map(m => dbToMouvement(m, data.stocks || [])) : []);
        setRendezvous(data.rendezvous && data.rendezvous.length ? data.rendezvous.map(r => dbToRendezVous(r, data.clients || [], data.personnel || [])) : getDefaultRendezvous());
        setUtilisateurs(data.utilisateurs && data.utilisateurs.length ? data.utilisateurs.map(dbToUtilisateur) : getDefaultUtilisateurs());
        setFichesSuivi(data.fiches_suivi && data.fiches_suivi.length ? data.fiches_suivi.map((f: any) => dbToFicheSuivi(f, data.clients || [])) : []);
        setFichesSeances(data.fiches_seances && data.fiches_seances.length ? data.fiches_seances.map(dbToFicheSeance) : []);
        return;
      }

      // Fallback to localStorage for older environments
      const storedClients = localStorage.getItem('ctk_clients');
      const storedPersonnel = localStorage.getItem('ctk_personnel');
      const storedSoins = localStorage.getItem('ctk_soins');
      const storedAbonnements = localStorage.getItem('ctk_abonnements');
      const storedPaiements = localStorage.getItem('ctk_paiements');
      const storedTransactions = localStorage.getItem('ctk_transactions');
      const storedStocks = localStorage.getItem('ctk_stocks');
      const storedMouvements = localStorage.getItem('ctk_mouvements');
      const storedRendezvous = localStorage.getItem('ctk_rendezvous');
      const storedUtilisateurs = localStorage.getItem('ctk_utilisateurs');
      const storedFichesSuivi = localStorage.getItem('ctk_fiches_suivi');
      const storedFichesSeances = localStorage.getItem('ctk_fiches_seances');

      setClients(storedClients ? JSON.parse(storedClients) : SAMPLE_CLIENTS);
      setPersonnel(storedPersonnel ? JSON.parse(storedPersonnel) : SAMPLE_PERSONNEL);
      setSoins(storedSoins ? JSON.parse(storedSoins) : getDefaultSoins());
      setAbonnements(storedAbonnements ? JSON.parse(storedAbonnements) : getDefaultAbonnements());
      setPaiements(storedPaiements ? JSON.parse(storedPaiements) : getDefaultPaiements());
      setTransactions(storedTransactions ? JSON.parse(storedTransactions) : getDefaultTransactions());
      setStocks(storedStocks ? JSON.parse(storedStocks) : getDefaultStocks());
      setMouvements(storedMouvements ? JSON.parse(storedMouvements) : []);
      setRendezvous(storedRendezvous ? JSON.parse(storedRendezvous) : getDefaultRendezvous());
      setUtilisateurs(storedUtilisateurs ? JSON.parse(storedUtilisateurs) : getDefaultUtilisateurs());
      setFichesSuivi(storedFichesSuivi ? JSON.parse(storedFichesSuivi) : []);
      setFichesSeances(storedFichesSeances ? JSON.parse(storedFichesSeances) : []);

    } catch (err) {
      console.error('Error loading from storage:', err);
      // Use default data
      setClients(SAMPLE_CLIENTS);
      setPersonnel(SAMPLE_PERSONNEL);
      setSoins(getDefaultSoins());
      setAbonnements(getDefaultAbonnements());
      setPaiements(getDefaultPaiements());
      setTransactions(getDefaultTransactions());
      setStocks(getDefaultStocks());
      setMouvements([]);
      setRendezvous(getDefaultRendezvous());
      setUtilisateurs(getDefaultUtilisateurs());
    }
  };

  // Save to local storage
  const saveToLocalStorage = useCallback((key: string, data: any) => {
    try {
      // Prefer clientStorage (IndexedDB)
      const mapKeyToTable: Record<string, string> = {
        clients: 'clients', personnel: 'personnel', soins: 'soins', abonnements: 'abonnements', paiements: 'paiements', transactions: 'transactions', stocks: 'stocks', mouvements: 'mouvements_stock', rendezvous: 'rendezvous', utilisateurs: 'utilisateurs', fiches_suivi: 'fiches_suivi', fiches_seances: 'fiches_seances'
      };
      const table = mapKeyToTable[key] || key;
      if (clientStorage && clientStorage.importAll) {
        const payload: Record<string, any[]> = {};
        payload[table] = data;
        // importAll handles put/overwrite when called repeatedly; do not await to avoid blocking UI
        clientStorage.importAll(payload, true).catch((e: any) => console.error('clientStorage import error', e));
      } else {
        localStorage.setItem(`ctk_${key}`, JSON.stringify(data));
      }
    } catch (err) {
      console.error('Error saving to storage:', err);
    }
  }, []);

  // Load all data from Supabase
  const loadAllData = async () => {
    try {
      const userId = currentUser?.id;
      const userRole = currentUser?.role;
      
      // Helper function to filter by deleted_at and role
      const filterByRoleAndDeleted = (items: any[]) => {
        return items.filter(item => {
          // Filter out deleted items
          if (item.deletedAt) return false;
          
          // Admins see all
          if (userRole === 'admin') return true;
          
          // Agents see only their own or assigned items
          if (userRole === 'agent') {
            const isCreatedByMe = item.createdBy === userId;
            const isAssignedToMe = item.assignedTo === userId;
            return isCreatedByMe || isAssignedToMe;
          }
          
          return false;
        });
      };

      // Load clients
      const { data: clientsData } = await supabase.from('clients').select('*').order('created_at', { ascending: false });
      const loadedClients = (clientsData?.map(dbToClient) || []).filter(c => !c.deletedAt);
      const filteredClients = userRole === 'admin' ? loadedClients : loadedClients.filter(c => c.createdBy === userId);
      setClients(filteredClients);

      // Load personnel
      const { data: personnelData } = await supabase.from('personnel').select('*').order('created_at', { ascending: false });
      const loadedPersonnel = (personnelData?.map(dbToPersonnel) || []).filter(p => !p.deletedAt);
      const filteredPersonnel = userRole === 'admin' ? loadedPersonnel : loadedPersonnel.filter(p => p.createdBy === userId);
      setPersonnel(filteredPersonnel);

      // Load soins
      const { data: soinsData } = await supabase.from('soins').select('*').order('date', { ascending: false });
      const loadedSoins = (soinsData?.map(s => dbToSoin(s, filteredClients, filteredPersonnel)) || []).filter(s => !s.deletedAt);
      const filteredSoins = filterByRoleAndDeleted(loadedSoins);
      setSoins(filteredSoins);

      // Load abonnements
      const { data: abonnementsData } = await supabase.from('abonnements').select('*').order('date_debut', { ascending: false });
      const loadedAbonnements = (abonnementsData?.map(a => dbToAbonnement(a, filteredClients)) || []).filter(a => !a.deletedAt);
      const filteredAbonnements = filterByRoleAndDeleted(loadedAbonnements);
      setAbonnements(filteredAbonnements);

      // Load paiements
      const { data: paiementsData } = await supabase.from('paiements').select('*').order('date', { ascending: false });
      const loadedPaiements = (paiementsData?.map(p => dbToPaiement(p, filteredClients)) || []).filter(p => !p.deletedAt);
      const filteredPaiements = filterByRoleAndDeleted(loadedPaiements);
      setPaiements(filteredPaiements);

      // Load transactions
      const { data: transactionsData } = await supabase.from('transactions').select('*').order('date', { ascending: false });
      const loadedTransactions = (transactionsData?.map(dbToTransaction) || []).filter(t => !t.deletedAt);
      const filteredTransactions = filterByRoleAndDeleted(loadedTransactions);
      setTransactions(filteredTransactions);

      // Load stocks (admin only)
      let loadedStocks: Stock[] = [];
      if (userRole === 'admin') {
        const { data: stocksData } = await supabase.from('stocks').select('*').order('nom');
        loadedStocks = (stocksData?.map(dbToStock) || []).filter(s => !s.deletedAt);
      }
      setStocks(loadedStocks);

      // Load mouvements
      const { data: mouvementsData } = await supabase.from('mouvements_stock').select('*').order('date', { ascending: false });
      const loadedMouvements = (mouvementsData?.map(m => dbToMouvement(m, loadedStocks)) || []).filter(m => !m.deletedAt);
      const filteredMouvements = filterByRoleAndDeleted(loadedMouvements);
      setMouvements(filteredMouvements);

      // Load rendezvous
      const { data: rendezvousData } = await supabase.from('rendezvous').select('*').order('date', { ascending: false });
      const loadedRendezvous = (rendezvousData?.map(r => dbToRendezVous(r, filteredClients, filteredPersonnel)) || []).filter(r => !r.deletedAt);
      const filteredRendezvous = filterByRoleAndDeleted(loadedRendezvous);
      setRendezvous(filteredRendezvous);

      const { data: fichesSuiviData } = await supabase.from('fiches_suivi').select('*').order('date_creation', { ascending: false });
      const loadedFichesSuivi = (fichesSuiviData?.map((f: any) => dbToFicheSuivi(f, filteredClients)) || []).filter(f => !f.deletedAt);
      // All staff can view all patient fiches (clinic-wide access - critical for continuity of care)
      setFichesSuivi(loadedFichesSuivi);

      const { data: fichesSeancesData } = await supabase.from('fiches_seances').select('*').order('date', { ascending: false });
      const loadedFichesSeances = (fichesSeancesData?.map((s: any) => dbToFicheSeance(s)) || []).filter(s => !s.deletedAt);
      // All staff can view all patient session records (clinic-wide access)
      setFichesSeances(loadedFichesSeances);

      // Load utilisateurs (admin only)
      let loadedUtilisateurs: User[] = [];
      if (userRole === 'admin') {
        const { data: utilisateursData } = await supabase.from('utilisateurs').select('*').order('date_creation', { ascending: false });
        loadedUtilisateurs = utilisateursData?.map(dbToUtilisateur) || [];
      }
      setUtilisateurs(loadedUtilisateurs);

    } catch (err) {
      console.error('Error loading data from Supabase:', err);
      setError('Erreur lors du chargement des données');
    }
  };

  // CRUD operations for Clients
  const addClient = useCallback(async (client: Client) => {
    if (isConnected) {
      const { error } = await supabase.from('clients').insert(clientToDb(client, currentUser?.id));
      if (error) {
        console.error('Error adding client:', error);
        throw error;
      }
    }
    setClients(prev => {
      const updated = [...prev, { ...client, createdBy: currentUser?.id }];
      if (!isConnected) saveToLocalStorage('clients', updated);
      return updated;
    });
  }, [isConnected, saveToLocalStorage, currentUser?.id]);

  const updateClient = useCallback(async (client: Client) => {
    if (isConnected) {
      const { error } = await supabase.from('clients').update(clientToDb(client)).eq('id', client.id);
      if (error) {
        console.error('Error updating client:', error);
        throw error;
      }
    }
    setClients(prev => {
      const updated = prev.map(c => c.id === client.id ? client : c);
      if (!isConnected) saveToLocalStorage('clients', updated);
      return updated;
    });
  }, [isConnected, saveToLocalStorage]);

  const deleteClient = useCallback(async (id: string) => {
    if (isConnected) {
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (error) {
        console.error('Error deleting client:', error);
        throw error;
      }
    }
    setClients(prev => {
      const updated = prev.filter(c => c.id !== id);
      if (!isConnected) saveToLocalStorage('clients', updated);
      return updated;
    });
  }, [isConnected, saveToLocalStorage]);

  // CRUD operations for Personnel
  const addPersonnel = useCallback(async (p: Personnel) => {
    if (isConnected) {
      const { error } = await supabase.from('personnel').insert(personnelToDb(p));
      if (error) throw error;
    }
    setPersonnel(prev => {
      const updated = [...prev, p];
      if (!isConnected) saveToLocalStorage('personnel', updated);
      return updated;
    });
  }, [isConnected, saveToLocalStorage]);

  const updatePersonnel = useCallback(async (p: Personnel) => {
    if (isConnected) {
      const { error } = await supabase.from('personnel').update(personnelToDb(p)).eq('id', p.id);
      if (error) throw error;
    }
    setPersonnel(prev => {
      const updated = prev.map(item => item.id === p.id ? p : item);
      if (!isConnected) saveToLocalStorage('personnel', updated);
      return updated;
    });
  }, [isConnected, saveToLocalStorage]);

  const deletePersonnel = useCallback(async (id: string) => {
    if (isConnected) {
      const { error } = await supabase.from('personnel').delete().eq('id', id);
      if (error) throw error;
    }
    setPersonnel(prev => {
      const updated = prev.filter(p => p.id !== id);
      if (!isConnected) saveToLocalStorage('personnel', updated);
      return updated;
    });
  }, [isConnected, saveToLocalStorage]);

  // CRUD operations for Soins
  const addSoin = useCallback(async (soin: Soin) => {
    validateSoin(soin);
    if (isConnected) {
      const { error } = await supabase.from('soins').insert(soinToDb(soin));
      if (error) throw error;
    }
    setSoins(prev => {
      const updated = [...prev, soin];
      if (!isConnected) saveToLocalStorage('soins', updated);
      return updated;
    });
  }, [isConnected, saveToLocalStorage]);

  const addFicheSuivi = useCallback(async (fiche: FicheSuivi) => {
    validateFicheSuivi(fiche);
    if (isConnected) {
      const { error } = await supabase.from('fiches_suivi').insert(ficheToDb(fiche, currentUser?.id));
      if (error) throw error;
    }
    setFichesSuivi(prev => {
      const updated = [...prev, fiche];
      if (!isConnected) saveToLocalStorage('fiches_suivi', updated);
      return updated;
    });
  }, [isConnected, saveToLocalStorage, currentUser?.id]);

  const updateFicheSuivi = useCallback(async (fiche: FicheSuivi) => {
    validateFicheSuivi(fiche);
    if (isConnected) {
      const { error } = await supabase.from('fiches_suivi').update(ficheToDb(fiche, undefined, currentUser?.id)).eq('id', fiche.id);
      if (error) throw error;
    }
    setFichesSuivi(prev => {
      const updated = prev.map(f => f.id === fiche.id ? fiche : f);
      if (!isConnected) saveToLocalStorage('fiches_suivi', updated);
      return updated;
    });
  }, [isConnected, saveToLocalStorage, currentUser?.id]);

  const deleteFicheSuivi = useCallback(async (id: string) => {
    if (isConnected) {
      const { error } = await supabase.from('fiches_suivi').delete().eq('id', id);
      if (error) throw error;
    }
    setFichesSuivi(prev => {
      const updated = prev.filter(f => f.id !== id);
      if (!isConnected) saveToLocalStorage('fiches_suivi', updated);
      return updated;
    });
  }, [isConnected, saveToLocalStorage]);

  const addFicheSeance = useCallback(async (seance: FicheSeance) => {
    validateFicheSeance(seance);
    if (isConnected) {
      const { error } = await supabase.from('fiches_seances').insert(seanceToDb(seance, currentUser?.id));
      if (error) throw error;
    }
    setFichesSeances(prev => {
      const updated = [...prev, seance];
      if (!isConnected) saveToLocalStorage('fiches_seances', updated);
      return updated;
    });
  }, [isConnected, saveToLocalStorage, currentUser?.id]);

  const updateFicheSeance = useCallback(async (seance: FicheSeance) => {
    validateFicheSeance(seance);
    if (isConnected) {
      const { error } = await supabase.from('fiches_seances').update(seanceToDb(seance)).eq('id', seance.id);
      if (error) throw error;
    }
    setFichesSeances(prev => {
      const updated = prev.map(s => s.id === seance.id ? seance : s);
      if (!isConnected) saveToLocalStorage('fiches_seances', updated);
      return updated;
    });
  }, [isConnected, saveToLocalStorage]);

  const deleteFicheSeance = useCallback(async (id: string) => {
    if (isConnected) {
      const { error } = await supabase.from('fiches_seances').delete().eq('id', id);
      if (error) throw error;
    }
    setFichesSeances(prev => {
      const updated = prev.filter(s => s.id !== id);
      if (!isConnected) saveToLocalStorage('fiches_seances', updated);
      return updated;
    });
  }, [isConnected, saveToLocalStorage]);

  const updateSoin = useCallback(async (soin: Soin) => {
    validateSoin(soin);
    if (isConnected) {
      const { error } = await supabase.from('soins').update(soinToDb(soin)).eq('id', soin.id);
      if (error) throw error;
    }
    setSoins(prev => {
      const updated = prev.map(s => s.id === soin.id ? soin : s);
      if (!isConnected) saveToLocalStorage('soins', updated);
      return updated;
    });
  }, [isConnected, saveToLocalStorage]);

  const deleteSoin = useCallback(async (id: string) => {
    if (isConnected) {
      const { error } = await supabase.from('soins').delete().eq('id', id);
      if (error) throw error;
    }
    setSoins(prev => {
      const updated = prev.filter(s => s.id !== id);
      if (!isConnected) saveToLocalStorage('soins', updated);
      return updated;
    });
  }, [isConnected, saveToLocalStorage]);

  // CRUD operations for Abonnements
  const addAbonnement = useCallback(async (abo: AbonnementClient) => {
    validateAbonnement(abo);
    if (isConnected) {
      const { error } = await supabase.from('abonnements').insert(abonnementToDb(abo));
      if (error) throw error;
    }
    setAbonnements(prev => {
      const updated = [...prev, abo];
      if (!isConnected) saveToLocalStorage('abonnements', updated);
      return updated;
    });
  }, [isConnected, saveToLocalStorage]);

  const updateAbonnement = useCallback(async (abo: AbonnementClient) => {
    validateAbonnement(abo);
    if (isConnected) {
      const { error } = await supabase.from('abonnements').update(abonnementToDb(abo)).eq('id', abo.id);
      if (error) throw error;
    }
    setAbonnements(prev => {
      const updated = prev.map(a => a.id === abo.id ? abo : a);
      if (!isConnected) saveToLocalStorage('abonnements', updated);
      return updated;
    });
  }, [isConnected, saveToLocalStorage]);

  const deleteAbonnement = useCallback(async (id: string) => {
    if (isConnected) {
      const { error } = await supabase.from('abonnements').delete().eq('id', id);
      if (error) throw error;
    }
    setAbonnements(prev => {
      const updated = prev.filter(a => a.id !== id);
      if (!isConnected) saveToLocalStorage('abonnements', updated);
      return updated;
    });
  }, [isConnected, saveToLocalStorage]);

  // CRUD operations for Paiements
  const addPaiement = useCallback(async (paiement: Paiement) => {
    validatePaiement(paiement);
    if (isConnected) {
      const { error } = await supabase.from('paiements').insert(paiementToDb(paiement));
      if (error) throw error;
    }
    setPaiements(prev => {
      const updated = [...prev, paiement];
      if (!isConnected) saveToLocalStorage('paiements', updated);
      return updated;
    });
  }, [isConnected, saveToLocalStorage]);

  const updatePaiement = useCallback(async (paiement: Paiement) => {
    if (isConnected) {
      const { error } = await supabase.from('paiements').update(paiementToDb(paiement)).eq('id', paiement.id);
      if (error) throw error;
    }
    setPaiements(prev => {
      const updated = prev.map(p => p.id === paiement.id ? paiement : p);
      if (!isConnected) saveToLocalStorage('paiements', updated);
      return updated;
    });
  }, [isConnected, saveToLocalStorage]);

  // CRUD operations for Transactions
  const addTransaction = useCallback(async (transaction: Transaction) => {
    validateTransaction(transaction);
    if (isConnected) {
      const { error } = await supabase.from('transactions').insert(transactionToDb(transaction));
      if (error) throw error;
    }
    setTransactions(prev => {
      const updated = [...prev, transaction];
      if (!isConnected) saveToLocalStorage('transactions', updated);
      return updated;
    });
  }, [isConnected, saveToLocalStorage]);

  // CRUD operations for Stocks
  const addStock = useCallback(async (stock: Stock) => {
    if (isConnected) {
      const { error } = await supabase.from('stocks').insert(stockToDb(stock));
      if (error) throw error;
    }
    setStocks(prev => {
      const updated = [...prev, stock];
      if (!isConnected) saveToLocalStorage('stocks', updated);
      return updated;
    });
  }, [isConnected, saveToLocalStorage]);

  const updateStock = useCallback(async (stock: Stock) => {
    if (isConnected) {
      const { error } = await supabase.from('stocks').update(stockToDb(stock)).eq('id', stock.id);
      if (error) throw error;
    }
    setStocks(prev => {
      const updated = prev.map(s => s.id === stock.id ? stock : s);
      if (!isConnected) saveToLocalStorage('stocks', updated);
      return updated;
    });
  }, [isConnected, saveToLocalStorage]);

  const deleteStock = useCallback(async (id: string) => {
    if (isConnected) {
      const { error } = await supabase.from('stocks').delete().eq('id', id);
      if (error) throw error;
    }
    setStocks(prev => {
      const updated = prev.filter(s => s.id !== id);
      if (!isConnected) saveToLocalStorage('stocks', updated);
      return updated;
    });
  }, [isConnected, saveToLocalStorage]);

  // CRUD operations for Mouvements
  const addMouvement = useCallback(async (mouvement: MouvementStock) => {
    if (isConnected) {
      const { error } = await supabase.from('mouvements_stock').insert(mouvementToDb(mouvement));
      if (error) throw error;
    }
    setMouvements(prev => {
      const updated = [...prev, mouvement];
      if (!isConnected) saveToLocalStorage('mouvements', updated);
      return updated;
    });
  }, [isConnected, saveToLocalStorage]);

  // CRUD operations for Rendezvous
  const addRendezvous = useCallback(async (rdv: RendezVous) => {
    if (isConnected) {
      const { error } = await supabase.from('rendezvous').insert(rendezVousToDb(rdv));
      if (error) throw error;
    }
    setRendezvous(prev => {
      const updated = [...prev, rdv];
      if (!isConnected) saveToLocalStorage('rendezvous', updated);
      return updated;
    });
  }, [isConnected, saveToLocalStorage]);

  const updateRendezvous = useCallback(async (rdv: RendezVous) => {
    if (isConnected) {
      const { error } = await supabase.from('rendezvous').update(rendezVousToDb(rdv)).eq('id', rdv.id);
      if (error) throw error;
    }
    setRendezvous(prev => {
      const updated = prev.map(r => r.id === rdv.id ? rdv : r);
      if (!isConnected) saveToLocalStorage('rendezvous', updated);
      return updated;
    });
  }, [isConnected, saveToLocalStorage]);

  const deleteRendezvous = useCallback(async (id: string) => {
    if (isConnected) {
      const { error } = await supabase.from('rendezvous').delete().eq('id', id);
      if (error) throw error;
    }
    setRendezvous(prev => {
      const updated = prev.filter(r => r.id !== id);
      if (!isConnected) saveToLocalStorage('rendezvous', updated);
      return updated;
    });
  }, [isConnected, saveToLocalStorage]);

  // CRUD operations for Utilisateurs
  const addUtilisateur = useCallback(async (user: User) => {
    if (isConnected) {
      const { error } = await supabase.from('utilisateurs').insert(utilisateurToDb(user));
      if (error) throw error;
    }
    setUtilisateurs(prev => {
      const updated = [...prev, user];
      if (!isConnected) saveToLocalStorage('utilisateurs', updated);
      return updated;
    });
  }, [isConnected, saveToLocalStorage]);

  const updateUtilisateur = useCallback(async (user: User) => {
    if (isConnected) {
      const { error } = await supabase.from('utilisateurs').update(utilisateurToDb(user)).eq('id', user.id);
      if (error) throw error;
    }
    setUtilisateurs(prev => {
      const updated = prev.map(u => u.id === user.id ? user : u);
      if (!isConnected) saveToLocalStorage('utilisateurs', updated);
      return updated;
    });
  }, [isConnected, saveToLocalStorage]);

  const deleteUtilisateur = useCallback(async (id: string) => {
    if (isConnected) {
      const { error } = await supabase.from('utilisateurs').delete().eq('id', id);
      if (error) throw error;
    }
    setUtilisateurs(prev => {
      const updated = prev.filter(u => u.id !== id);
      if (!isConnected) saveToLocalStorage('utilisateurs', updated);
      return updated;
    });
  }, [isConnected, saveToLocalStorage]);

  return {
    // State
    loading,
    error,
    isConnected,
    
    // Data
    clients,
    personnel,
    soins,
    fichesSuivi,
    fichesSeances,
    abonnements,
    paiements,
    transactions,
    stocks,
    mouvements,
    rendezvous,
    utilisateurs,
    
    // Client operations
    addClient,
    updateClient,
    deleteClient,
    
    // Personnel operations
    addPersonnel,
    updatePersonnel,
    deletePersonnel,
    
    // Soin operations
    addSoin,
    updateSoin,
    deleteSoin,
    
    // Fiche de suivi operations
    addFicheSuivi,
    updateFicheSuivi,
    deleteFicheSuivi,
    addFicheSeance,
    updateFicheSeance,
    deleteFicheSeance,
    
    // Abonnement operations
    addAbonnement,
    updateAbonnement,
    deleteAbonnement,
    
    // Paiement operations
    addPaiement,
    updatePaiement,
    
    // Transaction operations
    addTransaction,
    
    // Stock operations
    addStock,
    updateStock,
    deleteStock,
    
    // Mouvement operations
    addMouvement,
    
    // Rendezvous operations
    addRendezvous,
    updateRendezvous,
    deleteRendezvous,
    
    // Utilisateur operations
    addUtilisateur,
    updateUtilisateur,
    deleteUtilisateur,
    
    // Reload data
    reloadData: loadAllData
  };
}

// Default data functions
function getDefaultSoins(): Soin[] {
  return [
    {
      id: '1',
      clientId: '1',
      clientNom: 'Amadou Diallo',
      acteCode: 'R000',
      acteName: 'Consultation',
      tarif: 3000,
      personnelId: '1',
      personnelNom: 'Dr. Fatou Koné',
      date: new Date().toISOString().split('T')[0],
      heure: '09:00',
      notes: 'Première consultation',
      statut: 'termine',
      paye: true
    }
  ];
}

function getDefaultAbonnements(): AbonnementClient[] {
  return [
    {
      id: '1',
      clientId: '1',
      clientNom: 'Amadou Diallo',
      type: 'Mensuel',
      dateDebut: '2026-01-01',
      dateFin: '2026-01-31',
      montant: 15000,
      paye: true,
      statut: 'actif'
    }
  ];
}

function getDefaultPaiements(): Paiement[] {
  return [
    {
      id: '1',
      reference: 'CTK-20260120-ABC12',
      type: 'soin',
      clientId: '1',
      clientNom: 'Amadou Diallo',
      description: 'Soin: Consultation',
      montant: 3000,
      date: new Date().toISOString().split('T')[0],
      modePaiement: 'especes',
      recu: true
    }
  ];
}

function getDefaultTransactions(): Transaction[] {
  return [
    {
      id: '1',
      type: 'entree',
      categorie: 'Soins kinésithérapie',
      description: 'Revenus soins',
      montant: 150000,
      date: new Date().toISOString().split('T')[0],
      reference: 'TRX-ABC123'
    }
  ];
}

function getDefaultStocks(): Stock[] {
  return [
    {
      id: '1',
      nom: 'Huile de massage',
      categorie: 'Huiles et crèmes',
      quantite: 15,
      unite: 'litre',
      prixUnitaire: 5000,
      seuilAlerte: 5,
      fournisseur: 'Pharma Plus',
      dateAjout: '2026-01-01'
    },
    {
      id: '2',
      nom: 'Bandes élastiques',
      categorie: 'Équipements médicaux',
      quantite: 3,
      unite: 'boîte',
      prixUnitaire: 15000,
      seuilAlerte: 5,
      fournisseur: 'MediSupply',
      dateAjout: '2026-01-01'
    }
  ];
}

function getDefaultRendezvous(): RendezVous[] {
  return [
    {
      id: '1',
      clientId: '1',
      clientNom: 'Amadou Diallo',
      personnelId: '1',
      personnelNom: 'Dr. Fatou Koné',
      date: new Date().toISOString().split('T')[0],
      heure: '09:00',
      duree: 30,
      motif: 'Consultation initiale',
      statut: 'planifie',
      notes: ''
    }
  ];
}

function getDefaultUtilisateurs(): User[] {
  return [
    {
      id: '1',
      nom: 'Admin',
      prenom: 'CTK',
      email: 'admin@ctk.ci',
      role: 'admin',
      telephone: '+225 07 00 00 00 00',
      dateCreation: '2024-01-01',
      actif: true
    },
    {
      id: '2',
      nom: 'Agent',
      prenom: 'CTK',
      email: 'agent@ctk.ci',
      role: 'agent',
      telephone: '+225 05 00 00 00 00',
      dateCreation: '2024-01-01',
      actif: true
    }
  ];
}
