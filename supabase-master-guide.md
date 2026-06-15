# دليل Supabase الشامل — Next.js + TypeScript

> مرجعك النهائي لكل عمليات Supabase مع Next.js (App Router) و TypeScript.
> الكود مأخوذ من مشروع Social Media App حقيقي ومعرّض لأخطاء حقيقية.

---

## 1. الإعدادات الأساسية (Setup)

### ما هو Supabase؟

منصة مفتوحة المصدر بديل Firebase. تعطيك:
- **PostgreSQL** (قاعدة بيانات علائقية كاملة)
- **PostgREST** (Auto-generated REST API من الـ Schema)
- **Auth** (مصادقة مدمجة مع RLS)
- **Realtime** (WebSockets لتحديثات لحظية)
- **Storage** (رفع ملفات مع RLS)

### إنشاء الـ Server Client

هذا الـ client يستخدم **anon key + cookies**. يشتغل جوه Server Components و Server Actions فقط.

```typescript
// lib/supabase/server.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,   // تحذير: env var مفقود = crash صامت
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          // next/headers يسمح بـ set بس في Server Actions أو Route Handlers
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}

// ✅ الأفضل: استعمل cache() عشان تمنع duplicate clients في نفس الـ Request
import { cache } from "react";

export const getProfile = cache(async (userId: string) => {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .eq("id", userId)
    .single();
  return data;
});
```

> ⚠️ **Warning**: `createServerSupabaseClient()` مش `cache()`d. كل ما تناديها، بتخلق client جديد. `getProfile` هي اللي `cache()`d — الفرق مهم للأداء.

### إنشاء الـ Browser Client

للـ Client Components اللي محتاجة تعمل عمليات من المتصفح (زي رفع الصور أو Realtime subscriptions):

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from "@supabase/ssr";

export function createBrowserSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

### التحقق من صحة الـ Environment Variables

```typescript
// ✅ أفضل: Validator صريح عند الـ Startup
function getEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`❌ Environment variable ${name} is missing. Check .env.local`);
  }
  return value;
}

const supabaseUrl = getEnvVar("NEXT_PUBLIC_SUPABASE_URL");
const supabaseKey = getEnvVar("NEXT_PUBLIC_SUPABASE_ANON_KEY");
```

---

## 2. المصادقة (Authentication)

### لماذا Server Actions؟

Next.js App Router يعاني مع Cookies لو استخدمنا `signInWithPassword` من العميل. الحل: **Server Actions** عشان نضمن تدفق الـ Cookies صح للـ Middleware.

### تسجيل الدخول

```typescript
// features/auth/actions.ts
"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function loginUser(values: { email: string; password: string }) {
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: values.email,
    password: values.password,
  });

  if (error) throw error;  // يتقفل في withErrorHandling
  return null;
}
```

### التسجيل (مع إنشاء Profile)

> 💡 **Pro Tip**: `signUp()` في Supabase ما ينشئش صف في جدول `profiles` تلقائياً. لازم تسوي `upsert` بعد التسجيل بنفس الـ user ID.

```typescript
export async function registerUser(values: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  /* ... */
}) {
  const supabase = await createServerSupabaseClient();

  // 1. تسجيل المستخدم في Auth
  const { data, error } = await supabase.auth.signUp({
    email: values.email,
    password: values.password,
    options: {
      data: { full_name: `${values.firstName} ${values.lastName}` },
    },
  });
  if (error) throw error;

  // 2. إنشاء صف في جدول profiles
  const userId = data.user?.id;
  if (!userId) {
    // ❌ لو Email confirmation مفعل، userId بيكون null
    // المستخدم اتسجل في Auth لكن مفيش profile ليه — ده خطأ شائع
    throw new Error("لم يتم تأكيد البريد الإلكتروني بعد");
  }

  const { error: upsertError } = await supabase.from("profiles").upsert({
    id: userId,          // نفس ID مستخدم Auth
    full_name: `${values.firstName} ${values.lastName}`,
    avatar_url: null,
  });
  if (upsertError) throw upsertError;
}
```

### جلب المستخدم الحالي (Secure)

```typescript
// features/auth/actions.ts
"use server";

export async function requireUser() {
  const supabase = await createServerSupabaseClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  // 🔐 استخدم getUser() مش getSession() — getUser() يتصل بـ Auth server ويتحقق من الـ JWT
  // getSession() يقرا التوكن من الكوكي بس وما يتحققش من صحته

  if (userError || !user) {
    throw new Error("يجب تسجيل الدخول أولاً");
  }

  return { supabase, user };
}
```

