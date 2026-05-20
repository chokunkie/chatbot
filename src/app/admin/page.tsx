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
  const [imageUrl, setImageUrl] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchFaqs();
    const savedPassword = localStorage.getItem('admin_password') || '';
    setAdminPassword(savedPassword);
  }, []);

  const handlePasswordChange = (val: string) => {
    setAdminPassword(val);
    localStorage.setItem('admin_password', val);
  };

  async function fetchFaqs() {
    const { data, error } = await supabase
      .from('faqs')
      .select('id, question, answer, image_url')
      .order('id', { ascending: false });
    
    if (!error && data) setFaqs(data);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!adminPassword) {
      alert('กรุณากรอกรหัสผ่านผู้ดูแลระบบ');
      return;
    }
    setLoading(true);

    try {
      const res = await fetch('/api/admin/faq', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-password': adminPassword
        },
        body: JSON.stringify({ question, answer, image_url: imageUrl }),
      });

      if (res.ok) {
        setQuestion('');
        setAnswer('');
        setImageUrl('');
        fetchFaqs();
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล (เช็ครหัสผ่านแอดมิน)');
      }
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    if (!adminPassword) {
      alert('กรุณากรอกรหัสผ่านผู้ดูแลระบบเพื่อดำเนินการลบ');
      return;
    }
    if (!confirm('ยืนยันที่จะลบคำถามนี้หรือไม่?')) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/faq?id=${id}`, {
        method: 'DELETE',
        headers: { 
          'x-admin-password': adminPassword
        },
      });

      if (res.ok) {
        fetchFaqs();
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || 'เกิดข้อผิดพลาดในการลบคำถาม (เช็ครหัสผ่านแอดมิน)');
      }
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการดำเนินการลบ');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-8 font-sans">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">ระบบจัดการ FAQ โรงเรียน</h1>
      
      {/* ส่วนกรอกรหัสผ่านเพื่อความปลอดภัย */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-amber-800 font-semibold flex items-center gap-2">🔒 ระบบรักษาความปลอดภัยหลังบ้าน</h2>
          <p className="text-xs text-amber-700 mt-1">กรุณากรอกรหัสผ่านผู้ดูแลระบบที่ตั้งค่าไว้ใน Vercel เพื่อใช้ในการบันทึกหรือลบข้อมูล</p>
        </div>
        <input
          type="password"
          value={adminPassword}
          onChange={(e) => handlePasswordChange(e.target.value)}
          className="border border-amber-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white min-w-[240px]"
          placeholder="ป้อนรหัสผ่านแอดมิน..."
          required
        />
      </div>

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
          <div>
            <label className="block text-sm font-medium text-gray-700">ลิงก์รูปภาพประกอบ (ไม่บังคับ)</label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
              placeholder="เช่น https://example.com/school-map.jpg"
            />
            <p className="text-xs text-gray-400 mt-1">วางลิงก์รูปภาพ (https) เมื่อบอทตรวจพบคำถามนี้ บอทจะแนบรูปภาพส่งคู่กับข้อความทันที</p>
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">รูปภาพแนบ</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">จัดการ</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {faqs.map((faq) => (
              <tr key={faq.id}>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{faq.question}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{faq.answer}</td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {faq.image_url ? (
                    <a href={faq.image_url} target="_blank" rel="noreferrer" className="flex items-center">
                      <img src={faq.image_url} alt="attachment" className="w-10 h-10 object-cover rounded border hover:scale-105 transition" />
                    </a>
                  ) : (
                    <span className="text-gray-400 text-xs">ไม่มีภาพ</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right text-sm font-medium">
                  <button
                    onClick={() => handleDelete(faq.id)}
                    disabled={loading}
                    className="text-red-600 hover:text-red-900 disabled:text-red-300"
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
