-- وصف: استبدال عمود unread_count المشترك بعمودين منفصلين لكل مستخدم
-- لإصلاح مشكلة زيادة العداد عند كلا الطرفين (Architectural Flaw)

-- 1. إضافة العمودين الجديدين
ALTER TABLE conversations
  ADD COLUMN user_one_unread_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN user_two_unread_count INTEGER NOT NULL DEFAULT 0;

-- 2. ترحيل القيمة الحالية إلى العمودين (قيمة تقريبية تفترض أن العداد يمثل المرسل)
--    بعد الترحيل، نلغي الـ trigger لأن العداد سيُدار من الـ Server Actions
UPDATE conversations SET
  user_one_unread_count = unread_count,
  user_two_unread_count = unread_count;

-- 3. حذف الـ trigger و function القديمة (إن وُجدت)
DROP TRIGGER IF EXISTS on_message_insert_update_unread ON messages;
DROP FUNCTION IF EXISTS update_conversation_unread_count();

-- 4. حذف العمود القديم
ALTER TABLE conversations DROP COLUMN unread_count;

-- ملاحظة: إدارة العدادين أصبحت يدوية عبر Server Actions:
--   - sendChatMessageAction: increment عداد المستقبل
--   - markMessagesAsReadAction: إعادة حساب العدادين من الصفر (recalculate)