### تسجيل الخروج

```typescript
// features/auth/hooks/useAuth.tsx
import { useRouter } from "next/navigation";

async function handleSignOut() {
  const supabase = createBrowserSupabaseClient(); // لازم client-side

  const { error } = await supabase.auth.signOut();
  if (error) {
    // حتى لو فشل signOut، اعمل redirect — المستخدم يبغى يخرج
    console.error("SignOut error:", error);
  }

  // ✅ استخدم router.push للـ Client-side navigation
  // ❌ ما تستخدمش window.location.href = "/login" — يسبب Hard Reload ويفقد React Cache
  router.push("/login");
  router.refresh(); // يخلي الـ Server Components تجيب data جديدة
}
```

---

## 3. قاعدة البيانات (CRUD + PostgREST)

### القراءة الأساسية (Select)

```typescript
// جلب بوست واحد
const { data: post, error } = await supabase
  .from("posts")
  .select("id, content, created_at")
  .eq("id", postId)
  .single();               // ✅ يتأكد إن رجع صف واحد — لو مفيش، يخطي
//                           // ❌ .maybeSingle() يرجع null بدل الخطأ
```

### التصفية المتقدمة

```typescript
// .eq — يساوي
.eq("status", "accepted")

// .neq — لا يساوي
.neq("status", "blocked")

// .in — ضمن قائمة
.in("user_id", ["id1", "id2", "id3"])

// .or — أو (انتبه للـ syntax!)
.or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
// ⚠️ الـ .or() يستقبل string — لو userId جاه من user input، ممكن SQL injection
// الحل: استعمل .or() بس مع IDs من الـ Auth Server (زي auth.uid())، مش من User Input

// .lt / .gt — أقل من / أكبر من (للـ Cursor pagination)
.lt("created_at", cursorDate)

// .ilike — بحث نصي (case-insensitive)
.ilike("full_name", `%${searchTerm}%`)
```

### العلاقات (Joins) — الأهم

> 💡 **Pro Tip**: PostgREST يستخدم Foreign Keys عشان يعرف يربط الجداول. لو الـ FK مش موجود في قاعدة البيانات، الـ Query يفشل بـ:
> ```
> "Could not find a relationship between 'posts' and 'users'"
> ```

```typescript
// ✅ Join بسيط: بوست + صاحبه
const { data } = await supabase
  .from("posts")
  .select(`
    id,
    content,
    profiles!posts_user_id_fkey (   // !table_fk_column — بناء على FK
      id,
      full_name,
      avatar_url
    )
  `);

// ✅ Join مع تعليقات + لايكات (عدّ)
const { data } = await supabase
  .from("posts")
  .select(`
    id,
    content,
    profiles!posts_user_id_fkey (id, full_name, avatar_url),
    comments (
      id,
      content,
      profiles (full_name, avatar_url)    // Sub-join داخل comments
    ),
    likes (count)                          // aggregation: يرجع [{ count: 5 }]
  `);

// ✅ Self-Join (البوست نفسه يشارك بوست تاني)
const { data } = await supabase
  .from("posts")
  .select(`
    id,
    content,
    shared_post:posts!shared_post_id (     // self-join على نفس الجدول
      id, content, image_url
    )
  `);
// ⚠️ الـ Self-Job يحتاج FK constraint صريح: FOREIGN KEY (shared_post_id) REFERENCES posts(id)
```

### Cursor-based Pagination (بدل Offset)

> ⚠️ **Warning**: `.range(from, to)` (offset pagination) يسبب duplicate posts لو اتضافت بوستات جديدة أثناء التصفح. استخدم Cursor بدله.

```typescript
// ✅ Cursor Pagination — آمن من الـ Duplicates
const pageSize = 15;

// الصفحة الأولى
const { data: page1 } = await supabase
  .from("posts")
  .select("id, content, created_at")
  .order("created_at", { ascending: false })
  .limit(pageSize);

// الصفحة الثانية — استخدم created_at آخر بوست كـ Cursor
const lastCursor = page1[page1.length - 1].created_at;

const { data: page2 } = await supabase
  .from("posts")
  .select("id, content, created_at")
  .lt("created_at", lastCursor)    // اجلب اللي أصغر من التاريخ ده
  .order("created_at", { ascending: false })
  .limit(pageSize);
```

### الإدراج (Insert)

