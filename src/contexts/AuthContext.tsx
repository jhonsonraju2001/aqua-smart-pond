import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types/aquaculture';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  signup: (email: string, password: string, name: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demo
const mockUsers: Record<string, { password: string; user: User }> = {
  'admin@aquafarm.com': {
    password: 'admin123',
    user: {
      id: 'admin-1',
      email: 'admin@aquafarm.com',
      name: 'Admin User',
      role: 'admin',
      ponds: ['pond-1', 'pond-2', 'pond-3'],
      createdAt: new Date('2024-01-01'),
    },
  },
  'user@aquafarm.com': {
    password: 'user123',
    user: {
      id: 'user-1',
      email: 'user@aquafarm.com',
      name: 'John Farmer',
      role: 'user',
      ponds: ['pond-1', 'pond-2'],
      createdAt: new Date('2024-06-01'),
    },
  },
  'demo@aquafarm.com': {
    password: 'demo',
    user: {
      id: 'user-2',
      email: 'demo@aquafarm.com',
      name: 'Demo User',
      role: 'user',
      ponds: ['pond-1'],
      createdAt: new Date('2024-12-01'),
    },
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const savedUser = localStorage.getItem('aquafarm_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockUser = mockUsers[email.toLowerCase()];
    if (mockUser && mockUser.password === password) {
      setUser(mockUser.user);
      localStorage.setItem('aquafarm_user', JSON.stringify(mockUser.user));
      setIsLoading(false);
    } else {
      setIsLoading(false);
      throw new Error('Invalid email or password');
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (mockUsers[email.toLowerCase()]) {
      setIsLoading(false);
      throw new Error('Email already registered');
    }
    
    const newUser: User = {
      id: `user-${Date.now()}`,
      email,
      name,
      role: 'user',
      ponds: ['pond-1'],
      createdAt: new Date(),
    };
    
    setUser(newUser);
    localStorage.setItem('aquafarm_user', JSON.stringify(newUser));
    setIsLoading(false);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('aquafarm_user');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, logout, signup }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
