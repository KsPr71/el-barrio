import { supabase } from "@/lib/supabase";
import type { Session, User } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";

export type AdminProfile = {
  id: string;
  email: string | null;
  role: "admin" | "user";
};

export function useSupabaseAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error: err } = await supabase
      .from("admin_profiles")
      .select("id, email, role")
      .eq("id", userId)
      .single();
    if (err) {
      console.warn("[useSupabaseAuth] profile fetch:", err);
      return null;
    }
    return data as AdminProfile;
  }, []);

  const refreshSession = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const {
        data: { session: s },
        error: err,
      } = await supabase.auth.getSession();
      if (err) throw err;
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        const p = await fetchProfile(s.user.id);
        setProfile(p);
      } else {
        setProfile(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar sesión");
      setSession(null);
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [fetchProfile]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      setError(null);
      const { data, error: err } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (err) {
        setError(err.message);
        throw err;
      }
      if (data.user) {
        const p = await fetchProfile(data.user.id);
        setProfile(p);
      }
      setSession(data.session);
      setUser(data.user ?? null);
    },
    [fetchProfile],
  );

  const signUp = useCallback(
    async (email: string, password: string) => {
      setError(null);
      const { data, error: err } = await supabase.auth.signUp({
        email,
        password,
      });
      if (err) {
        setError(err.message);
        throw err;
      }
      if (data.user) {
        const p = await fetchProfile(data.user.id);
        setProfile(p);
      }
      setSession(data.session);
      setUser(data.user ?? null);
    },
    [fetchProfile],
  );

  const signOut = useCallback(async () => {
    setError(null);
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
  }, []);

  useEffect(() => {
    refreshSession();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        const p = await fetchProfile(s.user.id);
        setProfile(p);
      } else {
        setProfile(null);
      }
    });
    return () => subscription.unsubscribe();
  }, [refreshSession, fetchProfile]);

  const isAdmin = profile?.role === "admin";
  const isAuthenticated = !!user;

  return {
    session,
    user,
    profile,
    loading,
    error,
    isAdmin,
    isAuthenticated,
    signIn,
    signUp,
    signOut,
    refresh: refreshSession,
  };
}
