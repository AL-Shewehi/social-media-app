"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCcw, Home } from "lucide-react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // TODO: إرسال الخطأ إلى خدمة تسجيل الأخطاء مثل Sentry أو LogRocket
    console.error("Global Error Caught:", error);
  }, [error]);

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 text-center space-y-6 select-none" dir="rtl">
      <div className="p-5 bg-destructive/10 rounded-full animate-pulse">
        <AlertTriangle className="h-16 w-16 text-destructive" />
      </div>
      
      <div className="space-y-2">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground">
          عفواً، حدث خطأ غير متوقع!
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto text-[15px] leading-relaxed">
          يبدو أن هناك مشكلة تقنية حدثت أثناء معالجة طلبك. لا تقلق، لقد قمنا بتسجيل الخطأ وجاري العمل على إصلاحه.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3 pt-4">
        <Button onClick={() => reset()} size="lg" className="gap-2 w-full sm:w-auto font-medium">
          <RefreshCcw className="h-4 w-4" />
          <span>حاول مرة أخرى</span>
        </Button>
        
        <Button variant="outline" size="lg" asChild className="gap-2 w-full sm:w-auto font-medium">
          <Link href="/">
            <Home className="h-4 w-4" />
            <span>العودة للرئيسية</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}