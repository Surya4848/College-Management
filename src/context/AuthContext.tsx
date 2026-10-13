import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  apiFetch,
  clearStoredAuth,
  getStoredToken,
  getStoredUser,
  setStoredAuth,
  User,
  UserRole,
} from '../api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  role: UserRole | null;
  login: (identifier: string, password: string, collegeCode?: string) => Promise<void>;
  logout: () => void;
  register: (userData: any) => Promise<void>;
  refreshProfile: () => Promise<void>;
  setDemoUser: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Quick demo user accounts for immediate role preview
export const DEMO_USERS: Record<UserRole, User> = {
  platform_monitor: {
    id: 'demo-monitor',
    name: 'State Education Monitor',
    email: 'monitor@platform.edu',
    phone: '+91 99999 00000',
    role: 'platform_monitor',
    institution_id: 'MON-GOV-01',
    is_verified: true,
    is_active: true,
    is_approved_by_hod: true,
    profile_locked: true,
    photo_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=240&h=240&q=80',
  },
  principal: {
    id: 'demo-principal',
    name: 'Dr. R. Natarajan',
    email: 'principal@college.edu',
    phone: '+91 94444 11111',
    role: 'principal',
    institution_id: 'PRIN-001',
    college_id: 'demo-college-01',
    is_verified: true,
    is_active: true,
    is_approved_by_hod: true,
    profile_locked: true,
    photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=240&h=240&q=80',
  },
  hod: {
    id: 'demo-hod',
    name: 'Dr. S. Meenakshi',
    email: 'hod.it@college.edu',
    phone: '+91 98888 22222',
    role: 'hod',
    department_name: 'Information Technology',
    institution_id: 'HOD-IT-01',
    college_id: 'demo-college-01',
    is_verified: true,
    is_active: true,
    is_approved_by_hod: true,
    profile_locked: true,
    photo_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=240&h=240&q=80',
  },
  staff: {
    id: 'demo-staff',
    name: 'Dr. Arun Kumar',
    email: 'arun.kumar@college.edu',
    phone: '+91 98765 43210',
    role: 'staff',
    department_name: 'Information Technology',
    institution_id: 'SBCIT-FAC-001',
    college_id: 'demo-college-01',
    is_verified: true,
    is_active: true,
    is_approved_by_hod: true,
    profile_locked: false,
    photo_url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=240&h=240&q=85',
  },
  student: {
    id: 'demo-student',
    name: 'Surya M',
    email: 'surya.m@college.edu',
    phone: '+91 91234 56789',
    role: 'student',
    department_name: 'Information Technology',
    institution_id: '23IT001',
    college_id: 'demo-college-01',
    is_verified: true,
    is_active: true,
    is_approved_by_hod: true,
    profile_locked: true, // Locked institutional fields
    photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=240&h=240&q=80',
  },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => getStoredUser() || DEMO_USERS.student);
  const [token, setToken] = useState<string | null>(() => getStoredToken() || 'demo_token');

  async function login(identifier: string, password: string, collegeCode?: string) {
    try {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier, password, college_code: collegeCode }),
      });
      setStoredAuth(data);
      setUser(data.user);
      setToken(data.access_token);
    } catch (err) {
      // Fallback to local check for offline demo mode
      const found = Object.values(DEMO_USERS).find(
        (u) => u.email.toLowerCase() === identifier.toLowerCase() || u.phone === identifier
      );
      if (found) {
        setUser(found);
        setToken('demo_token');
        localStorage.setItem('portal_user', JSON.stringify(found));
        return;
      }
      throw err;
    }
  }

  async function register(userData: any) {
    const data = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    // Attempt automatic login or set user
    setUser(data);
  }

  function logout() {
    clearStoredAuth();
    setUser(null);
    setToken(null);
  }

  async function refreshProfile() {
    if (!token || token === 'demo_token') return;
    try {
      const profile = await apiFetch('/auth/me');
      setUser(profile);
      localStorage.setItem('portal_user', JSON.stringify(profile));
    } catch {
      // Silently keep cached profile
    }
  }

  function setDemoUser(role: UserRole) {
    const selected = DEMO_USERS[role];
    setUser(selected);
    setToken('demo_token');
    localStorage.setItem('portal_user', JSON.stringify(selected));
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        role: user?.role || null,
        login,
        logout,
        register,
        refreshProfile,
        setDemoUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

