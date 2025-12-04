
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Exportamos una variable mutable
export let supabase: SupabaseClient;

export const initSupabase = (url: string, key: string) => {
  if (!url || !key) {
    throw new Error("URL y Key son requeridos");
  }
  try {
      // Configuramos explícitamente la persistencia de sesión
      supabase = createClient(url, key, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
        }
      });
      return supabase;
  } catch (error) {
      console.error("Error inicializando Supabase", error);
      throw error;
  }
};

// Función auxiliar para verificar si está inicializado
export const isSupabaseConfigured = () => {
    return !!supabase;
};
