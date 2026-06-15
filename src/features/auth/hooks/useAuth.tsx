"use client";

import { useState, useCallback } from "react";
import { loginUser, registerUser } from "@/features/auth/actions";
import { createClient } from "@/lib/supabase/client"; 

export function useAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async <T extends { success?: boolean; error?: string } | null>(
    action: () => Promise<T>
  ) => {
    setIsLoading(true);
    setError(null);
    
    const result = await action();
    
    if (!result || result.success === false) {
      setError(result?.error || "حدث خطأ غير متوقع");
      setIsLoading(false);
      return null;
    }
    
    setIsLoading(false);
    return result; 
  }, []);

  const login = (values: { email: string; password: string }) =>
    execute(() => loginUser(values));

  const register = (values: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    birthDate: string;
    gender: string;
  }) => execute(() => registerUser(values));

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    
    window.location.href = "/login";
  };

  return { login, register, signOut, isLoading, error };
}