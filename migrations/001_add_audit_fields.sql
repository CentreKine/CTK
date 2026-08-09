-- ============================================================================
-- 🔧 MIGRATION SUPABASE - AJOUT DES CHAMPS DE SUIVI AGENT/ADMIN
-- ============================================================================
-- Date: 2026-06-30
-- Objectif: Ajouter la traçabilité des actions par agent/admin
-- Effort: Ces migrations créent les relations nécessaires pour l'audit
-- ============================================================================

-- ============================================================================
-- 1️⃣ TABLE: clients
-- ============================================================================
-- Ajoute la traçabilité de qui a créé/modifié chaque client

ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES utilisateurs(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES utilisateurs(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- ============================================================================
-- 2️⃣ TABLE: soins
-- ============================================================================
-- Ajoute la traçabilité + l'affectation à un agent responsable

ALTER TABLE soins 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES utilisateurs(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES utilisateurs(id) ON DELETE SET NULL COMMENT 'Agent responsable du soin',
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES utilisateurs(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- ============================================================================
-- 3️⃣ TABLE: rendezvous
-- ============================================================================
-- Ajoute la traçabilité + l'affectation à un agent responsable

ALTER TABLE rendezvous 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES utilisateurs(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES utilisateurs(id) ON DELETE SET NULL COMMENT 'Agent responsable du RDV',
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES utilisateurs(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- ============================================================================
-- 4️⃣ TABLE: abonnements
-- ============================================================================
-- Ajoute la traçabilité de qui a créé/modifié chaque abonnement

ALTER TABLE abonnements 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES utilisateurs(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES utilisateurs(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- ============================================================================
-- 5️⃣ TABLE: paiements
-- ============================================================================
-- Ajoute la traçabilité de qui a enregistré chaque paiement

ALTER TABLE paiements 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES utilisateurs(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- ============================================================================
-- 6️⃣ TABLE: personnel
-- ============================================================================
-- Ajoute la traçabilité de qui a créé/modifié chaque personnel

ALTER TABLE personnel 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES utilisateurs(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES utilisateurs(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- ============================================================================
-- 7️⃣ TABLE: stocks
-- ============================================================================
-- Ajoute la traçabilité de qui a créé/modifié chaque stock

ALTER TABLE stocks 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES utilisateurs(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES utilisateurs(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- ============================================================================
-- 8️⃣ TABLE: mouvements_stock
-- ============================================================================
-- Ajoute la traçabilité de qui a enregistré chaque mouvement de stock

ALTER TABLE mouvements_stock 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES utilisateurs(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- ============================================================================
-- 9️⃣ TABLE: transactions
-- ============================================================================
-- Ajoute la traçabilité de qui a enregistré chaque transaction financière

ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES utilisateurs(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- ============================================================================
-- 🔟 INDEXES - Optimisation des requêtes
-- ============================================================================

-- Index pour les clients
CREATE INDEX IF NOT EXISTS idx_clients_created_by ON clients(created_by);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at);
CREATE INDEX IF NOT EXISTS idx_clients_deleted_at ON clients(deleted_at);

-- Index pour les soins
CREATE INDEX IF NOT EXISTS idx_soins_created_by ON soins(created_by);
CREATE INDEX IF NOT EXISTS idx_soins_assigned_to ON soins(assigned_to);
CREATE INDEX IF NOT EXISTS idx_soins_created_at ON soins(created_at);
CREATE INDEX IF NOT EXISTS idx_soins_deleted_at ON soins(deleted_at);

-- Index pour les rendezvous
CREATE INDEX IF NOT EXISTS idx_rendezvous_created_by ON rendezvous(created_by);
CREATE INDEX IF NOT EXISTS idx_rendezvous_assigned_to ON rendezvous(assigned_to);
CREATE INDEX IF NOT EXISTS idx_rendezvous_created_at ON rendezvous(created_at);
CREATE INDEX IF NOT EXISTS idx_rendezvous_deleted_at ON rendezvous(deleted_at);

-- Index pour les abonnements
CREATE INDEX IF NOT EXISTS idx_abonnements_created_by ON abonnements(created_by);
CREATE INDEX IF NOT EXISTS idx_abonnements_created_at ON abonnements(created_at);
CREATE INDEX IF NOT EXISTS idx_abonnements_deleted_at ON abonnements(deleted_at);

-- Index pour les paiements
CREATE INDEX IF NOT EXISTS idx_paiements_created_by ON paiements(created_by);
CREATE INDEX IF NOT EXISTS idx_paiements_deleted_at ON paiements(deleted_at);

-- Index pour le personnel
CREATE INDEX IF NOT EXISTS idx_personnel_created_by ON personnel(created_by);
CREATE INDEX IF NOT EXISTS idx_personnel_deleted_at ON personnel(deleted_at);

-- Index pour les stocks
CREATE INDEX IF NOT EXISTS idx_stocks_created_by ON stocks(created_by);
CREATE INDEX IF NOT EXISTS idx_stocks_deleted_at ON stocks(deleted_at);

-- Index pour les mouvements de stock
CREATE INDEX IF NOT EXISTS idx_mouvements_stock_created_by ON mouvements_stock(created_by);
CREATE INDEX IF NOT EXISTS idx_mouvements_stock_deleted_at ON mouvements_stock(deleted_at);

-- Index pour les transactions
CREATE INDEX IF NOT EXISTS idx_transactions_created_by ON transactions(created_by);
CREATE INDEX IF NOT EXISTS idx_transactions_deleted_at ON transactions(deleted_at);

-- Index utile pour les utilisateurs
CREATE INDEX IF NOT EXISTS idx_utilisateurs_role ON utilisateurs(role);
CREATE INDEX IF NOT EXISTS idx_utilisateurs_actif ON utilisateurs(actif);

-- ============================================================================
-- 🔐 VIEWS - Vues Utiles pour les Requêtes
-- ============================================================================

-- Vue pour voir tous les clients avec le nom du créateur
CREATE OR REPLACE VIEW v_clients_with_creator AS
SELECT 
  c.id,
  c.nom,
  c.prenom,
  c.telephone,
  c.email,
  c.date_inscription,
  c.created_at,
  u.prenom as created_by_prenom,
  u.nom as created_by_nom,
  u.role as created_by_role
FROM clients c
LEFT JOIN utilisateurs u ON c.created_by = u.id
WHERE c.deleted_at IS NULL;

-- Vue pour voir tous les soins avec créateur et responsable
CREATE OR REPLACE VIEW v_soins_with_users AS
SELECT 
  s.id,
  s.client_id,
  s.acte_name,
  s.date,
  s.statut,
  creator.prenom as created_by_prenom,
  creator.nom as created_by_nom,
  assigned.prenom as assigned_to_prenom,
  assigned.nom as assigned_to_nom,
  s.created_at
FROM soins s
LEFT JOIN utilisateurs creator ON s.created_by = creator.id
LEFT JOIN utilisateurs assigned ON s.assigned_to = assigned.id
WHERE s.deleted_at IS NULL;

-- Vue pour voir les RDV avec responsable
CREATE OR REPLACE VIEW v_rendezvous_with_agent AS
SELECT 
  r.id,
  r.client_id,
  r.date,
  r.heure,
  r.motif,
  r.statut,
  creator.prenom as created_by_prenom,
  creator.nom as created_by_nom,
  assigned.prenom as assigned_to_prenom,
  assigned.nom as assigned_to_nom
FROM rendezvous r
LEFT JOIN utilisateurs creator ON r.created_by = creator.id
LEFT JOIN utilisateurs assigned ON r.assigned_to = assigned.id
WHERE r.deleted_at IS NULL;

-- ============================================================================
-- 📊 AUDIT - Enregistrement des modifications
-- ============================================================================

-- Table d'audit pour tracker les modifications critiques
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE')),
  performed_by UUID REFERENCES utilisateurs(id),
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index sur la table d'audit
CREATE INDEX IF NOT EXISTS idx_audit_log_table ON audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_log_performed_by ON audit_log(performed_by);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);

-- ============================================================================
-- ✅ FIN DE LA MIGRATION
-- ============================================================================
-- Notes:
-- 1. Toutes les colonnes utilisent "IF NOT EXISTS" pour éviter les erreurs si déjà créées
-- 2. Les références à utilisateurs utilisent "ON DELETE SET NULL" pour la sécurité
-- 3. Les indexes sont créés pour optimiser les requêtes par agent/rôle
-- 4. Les views facilitent les requêtes courantes
-- 5. L'audit_log permet de tracker les modifications sensibles
-- 
-- Prochaines étapes:
-- - Mettre à jour l'application pour utiliser ces nouvelles colonnes
-- - Implémenter le filtrage par rôle dans useDatabase.ts
-- - Ajouter la traçabilité dans les opérations CRUD
-- ============================================================================
