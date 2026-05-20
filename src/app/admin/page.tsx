'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Note: In a real production app, you should use a secure way to manage the Supabase client
// and handle authentication. This is a simplified version for the Admin UI.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default function AdminDashboard() {
  const [faqs, setFaqs] = useState<any[]>([]);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchFaqs();
  }, []);

  async function fetchFaqs() {
    const { data, error } = await supabase
      .from('faqs')
      .select('id, question, answer')
      .order('id', { ascending: false });
    
    if (!error && data) setFaqs(data);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      // In a real app, you would call an API route to handle embedding generation
      // to avoid exposing your Gemini API key on the client side.
      const res = await fetch('/api/admin/faq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, answer }),
      });

      if (res.ok) {
        setQuestion('');
        setAnswer('');
        fetchFaqs();
      } else {
        alert('Error saving FAQ');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Are you sure?')) return;
    const { error } = await supabase.from('faqs').delete().eq('id', id);
    if (!error) fetchFaqs();
  }

  return (
    <div className="max-w-4xl mx-auto p-8 font-sans">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">ระบบจัดการ FAQ โรงเรียน</h1>
      
      <div className="bg-white shadow-md rounded-lg p-6 mb-8 border border-gray-200">
        <h2 className="text-xl font-semibold mb-4">เพิ่มคำถามใหม่</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">คำถาม</label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
              placeholder="เช่น ค่าเทอมเท่าไหร่?"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">คำตอบ</label>
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
              rows={3}
              placeholder="ระบุคำตอบที่ต้องการให้ Bot ตอบ..."
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200 disabled:bg-blue-300"
          >
            {loading ? 'กำลังบันทึก...' : 'บันทึกคำถาม'}
          </button>
        </form>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">คำถาม</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">คำตอบ</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">จัดการ</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {faqs.map((faq) => (
              <tr key={faq.id}>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{faq.question}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{faq.answer}</td>
                <td className="px-6 py-4 text-right text-sm font-medium">
                  <button
                    onClick={() => handleDelete(faq.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    ลบ
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
