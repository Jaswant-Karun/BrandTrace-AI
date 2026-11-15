import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
  login: (email: string, password?: string) => Promise<UserPersona>;
  register: (data: { name: string; email: string; password: string; role?: any; workspace_id?: string }) => Promise<UserPersona>;
  logout: () => void;
  switchPersona: (persona: UserPersona) => Promise<void>;
  setWorkspace: (workspaceId: string) => void;
  personas: UserPersona[];
  loadPersonasIfNeeded: () => Promise<UserPersona[]>;
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
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlToken = params.get('token');
      if (urlToken) {
        localStorage.setItem('brandtrace_jwt_token', urlToken);
        localStorage.setItem('brandtrace_user_profile', JSON.stringify(DEMO_AURELLE_PERSONA));
        return urlToken;
      }
      if (params.get('demo') === 'true') {
        const demoToken = 'demo_authenticated_token';
        localStorage.setItem('brandtrace_jwt_token', demoToken);
        localStorage.setItem('brandtrace_user_profile', JSON.stringify(DEMO_AURELLE_PERSONA));
        return demoToken;
      }
    }
    return localStorage.getItem('brandtrace_jwt_token');
  });

  const [user, setUser] = useState<UserPersona | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('demo') === 'true' || params.get('token')) {
        return DEMO_AURELLE_PERSONA;
      }
    }
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

  // Deferred persona loading: does NOT block the critical login path
  const loadPersonasIfNeeded = useCallback(async (): Promise<UserPersona[]> => {
    if (personas.length > 0) return personas;
    try {
      const data = await apiClient.auth.personas();
      setPersonas(data);
      return data;
    } catch (e) {
      console.log('Persona fetch note:', e);
      return [];
    }
  }, [personas]);

  // Non-blocking idle pre-fetch: only when browser is completely idle and not on login view
  useEffect(() => {
    const isLoginView = typeof window !== 'undefined' && (
      window.location.pathname === '/login' ||
      new URLSearchParams(window.location.search).get('view') === 'login'
    );
    if (isLoginView) return; // Never waste network bandwidth on the login screen

    const timer = setTimeout(() => {
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(() => {
          loadPersonasIfNeeded();
        });
      } else {
        loadPersonasIfNeeded();
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [loadPersonasIfNeeded]);

  const login = async (email: string, password?: string): Promise<UserPersona> => {
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
      return res.user;
    } catch (err) {
      console.error('Login failed:', err);
      throw err;
    }
  };

  const register = async (data: { name: string; email: string; password: string; role?: any; workspace_id?: string }): Promise<UserPersona> => {
    try {
      const cleanEmail = data.email.toLowerCase().trim();
      const res = await apiClient.auth.register({
        name: data.name.trim(),
        email: cleanEmail,
        password: data.password,
        role: data.role || 'BRAND_MANAGER',
        workspace_id: data.workspace_id || 'aurelle-tech'
      });

      localStorage.setItem('brandtrace_jwt_token', res.access_token);
      localStorage.setItem('brandtrace_user_profile', JSON.stringify(res.user));
      setToken(res.access_token);
      setUser(res.user);
      setCurrentOrg(res.user.org_id);
      setCurrentWorkspace(res.user.workspace_id);
      return res.user;
    } catch (err) {
      console.error('Registration failed:', err);
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
        register,
        logout,
        switchPersona,
        setWorkspace,
        personas,
        loadPersonasIfNeeded
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
