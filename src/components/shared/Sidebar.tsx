"use client";

import Link from "next/link";
import {
    Users,
    Bookmark,
    History,
    UsersRound,
    Tv,
    Calendar,
    ChevronDown,
    X
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Profile } from "@/types/database.types";
import { useUIStore } from "@/store/useUIStore";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const sidebarItems = [
    { title: "الأصدقاء", icon: Users, href: "/friends", iconColor: "text-blue-500" },
    { title: "المجموعات", icon: UsersRound, href: "/groups", iconColor: "text-blue-600" },
    { title: "العناصر المحفوظة", icon: Bookmark, href: "/saved", iconColor: "text-purple-500" },
    { title: "الذكريات", icon: History, href: "/memories", iconColor: "text-blue-400" },
    { title: "فيديو Watch", icon: Tv, href: "/watch", iconColor: "text-blue-500" },
    { title: "المناسبات", icon: Calendar, href: "/events", iconColor: "text-red-500" },
];

interface SidebarProps {
    user: Profile | null; 
}

export default function Sidebar({ user }: SidebarProps) {
    const isMobileOpen = useUIStore((state) => state.isMobileSidebarOpen);
    const setMobileSidebarOpen = useUIStore((state) => state.setMobileSidebarOpen);

    const fullName = user?.full_name || "مستخدم مجهول";
    const fallbackLetter = fullName.charAt(0).toUpperCase() || "?";
    const avatar = user?.avatar_url;

    //  تحديد الرابط بشكل آمن لحماية الواجهة من الـ undefined
    const profileHref = user?.id ? `/profile/${user.id}` : "#";

    return (
        <>
            {isMobileOpen && (
                <div 
                    onClick={() => setMobileSidebarOpen(false)}
                    className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden transition-opacity duration-300"
                />
            )}

            <aside className={cn(
                "hidden lg:flex flex-col w-full md:max-w-75 h-[calc(100vh-5rem)] sticky top-14 self-start overflow-y-auto px-2 bg-background select-none scrollbar-thin py-2",
                
                // كلاسات الموبايل (تحويله لـ Drawer متحرك يظهر من اليمين بناءً على الـ Store)
                "fixed top-0 right-0 z-50 h-full w-full md:w-72 bg-background  shadow-2xl transition-transform duration-300 ease-in-out lg:sticky lg:top-14 lg:z-0 lg:h-[calc(100vh-5rem)] lg:w-full lg:shadow-none p-4 lg:p-2",
                isMobileOpen ? "translate-x-0 flex" : "translate-x-full lg:translate-x-0"
            )}>

                {/* زر القفل في الموبايل */}
                <div className="flex items-center justify-between lg:hidden mb-4 pb-2 border-b">
                    <span className="font-bold text-lg text-primary">القائمة</span>
                    <Button
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setMobileSidebarOpen(false)}
                        className="rounded-full h-8 w-8 text-muted-foreground"
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {/* البروفايل الشخصي */}
                <Link
                    href={profileHref}
                    onClick={(e) => {
                        // لو الرابط وهمي نمنع التوجيه، ولو حقيقي نقفل المنيو بتاعت الموبايل
                        if (profileHref === "#") {
                            e.preventDefault();
                        } else {
                            setMobileSidebarOpen(false);
                        }
                    }}
                    className="flex items-center gap-3 px-2 py-1.5 w-full rounded-xl hover:bg-secondary/80 transition"
                >
                    <Avatar className="h-9 w-9 border">
                        <AvatarImage src={avatar || undefined} alt={fullName || "الصورة الشخصية للمستخدم"} />
                        <AvatarFallback className="bg-primary text-white font-bold">{fallbackLetter}</AvatarFallback>
                    </Avatar>
                    <span className="font-semibold text-foreground text-[15px]">{fullName}</span>
                </Link>

                {/* عناصر القائمة */}
                <div className="space-y-0.5 mt-1">
                    {sidebarItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setMobileSidebarOpen(false)}
                                className="flex items-center gap-3 p-3 w-full rounded-xl hover:bg-secondary/80 transition"
                            >
                                <Icon className={`h-6 w-6 lg:h-7 lg:w-7 ${item.iconColor}`} />
                                <span className="font-medium text-foreground text-[15px]">{item.title}</span>
                            </Link>
                        );
                    })}
                </div>

                {/* زر عرض المزيد */}
                <button className="flex items-center gap-3 p-3 w-full rounded-xl hover:bg-secondary/80 transition mt-0.5 text-right">
                    <div className="flex items-center justify-center h-7 w-7 rounded-full bg-secondary text-foreground">
                        <ChevronDown className="h-5 w-5" />
                    </div>
                    <span className="font-medium text-foreground text-[15px]">عرض المزيد</span>
                </button>

                {/* الروابط الفرعية والحقوق */}
                <div className="px-3 mt-auto lg:mt-4 text-xs text-muted-foreground leading-relaxed pb-4 lg:pb-0">
                    <p className="hover:underline cursor-pointer inline">الخصوصية</p> ·
                    <p className="hover:underline cursor-pointer inline"> الشروط</p> ·
                    <p className="hover:underline cursor-pointer inline"> الإعلانات</p> ·
                    <p className="hover:underline cursor-pointer inline"> ملفات تعريف الارتباط</p> ·
                    <p className="mt-2">Socially © 2026</p>
                </div>

            </aside>
        </>
    );
}