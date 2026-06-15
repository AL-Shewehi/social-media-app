"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { loginSchema } from "@/lib/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const router = useRouter();
  const { login: loginUser, isLoading, error: authError } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      const result = await loginUser(values);
      if (result) {
        toast.success("تم تسجيل الدخول بنجاح! 👋");
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      console.error("Login error:", err);
      toast.error("حدث خطأ غير متوقع أثناء تسجيل الدخول.");
    }
  };

  const isButtonDisabled = isSubmitting || isLoading;

  return (
    <Card>
      <CardHeader>
        <CardTitle>تسجيل الدخول</CardTitle>
        <CardDescription>
          يرجى إدخال بريدك الإلكتروني وكلمة المرور
        </CardDescription>
      </CardHeader>
      <CardContent>
        {authError && (
          <p className="text-sm p-3 bg-red-50 text-red-600 rounded-md text-center mb-4">
            {authError}
          </p>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Input
              {...register("email")}
              type="email"
              placeholder="البريد الإلكتروني"
              className="w-full h-12"
              disabled={isButtonDisabled}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Input
              {...register("password")}
              type="password"
              placeholder="كلمة المرور"
              className="w-full h-12"
              disabled={isButtonDisabled}
            />
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-4 mt-2 mb-8">
            <Button
              type="submit"
              size="lg"
              className="w-full h-10 gap-2 font-semibold"
              disabled={isButtonDisabled}
            >
              {isButtonDisabled ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>جاري تسجيل الدخول...</span>
                </>
              ) : (
                <span>تسجيل الدخول</span>
              )}
            </Button>
            <Link href="/reset-password" className="text-center">
              <p className="text-sm text-foreground cursor-pointer hover:underline">
                هل نسيت كلمة السر ؟
              </p>
            </Link>
          </div>
          <Button
            variant="outline"
            size="lg"
            asChild
            className="w-full h-10"
            disabled={isButtonDisabled}
          >
            <Link href="/register" className="text-center">
              تسجيل حساب جديد
            </Link>
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}