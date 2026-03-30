'use client';

import { Suspense, useEffect, useState } from 'react';
import { useCampus } from '@/components/layout/CampusContext';
import { useSearchParams } from 'next/navigation';
import { Search, Users, FileText, CheckCircle, Printer } from 'lucide-react';

interface Family { id: number; family_name: string; guardian_name: string; contact_phone: string; address: string; members: Sibling[]; siblings: Sibling[]; }
interface Sibling { id: number; name: string; class_name: string; section_name: string; roll_no: string; campus_name: string; fees: { fee_head_name: string; amount: number }[]; subtotal: number; }

export default function FamilyVoucherPage() {
  return <Suspense fallback={<div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>}><FamilyVoucherContent /></Suspense>;
}

function FamilyVoucherContent() {
  const { selectedCampusId } = useCampus();
  const searchParams = useSearchParams();
  const familyIdParam = searchParams.get('family_id');

  const [searchQuery, setSearchQuery] = useState('');
  const [families, setFamilies] = useState<Family[]>([]);
  const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(2026);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<{ voucher_no: string; id: number; alreadyExists?: boolean } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchQuery.length < 2) { setFamilies([]); return; }
    const timer = setTimeout(() => {
      fetch(`/api/families?search=${encodeURIComponent(searchQuery)}`)
        .then(r => r.json()).then(d => { if (Array.isArray(d)) setFamilies(d); }).catch(() => {});
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (familyIdParam) loadFamily(Number(familyIdParam));
  }, [familyIdParam]);

  const loadFamily = async (id: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/families/${id}`);
      const data = await res.json();
      setSelectedFamily(data);
      setSearchQuery('');
      setFamilies([]);
      setGenerated(null);
    } catch { /* ignore */ }
    setLoading(false);
  };

  const grandTotal = selectedFamily?.members?.reduce((s, m) => s + (m.subtotal || 0), 0) || 0;

  const generateVoucher = async () => {
    if (!selectedFamily) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/family-vouchers/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ family_id: selectedFamily.contact_phone, month, year, campus_id: selectedCampusId }),
      });
      const data = await res.json();
      if (data.already_exists) {
        setGenerated({ voucher_no: data.voucher_no, id: data.id, alreadyExists: true });
      } else if (data.voucher_no) {
        setGenerated({ voucher_no: data.voucher_no, id: data.id });
      } else if (data.error) alert(data.error);
    } catch { /* ignore */ }
    setGenerating(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Family Voucher</h1>
          <p className="text-gray-500 mt-1">Generate consolidated fee vouchers for families with multiple children</p>
        </div>
        <div className="flex gap-2">
          <select value={month} onChange={e => setMonth(Number(e.target.value))} className="border rounded-lg px-3 py-2 text-sm">
            {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{new Date(2026, i).toLocaleString('default', { month: 'long' })}</option>)}
          </select>
          <select value={year} onChange={e => setYear(Number(e.target.value))} className="border rounded-lg px-3 py-2 text-sm">
            <option value={2025}>2025</option><option value={2026}>2026</option>
          </select>
        </div>
      </div>

      {/* Family Search */}
      {!selectedFamily && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-3 text-gray-400" />
            <input type="text" placeholder="Search by family name, guardian name, or child's name..."
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          {families.length > 0 && (
            <div className="mt-2 border rounded-lg max-h-64 overflow-y-auto">
              {families.map(f => (
                <button key={f.id} onClick={() => loadFamily(f.id)} className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b last:border-b-0">
                  <div className="font-medium">{f.family_name}</div>
                  <div className="text-sm text-gray-500">Guardian: {f.guardian_name} · {f.contact_phone}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {loading && <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>}

      {/* Family Overview */}
      {selectedFamily && (
        <>
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-50 text-purple-600 rounded-lg"><Users size={24} /></div>
                <div>
                  <h2 className="text-xl font-semibold">{selectedFamily.family_name}</h2>
                  <p className="text-gray-500">Guardian: {selectedFamily.guardian_name} · {selectedFamily.contact_phone}</p>
                  <p className="text-sm text-gray-400">{selectedFamily.address}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Children Enrolled</div>
                <div className="text-2xl font-bold text-purple-600">{selectedFamily.members?.length || 0}</div>
              </div>
            </div>
          </div>

          {/* Sibling Cards */}
          <div className="space-y-4">
            {(selectedFamily.members || []).map((child, i) => (
              <div key={child.id} className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{child.name}</h3>
                    <div className="flex gap-2 mt-1">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-sm">{child.class_name}</span>
                      <span className="px-2 py-0.5 bg-gray-100 rounded text-sm">{child.section_name}</span>
                      <span className="text-sm text-gray-500">Roll #{child.roll_no}</span>
                      {child.campus_name && <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-sm">{child.campus_name}</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Subtotal</div>
                    <div className="text-xl font-bold">Rs. {(child.subtotal || 0).toLocaleString()}</div>
                  </div>
                </div>
                {child.fees && child.fees.length > 0 && (
                  <table className="w-full text-sm">
                    <tbody>
                      {child.fees.map((fee, j) => (
                        <tr key={j} className="border-t">
                          <td className="py-1.5 text-gray-600">{fee.fee_head_name}</td>
                          <td className="py-1.5 text-right">Rs. {fee.amount.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                {i < (selectedFamily.members?.length || 0) - 1 && (
                  <div className="mt-3 text-xs text-green-600 bg-green-50 rounded px-2 py-1 inline-block">
                    Sibling #{i + 2} discount may apply
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Grand Total */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-blue-200">Family Grand Total</div>
                <div className="text-3xl font-bold mt-1">Rs. {grandTotal.toLocaleString()}</div>
              </div>
              <div className="text-right text-sm text-blue-200">
                <div>{selectedFamily.members?.length} students</div>
                <div>{new Date(2026, month - 1).toLocaleString('default', { month: 'long' })} {year}</div>
              </div>
            </div>
          </div>

          {/* Actions */}
          {!generated ? (
            <div className="flex gap-3">
              <button onClick={generateVoucher} disabled={generating}
                className="flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition font-medium">
                <FileText size={18} /> {generating ? 'Generating...' : 'Generate Family Voucher'}
              </button>
              <button onClick={() => { setSelectedFamily(null); setGenerated(null); }}
                className="px-6 py-3 border rounded-lg hover:bg-gray-50 transition text-sm">Change Family</button>
            </div>
          ) : generated.alreadyExists ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <FileText size={24} className="text-amber-600" />
                <h3 className="text-lg font-semibold text-amber-800">Voucher Already Exists</h3>
              </div>
              <p className="text-amber-700 mb-4">Voucher <span className="font-mono font-bold">{generated.voucher_no}</span> was already generated for this family/month. You can view or print it.</p>
              <div className="flex gap-3">
                <a href={`/family-voucher/${generated.id}`} className="flex items-center gap-2 bg-white border border-amber-300 text-amber-700 px-4 py-2 rounded-lg hover:bg-amber-50 text-sm font-medium">
                  <Printer size={16} /> View &amp; Print
                </a>
                <button onClick={() => { setSelectedFamily(null); setGenerated(null); }} className="text-sm text-amber-600 hover:underline px-4 py-2">Generate Another</button>
              </div>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle size={24} className="text-green-600" />
                <h3 className="text-lg font-semibold text-green-800">Family Voucher Generated</h3>
              </div>
              <p className="text-green-700 mb-4">Voucher No: <span className="font-mono font-bold">{generated.voucher_no}</span></p>
              <div className="flex gap-3">
                <a href={`/family-voucher/${generated.id}`} className="flex items-center gap-2 bg-white border border-green-300 text-green-700 px-4 py-2 rounded-lg hover:bg-green-50 text-sm font-medium">
                  <Printer size={16} /> View &amp; Print
                </a>
                <button onClick={() => { setSelectedFamily(null); setGenerated(null); }} className="text-sm text-green-600 hover:underline px-4 py-2">Generate Another</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
