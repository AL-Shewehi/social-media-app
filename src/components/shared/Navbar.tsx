"use client";

import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Search,
    Home,
    Tv,
    Users,
    MessageCircle,
    Bell,
    Menu,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavbarProps {
    user: {
        full_name: string | null;
        avatar_url: string | null;
    } | null; 
}

export default function Navbar({ user }: NavbarProps) {
    const pathname = usePathname();

    const Author = user?.full_name || "مستخدم مجهول";
    const fallbackLetter = Author.charAt(0).toUpperCase();
    const avatar = user?.avatar_url

    return (
        // الارتفاع h-auto في الموبايل عشان يلم الطبقتين، وفي الديسكتوب يرجع h-14 ثابت
        <nav className="sticky top-0 z-50 flex flex-col lg:flex-row lg:items-center justify-between bg-background border-b shadow-sm select-none w-full">

            <div className="flex items-center justify-between w-full lg:w-auto h-14 px-4 lg:flex-1 lg:justify-start gap-2">
                <Link href="/" className="text-primary text-2xl lg:text-4xl font-extrabold tracking-tight hover:opacity-90 transition">
                    Socially
                </Link>

                {/* حقل البحث للديسكتوب فقط */}
                <div className="relative hidden md:block lg:w-60">
                    <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="البحث في Socially"
                        className="w-full h-10 pr-9 bg-secondary rounded-full border-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                </div>

                {/* أزرار الموبايل العلوية (البحث والقائمة) تظهر في الشاشات الصغيرة فقط بجانب اللوجو */}
                <div className="flex items-center gap-2 lg:hidden">
                    <Button variant="secondary" size="icon" className="rounded-full h-10 w-10 bg-secondary">
                        <Search className="h-5 w-5" />
                    </Button>
                    <Button variant="secondary" size="icon" className="rounded-full h-10 w-10 bg-secondary">
                        <Menu className="h-5 w-5" />
                    </Button>
                </div>
            </div>


            <div className="flex items-center justify-around lg:justify-center w-full lg:w-auto flex-1 max-w-2xl h-12 lg:h-14 lg:gap-1">
                {[
                    { icon: Home, href: "/", label: "Home" },
                    { icon: Users, href: "/groups", label: "Groups" },
                    { icon: Tv, href: "/watch", label: "Watch" },
                ].map((item, index) => (
                    <Link
                        key={index}
                        href={item.href}
                        className={cn(
                            "flex items-center justify-center flex-1 lg:w-28 h-full border-b-2 lg:border-b-4 border-transparent transition relative",
                            "text-muted-foreground hover:bg-secondary",
                            pathname === item.href
                                ? "border-primary text-primary"
                                : "border-transparent"
                        )}
                    >
                        <item.icon className="h-6 w-6 lg:h-7 lg:w-7" />
                    </Link>
                ))}

                {/* زر الجرس يندمج في شريط التنقل في الموبايل ويتحول لليمين في الديسكتوب */}
                <Link href="/notifications" className="flex items-center justify-center flex-1 lg:hidden h-full border-b-2 border-transparent text-muted-foreground transition">
                    <Bell className="h-6 w-6" />
                </Link>
            </div>

            {/* ─── الأزرار الجانبية والبروفايل (تظهر في الديسكتوب فقط) ─── */}
            <div className="hidden lg:flex items-center gap-2 flex-1 justify-end px-4 h-14">
                <Button variant="secondary" size="icon" className="rounded-full h-10 w-10 bg-secondary hover:bg-secondary/80 transition relative">
                    <MessageCircle className="h-5 w-5" />
                </Button>

                <Button variant="secondary" size="icon" className="rounded-full h-10 w-10 bg-secondary hover:bg-secondary/80 transition">
                    <Bell className="h-5 w-5" />
                </Button>

                <Link href="/profile" className="mr-1 hover:brightness-95 transition">
                    <Avatar className="h-10 w-10 border border-border">
                        <AvatarImage src={avatar || undefined} alt={Author} />
                        <AvatarFallback className="bg-primary text-white font-bold">{fallbackLetter}</AvatarFallback>
                    </Avatar>
                </Link>
            </div>

        </nav>
    );
}