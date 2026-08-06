import { User } from '@supabase/supabase-js';

export const DEV_AUTO_LOGIN = false;
export const DEV_EMAIL = '';
export const DEV_PASSWORD = '';
export const hasDevCredentials = false;

export type DevAuthResult = {
  user: User | null;
  error: string | null;
};

export async function ensureDevSession(): Promise<DevAuthResult> {
  return { user: null, error: null };
}
