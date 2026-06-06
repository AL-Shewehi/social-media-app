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
import { Button } from "../ui/button";

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
    const fallbackLetter = fullName.charAt(0).toUpperCase();
    const avatar = user?.avatar_url;

    return (
        <>
            {isMobileOpen && (
                <div 
                    onClick={() => setMobileSidebarOpen(false)}
                    className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden transition-opacity duration-300"
                />
            )}

            <aside className={cn(
                // كلاسات الديسكتوب الافتراضية (ثابت ومستقر في الجنب الأيمن)
                "hidden lg:flex flex-col w-full max-w-[300px] h-[calc(100vh-3.5rem)] sticky top-14 overflow-y-auto px-2 bg-transparent select-none scrollbar-thin border-l py-2",
                
                // كلاسات الموبايل (تحويله لـ Drawer متحرك يظهر من اليمين بناءً على الـ Store)
                "fixed top-0 right-0 z-50 h-full w-[280px] bg-card border-l shadow-2xl transition-transform duration-300 ease-in-out lg:relative lg:top-0 lg:z-0 lg:h-[calc(100vh-3.5rem)] lg:w-full lg:shadow-none p-4 lg:p-2",
                isMobileOpen ? "translate-x-0 flex" : "translate-x-full lg:translate-x-0"
            )}>

                {/* زر القفل في الموبايل (يظهر أعلى الـ Sidebar في الشاشات الصغيرة فقط) */}
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
                    href="/profile"
                    onClick={() => setMobileSidebarOpen(false)}
                    className="flex items-center gap-3 px-2 py-1.5 w-full rounded-xl hover:bg-secondary/80 transition"
                >
                    <Avatar className="h-9 w-9 border">
                        <AvatarImage src={avatar || undefined} alt={fullName} />
                        <AvatarFallback className="bg-primary text-white font-bold">{fallbackLetter}</AvatarFallback>
                    </Avatar>
                    <span className="font-semibold text-foreground text-[15px]">{fullName}</span>
                </Link>

                {/* عناصر القائمة */}
                <div className="space-y-0.5 mt-1">
                    {sidebarItems.map((item, index) => {
                        const Icon = item.icon;
                        return (
                            <Link
                                key={index}
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