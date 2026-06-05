import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import ReactQueryProvider from "@/lib/react-query";

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: "Social Media App",
  description: "A social media application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <ReactQueryProvider>
        <body dir="rtl">{children}</body>
      </ReactQueryProvider>
    </html>
  );
}