```typescript
const { data, error } = await supabase
  .from("posts")
  .insert([{
    user_id: user.id,
    content: content.trim(),
    image_url: imageUrl || null,
  }])
  .select()       // ✅ يرجع الـ Data المضاف
  .single();      // ✅ يتأكد إنه رجع عنصر واحد
```

### التحديث (Update)

```typescript
const { error } = await supabase
  .from("profiles")
  .update({ full_name: "اسم جديد" })
  .eq("id", user.id)     // 🔐 دايمًا حدد بشرط — لو نسيت، كل الصفوف تتغير
```

### الحذف (Delete)

```typescript
const { error } = await supabase
  .from("posts")
  .delete()
  .eq("id", postId)
  .eq("user_id", user.id);  // 🔐 شرط إضافي: "أنا مالك البوست"
```

---

## 4. البث المباشر (Realtime)

### الاستماع إلى تغييرات قاعدة البيانات

```typescript
"use client";
import { useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";

export function useRealtimePosts(currentUserId: string) {
  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const channel = supabase
      .channel("feed-channel")                          // اسم القناة (أي اسم)
      .on(
        "postgres_changes",                             // نوع الحدث
        {
          event: "INSERT",                              // INSERT | UPDATE | DELETE | *
          schema: "public",
          table: "posts",
          filter: `user_id=eq.${currentUserId}`,        // فلتر: بس بوستاتي
        },
        (payload) => {
          // payload.new — البيانات الجديدة
          // payload.old — البيانات القديمة (في DELETE و UPDATE)
          console.log("بوست جديد:", payload.new);
        }
      )
      .subscribe();

    // ✅ Cleanup: فك الاشتراك لمنع Memory Leak
    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]); // أعد الاشتراك لو تغير الـ user
}
```

### التعامل مع Async داخل Realtime Callback

> ⚠️ **Warning**: لو احتجت تعمل fetch جوه الـ callback (زي جلب بيانات إضافية)، استخدم mounted flag أو AbortController عشان تمنع `setState` على component متخفي.

```typescript
useEffect(() => {
  let isMounted = true;  // ✅ العلم السحري

  const channel = supabase
    .channel("...")
    .on("postgres_changes", { event: "INSERT", table: "posts" }, async (payload) => {
      const { data: fullPost } = await supabase
        .from("posts")
        .select("..., profiles!posts_user_id_fkey(...)")
        .eq("id", payload.new.id)
        .single();

      if (isMounted && fullPost) {      // ✅ تحقق من الـ Mount
        setPosts(prev => [fullPost, ...prev]);
      }
    })
    .subscribe();

  return () => {
    isMounted = false;                  // ✅ علم الإلغاء
    supabase.removeChannel(channel);
  };
}, []);
```

---

## 5. التخزين (Storage)

### رفع ملف آمن

```typescript
async function uploadImage(file: File): Promise<string | null> {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // ✅ استخدم crypto.randomUUID() — يمنع Path Prediction
  // ❌ لو استخدمت اسم الملف الأصلي، أي واحد يعرف الرابط
  const fileExt = file.name.split(".").pop();
  const fileName = `${crypto.randomUUID()}.${fileExt}`;

  const { error } = await supabase.storage
    .from("avatars")                    // اسم الـ Bucket
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,                    // ❌ upsert: true خطر — أي one يقدر يعدل ملف أي حد
    });

  if (error) {
    console.error("Upload error:", error);
    return null;
  }

  const { data: { publicUrl } } = supabase.storage
    .from("avatars")
    .getPublicUrl(fileName);

  return publicUrl;
}
```

> 💡 **Pro Tip**: `upsert: true` يسمح بالكتابة فوق ملف موجود. لو RLS مش مضبوط، user X يقدر يعدل avatar بتاع user Y. استخدم `upsert: false` واسم ملف عشوائي.

### الـ Object URL للـ Preview

```typescript
// ✅ الصحيح: خلق Object URL + تنظيفه
const [preview, setPreview] = useState<string | null>(null);

const handleFileSelect = (file: File) => {
  // ✅ أنشئ URL
  const objectUrl = URL.createObjectURL(file);
  setPreview(objectUrl);
};

const cleanup = () => {
  if (preview) {
    URL.revokeObjectURL(preview);  // ✅ حرّر الذاكرة
    setPreview(null);
  }
};
```

> ⚠️ **Warning**: `URL.createObjectURL` يخزّن الـ Blob في الذاكرة. لو ناديته 100 مرة وما استخدمتش `revokeObjectURL`، الذاكرة تزيد. دايمًا نادي `revokeObjectURL` في الـ cleanup أو عند رفع الصورة.

