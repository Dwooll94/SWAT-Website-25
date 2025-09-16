import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

interface User {
  id: string;
  email: string;
  role: 'student' | 'mentor' | 'admin';
  registration_status: 'initially_created' | 'contract_signed' | 'complete' | 'inactive';
  first_name?: string;
  last_name?: string;
  maintenance_access: boolean;
  is_core_leadership?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<any>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  loading: boolean;
}

interface RegisterData {
  email: string;
  school_email?: string;
  password: string;
  graduation_year?: number;
  gender?: 'male' | 'female' | 'non_binary' | 'prefer_not_to_say';
  first_name?: string;
  last_name?: string;
  phone?: string;
  food_allergies?: string;
  medical_conditions?: string;
  heard_about_team?: string;
  subteam_preferences?: Array<{ subteam_id: number; preference_rank: number; is_interested: boolean }>;
  guardians?: Array<{ name: string; email?: string; phone?: string; relationship?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/auth/profile');
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<void> => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token: newToken, user: userData } = response.data;
      
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('token', newToken);
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed';
      if(error.response?.data?.email_verified === false){
        throw error
      }
      else{
        throw new Error(message);
      }

    }
  };

  const register = async (userData: RegisterData): Promise<any> => {
    try {
      const response = await api.post('/auth/register', userData);
      // Don't auto-login on registration since email verification is required
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Registration failed';
      throw new Error(message);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
  };

  const refreshUser = async () => {
    if (token) {
      await fetchProfile();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        refreshUser,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export { api };