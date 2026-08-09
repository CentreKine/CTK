# 🔍 AUDIT DES RELATIONS AGENT / ADMINISTRATEUR - CTK

**Date**: 2026-06-30  
**Statut**: ⚠️ **PROBLÈMES CRITIQUES DÉTECTÉS**

---

## 📋 RÉSUMÉ EXÉCUTIF

L'application présente des **lacunes significatives** dans le suivi des relations entre les comptes agent et administrateur. Cela empêche l'administrateur de:
- Voir qui a créé quoi
- Filtrer les données par agent responsable
- Effectuer un audit complet des actions
- Appliquer des politiques de contrôle d'accès

---

## 🗄️ TABLES EXISTANTES DANS SUPABASE

```
✅ clients
✅ personnel
✅ soins
✅ abonnements
✅ paiements
✅ transactions
✅ stocks
✅ mouvements_stock
✅ rendezvous
✅ utilisateurs
```

---

## ❌ PROBLÈMES IDENTIFIÉS

### 1️⃣ **Absence de Champ `created_by` dans les Tables Métier**

**Affecte**: `clients`, `soins`, `abonnements`, `paiements`, `personnel`, `rendezvous`, `stocks`

**Problème**: Impossible de savoir quel agent a créé le record.

**Impact**:
- L'admin ne peut pas vérifier qui a créé quel client
- Pas de traçabilité des actions
- Pas de possibilité de filtrer par agent créateur

**Exemple**:
```
Client "Amadou Diallo" créé le 2026-06-30
   ❓ Créé par quel agent?
   ❓ Admin ne peut pas le savoir
```

---

### 2️⃣ **Absence de Relation `agent_id` ou `assigned_to`**

**Affecte**: `soins`, `rendezvous`, `clients`

**Problème**: Les données ne sont pas liées à un agent responsable.

**Impact**:
- Un agent ne peut pas voir "ses" soins vs les soins d'autres agents
- L'admin ne peut pas voir les statistiques par agent
- Pas de contrôle de visibilité des données

**Exemple**:
```
Soin: "Consultation - Amadou Diallo"
   ❓ Affecté à quel agent?
   ❓ Tous les agents voient tous les soins
```

---

### 3️⃣ **Pas de Filtrage par Rôle dans les Requêtes**