---

## 6. الأمان (Row Level Security — RLS)

### ما هو RLS؟

RLS يخلّي PostgreSQL يطبق policy على كل صف قبل أي عملية. من غير RLS، **أي مستخدم مصادق يقدر يقرأ أو يكتب أي حاجة** في الجدول.

### سياسات أساسية

```sql
-- 1. المستخدم يقرأ بس البروفايلات
CREATE POLICY "profiles_select"
ON profiles FOR SELECT
USING (true);  -- الكل يقرأ

-- 2. المستخدم يعدل بروفايله بس
CREATE POLICY "profiles_update"
ON profiles FOR UPDATE
USING (auth.uid() = id)                         -- الصف اللي بيتم تعديله
WITH CHECK (auth.uid() = id);                   -- القيمة الجديدة (نفس الشرط)

-- 3. المستخدم ينشئ إشعار بصفته actor
CREATE POLICY "notifications_insert"
ON notifications FOR INSERT
WITH CHECK (actor_id = auth.uid());             -- يقدر ينشئ إشعار بس بصفته

-- 4. المستخدم يشوف إشعاراته بس
CREATE POLICY "notifications_select"
ON notifications FOR SELECT
USING (receiver_id = auth.uid());               -- يشوف بس الإشعارات اللي له
```

### متى يعمل RLS؟ فوق Server Action ولا Client؟

```typescript
// ✅ RLS شغال في الحالتين:
const serverClient = await createServerSupabaseClient();
// 🔐 يستخدم anon key + cookies — RLS شغال

const browserClient = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// 🔐 نفس الشي — anon key + session cookie — RLS شغال
```

> ⚠️ **Warning**: لو استخدمت **Service Role Key** (secret key)، RLS **ما يشتغلش**. Service role يتجاوز كل السياسات. استخدمه فقط في الـ Edge Functions أو الـ Admin Operations، أبدًا في Server Actions أو Browser.

### مشكلة الـ Silent Failure مع RLS

```typescript
// ❌ خطأ شائع: Insert بدون error check
await supabase.from("notifications").insert([{ ... }]);
// لو RLS منع الـ INSERT، الـ error يرجع في الـ response لكن الكود ما يفحصوش
// هذا يسمى Silent Failure — الإشعار ما ينضاف ولا حد يدري

// ✅ الصحيح:
const { error } = await supabase.from("notifications").insert([{ ... }]);
if (error) {
  console.error("RLS منع الإدراج:", error);
  // إما throw أو تعويض
}
```

---

## 7. أنماط متقدمة (Advanced Patterns)

### Type Safety — بدون `any`

> 💡 **Pro Tip**: Supabase يرجع Response بشكل `{ data: T | null; error: PostgrestError | null }`. TypeScript ما يقدر يستنتج شكل الـ Data تلقائيًا من الـ Query. لازم تحدّد الـ Type بنفسك.

```typescript
// types/database.types.ts
export type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
};

export type Post = {
  id: string;
  content: string;
  user_id: string;
  profiles: Profile | null;
  comments: Comment[] | null;
  likes: Like[] | null;
  shared_post_id: string | null;
  shared_post: SharedPost | SharedPost[] | null;  // Supabase يرجع Arrays للـ Joins
};

export type PostCardPost = Post & {
  likesCount?: number;    // حقول إضافية بعد المعالجة
  isLikedByMe?: boolean;
};

// ✅ الصحيح: استخدام الـ Type مع Supabase
const { data: post } = await supabase
  .from("posts")
  .select("id, content, profiles!posts_user_id_fkey(id, full_name)")  // TypeScript ما يقدر يستنتج
  .single();

// ✅ الحل: صرّح بالـ Type
const typedPost = post as Post;  // أقل evil من any
const safePost: Post = post!;     // أو assert (بحرص)
```

### Race Conditions — الـ Toggle

```typescript
// ❌ خطأ: Time-of-Check to Time-of-Use
const { data: existingLike } = await supabase
  .from("likes").select("id")
  .eq("post_id", postId).eq("user_id", userId)
  .maybeSingle();

if (existingLike) {
  await supabase.from("likes").delete()...  // بحلول هنا، الـ Like ممكن يكون اتشال
} else {
  await supabase.from("likes").insert()...  // أو اتضاف — عندنا Race
}

// ✅ الحل: استخدم Unique Constraint + Catch
const { error } = await supabase.from("likes").insert([{
  post_id: postId,
  user_id: userId,
}]);
// لو الـ Like موجود، Supabase يرجع error كود 23505 (unique violation)
if (error?.code === "23505") {
  // معناه الـ Like موجود — اعمل Delete
  await supabase.from("likes").delete()...
}
```

