import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

const dummyFaqs = [
  {
    question: "ค่าเทอมเท่าไหร่",
    answer: "ค่าเทอมสำหรับภาคเรียนปกติอยู่ที่ 15,000 บาท และภาคเรียนภาษาอังกฤษ (EP) อยู่ที่ 35,000 บาทค่ะ",
  },
  {
    question: "เปิดเทอมวันไหน",
    answer: "โรงเรียนเปิดเทอมภาคเรียนที่ 1 ในวันที่ 16 พฤษภาคม และภาคเรียนที่ 2 ในวันที่ 1 พฤศจิกายน ของทุกปีค่ะ",
  },
  {
    question: "ติดต่อฝ่ายธุรการได้ที่ไหน",
    answer: "สามารถติดต่อฝ่ายธุรการได้ที่อาคาร 1 ชั้น 1 หรือโทร 02-xxx-xxxx ในเวลาทำการค่ะ",
  }
];

async function seed() {
  console.log('Seeding FAQs with Gemini Embeddings...');
  
  const faqsWithEmbeddings = await Promise.all(dummyFaqs.map(async (faq) => {
    const result = await embeddingModel.embedContent({
      content: {
        role: "user",
        parts: [{ text: faq.question }]
      },
      outputDimensionality: 768
    } as any);
    return {
      ...faq,
      embedding: result.embedding.values
    };
  }));

  const { error } = await supabase.from('faqs').insert(faqsWithEmbeddings);
  
  if (error) console.error('Error seeding:', error);
  else console.log('Seeding complete with Gemini Embeddings (768 dims)!');
}

seed();
