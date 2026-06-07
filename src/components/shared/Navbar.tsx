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
  Loader2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { Profile } from "@/types/database.types";
import { useUIStore } from "@/store/useUIStore";
import { useDebounce } from "@/hooks/useDebounce";
import { searchProfilesAction } from "@/features/search/actions";
import { useState, useEffect, useRef } from "react";

interface NavbarProps {
  user: Profile | null;
}

export default function Navbar({ user }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const toggleMobileSidebar = useUIStore((state) => state.toggleMobileSidebar);

  // ─── States إدارة البحث ───
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const debouncedQuery = useDebounce(searchQuery, 300);
  const searchRef = useRef<HTMLDivElement>(null);

  const Author = user?.full_name || "مستخدم مجهول";
  const fallbackLetter = Author.charAt(0).toUpperCase();
  const avatar = user?.avatar_url;

  // ─── مراقبة الـ Debounced Query وتشغيل الأكشن ───
  useEffect(() => {
    const fetchResults = async () => {
      if (debouncedQuery.trim().length < 2) {
        setSearchResults([]);
        setIsDropdownOpen(false);
        return;
      }

      setIsSearching(true);
      const result = await searchProfilesAction(debouncedQuery);
      setIsSearching(false);

      if (result.success) {
        setSearchResults(result.data);
        setIsDropdownOpen(true);
      }
    };

    fetchResults();
  }, [debouncedQuery]);

  // قفل القائمة المنسدلة لو اليوزر ضغط في أي مكان بره صندوق البحث
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleUserClick = (userId: string) => {
    setIsDropdownOpen(false);
    setSearchQuery("");
    router.push(`/profile/${userId}`);
  };

  return (
    <nav className="sticky top-0 z-50 flex flex-col lg:flex-row lg:items-center justify-between bg-background border-b shadow-sm select-none w-full">
      <div className="flex items-center justify-between w-full lg:w-auto h-14 px-4 lg:flex-1 lg:justify-start gap-2">
        <Link
          href="/"
          className="text-primary text-2xl lg:text-4xl font-extrabold tracking-tight hover:opacity-90 transition"
        >
          Socially
        </Link>

        <div ref={searchRef} className="relative hidden md:block lg:w-64">
          <div className="relative">
            {isSearching ? (
              <Loader2 className="absolute right-3 top-3 h-4 w-4 text-primary animate-spin" />
            ) : (
              <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
            )}
            <Input
              type="text"
              placeholder="البحث في Socially"
              value={searchQuery}
              onFocus={() =>
                searchQuery.trim().length >= 2 && setIsDropdownOpen(true)
              }
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pr-9 bg-secondary rounded-full border-none focus-visible:ring-1 focus-visible:ring-ring text-sm"
              dir="auto"
            />
          </div>

          {/* قائمة نتائج البحث الطائرة */}
          {isDropdownOpen && (
            <div className="absolute top-12 right-0 w-full bg-card border rounded-xl shadow-xl overflow-hidden z-50 p-1 animate-in fade-in slide-in-from-top-1 duration-200">
              {searchResults.length > 0 ? (
                <div className="space-y-0.5">
                  <p className="text-[11px] font-medium text-muted-foreground px-3 py-1.5 border-b border-border/40 text-right">
                    نتائج البحث
                  </p>
                  {searchResults.map((profile) => (
                    <div
                      key={profile.id}
                      onClick={() => handleUserClick(profile.id)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary transition cursor-pointer text-right w-full"
                    >
                      <Avatar className="h-8 w-8 border">
                        <AvatarImage src={profile.avatar_url ?? undefined} />
                        <AvatarFallback className="bg-primary text-white text-xs font-bold">
                          {profile.full_name?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium text-foreground line-clamp-1">
                        {profile.full_name}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-sm text-muted-foreground">
                  لا توجد نتائج مطابقة لـ "{searchQuery}"
                </div>
              )}
            </div>
          )}
        </div>

        {/* أزرار الموبايل العلوية */}
        <div className="flex items-center gap-2 lg:hidden">
          <Button
            variant="secondary"
            size="icon"
            className="rounded-full h-10 w-10 bg-secondary"
          >
            <Search className="h-5 w-5" />
          </Button>
          <Button
            onClick={toggleMobileSidebar}
            variant="secondary"
            size="icon"
            className="rounded-full h-10 w-10 bg-secondary"
          >
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
                : "border-transparent",
            )}
          >
            <item.icon className="h-6 w-6 lg:h-7 lg:w-7" />
          </Link>
        ))}

        <Link
          href="/notifications"
          className="flex items-center justify-center flex-1 lg:hidden h-full border-b-2 border-transparent text-muted-foreground transition"
        >
          <Bell className="h-6 w-6" />
        </Link>
      </div>

      <div className="hidden lg:flex items-center gap-2 flex-1 justify-end px-4 h-14">
        <Button
          variant="secondary"
          size="icon"
          className="rounded-full h-10 w-10 bg-secondary hover:bg-secondary/80 transition relative"
        >
          <MessageCircle className="h-5 w-5" />
        </Button>

        <Button
          variant="secondary"
          size="icon"
          className="rounded-full h-10 w-10 bg-secondary hover:bg-secondary/80 transition"
        >
          <Bell className="h-5 w-5" />
        </Button>

        <Link
          href={`/profile/${user?.id}`}
          className="mr-1 hover:brightness-95 transition"
        >
          <Avatar className="h-10 w-10 border border-border">
            <AvatarImage src={avatar || undefined} alt={Author} />
            <AvatarFallback className="bg-primary text-white font-bold">
              {fallbackLetter}
            </AvatarFallback>
          </Avatar>
        </Link>
      </div>
    </nav>
  );
}