**Localisation**: [src/hooks/useDatabase.ts](src/hooks/useDatabase.ts#L446-L493)

**Problème**: Les données se chargent sans conditions basées sur le rôle.

**Code Problématique**:
```typescript
// ❌ MAUVAIS - Charge tous les clients, peu importe le rôle
const { data: clientsData } = await supabase
  .from('clients')
  .select('*')
  .order('created_at', { ascending: false });

// ❌ MAUVAIS - Pas de WHERE clause
const { data: soinsData } = await supabase
  .from('soins')
  .select('*')
  .order('date', { ascending: false });
```

**Impact**:
- Agent voit TOUT ce que tout le monde a créé
- Aucune séparation de données par agent
- Admin ne peut pas déléguer le suivi de cas à des agents spécifiques

---

### 4️⃣ **Pas de Champs d'Audit Modernes**

**Tables Manquant**:
- `created_at` ✅ (existe parfois)
- `created_by` ❌ **MANQUANT**
- `updated_at` ✅ (existe parfois)
- `updated_by` ❌ **MANQUANT**
- `deleted_at` ❌ **MANQUANT**

**Impact**: Impossible de faire un audit complet de qui a fait quoi et quand.

---

### 5️⃣ **Table `utilisateurs` Sans Relation Explicite**

**Localisation**: `utilisateurs` table

**Problème**: La table `utilisateurs` n'est liée à aucune table métier.

**Impact**:
- Les soins n'ont pas de `created_by_user_id` → `utilisateurs.id`
- Les clients n'ont pas de `created_by_user_id` → `utilisateurs.id`
- Les paiements n'ont pas de `created_by_user_id` → `utilisateurs.id`

---

### 6️⃣ **Permission Insuffisantes au Niveau Applicatif**

**Localisation**: [src/components/AppLayout.tsx](src/components/AppLayout.tsx#L32)

**Problème**: `userRole` est passé mais jamais utilisé pour filtrer les requêtes.

**Code Problématique**:
```typescript
const [userRole, setUserRole] = useState<'admin' | 'agent'>('agent');

// Plus tard...
const loadAllData = async () => {
  // ❌ Ne pas utiliser userRole ici!
  const { data: clientsData } = await supabase
    .from('clients')
    .select('*') // ← Pas de filtre!
    .order('created_at', { ascending: false });
};
```

---

## 📊 MATRICE DE RELATIONS MANQUANTES

| Table | Champ Manquant | Relation | Impact |
|-------|---|---|---|
| `clients` | `created_by` | → `utilisateurs.id` | Traçabilité perdue |
| `soins` | `created_by` | → `utilisateurs.id` | Audit impossible |
| `soins` | `assigned_to` | → `utilisateurs.id` (agent responsable) | Délégation impossible |
| `rendezvous` | `created_by` | → `utilisateurs.id` | Traçabilité perdue |
| `rendezvous` | `assigned_to` | → `utilisateurs.id` | Affectation impossible |
| `abonnements` | `created_by` | → `utilisateurs.id` | Traçabilité perdue |
| `paiements` | `created_by` | → `utilisateurs.id` | Audit impossible |
| `personnel` | `created_by` | → `utilisateurs.id` | Traçabilité perdue |
| `stocks` | `created_by` | → `utilisateurs.id` | Traçabilité perdue |
| `mouvements_stock` | `created_by` | → `utilisateurs.id` | Audit impossible |
| `transactions` | `created_by` | → `utilisateurs.id` | Audit impossible |

---

## ✅ RECOMMANDATIONS DE CORRECTIONS

### **Phase 1: Migrations Supabase** (Urgent)

#### 1. Ajouter `created_by` à toutes les tables métier:

```sql
-- clients
ALTER TABLE clients 
ADD COLUMN created_by UUID REFERENCES utilisateurs(id),
ADD COLUMN updated_by UUID REFERENCES utilisateurs(id),
ADD COLUMN deleted_at TIMESTAMP;

-- soins
ALTER TABLE soins 
ADD COLUMN created_by UUID REFERENCES utilisateurs(id),
ADD COLUMN assigned_to UUID REFERENCES utilisateurs(id),
ADD COLUMN updated_by UUID REFERENCES utilisateurs(id),
ADD COLUMN deleted_at TIMESTAMP;

-- rendezvous
ALTER TABLE rendezvous 
ADD COLUMN created_by UUID REFERENCES utilisateurs(id),
ADD COLUMN assigned_to UUID REFERENCES utilisateurs(id),
ADD COLUMN updated_by UUID REFERENCES utilisateurs(id),
ADD COLUMN deleted_at TIMESTAMP;

-- abonnements
ALTER TABLE abonnements 
ADD COLUMN created_by UUID REFERENCES utilisateurs(id),
ADD COLUMN updated_by UUID REFERENCES utilisateurs(id),
ADD COLUMN deleted_at TIMESTAMP;

-- paiements
ALTER TABLE paiements 
ADD COLUMN created_by UUID REFERENCES utilisateurs(id),
ADD COLUMN deleted_at TIMESTAMP;

-- personnel
ALTER TABLE personnel 
ADD COLUMN created_by UUID REFERENCES utilisateurs(id),
ADD COLUMN updated_by UUID REFERENCES utilisateurs(id),
ADD COLUMN deleted_at TIMESTAMP;

-- stocks
ALTER TABLE stocks 
ADD COLUMN created_by UUID REFERENCES utilisateurs(id),
ADD COLUMN updated_by UUID REFERENCES utilisateurs(id),
ADD COLUMN deleted_at TIMESTAMP;

-- mouvements_stock
ALTER TABLE mouvements_stock 
ADD COLUMN created_by UUID REFERENCES utilisateurs(id),
ADD COLUMN deleted_at TIMESTAMP;

-- transactions
ALTER TABLE transactions 
ADD COLUMN created_by UUID REFERENCES utilisateurs(id),
ADD COLUMN deleted_at TIMESTAMP;
```

#### 2. Ajouter des indexes pour les performances:

```sql
CREATE INDEX idx_clients_created_by ON clients(created_by);
CREATE INDEX idx_clients_created_at ON clients(created_at);
CREATE INDEX idx_soins_created_by ON soins(created_by);
CREATE INDEX idx_soins_assigned_to ON soins(assigned_to);
CREATE INDEX idx_rendezvous_assigned_to ON rendezvous(assigned_to);
CREATE INDEX idx_utilisateurs_role ON utilisateurs(role);
```

### **Phase 2: Modifications Applicatives** (Important)

#### 1. Ajouter le contexte utilisateur:

```typescript
// src/contexts/AuthContext.tsx - À créer
export interface AuthContext {
  currentUser: User | null;
  userRole: 'admin' | 'agent';
  userId: string;
}

// À utiliser dans useDatabase.ts
const { currentUser } = useAuthContext();
```

#### 2. Mettre à jour les opérations CRUD:

```typescript
// ❌ AVANT
const addClient = async (client: Client) => {
  const { error } = await supabase
    .from('clients')
    .insert(clientToDb(client));
};

// ✅ APRÈS
const addClient = async (client: Client, userId: string) => {
  const { error } = await supabase
    .from('clients')
    .insert({
      ...clientToDb(client),
      created_by: userId,
      updated_by: userId
    });
};
```

#### 3. Filtrer les données par rôle:

```typescript
// ✅ NOUVEAU - Filtrage selon le rôle
const loadAllData = async (userId: string, userRole: 'admin' | 'agent') => {
  // Les admins voient TOUT
  // Les agents ne voient que ce qu'ils ont créé + ce qui leur est affecté
  
  if (userRole === 'admin') {
    // Charger toutes les données
  } else {
    // Charger seulement les données créées par cet agent ou affectées à cet agent
    const { data: clientsData } = await supabase
      .from('clients')
      .select('*')
      .or(`created_by.eq.${userId},client_agent_id.eq.${userId}`);
  }
};
```

#### 4. Modifier les interfaces TypeScript:

```typescript
// src/lib/supabase.ts
export interface DbClient {
  id: string;
  nom: string;
  prenom: string;
  // ... champs existants ...
  created_by: string; // ← NOUVEAU
  updated_by: string; // ← NOUVEAU
  deleted_at: string | null; // ← NOUVEAU
  created_at: string;
  updated_at: string;
}

export interface DbSoin {
  id: string;
  client_id: string;
  // ... champs existants ...
  created_by: string; // ← NOUVEAU
  assigned_to: string | null; // ← NOUVEAU (agent responsable)
  updated_by: string; // ← NOUVEAU
  deleted_at: string | null; // ← NOUVEAU
}
```

#### 5. Mettre à jour les pages UI pour montrer le créateur:

```typescript
// ✅ NOUVEAU - Afficher qui a créé le record
<tr>
  <td>{client.prenom} {client.nom}</td>
  <td>{client.createdByName}</td>  {/* ← Nouveau */}
  <td>{client.dateInscription}</td>
  <td>
    {userRole === 'admin' && <DeleteButton />}
  </td>
</tr>
```

---

## 🔒 RÈGLES DE VISIBILITÉ À IMPLÉMENTER

### **Pour les AGENTS**:
- ✅ Voir les clients qu'il a créés
- ✅ Voir les soins qu'il a créés
- ✅ Voir les rendezvous qui lui sont assignés
- ✅ Voir les paiements des soins qu'il a créés
- ❌ Modifier les données des autres agents
- ❌ Voir les statistiques globales de la clinique
- ❌ Gérer les utilisateurs
- ❌ Accéder aux stocks

### **Pour les ADMINS**:
- ✅ Voir TOUTES les données
- ✅ Voir qui a créé chaque record
- ✅ Filtrer par agent responsable
- ✅ Voir l'historique complet (audit)
- ✅ Modifier n'importe quel record
- ✅ Voir les statistiques par agent
- ✅ Gérer les utilisateurs
- ✅ Gérer les stocks

---

## 📋 CHECKLIST DE VÉRIFICATION

- [ ] Migrer la base: Ajouter `created_by`, `updated_by`, `deleted_at`, `assigned_to`
- [ ] Créer les indexes pour les performances
- [ ] Mettre à jour les interfaces TypeScript
- [ ] Ajouter l'ID utilisateur courant aux opérations CRUD
- [ ] Implémenter le filtrage par rôle dans `loadAllData`
- [ ] Créer `AuthContext` pour gérer l'utilisateur courant
- [ ] Modifier les pages pour afficher le créateur
- [ ] Tester la visibilité: Agent ↔ Admin
- [ ] Vérifier les règles d'accès (permissions)
- [ ] Documenter les politiques de visibilité
- [ ] Former les utilisateurs aux rôles

---

## 🚀 ÉTAPES SUIVANTES

1. **Créer un backup** de la base de données Supabase
2. **Exécuter les migrations** SQL
3. **Mettre à jour** les fichiers TypeScript
4. **Implémenter** le filtrage par rôle
5. **Tester** exhaustivement
6. **Déployer** en production

---

## ⚠️ IMPACT SI NON CORRIGÉ

- 🔴 **Audit impossible**: On ne saura jamais qui a fait quoi
- 🔴 **Sécurité**: Les agents peuvent voir les données d'autres agents
- 🔴 **Responsabilité**: L'admin ne peut pas vérifier les actions des agents
- 🔴 **Conformité**: Problèmes potentiels avec la protection des données

---

**Priorité**: 🔴 **HAUTE**  
**Effort estimé**: 6-8 heures de développement  
**Risque si reporté**: CRITIQUE
