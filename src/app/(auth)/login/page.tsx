import LoginForm from "@/features/auth/components/LoginForm";
import Image from "next/image";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="flex-1 items-center justify-center hidden md:flex">
        <Image src={"/assets/login.png"} alt="Login" width={500} height={500} />
      </div>

      {/* Divider */}
      <div className="w-0.5 min-h-screen bg-muted-foreground/15 mx-8 rounded-full hidden md:block"></div>

      <div className="flex-1 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-primary mb-2">Social Media App</h1>
          <p className="text-foreground">تواصل مع الأصدقاء والعالم من حولك.</p>
        </div>
        
        <LoginForm />
      </div>
    </div>
  );
}