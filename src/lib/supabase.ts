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

const MISSING_ENV_ERROR = {
  code: 'MISSING_ENV',
  message:
    'Faltan variables de entorno en Vercel. Configuralas en: Vercel Dashboard → Settings → Environment Variables. Agregá VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY y luego re-despliega (Redeploy).',
  status: 500,
  details:
    'Faltan VITE_SUPABASE_URL y/o VITE_SUPABASE_ANON_KEY en las variables de entorno del servidor.',
};

// Error "clonable" (no instanceof Error, pero message/code/status presentes)
const makeError = (extraMsg?: string) => ({
  ...MISSING_ENV_ERROR,
  message: extraMsg ? `${MISSING_ENV_ERROR.message} (${extraMsg})` : MISSING_ENV_ERROR.message,
});

// -------- Fábrica de objetos Postgrest "encadenables" que no rompan --------
type AnyFn = (...args: any[]) => any;

const NO_DATA_ERROR = { data: null, count: null, status: 404, statusText: 'Not Found', error: makeError() };

function createChainable(defaultReturn: any = NO_DATA_ERROR): any {
  const terminalMethods = new Set([
    'then',      // async: .then(...) se usa cuando se "await"ea el builder
    'single',
    'maybeSingle',
    'order',
    'limit',
    'range',
    'abortSignal',
    'returns',
    'csv',
    'rollback',
  ]);

  const chain: AnyFn = (_: any) => chain;

  // @ts-ignore
  return new Proxy(() => {}, {
    apply(_target, _thisArg, _args) {
      return chainable();
    },
    get(_target, prop, _receiver) {
      // then() → hace que await resuelva al valor por defecto
      if (prop === 'then') {
        return (onFulfilled?: AnyFn, _onRejected?: AnyFn) => {
          const result = Promise.resolve(defaultReturn);
          return onFulfilled ? result.then(onFulfilled) : result;
        };
      }
      // Metodos asincrónicos que resuelven al default
      if (terminalMethods.has(String(prop))) {
        return () =>
          new Promise((resolve) => {
            setTimeout(() => resolve(defaultReturn), 0);
          });
      }
      // Cualquier otro método (eq, neq, gte, select, insert, update, delete, not, etc.)
      // devuelve otro chainable. Importante: .insert() no devuelve promesa, sino builder.
      return createChainable(defaultReturn);
    },
  }) as any;

  function chainable(): any {
    return createChainable(defaultReturn);
  }
}

// -------- Builder especial para "from('x').insert(y).select().single()" --------
function createInsertChainable(): any {
  const baseResult: any = { ...NO_DATA_ERROR };

  const chain = createChainable(baseResult);

  // .insert() y .upsert() devuelven builder, no promesa
  chain.insert = () => chain;
  chain.upsert = () => chain;
  chain.update = () => chain;
  chain.delete = () => chain;
  chain.select = () => chain;
  chain.eq = () => chain;
  chain.neq = () => chain;
  chain.gte = () => chain;
  chain.lte = () => chain;
  chain.gt = () => chain;
  chain.lt = () => chain;
  chain.in = () => chain;
  chain.is = () => chain;
  chain.not = () => chain;
  chain.or = () => chain;
  chain.and = () => chain;
  chain.textSearch = () => chain;
  chain.contains = () => chain;
  chain.containedBy = () => chain;
  chain.rangeGte = () => chain;
  chain.rangeGt = () => chain;
  chain.rangeLte = () => chain;
  chain.rangeLt = () => chain;
  chain.rangeAdjacent = () => chain;
  chain.overlaps = () => chain;
  chain.match = () => chain;
  chain.filter = () => chain;
  chain.limit = () => chain;
  chain.order = () => chain;
  chain.range = () => chain;
  chain.ilike = () => chain;
  chain.like = () => chain;
  chain.single = () => Promise.resolve(baseResult);
  chain.maybeSingle = () => Promise.resolve(baseResult);
  chain.csv = () => Promise.resolve('');

  // Hace que si alguien hace await directamente de la cadena, se resuelva
  Object.defineProperty(chain, 'then', {
    configurable: true,
    value: (onFulfilled?: AnyFn, _onRejected?: AnyFn) => {
      const p = Promise.resolve(baseResult);
      return onFulfilled ? p.then(onFulfilled) : p;
    },
  });

  return chain;
}

