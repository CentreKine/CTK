// CTK - Centre de Traitement en Kinésithérapie - Data Types and Constants

export interface User {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  password?: string; // Optional, for registration only
  role: 'admin' | 'agent';
  telephone: string;
  dateCreation: string;
  actif: boolean;
}

export interface Client {
  id: string;
  nom: string;
  prenom: string;
  dateNaissance: string;
  sexe: 'M' | 'F';
  telephone: string;
  email: string;
  adresse: string;
  profession: string;
  groupeSanguin: string;
  allergies: string;
  antecedents: string;
  dateInscription: string;
  notes: string;
  // Audit fields
  createdBy?: string;
  updatedBy?: string;
  deletedAt?: string;
}

export interface FicheSuivi {
  id: string;
  clientId: string;
  clientNom: string;
  dateCreation: string;
  motif: string;
  // Informations du patient
  sexe: 'M' | 'F' | '';
  age: number;
  temperature: number;
  tension: string;
  poids: number;
  // Douleur
  douleur: string;
  typeDouleur: 'Aiguë' | 'Chronique' | 'Périodique' | 'Brûlure' | 'Autre';
  siegeDouleur: string;
  diagnostic: string;
  // Examens
  examenPhysique: string;
  bilanVasculaire: string;
  bilanNeurologique: string;
  bilanArticulaire: string;
  bilanMusculaire: string;
  evaluationFonctionnelle: string;
  facteursPsychologiques: string;
  objectifs: string;
  planSoins: string;
  noteComplementaire: string;
  createdBy?: string;
  updatedBy?: string;
  deletedAt?: string;
}

export interface FicheSeance {
  id: string;
  ficheId: string;
  date: string;
  traitement: string;
  observation: string;
  visaKine: string;
  visaPatient: string;
  createdBy?: string;
  deletedAt?: string;
}

export interface Personnel {
  id: string;
  nom: string;
  prenom: string;
  poste: string;
  specialite: string;
  telephone: string;
  email: string;
  adresse: string;
  dateEmbauche: string;
  salaire: number;
  statut: 'actif' | 'conge' | 'inactif';
  // Audit fields
  createdBy?: string;
  updatedBy?: string;
  deletedAt?: string;
}

export interface ActeKinesitherapie {
  code: string;
  pathologie: string;
  tarif: number;
}

export const ACTES_KINESITHERAPIE: ActeKinesitherapie[] = [
  { code: 'R000', pathologie: 'Consultation', tarif: 3000 },
  { code: 'R001', pathologie: 'Artroses simple', tarif: 7500 },
  { code: 'R002', pathologie: 'Lombosciatiques bilateral', tarif: 10000 },
  { code: 'R003', pathologie: 'Traumatisme des membres sans materiels', tarif: 7500 },
  { code: 'R004', pathologie: 'Traumatisme des membres avec materiels', tarif: 5000 },
  { code: 'R005', pathologie: 'Hemiplegie', tarif: 10000 },
  { code: 'R006', pathologie: 'Paraplegie', tarif: 10000 },
  { code: 'R007', pathologie: 'Paralysie faciale', tarif: 5000 },
  { code: 'R008', pathologie: 'Nevralgie cervicaux', tarif: 7500 },
  { code: 'R009', pathologie: 'Kiné respiratoire', tarif: 5000 },
  { code: 'R010', pathologie: 'Massage relaxation', tarif: 15000 },
  { code: 'R011', pathologie: 'Rééducation enfant', tarif: 5000 },
  { code: 'R012', pathologie: 'Rééducation périnéale', tarif: 7500 },
  { code: 'R013', pathologie: 'Rééducation à domicile', tarif: 15000 },
  { code: 'R014', pathologie: 'Drainage lymphatique', tarif: 6500 },
  { code: 'R015', pathologie: 'Consultation spécialiste', tarif: 10000 },
  { code: 'R016', pathologie: 'Consultation générale', tarif: 5000 },
  { code: 'R017', pathologie: 'Tetraplegie', tarif: 12500 },
  { code: 'R018', pathologie: 'Autres', tarif: 15000 },
];

export interface Soin {
  id: string;
  clientId: string;
  clientNom: string;
  acteCode: string;
  acteName: string;
  tarif: number;
  personnelId: string;
  personnelNom: string;
  date: string;
  heure: string;
  notes: string;
  statut: 'en_attente' | 'en_cours' | 'termine' | 'annule';
  paye: boolean;
  // Audit fields
  createdBy?: string;
  assignedTo?: string;
  updatedBy?: string;
  deletedAt?: string;
}

export interface AbonnementGym {
  type: 'mensuel' | 'trimestriel' | 'semestriel' | 'annuel';
  nom: string;
  tarif: number;
  dureeJours: number;
}

export const ABONNEMENTS_GYM: AbonnementGym[] = [
  { type: 'mensuel', nom: 'Mensuel', tarif: 15000, dureeJours: 30 },
  { type: 'trimestriel', nom: 'Trimestriel', tarif: 40000, dureeJours: 90 },
  { type: 'semestriel', nom: 'Semestriel', tarif: 70000, dureeJours: 180 },
  { type: 'annuel', nom: 'Annuel', tarif: 120000, dureeJours: 365 },
];

