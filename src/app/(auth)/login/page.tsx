import LoginForm from "@/features/auth/components/LoginForm";
import AuthLayout from "@/features/auth/components/AuthLayout";

export default function LoginPage() {
  return (
    <AuthLayout>
      <LoginForm />
    </AuthLayout>
  );
}