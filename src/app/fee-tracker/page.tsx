'use client';

import { useEffect, useState } from 'react';
import { useCampus } from '@/components/layout/CampusContext';
import { Search, DollarSign, Download } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';

type Tab = 'record' | 'ledger' | 'tracker' | 'defaulters' | 'daily';

export default function FeeTrackerPage() {
  const [activeTab, setActiveTab] = useState<Tab>('record');
  const tabs: { key: Tab; label: string }[] = [
    { key: 'record', label: 'Record Payment' },
    { key: 'ledger', label: 'Student Ledger' },
    { key: 'tracker', label: 'Class Tracker' },
    { key: 'defaulters', label: 'Defaulters' },
    { key: 'daily', label: 'Daily Report' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Fee Tracker</h1>
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition ${activeTab === t.key ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}>
            {t.label}
          </button>
        ))}
      </div>
      {activeTab === 'record' && <RecordPayment />}
      {activeTab === 'ledger' && <StudentLedger />}
      {activeTab === 'tracker' && <ClassTracker />}
      {activeTab === 'defaulters' && <Defaulters />}
      {activeTab === 'daily' && <DailyReport />}
    </div>
  );
}

function RecordPayment() {
  const { selectedCampusId } = useCampus();
  const [searchQuery, setSearchQuery] = useState('');
  const [challans, setChallans] = useState<{ id: number; challan_no: string; student_name: string; grand_total: number; status: string }[]>([]);
  const [selectedChallan, setSelectedChallan] = useState<{ id: number; challan_no: string; student_name: string; grand_total: number } | null>(null);
  const [form, setForm] = useState({ amount: 0, mode: 'cash', date: new Date().toISOString().split('T')[0], notes: '' });
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (searchQuery.length < 2) { setChallans([]); return; }
    const timer = setTimeout(() => {
      fetch(`/api/challans?campus_id=${selectedCampusId}&search=${encodeURIComponent(searchQuery)}&status=unpaid`)
        .then(r => r.json()).then(setChallans).catch(() => {});
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCampusId]);

  const submitPayment = async () => {
    if (!selectedChallan) return;
    try {
      await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campus_id: selectedCampusId, challan_id: selectedChallan.id, amount_paid: form.amount || selectedChallan.grand_total, payment_date: form.date, payment_mode: form.mode, notes: form.notes }),
      });
      setSuccess(true);
      setTimeout(() => { setSuccess(false); setSelectedChallan(null); setSearchQuery(''); }, 2000);
    } catch { /* ignore */ }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
      {success && <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-4 font-medium">Payment recorded successfully!</div>}
      {!selectedChallan ? (
        <div>
          <label className="block text-sm font-medium mb-1">Search Challan or Student</label>
          <div className="relative">
            <Search size={18} className="absolute left-3 top-3 text-gray-400" />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Enter challan number or student name..." className="w-full pl-10 pr-4 py-2.5 border rounded-lg" />
          </div>
          {challans.length > 0 && (
            <div className="mt-2 border rounded-lg max-h-64 overflow-y-auto">
              {challans.map(c => (
                <button key={c.id} onClick={() => { setSelectedChallan(c); setForm(f => ({ ...f, amount: c.grand_total })); setSearchQuery(''); setChallans([]); }}
                  className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b last:border-b-0">
                  <div className="flex justify-between">
                    <div><span className="font-mono text-sm">{c.challan_no}</span> · <span className="font-medium">{c.student_name}</span></div>
                    <div className="flex items-center gap-2"><span className="font-bold">Rs. {c.grand_total?.toLocaleString()}</span><StatusBadge status={c.status} /></div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex justify-between"><span className="font-mono">{selectedChallan.challan_no}</span><button onClick={() => setSelectedChallan(null)} className="text-sm text-blue-600 hover:underline">Change</button></div>
            <div className="font-medium mt-1">{selectedChallan.student_name}</div>
            <div className="text-lg font-bold mt-1">Amount Due: Rs. {selectedChallan.grand_total.toLocaleString()}</div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">Amount</label><input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: Number(e.target.value) }))} className="w-full border rounded-lg px-3 py-2" /></div>
            <div><label className="block text-sm font-medium mb-1">Payment Mode</label>
              <select value={form.mode} onChange={e => setForm(f => ({ ...f, mode: e.target.value }))} className="w-full border rounded-lg px-3 py-2">
                <option value="cash">Cash</option><option value="bank">Bank</option><option value="online">Online</option><option value="cheque">Cheque</option><option value="jazzcash">JazzCash</option><option value="easypaisa">EasyPaisa</option>
              </select>
            </div>
            <div><label className="block text-sm font-medium mb-1">Date</label><input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="w-full border rounded-lg px-3 py-2" /></div>
            <div><label className="block text-sm font-medium mb-1">Notes</label><input type="text" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="w-full border rounded-lg px-3 py-2" placeholder="Optional" /></div>
          </div>
          <button onClick={submitPayment} className="flex items-center gap-2 bg-green-600 text-white px-6 py-2.5 rounded-lg hover:bg-green-700 font-medium"><DollarSign size={18} /> Record Payment</button>
        </div>
      )}
    </div>
  );
}

function StudentLedger() {
  const { selectedCampusId } = useCampus();
  const [search, setSearch] = useState('');
  const [students, setStudents] = useState<{ id: number; name: string; father_name: string }[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [challans, setChallans] = useState<{ challan_no: string; month: number; year: number; grand_total: number; status: string; payment_date?: string }[]>([]);

  useEffect(() => {
    if (search.length < 2) { setStudents([]); return; }
    const t = setTimeout(() => { fetch(`/api/students?campus_id=${selectedCampusId}&search=${encodeURIComponent(search)}`).then(r => r.json()).then(setStudents).catch(() => {}); }, 300);
    return () => clearTimeout(t);
  }, [search, selectedCampusId]);

  useEffect(() => {
    if (!selectedId) return;
    fetch(`/api/challans?student_id=${selectedId}`).then(r => r.json()).then(setChallans).catch(() => {});
  }, [selectedId]);

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
      <div className="relative">
        <Search size={18} className="absolute left-3 top-3 text-gray-400" />
        <input type="text" value={search} onChange={e => { setSearch(e.target.value); setSelectedId(null); }} placeholder="Search student..." className="w-full pl-10 pr-4 py-2.5 border rounded-lg" />
      </div>
      {students.length > 0 && !selectedId && (
        <div className="border rounded-lg max-h-48 overflow-y-auto">
          {students.map(s => <button key={s.id} onClick={() => { setSelectedId(s.id); setSearch(s.name); setStudents([]); }} className="w-full text-left px-4 py-2 hover:bg-blue-50 border-b text-sm">{s.name} - S/O {s.father_name}</button>)}
        </div>
      )}
      {selectedId && challans.length > 0 && (
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-50 border-b"><th className="text-left py-2 px-3">Month</th><th className="text-left py-2 px-3">Challan #</th><th className="text-right py-2 px-3">Total</th><th className="text-center py-2 px-3">Status</th></tr></thead>
          <tbody>
            {challans.map((c, i) => (
              <tr key={i} className="border-b hover:bg-gray-50">
                <td className="py-2 px-3">{new Date(2026, c.month - 1).toLocaleString('default', { month: 'short' })} {c.year}</td>
                <td className="py-2 px-3 font-mono text-xs">{c.challan_no}</td>
                <td className="py-2 px-3 text-right font-medium">Rs. {c.grand_total?.toLocaleString()}</td>
                <td className="py-2 px-3 text-center"><StatusBadge status={c.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {selectedId && challans.length === 0 && <p className="text-gray-400 text-center py-8">No challans found</p>}
    </div>
  );
}

function ClassTracker() {
  const { selectedCampusId } = useCampus();
  const [classes, setClasses] = useState<{ id: number; name: string }[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [students, setStudents] = useState<{ name: string; months: Record<number, string> }[]>([]);

  useEffect(() => { fetch(`/api/classes?campus_id=${selectedCampusId}`).then(r => r.json()).then(setClasses).catch(() => {}); }, [selectedCampusId]);

  useEffect(() => {
    if (!selectedClass) return;
    // Fetch students and their challan statuses
    fetch(`/api/students?campus_id=${selectedCampusId}&class_id=${selectedClass}`)
      .then(r => r.json())
      .then(async (studs: { id: number; name: string }[]) => {
        const result = await Promise.all(studs.map(async (s) => {
          const challans = await fetch(`/api/challans?student_id=${s.id}`).then(r => r.json()).catch(() => []);
          const months: Record<number, string> = {};
          for (const c of (challans || [])) months[c.month] = c.status;
          return { name: s.name, months };
        }));
        setStudents(result);
      }).catch(() => {});
  }, [selectedClass, selectedCampusId]);

  const statusColor: Record<string, string> = { paid: 'bg-green-500', partially_paid: 'bg-orange-400', unpaid: 'bg-gray-300', overdue: 'bg-red-500' };
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
      <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="border rounded-lg px-3 py-2">
        <option value="">Select Class</option>
        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      {students.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50"><th className="text-left py-2 px-3">Student</th>{monthNames.map(m => <th key={m} className="text-center py-2 px-2 text-xs">{m}</th>)}</tr></thead>
            <tbody>
              {students.map((s, i) => (
                <tr key={i} className="border-t">
                  <td className="py-2 px-3 font-medium text-xs">{s.name}</td>
                  {Array.from({ length: 12 }, (_, mi) => (
                    <td key={mi} className="py-2 px-2 text-center">
                      <div className={`w-6 h-6 rounded mx-auto ${statusColor[s.months[mi + 1]] || 'bg-gray-100'}`} title={s.months[mi + 1] || 'N/A'} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex gap-4 mt-4 text-xs">
            <div className="flex items-center gap-1"><div className="w-4 h-4 bg-green-500 rounded" /> Paid</div>
            <div className="flex items-center gap-1"><div className="w-4 h-4 bg-orange-400 rounded" /> Partial</div>
            <div className="flex items-center gap-1"><div className="w-4 h-4 bg-gray-300 rounded" /> Unpaid</div>
            <div className="flex items-center gap-1"><div className="w-4 h-4 bg-red-500 rounded" /> Overdue</div>
          </div>
        </div>
      )}
    </div>
  );
}

function Defaulters() {
  const { selectedCampusId } = useCampus();
  const [defaulters, setDefaulters] = useState<{ name: string; father_name: string; class_name: string; section_name: string; amount_due: number; due_date: string; contact_phone: string }[]>([]);

  useEffect(() => {
    fetch(`/api/reports/defaulters?campus_id=${selectedCampusId}`).then(r => r.json()).then(setDefaulters).catch(() => {});
  }, [selectedCampusId]);

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Defaulter Students</h3>
        <button className="flex items-center gap-2 text-sm border rounded-lg px-3 py-1.5 hover:bg-gray-50"><Download size={14} /> Export</button>
      </div>
      <table className="w-full text-sm">
        <thead><tr className="bg-gray-50 border-b"><th className="text-left py-2 px-3">Student</th><th className="text-left py-2 px-3">Father</th><th className="text-left py-2 px-3">Class</th><th className="text-right py-2 px-3">Amount Due</th><th className="text-left py-2 px-3">Due Date</th><th className="text-left py-2 px-3">Contact</th></tr></thead>
        <tbody>
          {defaulters.map((d, i) => (
            <tr key={i} className="border-b hover:bg-gray-50">
              <td className="py-2 px-3 font-medium">{d.name}</td>
              <td className="py-2 px-3">{d.father_name}</td>
              <td className="py-2 px-3">{d.class_name} {d.section_name}</td>
              <td className="py-2 px-3 text-right font-bold text-red-600">Rs. {d.amount_due?.toLocaleString()}</td>
              <td className="py-2 px-3">{d.due_date}</td>
              <td className="py-2 px-3">{d.contact_phone || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {defaulters.length === 0 && <p className="text-gray-400 text-center py-8">No defaulters found</p>}
    </div>
  );
}

function DailyReport() {
  const { selectedCampusId } = useCampus();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [payments, setPayments] = useState<{ receipt_no: string; student_name: string; amount_paid: number; payment_mode: string }[]>([]);

  useEffect(() => {
    fetch(`/api/payments?campus_id=${selectedCampusId}&date=${date}`).then(r => r.json()).then(setPayments).catch(() => {});
  }, [date, selectedCampusId]);

  const total = payments.reduce((s, p) => s + (p.amount_paid || 0), 0);
  const byMode: Record<string, number> = {};
  payments.forEach(p => { byMode[p.payment_mode] = (byMode[p.payment_mode] || 0) + (p.amount_paid || 0); });

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center gap-4 mb-4">
          <label className="text-sm font-medium">Date:</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="border rounded-lg px-3 py-2" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-green-50 rounded-lg p-4"><div className="text-sm text-green-600">Total Collected</div><div className="text-xl font-bold text-green-800">Rs. {total.toLocaleString()}</div></div>
          {Object.entries(byMode).map(([mode, amount]) => (
            <div key={mode} className="bg-gray-50 rounded-lg p-4"><div className="text-sm text-gray-500 capitalize">{mode}</div><div className="text-lg font-bold">Rs. {amount.toLocaleString()}</div></div>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="font-semibold mb-4">Payment List</h3>
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-50 border-b"><th className="text-left py-2 px-3">Receipt #</th><th className="text-left py-2 px-3">Student</th><th className="text-right py-2 px-3">Amount</th><th className="text-left py-2 px-3">Mode</th></tr></thead>
          <tbody>
            {payments.map((p, i) => (
              <tr key={i} className="border-b"><td className="py-2 px-3 font-mono text-xs">{p.receipt_no}</td><td className="py-2 px-3">{p.student_name}</td><td className="py-2 px-3 text-right font-medium">Rs. {p.amount_paid?.toLocaleString()}</td><td className="py-2 px-3 capitalize">{p.payment_mode}</td></tr>
            ))}
          </tbody>
        </table>
        {payments.length === 0 && <p className="text-gray-400 text-center py-8">No payments for this date</p>}
      </div>
    </div>
  );
}
