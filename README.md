# 🏫 Zero-Cost School FAQ Bot (LINE OA)

ระบบบอทตอบคำถามอัตโนมัติสำหรับโรงเรียน แบบไม่มีค่าใช้จ่าย (Zero-Cost) โดยใช้พลังของ AI ระดับโลก

## 🚀 Tech Stack
- **Framework**: Next.js (App Router) on Vercel Edge Runtime
- **Database**: Supabase + pgvector (768 dimensions)
- **Embedding**: Google Gemini (`text-embedding-004`) - **Free Tier**
- **LLM**: Groq (`llama-3.1-8b-instant`) - **Free Tier / High Speed**
- **Messaging**: LINE Messaging API

## 🛠 การติดตั้งและตั้งค่า

### 1. Database (Supabase)
- รัน SQL ในไฟล์ `supabase/migrations/0001_faq_schema.sql` ใน SQL Editor ของ Supabase เพื่อสร้างตารางและฟังก์ชันค้นหา Vector

### 2. Environment Variables
คัดลอกไฟล์ `.env.local.example` เป็น `.env` และใส่ค่าดังนี้:
- `SUPABASE_URL`: URL ของโปรเจกต์ Supabase
- `SUPABASE_SERVICE_ROLE_KEY`: Service Role Key (ห้ามเผยแพร่)
- `GROQ_API_KEY`: รับจาก [console.groq.com](https://console.groq.com/)
- `GEMINI_API_KEY`: รับจาก [Google AI Studio](https://aistudio.google.com/)
- `LINE_CHANNEL_ACCESS_TOKEN`: รับจาก LINE Developers Console
- `LINE_CHANNEL_SECRET`: รับจาก LINE Developers Console

### 3. การใช้งาน Admin Dashboard
- เข้าไปที่ `/admin` เพื่อจัดการเพิ่ม/ลบ คำถาม FAQ
- ระบบจะสร้าง Embedding ให้โดยอัตโนมัติเมื่อกดบันทึก

## 📦 ขั้นตอนการ Deploy (Vercel)
1. Push โค้ดขึ้น GitHub
2. Import เข้า Vercel
3. ตั้งค่า Environment Variables ให้ครบ
4. ตั้งค่า Webhook URL ใน LINE Developers: `https://your-app.vercel.app/api/webhook`
5. **สำคัญ:** ปิด Auto-reply ในหน้า LINE Official Account Manager

## 📝 โครงสร้างโปรเจกต์
- `src/app/api/webhook/route.ts`: ตัวรับข้อความจาก LINE และประมวลผล AI
- `src/app/admin/page.tsx`: หน้าเว็บจัดการ FAQ สำหรับแอดมิน
- `src/app/api/admin/faq/route.ts`: API สำหรับแอดมิน (Auto-embedding)
- `scripts/seed_faq.ts`: สคริปต์สำหรับนำเข้าข้อมูลตั้งต้น
