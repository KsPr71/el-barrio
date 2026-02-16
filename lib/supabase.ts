import Constants from "expo-constants";
import { createClient } from "@supabase/supabase-js";

const extra = Constants.expoConfig?.extra as { supabaseUrl?: string; supabaseKey?: string } | undefined;
const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? extra?.supabaseUrl ?? "";
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_KEY ?? extra?.supabaseKey ?? "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "[Supabase] EXPO_PUBLIC_SUPABASE_URL o EXPO_PUBLIC_SUPABASE_KEY no están definidos. Revisa tu archivo .env y reinicia expo start."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
