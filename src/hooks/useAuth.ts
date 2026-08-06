import { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { LoginData, RegisterData } from '../types';

export const useAuth = () => {
  const [user] = useState<User | null>({ id: 'public-admin' } as unknown as User);
  const [loading] = useState(false);
  const [devAuthError] = useState<string | null>(null);

  const signIn = async (_credentials: LoginData) => {
    return { data: null, error: null };
  };

  const signUp = async (_credentials: RegisterData) => {
    return { data: null, error: null };
  };

  const signOut = async () => {
    return { error: null };
  };

  const retryDevLogin = async () => {
    return { user, error: null };
  };

  return {
    user,
    loading,
    devAuthError,
    signIn,
    signUp,
    signOut,
    retryDevLogin,
  };
};
