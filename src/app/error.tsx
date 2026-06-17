"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.error("Local Error Caught:", error);
    }
        Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center h-[85vh] p-4 text-center" dir="rtl">
      <div className="w-24 h-24 bg-secondary rounded-full flex items-center justify-center mb-6">
        <AlertTriangle className="w-10 h-10 text-muted-foreground" />
      </div>

      <h2 className="text-2xl font-bold text-foreground mb-3">
        عفواً، حدث خطأ غير متوقع!
      </h2>
      
      <p className="text-muted-foreground max-w-sm mb-8">
        يبدو أن هناك مشكلة تقنية حدثت أثناء معالجة طلبك. لا تقلق، لقد قمنا بتسجيل الخطأ وجاري العمل على إصلاحه.
      </p>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Button onClick={() => reset()} className="w-full">
          حاول مرة أخرى
        </Button>
        <Button variant="secondary" asChild className="w-full">
          <Link href="/">العودة للموجز</Link>
        </Button>
      </div>
    </div>
  );
}