-- ============================================================================
-- 🗄️ MIGRATION 000 - INIT DATABASE - TABLES PRINCIPALES
-- ============================================================================
-- Date: 2026-07-13
-- Objectif: Créer la structure complète de la base de données
-- ============================================================================

-- ============================================================================
-- 1️⃣ TABLE: utilisateurs (Utilisateurs du système)
-- ============================================================================
CREATE TABLE IF NOT EXISTS utilisateurs (
  id TEXT PRIMARY KEY,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'agent')),
  telephone TEXT,
  actif BOOLEAN DEFAULT true,
  date_creation DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_utilisateurs_email ON utilisateurs(email);
CREATE INDEX idx_utilisateurs_role ON utilisateurs(role);
CREATE INDEX idx_utilisateurs_actif ON utilisateurs(actif);

-- ============================================================================
-- 2️⃣ TABLE: clients (Patients/Clients)
-- ============================================================================
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  date_naissance DATE,
  sexe VARCHAR(1) CHECK (sexe IN ('M', 'F')),
  telephone TEXT NOT NULL,
  email TEXT,
  adresse TEXT,
  profession TEXT,
  groupe_sanguin TEXT,
  allergies TEXT,
  antecedents TEXT,
  date_inscription DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_by TEXT REFERENCES utilisateurs(id) ON DELETE SET NULL,
  updated_by TEXT REFERENCES utilisateurs(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_clients_nom ON clients(nom);
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_clients_telephone ON clients(telephone);
CREATE INDEX idx_clients_deleted_at ON clients(deleted_at);

-- ============================================================================
-- 3️⃣ TABLE: personnel (Médecins/Kinés/Staff)
-- ============================================================================
CREATE TABLE IF NOT EXISTS personnel (
  id TEXT PRIMARY KEY,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  poste TEXT NOT NULL,
  specialite TEXT,
  telephone TEXT NOT NULL,
  email TEXT NOT NULL,
  adresse TEXT,
  date_embauche DATE NOT NULL,
  salaire NUMERIC(10,2),
  statut VARCHAR(20) CHECK (statut IN ('actif', 'conge', 'inactif')) DEFAULT 'actif',
  created_by TEXT REFERENCES utilisateurs(id) ON DELETE SET NULL,
  updated_by TEXT REFERENCES utilisateurs(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_personnel_email ON personnel(email);
CREATE INDEX idx_personnel_poste ON personnel(poste);
CREATE INDEX idx_personnel_statut ON personnel(statut);
CREATE INDEX idx_personnel_deleted_at ON personnel(deleted_at);

-- ============================================================================
-- 4️⃣ TABLE: soins (Séances de traitement/soins)
-- ============================================================================
CREATE TABLE IF NOT EXISTS soins (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  acte_code TEXT NOT NULL,
  acte_name TEXT NOT NULL,
  tarif NUMERIC(10,2) NOT NULL,
  personnel_id TEXT NOT NULL REFERENCES personnel(id) ON DELETE RESTRICT,
  date DATE NOT NULL,
  heure VARCHAR(5),
  notes TEXT,
  statut VARCHAR(20) CHECK (statut IN ('en_attente', 'en_cours', 'termine', 'annule')) DEFAULT 'en_attente',
  paye BOOLEAN DEFAULT false,
  created_by TEXT REFERENCES utilisateurs(id) ON DELETE SET NULL,
  assigned_to TEXT REFERENCES utilisateurs(id) ON DELETE SET NULL,
  updated_by TEXT REFERENCES utilisateurs(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_soins_client_id ON soins(client_id);
CREATE INDEX idx_soins_personnel_id ON soins(personnel_id);
CREATE INDEX idx_soins_date ON soins(date);
CREATE INDEX idx_soins_statut ON soins(statut);
CREATE INDEX idx_soins_paye ON soins(paye);
CREATE INDEX idx_soins_deleted_at ON soins(deleted_at);

-- ============================================================================
-- 5️⃣ TABLE: fiches_suivi (Dossiers de suivi patient)
-- ============================================================================
CREATE TABLE IF NOT EXISTS fiches_suivi (
  id TEXT PRIMARY KEY,
  client_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
  date_creation DATE NOT NULL DEFAULT CURRENT_DATE,
  motif TEXT,
  sexe VARCHAR(1),
  age INTEGER,
  temperature NUMERIC(5,2),
  tension VARCHAR(20),
  poids NUMERIC(5,2),
  douleur TEXT,
  type_douleur VARCHAR(50),
  siege_douleur TEXT,
  diagnostic TEXT,
  examen_physique TEXT,
  bilan_vasculaire TEXT,
  bilan_neurologique TEXT,
  bilan_articulaire TEXT,
  bilan_musculaire TEXT,
  evaluation_fonctionnelle TEXT,
  facteurs_psychologiques TEXT,
  objectifs TEXT,
  plan_soins TEXT,
  note_complementaire TEXT,
  created_by TEXT REFERENCES utilisateurs(id) ON DELETE SET NULL,
  updated_by TEXT REFERENCES utilisateurs(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_fiches_suivi_client_id ON fiches_suivi(client_id);
CREATE INDEX idx_fiches_suivi_date_creation ON fiches_suivi(date_creation);
CREATE INDEX idx_fiches_suivi_deleted_at ON fiches_suivi(deleted_at);

-- ============================================================================
-- 6️⃣ TABLE: fiches_seances (Détails des séances dans une fiche de suivi)
-- ============================================================================
CREATE TABLE IF NOT EXISTS fiches_seances (
  id TEXT PRIMARY KEY,
  fiche_id TEXT NOT NULL REFERENCES fiches_suivi(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  traitement TEXT,
  observation TEXT,
  visa_kine TEXT,
  visa_patient TEXT,
  created_by TEXT REFERENCES utilisateurs(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_fiches_seances_fiche_id ON fiches_seances(fiche_id);
CREATE INDEX idx_fiches_seances_date ON fiches_seances(date);
CREATE INDEX idx_fiches_seances_deleted_at ON fiches_seances(deleted_at);

-- ============================================================================
-- 7️⃣ TABLE: rendezvous (Rendez-vous/Consultations)
-- ============================================================================
CREATE TABLE IF NOT EXISTS rendezvous (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  personnel_id TEXT NOT NULL REFERENCES personnel(id) ON DELETE RESTRICT,
  date DATE NOT NULL,
  heure VARCHAR(5),
  duree INTEGER,
  motif TEXT,
  statut VARCHAR(20) CHECK (statut IN ('planifie', 'confirme', 'en_cours', 'termine', 'annule')) DEFAULT 'planifie',
  notes TEXT,
  created_by TEXT REFERENCES utilisateurs(id) ON DELETE SET NULL,
  assigned_to TEXT REFERENCES utilisateurs(id) ON DELETE SET NULL,
  updated_by TEXT REFERENCES utilisateurs(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_rendezvous_client_id ON rendezvous(client_id);
CREATE INDEX idx_rendezvous_personnel_id ON rendezvous(personnel_id);
CREATE INDEX idx_rendezvous_date ON rendezvous(date);
CREATE INDEX idx_rendezvous_statut ON rendezvous(statut);
CREATE INDEX idx_rendezvous_deleted_at ON rendezvous(deleted_at);

-- ============================================================================
-- 8️⃣ TABLE: abonnements (Abonnements gym/package)
-- ============================================================================
CREATE TABLE IF NOT EXISTS abonnements (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  date_debut DATE NOT NULL,
  date_fin DATE NOT NULL,
  montant NUMERIC(10,2) NOT NULL,
  paye BOOLEAN DEFAULT false,
  statut VARCHAR(20) CHECK (statut IN ('actif', 'expire', 'suspendu')) DEFAULT 'actif',
  created_by TEXT REFERENCES utilisateurs(id) ON DELETE SET NULL,
  updated_by TEXT REFERENCES utilisateurs(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_abonnements_client_id ON abonnements(client_id);
CREATE INDEX idx_abonnements_date_debut ON abonnements(date_debut);
CREATE INDEX idx_abonnements_statut ON abonnements(statut);
CREATE INDEX idx_abonnements_paye ON abonnements(paye);
CREATE INDEX idx_abonnements_deleted_at ON abonnements(deleted_at);

-- ============================================================================
-- 9️⃣ TABLE: paiements (Historique des paiements)
-- ============================================================================
CREATE TABLE IF NOT EXISTS paiements (
  id TEXT PRIMARY KEY,
  reference TEXT NOT NULL UNIQUE,
  type VARCHAR(50) CHECK (type IN ('soin', 'abonnement', 'autre')) NOT NULL,
  client_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  montant NUMERIC(10,2) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  mode_paiement VARCHAR(50) CHECK (mode_paiement IN ('especes', 'mobile_money', 'carte', 'virement')) DEFAULT 'especes',
  recu BOOLEAN DEFAULT false,
  created_by TEXT REFERENCES utilisateurs(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_paiements_client_id ON paiements(client_id);
CREATE INDEX idx_paiements_date ON paiements(date);
CREATE INDEX idx_paiements_reference ON paiements(reference);
CREATE INDEX idx_paiements_type ON paiements(type);
CREATE INDEX idx_paiements_mode_paiement ON paiements(mode_paiement);
CREATE INDEX idx_paiements_deleted_at ON paiements(deleted_at);

-- ============================================================================
-- 🔟 TABLE: transactions (Journal des transactions financières)
-- ============================================================================
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  type VARCHAR(20) CHECK (type IN ('entree', 'sortie')) NOT NULL,
  categorie TEXT NOT NULL,
  description TEXT,
  montant NUMERIC(10,2) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  reference TEXT,
  created_by TEXT REFERENCES utilisateurs(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_categorie ON transactions(categorie);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_deleted_at ON transactions(deleted_at);

-- ============================================================================
-- 1️⃣1️⃣ TABLE: stocks (Inventaire/Stock de matériel)
-- ============================================================================
CREATE TABLE IF NOT EXISTS stocks (
  id TEXT PRIMARY KEY,
  nom TEXT NOT NULL,
  categorie TEXT NOT NULL,
  quantite INTEGER NOT NULL DEFAULT 0,
  unite TEXT,
  prix_unitaire NUMERIC(10,2),
  seuil_alerte INTEGER DEFAULT 5,
  fournisseur TEXT,
  date_ajout DATE DEFAULT CURRENT_DATE,
  created_by TEXT REFERENCES utilisateurs(id) ON DELETE SET NULL,
  updated_by TEXT REFERENCES utilisateurs(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_stocks_categorie ON stocks(categorie);
CREATE INDEX idx_stocks_quantite ON stocks(quantite);
CREATE INDEX idx_stocks_fournisseur ON stocks(fournisseur);
CREATE INDEX idx_stocks_deleted_at ON stocks(deleted_at);

-- ============================================================================
-- 1️⃣2️⃣ TABLE: mouvements_stock (Historique des mouvements de stock)
-- ============================================================================
CREATE TABLE IF NOT EXISTS mouvements_stock (
  id TEXT PRIMARY KEY,
  stock_id TEXT NOT NULL REFERENCES stocks(id) ON DELETE CASCADE,
  type VARCHAR(20) CHECK (type IN ('entree', 'sortie')) NOT NULL,
  quantite INTEGER NOT NULL,
  motif TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  utilisateur TEXT,
  created_by TEXT REFERENCES utilisateurs(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_mouvements_stock_stock_id ON mouvements_stock(stock_id);
CREATE INDEX idx_mouvements_stock_type ON mouvements_stock(type);
CREATE INDEX idx_mouvements_stock_date ON mouvements_stock(date);
CREATE INDEX idx_mouvements_stock_deleted_at ON mouvements_stock(deleted_at);

-- ============================================================================
-- ✅ COMMIT: Toutes les tables créées avec succès
-- ============================================================================
