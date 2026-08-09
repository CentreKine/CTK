# 🔧 GUIDE D'IMPLÉMENTATION - SUIVI AGENT/ADMIN

## 📋 Résumé des Changements Nécessaires

Ce guide détaille les modifications à apporter au code TypeScript pour implémenter:
1. Le suivi de qui a créé quoi (created_by)
2. L'assignation des tâches à des agents (assigned_to)
3. Le filtrage des données selon le rôle (admin vs agent)
4. L'audit des modifications

---

## 1️⃣ CRÉER UN CONTEXTE D'AUTHENTIFICATION

**Fichier**: `src/contexts/AuthContext.tsx` (À CRÉER)

```typescript
import React, { createContext, useContext, useState } from 'react';

export interface User {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  role: 'admin' | 'agent';
  telephone: string;
  dateCreation: string;
  actif: boolean;
}

interface AuthContextType {
  currentUser: User | null;
  login: (user: User) => void;
  logout: () => void;
  isAdmin: () => boolean;
  isAgent: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const login = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
  };

  const isAdmin = () => currentUser?.role === 'admin';
  const isAgent = () => currentUser?.role === 'agent';

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, isAdmin, isAgent }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

---

## 2️⃣ METTRE À JOUR LES INTERFACES SUPABASE

**Fichier**: `src/lib/supabase.ts`

Ajouter les nouveaux champs à chaque interface:

```typescript
// ============================================================================
// AVANT
// ============================================================================
export interface DbClient {
  id: string;
  nom: string;
  prenom: string;
  date_naissance: string | null;
  // ... autres champs ...
  created_at: string;
  updated_at: string;
}

// ============================================================================
// APRÈS - AJOUTER CES CHAMPS
// ============================================================================
export interface DbClient {
  id: string;
  nom: string;
  prenom: string;
  date_naissance: string | null;
  // ... autres champs ...
  created_by: string | null;        // ← NOUVEAU
  updated_by: string | null;        // ← NOUVEAU
  deleted_at: string | null;        // ← NOUVEAU
  created_at: string;
  updated_at: string;
}

export interface DbSoin {
  id: string;
  client_id: string;
  acte_code: string;
  acte_name: string;
  tarif: number;
  personnel_id: string;
  date: string;
  heure: string;
  notes: string | null;
  statut: 'en_attente' | 'en_cours' | 'termine' | 'annule';
  paye: boolean;
  created_by: string | null;        // ← NOUVEAU
  assigned_to: string | null;       // ← NOUVEAU (agent responsable)
  updated_by: string | null;        // ← NOUVEAU
  deleted_at: string | null;        // ← NOUVEAU
  created_at: string;
  updated_at: string;
}

export interface DbRendezVous {
  id: string;
  client_id: string;
  personnel_id: string;
  date: string;
  heure: string;
  duree: number;
  motif: string;
  statut: string;
  notes: string | null;
  created_by: string | null;        // ← NOUVEAU
  assigned_to: string | null;       // ← NOUVEAU
  updated_by: string | null;        // ← NOUVEAU
  deleted_at: string | null;        // ← NOUVEAU
  created_at: string;
  updated_at: string;
}

// Appliquer le même pattern à: DbAbonnement, DbPaiement, DbPersonnel, DbStock, DbTransaction
```

---

## 3️⃣ METTRE À JOUR LES FONCTIONS DE CONVERSION

**Fichier**: `src/hooks/useDatabase.ts` (Sections à modifier)

### Avant (ACTUEL):
```typescript
const dbToClient = (db: any): Client => ({
  id: db.id,
  nom: db.nom,
  prenom: db.prenom,
  // ... autres champs ...
});
```

### Après (NOUVEAU):
```typescript
const dbToClient = (db: any, createdByName?: string): Client & { createdBy?: string } => ({
  id: db.id,
  nom: db.nom,
  prenom: db.prenom,
  // ... autres champs ...
  createdBy: createdByName // ← NOUVEAU
});

const clientToDb = (client: Client, userId: string) => ({
  id: client.id,
  nom: client.nom,
  prenom: client.prenom,
  // ... autres champs ...
  created_by: userId,      // ← NOUVEAU - ID de qui crée
  updated_by: userId,      // ← NOUVEAU
});
```

---

## 4️⃣ IMPLÉMENTER LE FILTRAGE PAR RÔLE

**Fichier**: `src/hooks/useDatabase.ts` (Fonction `loadAllData`)

### AVANT - Charge TOUT pour tout le monde:
```typescript
const loadAllData = async () => {
  try {
    // ❌ Charge tous les clients sans filtre
    const { data: clientsData } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });
    
    // ❌ Charge tous les soins
    const { data: soinsData } = await supabase
      .from('soins')
      .select('*')
      .order('date', { ascending: false });
  } catch (err) {
    // ...
  }
};
```

### APRÈS - Filtre selon le rôle et l'utilisateur:
```typescript
import { useAuth } from '@/contexts/AuthContext';

