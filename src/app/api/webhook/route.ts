import { createClient } from '@supabase/supabase-js';
import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const runtime = 'edge';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });

const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN!;
const LINE_CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET!;

const SYSTEM_PROMPT = `คุณคือแอดมิน AI ประจำ LINE Official Account ของโรงเรียนทุ่งใหญ่วิทยาคม
หน้าที่ของคุณคือตอบคำถามผู้ปกครองและนักเรียนด้วยความสุภาพ รวดเร็ว และแม่นยำ

[กฎเหล็กที่ต้องปฏิบัติตามอย่างเคร่งครัด]
1. ความยาว: ผู้ใช้งานอ่านบนหน้าจอมือถือ คุณต้องตอบให้สั้น กระชับ ตรงประเด็นที่สุด ห้ามเกิน 3 ประโยค ห้ามมีน้ำหรือคำเกริ่นนำยืดเยื้อ
2. ขอบเขต: ตอบเฉพาะข้อมูลที่เกี่ยวข้องกับโรงเรียนเท่านั้น (เช่น ค่าเทอม, การรับสมัคร, วันหยุด, กฎระเบียบ) หากมีคนถามเรื่องอื่น (การเมือง, ทั่วไป, เล่นมุก) ให้ตอบปฏิเสธอย่างสุภาพทันทีว่า "ขออภัยค่ะ แอดมินสามารถให้ข้อมูลได้เฉพาะเรื่องของโรงเรียนเท่านั้นค่ะ"
3. ห้ามเดา: หากคำถามนั้นไม่มีข้อมูลใน Context หรือคุณไม่แน่ใจ 100% ห้ามเดาหรือแต่งเรื่องเองเด็ดขาด ให้ตอบว่า "ข้อมูลส่วนนี้แอดมินไม่แน่ใจ รบกวนติดต่อฝ่ายธุรการโดยตรงที่เบอร์ [รออัปเดตเบอร์โทร] ในวันและเวลาราชการนะคะ"
4. โทนเสียง: สุภาพ เป็นทางการแต่น่าฟัง ลงท้ายด้วย "ค่ะ/ครับ" เสมอ และสามารถใช้ Emoji ได้เล็กน้อย

[ข้อมูลพื้นฐานของโรงเรียน]
- เวลาทำการ: จันทร์-ศุกร์ 08:30 - 16:30 น.
- เบอร์ติดต่อ: [รออัปเดตเบอร์โทร]
- เว็บไซต์: [รออัปเดตเว็บไซต์]`;

async function verifySignature(body: string, signature: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(LINE_CHANNEL_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );
  const signatureBin = Uint8Array.from(atob(signature), (c) => c.charCodeAt(0));
  return await crypto.subtle.verify('HMAC', key, signatureBin, encoder.encode(body));
}

async function replyMessage(replyToken: string, text: string) {
  try {
    const res = await fetch('https://api.line.me/v2/bot/message/reply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        replyToken,
        messages: [{ type: 'text', text }],
      }),
    });
    if (!res.ok) {
      console.error('[LINE API Error]:', await res.text());
    }
  } catch (err) {
    console.error('[Reply Error]:', err);
  }
}

async function getEmbedding(text: string): Promise<number[]> {
  try {
    const result = await embeddingModel.embedContent(text);
    return result.embedding.values;
  } catch (err) {
    console.error('[Gemini Embedding Error]:', err);
    throw err;
  }
}

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('x-line-signature') || '';

  if (!(await verifySignature(body, signature))) {
    return new Response('Invalid signature', { status: 401 });
  }

  const { events } = JSON.parse(body);

  for (const event of events) {
    if (event.type === 'message' && event.message.type === 'text') {
      const userMessage = event.message.text;
      const replyToken = event.replyToken;

      try {
        // 1. Search FAQ in Supabase (Vector Search)
        let embedding: number[];
        try {
          embedding = await getEmbedding(userMessage);
          const { data: faqMatch, error } = await supabase.rpc('match_faqs', {
            query_embedding: embedding,
            match_threshold: 0.8,
            match_count: 1,
          });

          if (!error && faqMatch && faqMatch.length > 0) {
            await replyMessage(replyToken, faqMatch[0].answer);
            continue;
          }
        } catch (embeddingErr) {
          console.error('Vector search failed, falling back to LLM directly');
        }

        // 2. Fallback to Groq with Llama-3.1-8b-instant
        try {
          const completion = await groq.chat.completions.create({
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: userMessage },
            ],
            model: 'llama-3.1-8b-instant',
            max_tokens: 150,
            temperature: 0.2, // Low temperature for consistent, stable answers
          });

          const aiResponse = completion.choices[0]?.message?.content || 'ขออภัยค่ะ ไม่สามารถประมวลผลได้ในขณะนี้';
          await replyMessage(replyToken, aiResponse);
        } catch (groqErr: any) {
          console.error('[Groq API Error]:', groqErr);
          if (groqErr.status === 429) {
            await replyMessage(replyToken, 'ขณะนี้มีผู้ใช้งานจำนวนมาก กรุณาลองใหม่อีกครั้ง หรือติดต่อโรงเรียนโดยตรงที่เบอร์ [เบอร์โทรโรงเรียน] ค่ะ');
          } else {
            await replyMessage(replyToken, 'ขออภัยค่ะ ระบบขัดข้องชั่วคราว กรุณาลองใหม่อีกครั้งนะคะ');
          }
        }

      } catch (err) {
        console.error('[General Error Handling Event]:', err);
        await replyMessage(replyToken, 'เกิดข้อผิดพลาดในการประมวลผลค่ะ');
      }
    }
  }

  return new Response('OK', { status: 200 });
}
