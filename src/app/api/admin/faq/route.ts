import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const runtime = 'edge';

const cleanKey = (key: string | undefined) => key ? key.replace(/\s+/g, '') : '';

const supabase = createClient(
  cleanKey(process.env.SUPABASE_URL),
  cleanKey(process.env.SUPABASE_SERVICE_ROLE_KEY)
);

const genAI = new GoogleGenerativeAI(cleanKey(process.env.GEMINI_API_KEY));
const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

export async function POST(req: Request) {
  try {
    const { question, answer } = await req.json();

    if (!question || !answer) {
      return new Response('Missing question or answer', { status: 400 });
    }

    // 1. Generate Embedding using Gemini
    const result = await embeddingModel.embedContent({
      content: {
        role: "user",
        parts: [{ text: question }]
      },
      outputDimensionality: 768
    } as any);
    const embedding = result.embedding.values;

    // 2. Insert into Supabase
    const { error } = await supabase.from('faqs').insert({
      question,
      answer,
      embedding,
    });

    if (error) {
      console.error('Supabase error:', error);
      return new Response('Database error', { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Admin API error:', err);
    return new Response('Internal Server Error', { status: 500 });
  }
}
