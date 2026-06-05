"use client";

import { useState } from "react";
import { loginUser, registerUser } from "../actions";

export function useAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (values: { email: string; password: string }) => {
    setIsLoading(true);
    setError(null);

    const result = await loginUser(values);
    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
      return null;
    }

    setIsLoading(false);
    return { success: true as const };
  };

  const register = async (values: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    birthDate: string;
    gender: string;
  }) => {
    setIsLoading(true);
    setError(null);

    const result = await registerUser(values);
    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
      return null;
    }

    setIsLoading(false);
    return { success: true as const };
  };

  return { login, register, isLoading, error };
}
