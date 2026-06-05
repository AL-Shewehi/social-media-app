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

// هنا هنستخدم Zod عشان نضمن ان الداتا اللي داخلة صحيحة
export type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (values: LoginFormValues) => {
    console.log(values);
    // TODO: handle login with supabase
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle>تسجيل الدخول</CardTitle>
        <CardDescription>
          يرجى إدخال بريدك الإلكتروني وكلمة المرور
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Input
              {...register("email")}
              type="email"
              placeholder="البريد الإلكتروني"
              className="w-full h-12"
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
            />
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-4 mt-2 mb-8">
            <Button
              type="submit"
              rounded="full"
              size="lg"
              className="w-full h-10"
              disabled={isSubmitting}
            >
              {isSubmitting ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
            </Button>
            <Link href="/reset-password" className="text-center">
              <p className="text-sm text-foreground cursor-pointer">
                هل نسيت كلمة السر ؟
              </p>
            </Link>
          </div>
          <Button
            variant="outline"
            rounded="full"
            size="lg"
            asChild
            className="w-full h-10"
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
