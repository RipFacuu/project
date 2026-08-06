import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabaseInstance: SupabaseClient | null = null;
let missingEnvVarsWarningShown = false;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '%c⚠️ Faltan variables de entorno en Vercel!',
    'background: #ff4444; color: white; padding: 8px 12px; border-radius: 4px; font-weight: bold; font-size: 14px;'
  );
  console.error(
    'En el panel de Vercel → Settings → Environment Variables agregá:\n' +
      '  VITE_SUPABASE_URL = https://bfoqnoemdbjoruqvhpwz.supabase.co\n' +
      '  VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmb3Fub2VtZGJqb3J1cXZocHd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwMjU1ODksImV4cCI6MjEwMTYwMTU4OX0.1BbiY0Nrohb1JsAl4R9qdsmzyW7KxagoyJHGerWWi9A\n\n' +
      'Después re-desplegá (Redeploy).'
  );
  missingEnvVarsWarningShown = true;
} else {
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
}

// Crear un cliente "fallback" que no explote pero avise al usuario
const dummySupabase: any = new Proxy(
  {},
  {
    get(_target, prop) {
      if (prop === 'auth') {
        return {
          signInWithPassword: async () => ({ data: null, error: { message: 'Faltan variables de Supabase en Vercel' } }),
          signUp: async () => ({ data: null, error: { message: 'Faltan variables de Supabase en Vercel' } }),
          signOut: async () => ({ error: null }),
          getUser: async () => ({ data: { user: { id: 'fallback-user' } }, error: null }),
          onAuthStateChange: () => ({
            data: {
              subscription: { unsubscribe: () => {} },
            },
          }),
        };
      }
      if (prop === 'from') {
        return () => ({
          select: () => ({
            eq: () => ({
              limit: () => ({
                maybeSingle: async () => ({ data: null, error: null }),
                single: async () => ({
                  data: null,
                  error: { code: 'MISSING_ENV', message: 'Faltan variables de Supabase en Vercel. Configuralas en Vercel → Settings → Environment Variables.' },
                  status: 500,
                }),
              }),
              order: async () => ({
                data: [],
                error: { code: 'MISSING_ENV', message: 'Faltan variables de Supabase en Vercel.' },
              }),
              maybeSingle: async () => ({ data: null, error: null }),
              single: async () => ({
                data: null,
                error: { code: 'MISSING_ENV', message: 'Faltan variables de Supabase.' },
              }),
            }),
            not: () => ({ eq: () => ({ order: async () => ({ data: [], error: null }) }) }),
            limit: () => ({ order: async () => ({ data: [], error: null }) }),
            order: async () => ({ data: [], error: null }),
            insert: () => ({
              select: () => ({
                single: async () => ({
                  data: null,
                  error: {
                    code: 'MISSING_ENV',
                    message:
                      'Faltan variables de entorno en Vercel. Configuralas en: Vercel Dashboard → Settings → Environment Variables. Agregá VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY y luego re-despliega (Redeploy).',
                  },
                }),
              }),
            }),
            update: () => ({
              eq: () => ({
                select: () => ({
                  single: async () => ({
                    data: null,
                    error: { code: 'MISSING_ENV', message: 'Faltan variables de entorno en Vercel.' },
                  }),
                }),
              }),
            }),
            delete: () => ({
              eq: async () => ({ error: null }),
            }),
          }),
        });
      }
      return () => dummySupabase;
    },
  }
);

export const supabase: SupabaseClient = (supabaseInstance ?? (dummySupabase as SupabaseClient));

export const isSupabaseMisconfigured = missingEnvVarsWarningShown;
