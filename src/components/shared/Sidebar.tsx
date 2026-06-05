"use client";

import Link from "next/link";
import {
    Users,
    Bookmark,
    History,
    UsersRound,
    Tv,
    Calendar,
    ChevronDown
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// هيكلة البيانات للاختصارات لجعل الكود أنظف (Clean Code)
const sidebarItems = [
    {
        title: "الأصدقاء",
        icon: Users,
        href: "/friends",
        iconColor: "text-blue-500",
    },
    {
        title: "المجموعات",
        icon: UsersRound,
        href: "/groups",
        iconColor: "text-blue-600",
    },
    {
        title: "العناصر المحفوظة",
        icon: Bookmark,
        href: "/saved",
        iconColor: "text-purple-500",
    },
    {
        title: "الذكريات",
        icon: History,
        href: "/memories",
        iconColor: "text-blue-400",
    },
    {
        title: "فيديو Watch",
        icon: Tv,
        href: "/watch",
        iconColor: "text-blue-500",
    },
    {
        title: "المناسبات",
        icon: Calendar,
        href: "/events",
        iconColor: "text-red-500",
    },
];

interface SidebarProps {
    user: {
        full_name: string | null;
        avatar_url: string | null;
    } | null; 
}

export default function Sidebar({user} : SidebarProps) {
    const full_name = user?.full_name
    const Author = user?.full_name || "مستخدم مجهول";
    const fallbackLetter = Author.charAt(0).toUpperCase();
    const avatar = user?.avatar_url
    return (
        <aside className="hidden lg:flex flex-col w-full max-w-[300px] h-[calc(100vh-3.5rem)] sticky top-0 overflow-y-auto px-2 bg-transparent select-none scrollbar-thin border-l">

            <Link
                href="/profile"
                className="flex items-center gap-3 px-2 w-full rounded-xl hover:bg-secondary/80 transition"
            >
                <Avatar className="h-9 w-9 border">
                    <AvatarImage src={avatar || undefined} alt={full_name || "user avatar"} />
                    <AvatarFallback className="bg-primary text-white font-bold">{fallbackLetter}</AvatarFallback>
                </Avatar>
                <span className="font-semibold text-foreground text-[15px]">{full_name}</span>
            </Link>

            <div className="space-y-0.5 mt-1">
                {sidebarItems.map((item, index) => {
                    const Icon = item.icon;
                    return (
                        <Link
                            key={index}
                            href={item.href}
                            className="flex items-center gap-3 p-3 w-full rounded-xl hover:bg-secondary/80 transition"
                        >
                            <Icon className={`h-7 w-7 ${item.iconColor}`} />
                            <span className="font-medium text-foreground text-[15px]">{item.title}</span>
                        </Link>
                    );
                })}
            </div>

            <button className="flex items-center gap-3 p-3 w-full rounded-xl hover:bg-secondary/80 transition text-left mt-0.5">
                <div className="flex items-center justify-center h-7 w-7 rounded-full bg-secondary text-foreground">
                    <ChevronDown className="h-5 w-5" />
                </div>
                <span className="font-medium text-foreground text-[15px]">عرض المزيد</span>
            </button>

            <div className="px-3 mt-4 text-xs text-muted-foreground leading-relaxed">
                <p className="hover:underline cursor-pointer inline">الخصوصية</p> ·
                <p className="hover:underline cursor-pointer inline"> الشروط</p> ·
                <p className="hover:underline cursor-pointer inline"> الإعلانات</p> ·
                <p className="hover:underline cursor-pointer inline"> ملفات تعريف الارتباط</p> ·
                <p className="mt-2">Socially © 2026</p>
            </div>

        </aside>
    );
}