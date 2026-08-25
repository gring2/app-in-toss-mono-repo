import { Storage } from '@apps-in-toss/framework';
import { createClient } from '@supabase/supabase-js';

import { supabaseConfig } from './config';
import type { Database } from './database.types';

const sessionStorage = {
  getItem: (key: string) => Storage.getItem(key),
  setItem: (key: string, value: string) => Storage.setItem(key, value),
  removeItem: (key: string) => Storage.removeItem(key),
};

export const supabase = createClient<Database>(supabaseConfig.url, supabaseConfig.publishableKey, {
  auth: {
    storage: sessionStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

let pendingAnonymousSession: Promise<void> | null = null;

export async function ensureAnonymousSession(): Promise<void> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError != null) {
    throw sessionError;
  }

  if (session != null) {
    return;
  }

  if (pendingAnonymousSession == null) {
    pendingAnonymousSession = supabase.auth
      .signInAnonymously()
      .then(({ error }) => {
        if (error != null) {
          throw error;
        }
      })
      .finally(() => {
        pendingAnonymousSession = null;
      });
  }

  await pendingAnonymousSession;
}
