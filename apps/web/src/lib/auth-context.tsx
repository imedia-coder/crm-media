'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api, clearTokens, decodeJwt, getAccessToken, setAccessToken } from './api';

export interface AuthUser {
  sub: string;
  tenantId: string;
  roleId: string | null;
  permissions: string[];
  isClient: boolean;
  companyId: string | null;
}

export interface TenantInfo {
  id: string;
  slug: string;
  name: string;
}

interface AuthResponse {
  tenant: TenantInfo;
  user: { id: string; email: string; firstName: string; lastName: string };
  accessToken: string;
  // Pas de refreshToken ici : l'API le pose directement en cookie httpOnly
  // (Set-Cookie), jamais dans le corps JSON — voir apps/api auth.controller.ts.
}

interface RegisterDto {
  tenantName: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

interface LoginDto {
  tenantSlug: string;
  email: string;
  password: string;
  mfaCode?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  tenant: TenantInfo | null;
  displayName: string | null;
  isLoading: boolean;
  register: (dto: RegisterDto) => Promise<void>;
  login: (dto: LoginDto) => Promise<void>;
  logout: () => Promise<void>;
}

const TENANT_KEY = 'crm_tenant';
const DISPLAY_NAME_KEY = 'crm_display_name';

const AuthContext = createContext<AuthContextValue | null>(null);

function applyAuthResponse(data: AuthResponse) {
  setAccessToken(data.accessToken);
  window.localStorage.setItem(TENANT_KEY, JSON.stringify(data.tenant));
  window.localStorage.setItem(DISPLAY_NAME_KEY, `${data.user.firstName} ${data.user.lastName}`);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      // Hydratation depuis le token/localStorage (client-only, indisponible
      // pendant le rendu serveur) — pas un calcul derivable au rendu.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUser(decodeJwt<AuthUser>(token));
      const storedTenant = window.localStorage.getItem(TENANT_KEY);
      if (storedTenant) setTenant(JSON.parse(storedTenant));
      setDisplayName(window.localStorage.getItem(DISPLAY_NAME_KEY));
    }
    setIsLoading(false);
  }, []);

  async function register(dto: RegisterDto) {
    const data = await api.post<AuthResponse>('/auth/register', dto, { skipAuth: true });
    applyAuthResponse(data);
    setUser(decodeJwt<AuthUser>(data.accessToken));
    setTenant(data.tenant);
    setDisplayName(`${data.user.firstName} ${data.user.lastName}`);
  }

  async function login(dto: LoginDto) {
    const data = await api.post<AuthResponse>('/auth/login', dto, { skipAuth: true });
    applyAuthResponse(data);
    setUser(decodeJwt<AuthUser>(data.accessToken));
    setTenant(data.tenant);
    setDisplayName(`${data.user.firstName} ${data.user.lastName}`);
  }

  async function logout() {
    // Le refresh token voyage dans le cookie httpOnly, envoye automatiquement
    // par le navigateur — rien a lire/envoyer explicitement ici.
    await api.post('/auth/logout', undefined, { skipAuth: true }).catch(() => undefined);
    clearTokens();
    window.localStorage.removeItem(TENANT_KEY);
    window.localStorage.removeItem(DISPLAY_NAME_KEY);
    setUser(null);
    setTenant(null);
    setDisplayName(null);
  }

  return (
    <AuthContext.Provider value={{ user, tenant, displayName, isLoading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
