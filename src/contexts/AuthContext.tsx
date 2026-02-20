import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UserProfile {
  id: string;
  phone: string;
  full_name: string | null;
}

interface AuthContextType {
  user: any | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isNewUser: boolean;
  setIsNewUser: (v: boolean) => void;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  setSessionFromOTP: (session: { access_token: string; refresh_token: string | null }) => Promise<void>;
  updateProfileName: (fullName: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("id, phone, full_name")
      .eq("id", userId)
      .maybeSingle();
    if (data) setProfile(data as UserProfile);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user?.id) await fetchProfile(user.id);
  }, [user, fetchProfile]);

  const updateProfileName = useCallback(async (fullName: string) => {
    if (!user?.id) return;
    await supabase.from("profiles").update({ full_name: fullName }).eq("id", user.id);
    setProfile(prev => prev ? { ...prev, full_name: fullName } : prev);
  }, [user]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setIsNewUser(false);
  }, []);

  const setSessionFromOTP = useCallback(async (session: { access_token: string; refresh_token: string | null }) => {
    const { data, error } = await supabase.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token ?? "",
    });
    if (error) {
      console.error("Set session error:", error);
      return;
    }
    if (data.user) {
      setUser(data.user);
      await fetchProfile(data.user.id);
    }
  }, [fetchProfile]);

  useEffect(() => {
    // Set up auth listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        // Use setTimeout to avoid Supabase deadlock
        setTimeout(() => fetchProfile(session.user.id), 0);
      } else {
        setUser(null);
        setProfile(null);
      }
      setIsLoading(false);
    });

    // Then check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        fetchProfile(session.user.id);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      isAuthenticated: !!user,
      isLoading,
      isNewUser,
      setIsNewUser,
      signOut,
      refreshProfile,
      setSessionFromOTP,
      updateProfileName,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
