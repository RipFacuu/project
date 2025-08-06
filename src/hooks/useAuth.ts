import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { authService } from '../lib/database';
import { LoginData, RegisterData } from '../types';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    authService.getCurrentUser().then(({ user, error }) => {
      setUser(user);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = authService.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (credentials: LoginData) => {
    const { data, error } = await authService.login(credentials);
    return { data, error };
  };

  const signUp = async (credentials: RegisterData) => {
    const { data, error } = await authService.register(credentials);
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await authService.logout();
    return { error };
  };

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  };
};