"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { ThemeProvider as NextThemesProvider } from "next-themes";

const GlobalPostModal = dynamic(
  () => import("@/features/feed/components/GlobalPostModal"),
  { ssr: false },
);

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <NextThemesProvider {...props}>
      {children}
      {mounted && <GlobalPostModal />}
    </NextThemesProvider>
  );
}
