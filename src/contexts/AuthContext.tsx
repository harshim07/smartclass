import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import { generateToken, verifyToken, getTokenFromStorage, setTokenToStorage, removeTokenFromStorage, isTokenExpired, refreshAccessToken } from "@/utils/jwt";

interface Profile {
  id: string;
  user_id: string;
  display_name: string;
  role: "teacher" | "student";
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  profileLoading: boolean;
  token: string | null;
  signUp: (
    email: string,
    password: string,
    displayName: string,
    role: "teacher" | "student"
  ) => Promise<{ error: any; profileError: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  isAuthenticated: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  const buildProfileDefaults = (authUser: User) => {
    const metadata = (authUser.user_metadata ?? {}) as Record<string, unknown>;
    const metadataRole = metadata.role === "teacher" ? "teacher" : metadata.role === "student" ? "student" : null;
    const role: "teacher" | "student" = metadataRole ?? "student";

    const fallbackName = authUser.email?.split("@")[0] || "User";
    const display_name =
      typeof metadata.display_name === "string" && metadata.display_name.trim().length > 0
        ? metadata.display_name
        : fallbackName;

    return { role, display_name };
  };

  // Fetch profile for a given auth user; auto-heal missing profile rows.
  const generateAndSetToken = async (authUser: User, userProfile: Profile) => {
    const tokenPayload = {
      userId: authUser.id,
      email: authUser.email || '',
      role: userProfile.role,
      displayName: userProfile.display_name,
    };
    const jwtToken = await generateToken(tokenPayload);
    setToken(jwtToken);
    setTokenToStorage(jwtToken);
  };

  const fetchProfile = async (authUser: User) => {
    setProfileLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", authUser.id)
        .maybeSingle();

      if (error) {
        // Includes network/RLS/permission errors from PostgREST
        console.error("[AuthContext] Failed to fetch profile:", {
          userId: authUser.id,
          code: error.code,
          message: error.message,
          details: error.details,
        });
        setProfile(null);
        return;
      }

      if (!data) {
        const defaults = buildProfileDefaults(authUser);
        const { data: createdProfile, error: upsertError } = await supabase
          .from("profiles")
          .upsert(
            {
              user_id: authUser.id,
              display_name: defaults.display_name,
              role: defaults.role,
            } as any,
            { onConflict: "user_id" }
          )
          .select("*")
          .single();

        if (upsertError) {
          console.error("[AuthContext] Missing profile and auto-create failed:", {
            userId: authUser.id,
            code: upsertError.code,
            message: upsertError.message,
            details: upsertError.details,
          });
          setProfile(null);
          return;
        }

        setProfile(createdProfile as unknown as Profile);
        await generateAndSetToken(authUser, createdProfile as unknown as Profile);
        return;
      }

      setProfile(data as unknown as Profile);
      await generateAndSetToken(authUser, data as unknown as Profile);
    } catch (error) {
      // Catches unexpected runtime/network failures
      console.error("[AuthContext] Unexpected profile fetch error:", error);
      setProfile(null);
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    // Initialize JWT token from storage
    const storedToken = getTokenFromStorage();
    if (storedToken) {
      if (isTokenExpired(storedToken)) {
        removeTokenFromStorage();
        setToken(null);
      } else {
        setToken(storedToken);
      }
    }

    // Listen for auth changes FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setProfile(null);
        if (session?.user) {
          // Use setTimeout to avoid Supabase deadlock
          setTimeout(() => fetchProfile(session.user), 0);
        } else {
          setProfile(null);
          setProfileLoading(false);
          setToken(null);
          removeTokenFromStorage();
        }
        setLoading(false);
      }
    );

    // Then check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setProfile(null);
      if (session?.user) {
        fetchProfile(session.user);
      } else {
        setProfileLoading(false);
        setToken(null);
        removeTokenFromStorage();
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (
    email: string,
    password: string,
    displayName: string,
    role: "teacher" | "student"
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName, role },
      },
    });

    let profileError: any = null;
    if (!error && data.user) {
      // Persist role/display name in profile with idempotent upsert.
      const { error: upsertError } = await supabase
        .from("profiles")
        .upsert(
          {
            user_id: data.user.id,
            display_name: displayName,
            role,
          } as any,
          { onConflict: "user_id" }
        );

      if (upsertError) {
        profileError = upsertError;
        console.error("[AuthContext] Failed to upsert profile during signup:", {
          userId: data.user.id,
          code: upsertError.code,
          message: upsertError.message,
          details: upsertError.details,
        });
      }
    }

    return { error, profileError };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setToken(null);
    removeTokenFromStorage();
  };

  const refreshToken = async (): Promise<boolean> => {
    if (!token) return false;
    
    const newToken = await refreshAccessToken(token);
    if (newToken) {
      setToken(newToken);
      setTokenToStorage(newToken);
      return true;
    }
    
    // Token refresh failed, sign out
    await signOut();
    return false;
  };

  const isAuthenticated = (): boolean => {
    return !!(user && session && token && !isTokenExpired(token));
  };

  return (
    <AuthContext.Provider
      value={{ 
        user, 
        session, 
        profile, 
        loading, 
        profileLoading, 
        token,
        signUp, 
        signIn, 
        signOut, 
        refreshToken, 
        isAuthenticated 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
