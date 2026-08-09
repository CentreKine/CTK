import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

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
  isLoading: boolean;
  isLoggedIn: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAdmin: () => boolean;
  isAgent: () => boolean;
  getUserName: () => string;
  setCurrentUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Charger l'utilisateur stocké au montage
  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (err) {
        console.error('Error parsing stored user:', err);
        localStorage.removeItem('currentUser');
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(
    async (
      email: string,
      password: string
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        setIsLoading(true);

        let users: User[] = [];

        try {
          const { data, error } = await supabase.from('utilisateurs').select('*').limit(100);
          if (!error && Array.isArray(data)) {
            users = data.map((row: any) => ({
              id: row.id,
              nom: row.nom,
              prenom: row.prenom,
              email: row.email,
              role: row.role === 'admin' ? 'admin' : 'agent',
              telephone: row.telephone || '',
              dateCreation: row.date_creation || '',
              actif: row.actif !== false,
            }));
          }
        } catch (err) {
          console.warn('Backend users unavailable, falling back to local storage', err);
        }

        if (!users.length) {
          const storedUsers = localStorage.getItem('ctk_utilisateurs');
          users = storedUsers ? JSON.parse(storedUsers) : [];
        }

        let user: User | null = null;

        const foundUser = users.find((u: User) => u.email === email);
        if (foundUser) {
          user = foundUser;
        } else if (email === 'admin@ctk.ci' && password === 'admin123') {
          user = {
            id: 'admin-001',
            nom: 'Admin',
            prenom: 'CTK',
            email: 'admin@ctk.ci',
            role: 'admin',
            telephone: '+235-00-00-00-00',
            dateCreation: new Date().toISOString().split('T')[0],
            actif: true,
          };
        } else if (email === 'agent@ctk.ci' && password === 'agent123') {
          user = {
            id: 'agent-001',
            nom: 'Agent',
            prenom: 'CTK',
            email: 'agent@ctk.ci',
            role: 'agent',
            telephone: '+235-00-00-00-01',
            dateCreation: new Date().toISOString().split('T')[0],
            actif: true,
          };
        }

        if (!user) {
          return {
            success: false,
            error: 'Email ou mot de passe incorrect',
          };
        }

        setCurrentUser(user);
        localStorage.setItem('currentUser', JSON.stringify(user));
        return { success: true };
      } catch (err) {
        console.error('Login error:', err);
        return {
          success: false,
          error: 'Erreur lors de la connexion',
        };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const logout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
  }, []);

  const isAdmin = useCallback(() => currentUser?.role === 'admin', [currentUser]);
  const isAgent = useCallback(() => currentUser?.role === 'agent', [currentUser]);

  const getUserName = useCallback(() => {
    if (!currentUser) return 'Utilisateur';
    return `${currentUser.prenom} ${currentUser.nom}`;
  }, [currentUser]);

  const value: AuthContextType = {
    currentUser,
    isLoading,
    isLoggedIn: !!currentUser,
    login,
    logout,
    isAdmin,
    isAgent,
    getUserName,
    setCurrentUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
