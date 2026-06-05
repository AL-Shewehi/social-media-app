import { z } from "zod";

export const loginSchema = z.object({
    email: z.string().email("البريد الالكتروني غير صحيح"),
    password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
});


export const signupSchema = z.object({
    firstName: z.string().min(2, "ما اسمك الأول ؟"),
    lastName: z.string().min(2, "ما اسمك الأخير ؟"),
    birthDate: z.string("الرجاء إدخال تاريخ ميلادك").refine((value) => {
        const birthDate = new Date(value);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        return age >= 18;
    }, "يجب أن يكون عمرك 18 عامًا على الأقل"),
    gender: z.enum(["ذكر", "أنثى"], "الرجاء إدخال جنسك"),
    email: z.string().email("البريد الالكتروني غير صحيح"),
    password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
    username: z.string().min(2, "ما اسم المستخدم الخاص بك ؟").max(10, "اسم المستخدم يجب أن لا يتجاوز 10 أحرف"),
});
