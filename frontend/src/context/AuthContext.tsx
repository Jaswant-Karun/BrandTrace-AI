import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../services/apiClient';

export interface UserPersona {
  email: string;
  name: string;
  role: 'ADMIN' | 'BRAND_MANAGER' | 'CREATOR' | 'REVIEWER' | 'COMPLIANCE_REVIEWER';
  org_id: string;
  workspace_id: string;
}

interface AuthContextType {
  user: UserPersona | null;
  token: string | null;
  isAuthenticated: boolean;
  currentOrg: string;
  currentWorkspace: string;
  login: (email: string, password?: string) => Promise<void>;
  logout: () => void;
  switchPersona: (persona: UserPersona) => Promise<void>;
  setWorkspace: (workspaceId: string) => void;
  personas: UserPersona[];
}

export const DEMO_AURELLE_PERSONA: UserPersona = {
  email: "demo@brandtrace.ai",
  name: "Alex Mercer, VP Global Brand Governance",
  role: "BRAND_MANAGER",
  org_id: "ORG-AURELLE",
  workspace_id: "aurelle-tech"
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('brandtrace_jwt_token');
  });

  const [user, setUser] = useState<UserPersona | null>(() => {
    const savedUser = localStorage.getItem('brandtrace_user_profile');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch {
        return null;
      }
    }
    // If a valid token exists but no profile, initialize with DEMO persona
    return localStorage.getItem('brandtrace_jwt_token') ? DEMO_AURELLE_PERSONA : null;
  });

  const [currentOrg, setCurrentOrg] = useState<string>(() => {
    return user?.org_id || "ORG-AURELLE";
  });

  const [currentWorkspace, setCurrentWorkspace] = useState<string>(() => {
    return user?.workspace_id || "aurelle-tech";
  });

  const [personas, setPersonas] = useState<UserPersona[]>([]);

  useEffect(() => {
    // Load available personas from backend
    apiClient.auth.personas()
      .then((data) => setPersonas(data))
      .catch((e) => console.log('Persona fetch note:', e));
  }, []);

  const login = async (email: string, password?: string) => {
    try {
      const cleanEmail = email.toLowerCase().trim();
      const defaultPassword = cleanEmail === 'demo@brandtrace.ai'
        ? 'DemoAurelle2026!'
        : 'brandtrace2026';

      const res = await apiClient.auth.login({
        email: cleanEmail,
        password: password || defaultPassword
      });

      localStorage.setItem('brandtrace_jwt_token', res.access_token);
      localStorage.setItem('brandtrace_user_profile', JSON.stringify(res.user));
      setToken(res.access_token);
      setUser(res.user);
      setCurrentOrg(res.user.org_id);
      setCurrentWorkspace(res.user.workspace_id);
    } catch (err) {
      console.error('Login failed:', err);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('brandtrace_jwt_token');
    localStorage.removeItem('brandtrace_user_profile');
    setToken(null);
    setUser(null);
  };

  const switchPersona = async (persona: UserPersona) => {
    await login(persona.email);
  };

  const setWorkspace = (workspaceId: string) => {
    setCurrentWorkspace(workspaceId);
    if (workspaceId === 'novus-health') {
      setCurrentOrg('ORG-NOVUS');
    } else if (workspaceId === 'aurelle-maison' || workspaceId === 'aurelle-tech') {
      setCurrentOrg('ORG-AURELLE');
    } else {
      setCurrentOrg('ORG-APEX');
    }

    if (user) {
      const updatedUser = { ...user, workspace_id: workspaceId };
      setUser(updatedUser);
      localStorage.setItem('brandtrace_user_profile', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        currentOrg,
        currentWorkspace,
        login,
        logout,
        switchPersona,
        setWorkspace,
        personas
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
