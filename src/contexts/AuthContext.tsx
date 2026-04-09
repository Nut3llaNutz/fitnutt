import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isGuest: boolean;
  loading: boolean;
  setIsAuthenticating: (val: boolean) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  isGuest: true,
  loading: true,
  setIsAuthenticating: () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    // Subscribe to auth state changes first so we don't miss any events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    // Then get the initial session — this is the authoritative first load
    // Setting loading=false only here avoids a race condition where
    // onAuthStateChange fires INITIAL_SESSION(null) before the real session resolves
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ 
      session, 
      user: session?.user ?? null, 
      isGuest: !loading && !session?.user,
      loading: loading || isAuthenticating, 
      setIsAuthenticating, 
      signOut 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
