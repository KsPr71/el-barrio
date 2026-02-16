import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

const GUEST_PROFILE_ID_KEY = "guest_profile_id";

export type ProfileData = {
  name: string;
  email: string;
  province: string;
  municipality: string;
};

async function getOrCreateGuestId(): Promise<string> {
  let id = await AsyncStorage.getItem(GUEST_PROFILE_ID_KEY);
  if (!id) {
    id = `guest_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    await AsyncStorage.setItem(GUEST_PROFILE_ID_KEY, id);
  }
  return id;
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData>({
    name: "",
    email: "",
    province: "",
    municipality: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userId = user?.openId ?? user?.id?.toString() ?? null;

  const fetchProfile = useCallback(async () => {
    let id: string;
    if (userId) {
      id = userId;
    } else {
      id = await getOrCreateGuestId();
    }

    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from("user_profiles")
        .select("name, email, province, municipality")
        .eq("user_id", id)
        .maybeSingle();

      if (err) throw err;
      if (data) {
        setProfile({
          name: data.name ?? "",
          email: data.email ?? "",
          province: data.province ?? "",
          municipality: data.municipality ?? "",
        });
      } else if (user) {
        setProfile({
          name: user.name ?? "",
          email: user.email ?? "",
          province: "",
          municipality: "",
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar el perfil");
    } finally {
      setLoading(false);
    }
  }, [userId, user?.name, user?.email]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const saveProfile = useCallback(
    async (data: ProfileData) => {
      let id: string;
      if (userId) {
        id = userId;
      } else {
        id = await getOrCreateGuestId();
      }

      setSaving(true);
      setError(null);
      try {
        const { error: err } = await supabase.from("user_profiles").upsert(
          {
            user_id: id,
            name: data.name || null,
            email: data.email || null,
            province: data.province || null,
            municipality: data.municipality || null,
          },
          { onConflict: "user_id" }
        );
        if (err) throw err;
        setProfile(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al guardar");
        throw e;
      } finally {
        setSaving(false);
      }
    },
    [userId]
  );

  return { profile, loading, saving, error, saveProfile, refresh: fetchProfile };
}
