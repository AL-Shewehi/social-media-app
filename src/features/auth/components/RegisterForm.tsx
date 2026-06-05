"use client";
import { Controller, useForm } from "react-hook-form";
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
import { signupSchema } from "@/lib/zod";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { useAuth } from "../hooks/useAuth";

// هنا هنستخدم Zod عشان نضمن ان الداتا اللي داخلة صحيحة
export type RegisterFormValues = z.infer<typeof signupSchema>;

export default function RegisterForm() {
  const router = useRouter();
  const { register: registerUser, isLoading, error: authError } = useAuth();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (values: RegisterFormValues) => {
    const result = await registerUser(values);
    if (result) {
      router.push("/login");
    }
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle>إنشاء حساب</CardTitle>
        <CardDescription>
          يمكنك إنشاء حساب للتواصل مع الأصدقاء والعائلة والمجتمعات التي تضم
          أشخاصًا يشاركونك نفس الاهتمامات.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {authError && (
            <p className="text-sm p-3 bg-red-50 text-red-600 rounded-md text-center mb-4">
              {authError}
            </p>
          )}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Input
                {...register("firstName")}
                type="text"
                placeholder="الاسم الأول"
                className="w-full h-12"
              />
              {errors.firstName && (
                <p className="text-sm text-red-500">
                  {errors.firstName.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Input
                {...register("lastName")}
                type="text"
                placeholder="الاسم الأخير"
                className="w-full h-12"
              />
              {errors.lastName && (
                <p className="text-sm text-red-500">
                  {errors.lastName.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Input
              {...register("birthDate")}
              type="date"
              placeholder="تاريخ الميلاد"
              className="w-full h-12"
            />
            {errors.birthDate && (
              <p className="text-sm text-red-500">{errors.birthDate.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Controller
              control={control}
              name="gender"
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value}
                >
                  <SelectTrigger
                    className="w-full h-12"
                    dir="rtl"
                    style={{ textAlign: "right", height: "48px" }}
                  >
                    <SelectValue placeholder="الجنس" />
                  </SelectTrigger>
                  <SelectContent dir="rtl">
                    <SelectItem value="male">ذكر</SelectItem>
                    <SelectItem value="female">أنثى</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.gender && (
              <p className="text-sm text-red-500">{errors.gender.message}</p>
            )}
          </div>

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
          <Button
            type="submit"
            rounded="full"
            size="lg"
            disabled={isSubmitting}
            className="w-full h-10"
          >
            {isSubmitting ? "جاري إنشاء الحساب..." : "إنشاء حساب"}
          </Button>
          <Button
            variant="outline"
            rounded="full"
            size="lg"
            asChild
            className="w-full h-10"
          >
            <Link href="/login" className="text-center">
              لدي حساب بالفعل
            </Link>
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
