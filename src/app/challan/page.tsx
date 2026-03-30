'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useCampus } from '@/components/layout/CampusContext';
import { useSearchParams } from 'next/navigation';
import { FileText, Printer, CheckCircle, Search } from 'lucide-react';
import Link from 'next/link';


interface Student { id: number; name: string; father_name: string; class_id: number; class_name: string; section_name: string; roll_no: string; family_id: string | null; campus_id: number; }
interface FeeItem { fee_head_id: number; fee_head_name: string; amount: number; concession: number; net: number; reason: string; }
interface Concession { id: number; type: string; value: number; fee_head_name: string; template_name: string; }

export default function ChallanPage() {
  return <Suspense fallback={<div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>}><ChallanContent /></Suspense>;
}

function ChallanContent() {
  const { selectedCampusId } = useCampus();
  const searchParams = useSearchParams();
  const studentIdParam = searchParams.get('student_id');

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [feeItems, setFeeItems] = useState<FeeItem[]>([]);
  const [concessions, setConcessions] = useState<Concession[]>([]);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(2026);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<{ challan_no: string; id: number; alreadyExists?: boolean } | null>(null);
  const [oneTimeAdjustments, setOneTimeAdjustments] = useState<Record<number, { amount: number; reason: string }>>({});
  const [excludedFees, setExcludedFees] = useState<Set<number>>(new Set());

  // Search students
  useEffect(() => {
    if (searchQuery.length < 2) { setSearchResults([]); return; }
    const timer = setTimeout(() => {
      fetch(`/api/students?campus_id=${selectedCampusId}&search=${encodeURIComponent(searchQuery)}`)
        .then(r => r.json()).then(d => { if (Array.isArray(d)) setSearchResults(d); }).catch(() => {});
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCampusId]);

  // Auto-load student from URL param
  useEffect(() => {
    if (studentIdParam) {
      fetch(`/api/students/${studentIdParam}`)
        .then(r => r.json()).then(s => setSelectedStudent(s)).catch(() => {});
    }
  }, [studentIdParam]);

  // Load fee structure when student selected
  const loadFees = useCallback(async (student: Student) => {
    setSelectedStudent(student);
    setSearchQuery('');
    setSearchResults([]);
    setGenerated(null);
    setExcludedFees(new Set());
    try {
      const [feeRes, concRes] = await Promise.all([
        fetch(`/api/fee-structures?campus_id=${selectedCampusId}&class_id=${student.class_id}`).then(r => r.json()),
        fetch(`/api/student-concessions?student_id=${student.id}`).then(r => r.json()),
      ]);
      const items: FeeItem[] = (feeRes || []).map((fs: { fee_head_id: number; fee_head_name: string; amount: number }) => ({
        fee_head_id: fs.fee_head_id, fee_head_name: fs.fee_head_name, amount: fs.amount, concession: 0, net: fs.amount, reason: '',
      }));
      setConcessions(concRes || []);
      // Apply permanent concessions
      for (const c of (concRes || [])) {
        const item = items.find(i => i.fee_head_id === c.fee_head_id || !c.fee_head_id);
        if (item) {
          const disc = c.type === 'percentage' ? item.amount * c.value / 100 : c.value;
          item.concession = disc;
          item.net = item.amount - disc;
        }
      }
      setFeeItems(items);
    } catch { /* ignore */ }
  }, [selectedCampusId]);

  useEffect(() => {
    if (selectedStudent) loadFees(selectedStudent);
  }, [selectedStudent, loadFees]);

  const applyOneTimeAdjustment = (feeHeadId: number, amount: number, reason: string) => {
    setOneTimeAdjustments(prev => ({ ...prev, [feeHeadId]: { amount, reason } }));
    setFeeItems(prev => prev.map(item => {
      if (item.fee_head_id === feeHeadId) {
        const totalConcession = item.concession + amount;
        return { ...item, net: item.amount - totalConcession };
      }
      return item;
    }));
  };

  const includedItems = feeItems.filter(i => !excludedFees.has(i.fee_head_id));
  const totalOriginal = includedItems.reduce((s, i) => s + i.amount, 0);
  const totalConcession = includedItems.reduce((s, i) => s + i.concession, 0) + includedItems.reduce((s, i) => s + (oneTimeAdjustments[i.fee_head_id]?.amount || 0), 0);
  const grandTotal = includedItems.reduce((s, i) => s + i.net - (oneTimeAdjustments[i.fee_head_id]?.amount || 0), 0);

  const generateChallan = async () => {
    if (!selectedStudent) return;
    setGenerating(true);
    try {
      // Send only included fee items
      const items = feeItems
        .filter(item => !excludedFees.has(item.fee_head_id))
        .map(item => ({
          fee_head_id: item.fee_head_id,
          original_amount: item.amount,
          concession_amount: item.concession,
          one_time_adjustment: oneTimeAdjustments[item.fee_head_id]?.amount || 0,
          one_time_reason: oneTimeAdjustments[item.fee_head_id]?.reason || null,
          net_amount: item.net - (oneTimeAdjustments[item.fee_head_id]?.amount || 0),
        }));
      const res = await fetch('/api/challans/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: selectedStudent.id, campus_id: selectedCampusId, month, year, items }),
      });
      const data = await res.json();
      if (data.already_exists) {
        // Challan already exists — show it with option to view/edit
        setGenerated({ challan_no: data.challan_no, id: data.id, alreadyExists: true });
      } else if (data.id) {
        setGenerated({ challan_no: data.challan_no, id: data.id });
      } else if (data.error) alert(data.error);
    } catch { /* ignore */ }
    setGenerating(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Challan Generation</h1>
        <div className="flex gap-2">
          <select value={month} onChange={e => setMonth(Number(e.target.value))} className="border rounded-lg px-3 py-2 text-sm">
            {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{new Date(2026, i).toLocaleString('default', { month: 'long' })}</option>)}
          </select>
          <select value={year} onChange={e => setYear(Number(e.target.value))} className="border rounded-lg px-3 py-2 text-sm">
            <option value={2025}>2025</option><option value={2026}>2026</option><option value={2027}>2027</option>
          </select>
        </div>
      </div>

      {/* Student Search */}
      {!selectedStudent && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text" placeholder="Search student by name, father name, or roll number..."
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          {searchResults.length > 0 && (
            <div className="mt-2 border rounded-lg max-h-64 overflow-y-auto">
              {searchResults.map(s => (
                <button key={s.id} onClick={() => loadFees(s)} className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b last:border-b-0 transition">
                  <div className="font-medium">{s.name}</div>
                  <div className="text-sm text-gray-500">S/O {s.father_name} · {s.class_name} {s.section_name} · Roll #{s.roll_no}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Student Info Header */}
      {selectedStudent && (
        <>
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">{selectedStudent.name}</h2>
                <p className="text-gray-500">S/O {selectedStudent.father_name}</p>
                <div className="flex gap-3 mt-2 text-sm">
                  <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded">{selectedStudent.class_name}</span>
                  <span className="px-2 py-1 bg-gray-100 rounded">{selectedStudent.section_name}</span>
                  <span className="text-gray-500">Roll #{selectedStudent.roll_no}</span>
                </div>
              </div>
              <button onClick={() => { setSelectedStudent(null); setFeeItems([]); setGenerated(null); setExcludedFees(new Set()); }} className="text-sm text-blue-600 hover:underline">Change Student</button>
            </div>
          </div>

          {/* Fee Table */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4">Fee Breakdown</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="py-3 px-3 w-10 text-center">
                    <input type="checkbox" title="Include all"
                      checked={feeItems.every(i => !excludedFees.has(i.fee_head_id))}
                      onChange={e => setExcludedFees(e.target.checked ? new Set() : new Set(feeItems.map(i => i.fee_head_id)))}
                      className="rounded" />
                  </th>
                  <th className="text-left py-3 px-4">Fee Head</th>
                  <th className="text-right py-3 px-4">Original</th>
                  <th className="text-right py-3 px-4">Concession</th>
                  <th className="text-right py-3 px-4">One-Time Adj.</th>
                  <th className="text-right py-3 px-4">Net Amount</th>
                </tr>
              </thead>
              <tbody>
                {feeItems.map(item => {
                  const excluded = excludedFees.has(item.fee_head_id);
                  return (
                    <tr key={item.fee_head_id} className={`border-b transition ${excluded ? 'opacity-40 bg-gray-50' : 'hover:bg-gray-50'}`}>
                      <td className="py-3 px-3 text-center">
                        <input type="checkbox" checked={!excluded}
                          onChange={e => {
                            setExcludedFees(prev => {
                              const next = new Set(prev);
                              if (e.target.checked) next.delete(item.fee_head_id);
                              else next.add(item.fee_head_id);
                              return next;
                            });
                          }}
                          className="rounded" />
                      </td>
                      <td className={`py-3 px-4 ${excluded ? 'line-through text-gray-400' : ''}`}>{item.fee_head_name}</td>
                      <td className="py-3 px-4 text-right">
                        <input type="number" min="0" value={item.amount} disabled={excluded}
                          onChange={e => {
                            const newAmt = Number(e.target.value);
                            setFeeItems(prev => prev.map(fi => fi.fee_head_id === item.fee_head_id ? { ...fi, amount: newAmt, net: newAmt - fi.concession } : fi));
                          }}
                          className="w-24 text-right border rounded px-2 py-1 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed" />
                      </td>
                      <td className="py-3 px-4 text-right text-red-600">
                        <input type="number" min="0" value={item.concession} disabled={excluded}
                          onChange={e => {
                            const newDisc = Number(e.target.value);
                            setFeeItems(prev => prev.map(fi => fi.fee_head_id === item.fee_head_id ? { ...fi, concession: newDisc, net: fi.amount - newDisc } : fi));
                          }}
                          className="w-20 text-right border rounded px-2 py-1 text-sm text-red-600 disabled:bg-gray-100 disabled:cursor-not-allowed" />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <input type="number" min="0" placeholder="0" disabled={excluded}
                          className="w-20 text-right border rounded px-2 py-1 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                          value={oneTimeAdjustments[item.fee_head_id]?.amount || ''}
                          onChange={e => applyOneTimeAdjustment(item.fee_head_id, Number(e.target.value), '')}
                        />
                      </td>
                      <td className={`py-3 px-4 text-right font-medium ${excluded ? 'text-gray-300' : ''}`}>
                        {excluded ? '—' : `Rs. ${(item.net - (oneTimeAdjustments[item.fee_head_id]?.amount || 0)).toLocaleString()}`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 font-semibold">
                  <td></td>
                  <td className="py-3 px-4">Total <span className="text-xs font-normal text-gray-400">({includedItems.length}/{feeItems.length} included)</span></td>
                  <td className="py-3 px-4 text-right">Rs. {totalOriginal.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right text-red-600">- Rs. {totalConcession.toLocaleString()}</td>
                  <td className="py-3 px-4"></td>
                  <td className="py-3 px-4 text-right text-lg">Rs. {grandTotal.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>

            {/* Permanent Concessions */}
            {concessions.length > 0 && (
              <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
                <h4 className="text-sm font-medium text-yellow-800 mb-2">Active Concessions</h4>
                {concessions.map(c => (
                  <div key={c.id} className="text-sm text-yellow-700">
                    {c.template_name || 'Custom'}: {c.type === 'percentage' ? `${c.value}%` : `Rs. ${c.value}`} on {c.fee_head_name || 'all fees'}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          {!generated ? (
            <div className="flex gap-3">
              <button onClick={generateChallan} disabled={generating || feeItems.length === 0}
                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition font-medium">
                <FileText size={18} /> {generating ? 'Generating...' : 'Generate Challan'}
              </button>
            </div>
          ) : generated.alreadyExists ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <FileText size={24} className="text-amber-600" />
                <h3 className="text-lg font-semibold text-amber-800">Challan Already Exists</h3>
              </div>
              <p className="text-amber-700 mb-4">Challan <span className="font-mono font-bold">{generated.challan_no}</span> was already generated for this student/month. You can view it or update the fee details.</p>
              <div className="flex gap-3">
                <Link href={`/challan/${generated.id}`} className="flex items-center gap-2 bg-white border border-amber-300 text-amber-700 px-4 py-2 rounded-lg hover:bg-amber-50 transition text-sm font-medium">
                  <Printer size={16} /> View & Print
                </Link>
                <button onClick={async () => {
                  if (!selectedStudent) return;
                  setGenerating(true);
                  try {
                    const items = feeItems.map(item => ({
                      fee_head_id: item.fee_head_id,
                      original_amount: item.amount,
                      concession_amount: item.concession + (oneTimeAdjustments[item.fee_head_id]?.amount || 0),
                      concession_reason: oneTimeAdjustments[item.fee_head_id]?.reason || null,
                      net_amount: item.net - (oneTimeAdjustments[item.fee_head_id]?.amount || 0),
                    }));
                    const res = await fetch(`/api/challans/${generated.id}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ items }),
                    });
                    if (res.ok) {
                      setGenerated({ ...generated, alreadyExists: false });
                    }
                  } catch { /* ignore */ }
                  setGenerating(false);
                }} disabled={generating}
                  className="flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 disabled:opacity-50 transition text-sm font-medium">
                  <FileText size={16} /> {generating ? 'Updating...' : 'Update Fee Details'}
                </button>
                <button onClick={() => { setSelectedStudent(null); setFeeItems([]); setGenerated(null); setExcludedFees(new Set()); }}
                  className="text-sm text-amber-600 hover:underline px-4 py-2">Generate Another</button>
              </div>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle size={24} className="text-green-600" />
                <h3 className="text-lg font-semibold text-green-800">Challan Generated Successfully</h3>
              </div>
              <p className="text-green-700 mb-4">Challan No: <span className="font-mono font-bold">{generated.challan_no}</span></p>
              <div className="flex gap-3">
                <Link href={`/challan/${generated.id}`} className="flex items-center gap-2 bg-white border border-green-300 text-green-700 px-4 py-2 rounded-lg hover:bg-green-50 transition text-sm font-medium">
                  <Printer size={16} /> View & Print
                </Link>
                <button onClick={() => { setSelectedStudent(null); setFeeItems([]); setGenerated(null); setExcludedFees(new Set()); }}
                  className="text-sm text-green-600 hover:underline px-4 py-2">Generate Another</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