### Optimistic UI — الصحيح

```typescript
// ✅ المبدأ: حدث الـ UI على طول، تراجع لو فشل السيرفر
const handleLikeToggle = async () => {
  if (isPending) return;

  const prevLiked = isLiked;
  const prevCount = likesCount;

  // 1. Optimistic Update
  setIsLiked(!prevLiked);
  setLikesCount(prev => prevLiked ? prev - 1 : prev + 1);

  // 2. Call Server
  const result = await toggleLikeAction(postId);

  // 3. Rollback على الفشل
  if (!result.success) {
    setIsLiked(prevLiked);
    setLikesCount(prevCount);
  }
};
```

### التعامل مع الـ Error Handling المركزي

```typescript
// lib/with-error-handling.ts
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  errorMessage: string = "حدث خطأ"
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    const data = await fn();
    return { success: true, data };
  } catch (error: unknown) {
    console.error(`[Error] ${errorMessage}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : errorMessage,
    };
  }
}

// ✅ الاستخدام في Server Action
export async function deletePostAction(postId: string) {
  return withErrorHandling(async () => {
    const { supabase, user } = await requireUser();
    const { error } = await supabase
      .from("posts")
      .delete()
      .eq("id", postId)
      .eq("user_id", user.id);     // 🔐 تأكد من الملكية
    if (error) throw error;
    return null;
  }, "فشل حذف المنشور");
}
```

### الـ Normalize Pattern (علاج الـ Array vs Object)

> 💡 **Pro Tip**: Supabase يرجع الـ Joins كمصفوفة دايماً، حتى لو العلاقة `belongs_to` (واحد لواحد). ESTest:</parameter> دايمًا استخدم `normalizeProfile` عشان تتعامل مع الحالتين.

```typescript
// lib/normalize.ts
import type { Profile } from "@/types/database.types";

export function normalizeProfile(profiles: unknown): Profile | null {
  if (!profiles) return null;

  if (Array.isArray(profiles)) {
    // Supabase رجعها كمصفوفة — خذ أول عنصر
    return (profiles[0] as Profile) ?? null;
  }

  // Supabase رجعها ككائن (لو استخدمت .single())
  return profiles as Profile;
}
```

---

## 8. الأخطاء الشائعة — ملخص سريع

| الخطأ | السبب | الحل |
|-------|-------|------|
| "Could not find a relationship" | FK constraint مفقود في DB | أضف `FOREIGN KEY` في SQL Editor |
| Self-join مش شغال | الـ FK موجود لكن PostgREST محتاج الاسم الصريح | استخدم `table!fk_column` |
| Like يتضاف/يتشال غلط | Race condition بين select و insert | استخدم Unique constraint + error code 23505 |
| الإشعارات ما تظهر | RLS يمنع INSERT أو SELECT بدون error check | أضف error check + راجع Policies |
| "new row violates row-level security" | RLS policy تمنع العملية | أضف policy `WITH CHECK (actor_id = auth.uid())` |
| avatar_url يتغير لغير المستخدم | `upsert: true` في Storage | استخدم `upsert: false` + random filename |
| Memory leak من useEffect | ما فيه cleanup function | دايمًا `return () => { ... }` |
| setState على component مفصول | ما فيه mounted flag | استخدم `let isMounted = true` |
| duplicate posts في infinite scroll | Offset pagination | استخدم Cursor pagination مع `.lt()` |
| Object URL يتراكم في الذاكرة | `createObjectURL` بدون `revoke` | نادي `revokeObjectURL` في الـ cleanup |
| getUser() يرجع null غلط | استخدمت `getSession()` بدل `getUser()` | `getSession()` يقرأ التوكن محليًا، `getUser()` يتحقق من Auth server |
| `auth.uid()` غلط في الـ RLS | نسيت إن `auth.uid()` ترجع UUID من Auth.users | تأكد إن `profiles.id` = `auth.users.id` |
| الـ Middleware يقطع API routes | Matcher يطابق `/api/*` | استثني `/api/(.*)` من matcher |

---

> **الخلاصة**: Supabase أداة قوية، لكن أخطائها صامتة. أكتب error check على **كل** Query، اختبر RLS Policies قبل النشر، واستخدم TypeScript عشان تمسك الأخطار قبل ما توصل للـ Production.
