import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import ReactQueryProvider from "@/lib/react-query";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import GlobalPostModal from "@/features/feed/components/GlobalPostModal";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Socially",
  description: "تواصل مع الأصدقاء والعالم من حولك.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      className={cn("font-sans", geist.variable)}
      suppressHydrationWarning
    >
      <body dir="rtl">
        <ReactQueryProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem={true}
            disableTransitionOnChange
          >
            {children}
            <Toaster />
            <GlobalPostModal />
          </ThemeProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}