const loadAllData = async () => {
  const { currentUser } = useAuth();
  
  if (!currentUser) {
    console.error('User not authenticated');
    return;
  }

  try {
    if (currentUser.role === 'admin') {
      // LES ADMINS VOIENT TOUT
      const { data: clientsData } = await supabase
        .from('clients')
        .select('*')
        .is('deleted_at', null) // Exclude soft-deleted
        .order('created_at', { ascending: false });
      
      const { data: soinsData } = await supabase
        .from('soins')
        .select('*')
        .is('deleted_at', null)
        .order('date', { ascending: false });
      
      // ... charger toutes les données
    } else {
      // LES AGENTS NE VOIENT QUE LEURS DONNÉES
      const userId = currentUser.id;
      
      // Clients créés par cet agent
      const { data: clientsData } = await supabase
        .from('clients')
        .select('*')
        .eq('created_by', userId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      
      // Soins créés par cet agent OU affectés à cet agent
      const { data: soinsData } = await supabase
        .from('soins')
        .select('*')
        .or(`created_by.eq.${userId},assigned_to.eq.${userId}`)
        .is('deleted_at', null)
        .order('date', { ascending: false });
      
      // Rendez-vous affectés à cet agent
      const { data: rendezvousData } = await supabase
        .from('rendezvous')
        .select('*')
        .eq('assigned_to', userId)
        .is('deleted_at', null)
        .order('date', { ascending: false });
      
      // ... charger les autres données filtrées
    }
  } catch (err) {
    console.error('Error loading data:', err);
  }
};
```

---

## 5️⃣ METTRE À JOUR LES OPÉRATIONS CRUD

**Fichier**: `src/hooks/useDatabase.ts` (Fonctions CRUD)

### AVANT:
```typescript
const addClient = useCallback(async (client: Client) => {
  if (isConnected) {
    const { error } = await supabase
      .from('clients')
      .insert(clientToDb(client));
    // ...
  }
}, [isConnected, saveToLocalStorage]);
```

### APRÈS:
```typescript
const addClient = useCallback(async (client: Client, userId: string) => {
  if (isConnected) {
    const { error } = await supabase
      .from('clients')
      .insert({
        ...clientToDb(client),
        created_by: userId,    // ← NOUVEAU
        updated_by: userId,    // ← NOUVEAU
      });
    
    if (error) {
      console.error('Error adding client:', error);
      throw error;
    }
  }
  setClients(prev => {
    const updated = [...prev, { ...client, createdBy: userId }];
    if (!isConnected) saveToLocalStorage('clients', updated);
    return updated;
  });
}, [isConnected, saveToLocalStorage]);

// ==============================
// MODIFIER: updateClient aussi
// ==============================
const updateClient = useCallback(async (client: Client, userId: string) => {
  if (isConnected) {
    const { error } = await supabase
      .from('clients')
      .update({
        ...clientToDb(client),
        updated_by: userId,    // ← NOUVEAU
      })
      .eq('id', client.id);
    
    if (error) {
      console.error('Error updating client:', error);
      throw error;
    }
  }
  // ... rest of update logic
}, [isConnected, saveToLocalStorage]);

// ==============================
// MODIFIER: deleteClient (soft delete)
// ==============================
const deleteClient = useCallback(async (id: string, userId: string) => {
  if (isConnected) {
    // Soft delete au lieu de delete physique
    const { error } = await supabase
      .from('clients')
      .update({
        deleted_at: new Date().toISOString(),
        updated_by: userId,
      })
      .eq('id', id);
    
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
```

---

## 6️⃣ METTRE À JOUR LES APPELS DANS AppLayout

**Fichier**: `src/components/AppLayout.tsx`

### AVANT:
```typescript
const handleClientAdd = async (client: Client) => {
  await db.addClient(client);
};
```

### APRÈS:
```typescript
const { currentUser } = useAuth();

const handleClientAdd = async (client: Client) => {
  if (currentUser) {
    await db.addClient(client, currentUser.id);
  }
};

const handleClientUpdate = async (client: Client) => {
  if (currentUser) {
    await db.updateClient(client, currentUser.id);
  }
};

const handleClientDelete = async (id: string) => {
  if (currentUser) {
    await db.deleteClient(id, currentUser.id);
  }
};
```

---

## 7️⃣ AFFICHER LE CRÉATEUR DANS LES PAGES

**Exemple**: `src/components/ctk/ClientsPage.tsx`

### AVANT:
```typescript
<table className="w-full">
  <thead>
    <tr>
      <th>Client</th>
      <th>Contact</th>
      <th>Inscription</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    {filteredClients.map((client) => (
      <tr key={client.id}>
        <td>{client.prenom} {client.nom}</td>
        <td>{client.telephone}</td>
        <td>{client.dateInscription}</td>
      </tr>
    ))}
  </tbody>
</table>
```

### APRÈS:
```typescript
<table className="w-full">
  <thead>
    <tr>
      <th>Client</th>
      <th>Contact</th>
      <th>Inscription</th>
      <th>Créé par</th>        {/* ← NOUVEAU */}
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    {filteredClients.map((client) => (
      <tr key={client.id}>
        <td>{client.prenom} {client.nom}</td>
        <td>{client.telephone}</td>
        <td>{client.dateInscription}</td>
        <td>{client.createdBy}</td>  {/* ← NOUVEAU */}
      </tr>
    ))}
  </tbody>
</table>
```

---

## 8️⃣ AJOUTER L'ASSIGNATION DANS LES SOINS/RENDEZ-VOUS

**Fichier**: `src/components/ctk/KinesitherapiePage.tsx`

### Ajouter un champ "Affecté à":

```typescript
const [formData, setFormData] = useState({
  clientId: '',
  acteCode: '',
  personnelId: '',
  date: new Date().toISOString().split('T')[0],
  heure: '09:00',
  notes: '',
  assignedTo: '', // ← NOUVEAU - Sélectionner un agent
});

// Dans le formulaire:
<div>
  <label>Affecté à (Agent)</label>
  <select
    value={formData.assignedTo}
    onChange={(e) => setFormData({...formData, assignedTo: e.target.value})}
  >
    <option value="">-- Non affecté --</option>
    {utilisateurs
      .filter(u => u.role === 'agent')
      .map(u => (
        <option key={u.id} value={u.id}>
          {u.prenom} {u.nom}
        </option>
      ))
    }
  </select>
</div>
```

---

## 9️⃣ RÈGLES DE VISIBILITÉ À ENFORCER

**Dans chaque page qui édite/supprime des données**:

```typescript
// Agent essaie de modifier un soin créé par un autre agent?
const canEdit = (record: any, currentUser: User): boolean => {
  // Admin peut tout faire
  if (currentUser.role === 'admin') return true;
  
  // Agent ne peut éditer que ses propres records
  if (record.created_by === currentUser.id) return true;
  
  // Ou les records affectés à lui-même
  if (record.assigned_to === currentUser.id) return true;
  
  return false;
};

// Utiliser dans le JSX:
{canEdit(client, currentUser) && (
  <button onClick={() => handleEdit(client)}>
    Modifier
  </button>
)}
```

---

## 🔟 PROVIDER WRAPPER

**Fichier**: `src/App.tsx` (Wrapping)

```typescript
import { AuthProvider } from '@/contexts/AuthContext';

const App = () => (
  <AuthProvider>
    <ThemeProvider defaultTheme="light">
      <QueryClientProvider client={queryClient}>
        {/* ... rest ... */}
      </QueryClientProvider>
    </ThemeProvider>
  </AuthProvider>
);

export default App;
```

---

## ✅ CHECKLIST DE VALIDATION

Une fois tous les changements implémentés, vérifier:

- [ ] `AuthContext` créé et utilisé partout
- [ ] `loadAllData` filtre selon le rôle
- [ ] Les CRUD ajoutent `created_by` et `updated_by`
- [ ] Les pages affichent qui a créé quoi
- [ ] Les agents ne peuvent modifier que leurs données
- [ ] Les admins voient tout
- [ ] Les champs `assigned_to` sont visibles dans l'UI
- [ ] Les soins/RDV peuvent être assignés à des agents
- [ ] Les tests passent
- [ ] Aucune fuite de données

---

## 🚀 ORDRE D'IMPLÉMENTATION RECOMMANDÉ

1. **Phase 1** (Jour 1): Créer AuthContext + Interfaces
2. **Phase 2** (Jour 1-2): Migration Supabase + Conversions
3. **Phase 3** (Jour 2): Filtrage par rôle dans loadAllData
4. **Phase 4** (Jour 2-3): Mise à jour des CRUD
5. **Phase 5** (Jour 3): Mise à jour des pages UI
6. **Phase 6** (Jour 3-4): Tests + Validation
7. **Phase 7** (Jour 4): Déploiement

---

## 🐛 PIÈGES À ÉVITER

⚠️ **Ne pas oublier de**:
- Toujours passer l'userId aux CRUD
- Toujours appeler useAuth() au bon endroit
- Vérifier le rôle avant toute opération sensible
- Utiliser les soft deletes (deleted_at) au lieu de DELETE physiques
- Journaliser les modifications sensibles dans audit_log

❌ **À ne pas faire**:
- Charger TOUS les clients même pour un agent
- Permettre à un agent de modifier les données d'un autre
- Oublier de filtrer les requêtes côté serveur (Supabase)
- Envoyer l'userId côté client seulement (toujours valider côté serveur)

---

## 📞 SUPPORT

Pour toute question sur l'implémentation, consultez:
- [AUDIT_RELATIONS_AGENT_ADMIN.md](../AUDIT_RELATIONS_AGENT_ADMIN.md) - Analyse complète
- [001_add_audit_fields.sql](001_add_audit_fields.sql) - SQL à exécuter
- Les commentaires `// ← NOUVEAU` dans ce guide

