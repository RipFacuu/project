import { User } from '@supabase/supabase-js';
import { authService } from './database';

export const DEV_AUTO_LOGIN = import.meta.env.VITE_DEV_AUTO_LOGIN === 'true';
export const DEV_EMAIL = import.meta.env.VITE_DEV_EMAIL ?? '';
export const DEV_PASSWORD = import.meta.env.VITE_DEV_PASSWORD ?? '';

export const hasDevCredentials = DEV_EMAIL.length > 0 && DEV_PASSWORD.length > 0;

export type DevAuthResult = {
  user: User | null;
  error: string | null;
};

function formatDevAuthError(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes('failed to fetch') || lower.includes('network')) {
    return 'No se puede conectar a Supabase. Verificá VITE_SUPABASE_URL en .env (copiá la URL exacta desde Supabase → Project Settings → API).';
  }

  if (lower.includes('email not confirmed')) {
    return 'El email no está confirmado. En Supabase: Authentication → Providers → Email → desactivá "Confirm email". Después borrá el usuario en Authentication → Users y recargá la app.';
  }

  if (lower.includes('invalid login credentials') || lower.includes('invalid credentials')) {
    return `No se pudo entrar con ${DEV_EMAIL}. Borrá ese usuario en Supabase → Authentication → Users, recargá la app y se creará de nuevo automáticamente.`;
  }

  if (lower.includes('email address') && lower.includes('invalid')) {
    return `El email "${DEV_EMAIL}" no es válido para Supabase. Cambiá VITE_DEV_EMAIL en .env a algo como admin@test.com.`;
  }

  return message;
}

export async function ensureDevSession(): Promise<DevAuthResult> {
  if (!DEV_AUTO_LOGIN || !hasDevCredentials) {
    return { user: null, error: null };
  }

  const credentials = { email: DEV_EMAIL, password: DEV_PASSWORD };

  const loginResult = await authService.login(credentials);
  if (loginResult.data?.user) {
    return { user: loginResult.data.user, error: null };
  }

  const registerResult = await authService.register(credentials);

  if (registerResult.data?.session?.user) {
    return { user: registerResult.data.session.user, error: null };
  }

  if (registerResult.data?.user && !registerResult.error) {
    const retryLogin = await authService.login(credentials);
    if (retryLogin.data?.user) {
      return { user: retryLogin.data.user, error: null };
    }
  }

  const alreadyRegistered = registerResult.error?.message?.toLowerCase().includes('already');
  if (alreadyRegistered) {
    const retryLogin = await authService.login(credentials);
    if (retryLogin.data?.user) {
      return { user: retryLogin.data.user, error: null };
    }
  }

  const rawError =
    loginResult.error?.message ??
    registerResult.error?.message ??
    'No se pudo iniciar sesión automáticamente';

  return { user: null, error: formatDevAuthError(rawError) };
}
