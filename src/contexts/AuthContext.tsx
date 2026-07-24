import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      console.log("==================================");
      console.log("Buscando profile...");
      console.log("User ID:", userId);

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      console.log("Resultado da consulta Profile");
      console.log("Data:", data);
      console.log("Error:", error);

      if (error) {
        console.error("Erro ao buscar profile:");
        console.error(error);
        return null;
      }

      return data as Profile;
    } catch (err) {
      console.error("Erro inesperado ao buscar profile:");
      console.error(err);
      return null;
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session: currentSession } }) => {
      console.log("Sessão inicial:");
      console.log(currentSession);

      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        const p = await fetchProfile(currentSession.user.id);
        setProfile(p);
      }

      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log("==================================");
      console.log("Evento Auth:", event);
      console.log("Nova Sessão:", newSession);

      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        const p = await fetchProfile(newSession.user.id);
        setProfile(p);
      } else {
        setProfile(null);
      }

      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log("==================================");
    console.log("Tentando login...");
    console.log("Email:", email);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    console.log("Resposta do Supabase:");
    console.log("Data:", data);
    console.log("Erro:", error);

    if (error) {
      console.error("==================================");
      console.error("LOGIN FALHOU");
      console.error("Status:", error.status);
      console.error("Código:", error.code);
      console.error("Mensagem:", error.message);
      console.error("Nome:", error.name);
      console.error(error);

      alert(`Erro ao entrar:\n\n${error.message}`);

      throw error;
    }

    console.log("==================================");
    console.log("LOGIN EFETUADO COM SUCESSO");
  };

  const signOut = async () => {
    console.log("Realizando logout...");

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error(error);
      throw error;
    }

    setUser(null);
    setProfile(null);
    setSession(null);

    console.log("Logout realizado.");
  };

  const resetPassword = async (email: string) => {
    console.log("Solicitando redefinição de senha:", email);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      console.error(error);
      throw error;
    }

    console.log("Email de redefinição enviado.");
  };

  const updatePassword = async (newPassword: string) => {
    console.log("Atualizando senha...");

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      console.error(error);
      throw error;
    }

    console.log("Senha alterada com sucesso.");
  };

  const value: AuthContextType = {
    user,
    profile,
    session,
    isLoading,
    isAuthenticated: !!user,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}