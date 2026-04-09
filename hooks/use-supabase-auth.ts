import { supabase } from "@/lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Session, User } from "@supabase/supabase-js";
import { useCallback, useEffect, useRef, useState } from "react";

export type AdminProfile = {
  id: string;
  email: string | null;
  name: string | null;
  role: "admin" | "user";
};

const AUTH_SNAPSHOT_KEY = "supabase_auth_snapshot_v1";

type CachedAuthSnapshot = {
  user: {
    id: string;
    email: string | null;
    user_metadata?: User["user_metadata"];
  } | null;
  profile: AdminProfile | null;
};

function withTimeout<T>(
  promise: PromiseLike<T>,
  ms: number,
  label: string,
): Promise<T> {
  let t: ReturnType<typeof setTimeout> | null = null;
  const timeout = new Promise<never>((_, reject) => {
    t = setTimeout(() => reject(new Error(`Timeout (${label})`)), ms);
  });
  return Promise.race([Promise.resolve(promise), timeout]).finally(() => {
    if (t) clearTimeout(t);
  }) as Promise<T>;
}

export function useSupabaseAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hydratedProfileUserIdRef = useRef<string | null>(null);

  const persistSnapshot = useCallback(
    async (nextUser: User | null, nextProfile: AdminProfile | null) => {
      const payload: CachedAuthSnapshot = {
        user: nextUser
          ? {
              id: nextUser.id,
              email: nextUser.email ?? null,
              user_metadata: nextUser.user_metadata,
            }
          : null,
        profile: nextProfile,
      };
      try {
        await AsyncStorage.setItem(AUTH_SNAPSHOT_KEY, JSON.stringify(payload));
      } catch (e) {
        console.warn("[useSupabaseAuth] persistSnapshot:", e);
      }
    },
    [],
  );

  const clearSnapshot = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(AUTH_SNAPSHOT_KEY);
    } catch (e) {
      console.warn("[useSupabaseAuth] clearSnapshot:", e);
    }
  }, []);

  const restoreSnapshot = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(AUTH_SNAPSHOT_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as CachedAuthSnapshot;
    } catch (e) {
      console.warn("[useSupabaseAuth] restoreSnapshot:", e);
      return null;
    }
  }, []);

  const fetchProfile = useCallback(
    async (
      userId: string,
      userMetadata?: { display_name?: string; full_name?: string },
    ) => {
      const { data, error: err } = await withTimeout(
        supabase
          .from("admin_profiles")
          .select("id, email, name, role")
          .eq("id", userId)
          .single(),
        3500,
        "cargar perfil admin",
      );

      if (err) {
        const fallback = await withTimeout(
          supabase
            .from("admin_profiles")
            .select("id, email, role")
            .eq("id", userId)
            .single(),
          3500,
          "cargar perfil admin fallback",
        );
        if (fallback.error) {
          console.warn("[useSupabaseAuth] profile fetch:", err);
          return null;
        }
        return {
          ...fallback.data,
          name: userMetadata?.display_name ?? userMetadata?.full_name ?? null,
        } as AdminProfile;
      }

      return data as AdminProfile;
    },
    [],
  );

  const hydrateProfile = useCallback(
    async (nextUser: User) => {
      try {
        const nextProfile = await fetchProfile(nextUser.id, nextUser.user_metadata);
        setProfile((current) =>
          user?.id && user.id !== nextUser.id ? current : nextProfile,
        );
        hydratedProfileUserIdRef.current = nextUser.id;
        void persistSnapshot(nextUser, nextProfile);
        return nextProfile;
      } catch (e) {
        console.warn("[useSupabaseAuth] hydrateProfile:", e);
        hydratedProfileUserIdRef.current = nextUser.id;
        return null;
      }
    },
    [fetchProfile, persistSnapshot, user?.id],
  );

  const refreshSession = useCallback(
    async (options?: { showLoading?: boolean }) => {
      const showLoading = options?.showLoading ?? true;
      if (showLoading) setLoading(true);
      setError(null);

      try {
        const {
          data: { session: nextSession },
          error: err,
        } = await withTimeout(supabase.auth.getSession(), 2500, "cargar sesión");

        if (err) throw err;

        setSession(nextSession);
        setUser(nextSession?.user ?? null);

        if (nextSession?.user) {
          if (showLoading) {
            const nextProfile = await fetchProfile(
              nextSession.user.id,
              nextSession.user.user_metadata,
            );
            setProfile(nextProfile);
            hydratedProfileUserIdRef.current = nextSession.user.id;
            void persistSnapshot(nextSession.user, nextProfile);
          } else {
            if (hydratedProfileUserIdRef.current !== nextSession.user.id) {
              void hydrateProfile(nextSession.user);
            }
          }
        } else {
          setProfile(null);
          hydratedProfileUserIdRef.current = null;
          void clearSnapshot();
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al cargar sesión");
        setSession(null);
        setUser(null);
        setProfile(null);
        hydratedProfileUserIdRef.current = null;
        void clearSnapshot();
      } finally {
        setLoading(false);
      }
    },
    [clearSnapshot, fetchProfile, hydrateProfile, persistSnapshot],
  );

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
        const nextProfile = await fetchProfile(data.user.id, data.user.user_metadata);
        setProfile(nextProfile);
        hydratedProfileUserIdRef.current = data.user.id;
        void persistSnapshot(data.user, nextProfile);
      }
      setSession(data.session);
      setUser(data.user ?? null);
      setLoading(false);
    },
    [fetchProfile, persistSnapshot],
  );

  const signUp = useCallback(
    async (email: string, password: string, name: string) => {
      setError(null);
      const { data, error: err } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: name.trim() || undefined,
            full_name: name.trim() || undefined,
          },
        },
      });
      if (err) {
        setError(err.message);
        throw err;
      }
      if (data.user) {
        const userId = data.user.id;
        const nameVal = name.trim() || null;
        const updateAdmin = await supabase
          .from("admin_profiles")
          .update({ name: nameVal })
          .eq("id", userId);
        if (updateAdmin.error) {
          console.warn(
            "[useSupabaseAuth] admin_profiles update (name):",
            updateAdmin.error,
          );
        }
        const upsertProfile = await supabase.from("user_profiles").upsert(
          {
            user_id: userId,
            name: nameVal,
            email: email.trim() || null,
          },
          { onConflict: "user_id" },
        );
        if (upsertProfile.error) {
          console.warn("[useSupabaseAuth] user_profiles upsert:", upsertProfile.error);
        }
        const nextProfile = await fetchProfile(userId, data.user.user_metadata);
        setProfile(nextProfile);
        hydratedProfileUserIdRef.current = userId;
        void persistSnapshot(data.user, nextProfile);
      }
      setSession(data.session);
      setUser(data.user ?? null);
      setLoading(false);
    },
    [fetchProfile, persistSnapshot],
  );

  const signOut = useCallback(async () => {
    setError(null);
    try {
      await withTimeout(
        supabase.auth.signOut({ scope: "local" }),
        2500,
        "cerrar sesión",
      );
    } catch (e) {
      console.warn("[useSupabaseAuth] signOut:", e);
    } finally {
      setSession(null);
      setUser(null);
      setProfile(null);
      hydratedProfileUserIdRef.current = null;
      setLoading(false);
      await clearSnapshot();
    }
  }, [clearSnapshot]);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      const snapshot = await restoreSnapshot();
      if (cancelled) return;

      if (snapshot?.user) {
        setUser(snapshot.user as User);
        setProfile(snapshot.profile);
        setLoading(false);
        void refreshSession({ showLoading: false });
        return;
      }

      void refreshSession({ showLoading: true });
    };

    void bootstrap();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      if (nextSession?.user) {
        if (hydratedProfileUserIdRef.current !== nextSession.user.id) {
          void hydrateProfile(nextSession.user);
        }
      } else {
        setProfile(null);
        hydratedProfileUserIdRef.current = null;
        void clearSnapshot();
      }
      setLoading(false);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [clearSnapshot, hydrateProfile, refreshSession, restoreSnapshot]);

  useEffect(() => {
    if (!loading) return;
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 2500);
    return () => clearTimeout(timeout);
  }, [loading]);

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
