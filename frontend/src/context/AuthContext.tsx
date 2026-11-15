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
  login: (email: string) => Promise<void>;
  logout: () => void;
  switchPersona: (persona: UserPersona) => Promise<void>;
  setWorkspace: (workspaceId: string) => void;
  personas: UserPersona[];
}

const DEFAULT_PERSONA: UserPersona = {
  email: "governance@apex.com",
  name: "David Sterling, Chief Governance Officer",
  role: "COMPLIANCE_REVIEWER",
  org_id: "ORG-APEX",
  workspace_id: "apex-dynamics"
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserPersona | null>(DEFAULT_PERSONA);
  const [token, setToken] = useState<string | null>(localStorage.getItem('brandtrace_jwt_token'));
  const [currentOrg, setCurrentOrg] = useState<string>("ORG-APEX");
  const [currentWorkspace, setCurrentWorkspace] = useState<string>("apex-dynamics");
  const [personas, setPersonas] = useState<UserPersona[]>([]);

  useEffect(() => {
    // Load available personas from backend
    apiClient.auth.personas()
      .then((data) => setPersonas(data))
      .catch((e) => console.log('Persona fetch note:', e));

    // Auto-login default persona if token is absent
    if (!token) {
      apiClient.auth.login({ email: DEFAULT_PERSONA.email })
        .then((res) => {
          localStorage.setItem('brandtrace_jwt_token', res.access_token);
          setToken(res.access_token);
          setUser(res.user);
          setCurrentOrg(res.user.org_id);
          setCurrentWorkspace(res.user.workspace_id);
        })
        .catch((e) => console.log('Auto-login note:', e));
    }
  }, []);

  const login = async (email: string) => {
    try {
      const res = await apiClient.auth.login({ email });
      localStorage.setItem('brandtrace_jwt_token', res.access_token);
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
    } else {
      setCurrentOrg('ORG-APEX');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
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
