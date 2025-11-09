import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged 
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth } from '../config/firebase';
import api from '../config/api';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, firstName?: string, lastName?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const signup = async (email: string, password: string, firstName?: string, lastName?: string) => {
    try {
      // First, create user via backend
      const response = await api.post('/signup', {
        email,
        password,
        firstName,
        lastName,
      });
      
      // Backend successfully created the user, now sign in with Firebase Client SDK
      // Since the user already exists (created by backend), we sign in instead of creating
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      // Handle backend errors
      if (error.response?.status === 409) {
        // User already exists - try to sign in instead
        try {
          await signInWithEmailAndPassword(auth, email, password);
        } catch (signInError: any) {
          throw new Error('An account with this email already exists. Please sign in instead.');
        }
      } else if (error.code === 'auth/email-already-in-use') {
        // If Firebase says user exists, just sign in
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        // Re-throw other errors
        throw error;
      }
    }
  };

  const login = async (email: string, password: string) => {
    try {
      // Verify credentials with backend
      await api.post('/login', {
        email,
        password,
      });
      
      // Then authenticate with Firebase Client SDK for session management
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      throw error;
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  useEffect(() => {
    try {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setCurrentUser(user);
        setLoading(false);
      }, (error) => {
        console.error('Auth state change error:', error);
        setLoading(false);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Firebase initialization error:', error);
      setLoading(false);
    }
  }, []);

  const value = {
    currentUser,
    loading,
    login,
    signup,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg">Loading...</div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

