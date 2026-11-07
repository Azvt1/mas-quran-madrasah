import type { Session } from '@supabase/supabase-js';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createContext, use, useEffect, useState, type PropsWithChildren } from 'react';

import { supabase } from '@/lib/supabase';

export type UserRole = 'admin' | 'teacher' | 'student';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
}

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  /** True until we know whether someone is signed in (and their role). */
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function useAuth(): AuthState {
  const value = use(AuthContext);
  if (!value) throw new Error('useAuth must be used inside <AuthProvider />');
  return value;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);

  useEffect(() => {
    // Restores the session saved on the device, so returning users skip login.
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setSessionLoaded(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => sub.subscription.unsubscribe();
  }, []);

  const userId = session?.user.id;
  const profileQuery = useQuery({
    queryKey: ['profile', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, role, full_name')
        .eq('id', userId!)
        .single();
      if (error) throw error;
      return data as Profile;
    },
  });

  const value: AuthState = {
    session,
    profile: profileQuery.data ?? null,
    isLoading: !sessionLoaded || (!!userId && profileQuery.isPending),
    async signIn(email, password) {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      return error ? { error: 'Invalid email or password.' } : {};
    },
    async signOut() {
      await supabase.auth.signOut();
      // Don't leave one user's cached data around for the next person.
      queryClient.clear();
    },
  };

  return <AuthContext value={value}>{children}</AuthContext>;
}
