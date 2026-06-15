import RegisterForm from "@/features/auth/components/RegisterForm";
import AuthLayout from "@/features/auth/components/AuthLayout";

export default function RegisterPage() {
  return (
    <AuthLayout>
      <RegisterForm />
    </AuthLayout>
  );
}