// -------- Dummy auth --------
function createDummyAuth() {
  return {
    signInWithPassword: async () => ({ data: null, error: makeError('auth') }),
    signInWithOtp: async () => ({ data: null, error: makeError('auth') }),
    signInWithOAuth: async () => ({ data: null, error: makeError('auth') }),
    signUp: async () => ({ data: null, error: makeError('auth') }),
    signOut: async () => ({ error: null }),
    getUser: async () => ({
      data: { user: { id: 'fallback-user' } },
      error: null,
    }),
    getSession: async () => ({ data: { session: null }, error: null }),
    setSession: async () => ({ data: null, error: null }),
    refreshSession: async () => ({ data: null, error: makeError('auth') }),
    updateUser: async () => ({ data: null, error: makeError('auth') }),
    resetPasswordForEmail: async () => ({ data: null, error: makeError('auth') }),
    verifyOtp: async () => ({ data: null, error: makeError('auth') }),
    linkIdentity: async () => ({ data: null, error: makeError('auth') }),
    unlinkIdentity: async () => ({ data: null, error: makeError('auth') }),
    getIdentities: () => ({ user: null, identities: [] }),
    onAuthStateChange: (_cb: any) => ({
      data: { subscription: { unsubscribe: () => {} } },
    }),
    admin: {
      createUser: async () => ({ data: null, error: makeError('auth admin') }),
      deleteUser: async () => ({ data: null, error: makeError('auth admin') }),
      listUsers: async () => ({ data: null, error: makeError('auth admin') }),
    },
  };
}

// -------- Dummy functions / storage / realtime / etc --------
function createDummyObject(): any {
  return new Proxy(() => createInsertChainable(), {
    get() {
      return createInsertChainable();
    },
  });
}

// -------- Ensamblar el cliente --------
function createDummySupabase(): SupabaseClient {
  const auth = createDummyAuth();
  const fromFn = (_table: string) => createInsertChainable();
  const rpc = async () => NO_DATA_ERROR;
  const storage = {
    from: () => ({
      upload: async () => ({ data: null, error: makeError('storage') }),
      download: async () => ({ data: null, error: makeError('storage') }),
      list: async () => ({ data: [], error: makeError('storage') }),
      remove: async () => ({ data: null, error: makeError('storage') }),
      createSignedUrl: async () => ({ data: null, error: makeError('storage') }),
      getPublicUrl: () => ({ data: { publicUrl: '' } }),
      update: async () => ({ data: null, error: makeError('storage') }),
      move: async () => ({ data: null, error: makeError('storage') }),
    }),
    listBuckets: async () => ({ data: [], error: makeError('storage') }),
    getBucket: async () => ({ data: null, error: makeError('storage') }),
    createBucket: async () => ({ data: null, error: makeError('storage') }),
    deleteBucket: async () => ({ data: null, error: makeError('storage') }),
  };
  const realtime: any = createDummyObject();
  const rest: any = createDummyObject();

  const client: any = {
    auth,
    storage,
    realtime,
    rest,
    from: fromFn,
    rpc,
    schema: () => client,
    channel: () => ({
      subscribe: () => {},
      unsubscribe: () => {},
      on: () => client.channel('x'),
      send: () => client.channel('x'),
      presenceState: () => ({}),
      track: () => ({ ok: true }),
      untrack: () => ({ ok: true }),
    }),
    removeChannel: async () => {},
    removeAllChannels: async () => {},
    getChannels: () => [],
  };

  return client as SupabaseClient;
}

export const supabase: SupabaseClient = (supabaseInstance ?? createDummySupabase());
export const isSupabaseMisconfigured = missingEnvVarsWarningShown;