export interface AbonnementClient {
  id: string;
  clientId: string;
  clientNom: string;
  type: string;
  dateDebut: string;
  dateFin: string;
  montant: number;
  paye: boolean;
  statut: 'actif' | 'expire' | 'suspendu';
  // Audit fields
  createdBy?: string;
  updatedBy?: string;
  deletedAt?: string;
}

export interface Paiement {
  id: string;
  reference: string;
  type: 'soin' | 'abonnement' | 'autre';
  clientId: string;
  clientNom: string;
  description: string;
  montant: number;
  date: string;
  modePaiement: 'especes' | 'mobile_money' | 'carte' | 'virement';
  recu: boolean;
  // Audit fields
  createdBy?: string;
  deletedAt?: string;
}

export interface Transaction {
  id: string;
  type: 'entree' | 'sortie';
  categorie: string;
  description: string;
  montant: number;
  date: string;
  reference: string;
  // Audit fields
  createdBy?: string;
  deletedAt?: string;
}

export interface Stock {
  id: string;
  nom: string;
  categorie: string;
  quantite: number;
  unite: string;
  prixUnitaire: number;
  seuilAlerte: number;
  fournisseur: string;
  dateAjout: string;
  // Audit fields
  createdBy?: string;
  updatedBy?: string;
  deletedAt?: string;
}

export interface MouvementStock {
  id: string;
  stockId: string;
  stockNom: string;
  type: 'entree' | 'sortie';
  quantite: number;
  motif: string;
  date: string;
  utilisateur: string;
  // Audit fields
  createdBy?: string;
  deletedAt?: string;
}

export interface RendezVous {
  id: string;
  clientId: string;
  clientNom: string;
  personnelId: string;
  personnelNom: string;
  date: string;
  heure: string;
  duree: number;
  motif: string;
  statut: 'planifie' | 'confirme' | 'en_cours' | 'termine' | 'annule';
  notes: string;
  // Audit fields
  createdBy?: string;
  assignedTo?: string;
  updatedBy?: string;
  deletedAt?: string;
}

// Sample data generators
export const generateId = () => Math.random().toString(36).substr(2, 9);

export const formatMontant = (montant: number): string => {
  return new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA';
};

export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

// Initial sample data
export const SAMPLE_CLIENTS: Client[] = [
  {
    id: '1',
    nom: 'Diallo',
    prenom: 'Amadou',
    dateNaissance: '1985-03-15',
    sexe: 'M',
    telephone: '+225 07 12 34 56 78',
    email: 'amadou.diallo@email.com',
    adresse: 'Cocody, Abidjan',
    profession: 'Ingénieur',
    groupeSanguin: 'O+',
    allergies: 'Aucune',
    antecedents: 'Fracture tibia 2020',
    dateInscription: '2024-01-15',
    notes: 'Patient régulier'
  },
  {
    id: '2',
    nom: 'Kouassi',
    prenom: 'Marie',
    dateNaissance: '1990-07-22',
    sexe: 'F',
    telephone: '+225 05 98 76 54 32',
    email: 'marie.kouassi@email.com',
    adresse: 'Plateau, Abidjan',
    profession: 'Enseignante',
    groupeSanguin: 'A+',
    allergies: 'Pénicilline',
    antecedents: 'Lombalgie chronique',
    dateInscription: '2024-02-20',
    notes: 'Séances hebdomadaires'
  },
  {
    id: '3',
    nom: 'Traoré',
    prenom: 'Ibrahim',
    dateNaissance: '1978-11-08',
    sexe: 'M',
    telephone: '+225 01 23 45 67 89',
    email: 'ibrahim.traore@email.com',
    adresse: 'Marcory, Abidjan',
    profession: 'Commerçant',
    groupeSanguin: 'B+',
    allergies: 'Aucune',
    antecedents: 'AVC 2022',
    dateInscription: '2024-03-10',
    notes: 'Rééducation post-AVC'
  },
];

export const SAMPLE_PERSONNEL: Personnel[] = [
  {
    id: '1',
    nom: 'Koné',
    prenom: 'Dr. Fatou',
    poste: 'Kinésithérapeute Chef',
    specialite: 'Neurologie',
    telephone: '+225 07 00 11 22 33',
    email: 'dr.kone@ctk.ci',
    adresse: 'Riviera, Abidjan',
    dateEmbauche: '2020-01-15',
    salaire: 450000,
    statut: 'actif'
  },
  {
    id: '2',
    nom: 'Bamba',
    prenom: 'Moussa',
    poste: 'Kinésithérapeute',
    specialite: 'Traumatologie',
    telephone: '+225 05 44 55 66 77',
    email: 'moussa.bamba@ctk.ci',
    adresse: 'Yopougon, Abidjan',
    dateEmbauche: '2021-06-01',
    salaire: 350000,
    statut: 'actif'
  },
  {
    id: '3',
    nom: 'Ouattara',
    prenom: 'Aïcha',
    poste: 'Réceptionniste',
    specialite: 'Accueil',
    telephone: '+225 01 88 99 00 11',
    email: 'aicha.ouattara@ctk.ci',
    adresse: 'Adjamé, Abidjan',
    dateEmbauche: '2022-03-15',
    salaire: 180000,
    statut: 'actif'
  },
];
