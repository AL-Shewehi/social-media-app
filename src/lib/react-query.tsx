"use client";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export default function ReactQueryProvider({ children }: { children: React.ReactNode }) {
  // بنستخدم useState عشان نضمن إن الـ QueryClient ميتعملوش Re-initialize مع كل ريندر
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // البيانات تفضل "طازجة" لمدة دقيقة قبل ما يحاول يعمل Fetch تاني
            refetchOnWindowFocus: false, // عشان نقلل استهلاك الـ API بدون داعي
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}