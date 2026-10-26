import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, RoleType } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  demoRole: RoleType;
  isLoading: boolean;
  login: (credentials: { identifier?: string; password?: string; role?: string }) => Promise<void>;
  logout: () => Promise<void>;
  switchDemoRole: (role: RoleType) => void;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('cipherops_token'));
  const [demoRole, setDemoRole] = useState<RoleType>(
    (localStorage.getItem('cipherops_demo_role') as RoleType) || 'INVESTIGATOR'
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize or sync user profile
  useEffect(() => {
    async function initUser() {
      setIsLoading(true);
      try {
        if (token) {
          const res = await api.getMe();
          setUser(res.user);
        } else {
          // Default demo user corresponding to demoRole
          const demoUsers = await api.getDemoUsers();
          const matched = demoUsers.users.find(u => u.role === demoRole) || demoUsers.users[0];
          setUser({
            ...matched,
            permissions: ['*'], // granted per role
          });
        }
      } catch (err) {
        console.warn('Auth initialization fallback to demo mode:', err);
        // Set fallback demo user
        setUser({
          id: 'usr-inv-01',
          email: 'investigator@cipherops.gov.in',
          badgeNumber: 'BADGE-INV-302',
          fullName: 'Inspector Kabir Sharma',
          role: demoRole,
          department: 'Organized Crime & Economic Offenses Unit',
          permissions: ['*'],
        });
      } finally {
        setIsLoading(false);
      }
    }
    initUser();
  }, [token, demoRole]);

  const login = async (credentials: { identifier?: string; password?: string; role?: string }) => {
    setIsLoading(true);
    try {
      const res = await api.login(credentials);
      localStorage.setItem('cipherops_token', res.token);
      setToken(res.token);
      setUser(res.user);
      if (res.user.role) {
        setDemoRole(res.user.role);
        localStorage.setItem('cipherops_demo_role', res.user.role);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (e) {
      // ignore
    }
    localStorage.removeItem('cipherops_token');
    setToken(null);
    // Revert to demo mode
    setUser({
      id: 'usr-inv-01',
      email: 'investigator@cipherops.gov.in',
      badgeNumber: 'BADGE-INV-302',
      fullName: 'Inspector Kabir Sharma',
      role: 'INVESTIGATOR',
      department: 'Organized Crime & Economic Offenses Unit',
      permissions: ['*'],
    });
  };

  const switchDemoRole = async (newRole: RoleType) => {
    setDemoRole(newRole);
    localStorage.setItem('cipherops_demo_role', newRole);
    try {
      const demoUsers = await api.getDemoUsers();
      const matched = demoUsers.users.find(u => u.role === newRole);
      if (matched) {
        setUser({
          ...matched,
          permissions: ['*'],
        });
      }
    } catch (e) {
      if (user) {
        setUser({ ...user, role: newRole });
      }
    }
  };

  const hasPermission = (permission: string) => {
    if (!user) return false;
    if (user.role === 'SYSTEM_ADMINISTRATOR') return true;
    if (!user.permissions) return true;
    return user.permissions.includes(permission) || user.permissions.includes('*');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        demoRole,
        isLoading,
        login,
        logout,
        switchDemoRole,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
