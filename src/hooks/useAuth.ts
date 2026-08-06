import { useState } from 'react';
import { User } from '@supabase/supabase-js';

export const useAuth = () => {
  const [user] = useState<User | null>({ id: 'public-admin' } as unknown as User);
  const [loading] = useState(false);
  const [devAuthError] = useState<string | null>(null);

  const signIn = async () => ({ data: null, error: null });
  const signUp = async () => ({ data: null, error: null });
  const signOut = async () => ({ error: null });
  const retryDevLogin = async () => ({ user, error: null });

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
