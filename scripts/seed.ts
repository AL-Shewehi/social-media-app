import { createClient } from "@supabase/supabase-js";
import { fakerAR } from "@faker-js/faker"; // 👈 استخدام النسخة العربية لواقعية البيانات
import * as dotenv from "dotenv";

// تحميل متغيرات البيئة من .env.local
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const myUserId = process.env.MY_USER_ID;

if (!supabaseUrl || !supabaseServiceKey || !myUserId) {
  console.error("🚨 المتغيرات المطلوبة غير موجودة في .env.local");
  process.exit(1);
}

// 🛡️ استخدام Service Role Key لعمل Bypass للـ RLS وصلاحيات الـ Admin
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const NUM_USERS = 10; // عدد الأصدقاء الوهميين
const POSTS_PER_USER = 5; // كل صديق هينزل 5 بوستات (الإجمالي 50 بوست)

async function runSeed() {
  console.log("🌱 بدء عملية زراعة البيانات (Seeding)...");

  try {
    for (let i = 0; i < NUM_USERS; i++) {
      // 1. إنشاء حساب وهمي
      const email = fakerAR.internet.email();
      const password = "Password123!";
      const fullName = fakerAR.person.fullName();
      const avatarUrl = fakerAR.image.avatar();

      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // تخطي تأكيد الإيميل
      });

      if (authError || !authData.user) {
        console.error(`خطأ في إنشاء المستخدم ${email}:`, authError?.message);
        continue;
      }

      const fakeUserId = authData.user.id;
      console.log(`👤 تم إنشاء المستخدم: ${fullName}`);

      // 2. تحديث بروفايل المستخدم بالاسم والصورة (بافتراض إن عندك Trigger بيكريت الـ Profile فاضي)
      await supabaseAdmin.from("profiles").update({
        full_name: fullName,
        avatar_url: avatarUrl,
      }).eq("id", fakeUserId);

      // 3. 🤝 تكوين صداقة إجبارية بينك وبين المستخدم الوهمي (عشان تشوف بوستاته)
      await supabaseAdmin.from("friendships").insert({
        sender_id: fakeUserId,
        receiver_id: myUserId,
        status: "accepted", // صداقة مقبولة فوراً
      });
      console.log(`🤝 أصبح ${fullName} صديقاً لك!`);

      // 4. كتابة منشورات لهذا المستخدم
      const postsToInsert = Array.from({ length: POSTS_PER_USER }).map(() => ({
        user_id: fakeUserId,
        content: fakerAR.lorem.paragraphs({ min: 1, max: 3 }), // بوستات عربية عشوائية
        created_at: fakerAR.date.recent({ days: 30 }).toISOString(), // تواريخ مختلفة عشان نختبر ترتيب الباجينيشن
      }));

      const { error: postsError } = await supabaseAdmin.from("posts").insert(postsToInsert);
      
      if (postsError) {
        console.error("خطأ في نشر البوستات:", postsError.message);
      } else {
        console.log(`📝 تم نشر ${POSTS_PER_USER} منشورات للمستخدم ${fullName}`);
      }
    }

    console.log("✅ تمت عملية الزراعة بنجاح! افتح التطبيق الآن وجرب الـ Feed.");
  } catch (error) {
    console.error("🚨 حدث خطأ غير متوقع:", error);
  }
}

runSeed();