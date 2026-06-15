"use client";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import React, { Component, ReactNode } from "react";
import { Button } from "../ui/button";

interface FeedErrorBoundaryProps {
  children: ReactNode;
}

interface FeedErrorBoundaryState {
  hasError: boolean;
}

class FeedErrorBoundary extends Component<
  FeedErrorBoundaryProps,
  FeedErrorBoundaryState
> {
  constructor(props: FeedErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    // تحديث الحالة لعرض واجهة الخطأ
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // TODO: إرسال الخطأ إلى خدمة تسجيل الأخطاء مثل Sentry أو LogRocket
    console.error("Error in Feed:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 bg-card border border-destructive/20 rounded-xl my-4 text-center">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">
            حدث خطأ في عرض المنشورات
          </h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-md leading-relaxed">
            واجهنا مشكلة غير متوقعة أثناء معالجة البيانات. لا تقلق، يمكنك
            المحاولة مرة أخرى.
          </p>
          <Button
            onClick={() => this.setState({ hasError: false })}
            variant="outline"
            className="gap-2 hover:bg-destructive hover:text-destructive-foreground transition-colors"
          >
            <RefreshCcw className="h-4 w-4" />
            <span>إعادة المحاولة</span>
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default FeedErrorBoundary;
