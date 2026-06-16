import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();


  const authPages = ["/login", "/register", "/reset-password"];
  const isAuthPage = authPages.includes(request.nextUrl.pathname);

  //  مستخدم غير مسجل بيحاول يدخل صفحة محمية (الرئيسية، الأصدقاء، البروفايل، الخ..) -> اطرده للوجين
  if (!user && !isAuthPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  //  مستخدم مسجل بالفعل بيحاول يفتح صفحة تسجيل الدخول -> رجعه للرئيسية
  if (user && isAuthPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - الصور والملفات الثابتة
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}