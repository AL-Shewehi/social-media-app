"use client";

import { useState, useCallback } from "react";
import { loginUser, registerUser } from "../actions";

export function useAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async <T,>(action: () => Promise<T | null>): Promise<T | null> => {
    setIsLoading(true);
    setError(null);
    const result = await action();
    if (result && typeof result === "object" && "error" in result) {
      setError((result as { error: string }).error);
      setIsLoading(false);
      return null;
    }
    setIsLoading(false);
    return result as T;
  }, []);

  const login = (values: { email: string; password: string }) =>
    execute(() => loginUser(values)) as Promise<{ success: true } | null>;

  const register = (values: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    birthDate: string;
    gender: string;
  }) => execute(() => registerUser(values)) as Promise<{ success: true } | null>;

  const signOut = async () => {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    await supabase.auth.signOut();
  };

  return { login, register, signOut, isLoading, error };
}
