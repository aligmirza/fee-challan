'use client';

import { useEffect, useState } from 'react';
import { useCampus } from '@/components/layout/CampusContext';
import { Download, FileText, Users, DollarSign, AlertTriangle } from 'lucide-react';

type Tab = 'defaulters' | 'collections' | 'arrears';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('defaulters');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <button className="flex items-center gap-2 border rounded-lg px-4 py-2 text-sm hover:bg-gray-50"><Download size={14} /> Export All</button>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        {[
          { key: 'defaulters' as Tab, label: 'Defaulter Report', icon: <AlertTriangle size={14} /> },
          { key: 'collections' as Tab, label: 'Collection Summary', icon: <DollarSign size={14} /> },
          { key: 'arrears' as Tab, label: 'Arrears Report', icon: <FileText size={14} /> },
        ].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition ${activeTab === t.key ? 'bg-white shadow text-blue-600' : 'text-gray-600'}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'defaulters' && <DefaulterReport />}
      {activeTab === 'collections' && <CollectionSummary />}
      {activeTab === 'arrears' && <ArrearsReport />}
    </div>
  );
}

function DefaulterReport() {
  const { selectedCampusId } = useCampus();
  const [classes, setClasses] = useState<{ id: number; name: string }[]>([]);
  const [filterClass, setFilterClass] = useState('');
  const [defaulters, setDefaulters] = useState<{ name: string; father_name: string; class_name: string; section_name: string; amount_due: number; due_date: string; contact_phone: string; month: number; year: number }[]>([]);

  useEffect(() => { fetch(`/api/classes?campus_id=${selectedCampusId}`).then(r => r.json()).then(setClasses).catch(() => {}); }, [selectedCampusId]);

  useEffect(() => {
    const params = new URLSearchParams({ campus_id: String(selectedCampusId) });
    if (filterClass) params.set('class_id', filterClass);
    fetch(`/api/reports/defaulters?${params}`).then(r => r.json()).then(setDefaulters).catch(() => {});
  }, [selectedCampusId, filterClass]);

  const totalDue = defaulters.reduce((s, d) => s + (d.amount_due || 0), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-red-50 border border-red-100 rounded-xl p-4"><div className="text-sm text-red-600">Total Defaulters</div><div className="text-2xl font-bold text-red-800">{defaulters.length}</div></div>
        <div className="bg-orange-50 border border-orange-100 rounded-xl p-4"><div className="text-sm text-orange-600">Total Amount Due</div><div className="text-2xl font-bold text-orange-800">Rs. {totalDue.toLocaleString()}</div></div>
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <label className="block text-sm text-blue-600 mb-1">Filter by Class</label>
          <select value={filterClass} onChange={e => setFilterClass(e.target.value)} className="w-full border rounded-lg px-2 py-1 text-sm">
            <option value="">All Classes</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-50 border-b"><th className="text-left py-3 px-4">Student</th><th className="text-left py-3 px-4">Father</th><th className="text-left py-3 px-4">Class</th><th className="text-left py-3 px-4">Month</th><th className="text-right py-3 px-4">Amount Due</th><th className="text-left py-3 px-4">Due Date</th><th className="text-left py-3 px-4">Contact</th></tr></thead>
          <tbody>
            {defaulters.map((d, i) => (
              <tr key={i} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4 font-medium">{d.name}</td>
                <td className="py-3 px-4">{d.father_name}</td>
                <td className="py-3 px-4">{d.class_name} {d.section_name}</td>
                <td className="py-3 px-4">{d.month && new Date(2026, d.month - 1).toLocaleString('default', { month: 'short' })} {d.year}</td>
                <td className="py-3 px-4 text-right font-bold text-red-600">Rs. {d.amount_due?.toLocaleString()}</td>
                <td className="py-3 px-4">{d.due_date}</td>
                <td className="py-3 px-4">{d.contact_phone || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {defaulters.length === 0 && <p className="text-gray-400 text-center py-12">No defaulters found</p>}
      </div>
    </div>
  );
}

function CollectionSummary() {
  const { selectedCampusId } = useCampus();
  const [payments, setPayments] = useState<{ receipt_no: string; student_name: string; amount_paid: number; payment_mode: string; payment_date: string }[]>([]);

  useEffect(() => {
    fetch(`/api/payments?campus_id=${selectedCampusId}`).then(r => r.json()).then(setPayments).catch(() => {});
  }, [selectedCampusId]);

  const total = payments.reduce((s, p) => s + (p.amount_paid || 0), 0);
  const byMode: Record<string, number> = {};
  payments.forEach(p => { byMode[p.payment_mode] = (byMode[p.payment_mode] || 0) + (p.amount_paid || 0); });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-green-50 border border-green-100 rounded-xl p-4"><div className="text-sm text-green-600">Total Collected</div><div className="text-2xl font-bold text-green-800">Rs. {total.toLocaleString()}</div></div>
        {Object.entries(byMode).map(([mode, amount]) => (
          <div key={mode} className="bg-gray-50 border rounded-xl p-4"><div className="text-sm text-gray-500 capitalize">{mode}</div><div className="text-xl font-bold">Rs. {amount.toLocaleString()}</div></div>
        ))}
      </div>
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-50 border-b"><th className="text-left py-3 px-4">Receipt #</th><th className="text-left py-3 px-4">Student</th><th className="text-right py-3 px-4">Amount</th><th className="text-left py-3 px-4">Mode</th><th className="text-left py-3 px-4">Date</th></tr></thead>
          <tbody>
            {payments.map((p, i) => (
              <tr key={i} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4 font-mono text-xs">{p.receipt_no}</td>
                <td className="py-3 px-4">{p.student_name}</td>
                <td className="py-3 px-4 text-right font-medium">Rs. {p.amount_paid?.toLocaleString()}</td>
                <td className="py-3 px-4 capitalize">{p.payment_mode}</td>
                <td className="py-3 px-4">{p.payment_date}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {payments.length === 0 && <p className="text-gray-400 text-center py-12">No payments recorded</p>}
      </div>
    </div>
  );
}

function ArrearsReport() {
  const { selectedCampusId } = useCampus();
  const [challans, setChallans] = useState<{ student_name: string; class_name: string; challan_no: string; month: number; year: number; grand_total: number; status: string }[]>([]);

  useEffect(() => {
    fetch(`/api/challans?campus_id=${selectedCampusId}&status=overdue`).then(r => r.json()).then(setChallans).catch(() => {});
  }, [selectedCampusId]);

  const totalArrears = challans.reduce((s, c) => s + (c.grand_total || 0), 0);

  return (
    <div className="space-y-4">
      <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 inline-block">
        <div className="text-sm text-orange-600">Total Outstanding Arrears</div>
        <div className="text-2xl font-bold text-orange-800">Rs. {totalArrears.toLocaleString()}</div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-50 border-b"><th className="text-left py-3 px-4">Student</th><th className="text-left py-3 px-4">Class</th><th className="text-left py-3 px-4">Challan #</th><th className="text-left py-3 px-4">Period</th><th className="text-right py-3 px-4">Amount</th></tr></thead>
          <tbody>
            {challans.map((c, i) => (
              <tr key={i} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4 font-medium">{c.student_name}</td>
                <td className="py-3 px-4">{c.class_name}</td>
                <td className="py-3 px-4 font-mono text-xs">{c.challan_no}</td>
                <td className="py-3 px-4">{c.month && new Date(2026, c.month - 1).toLocaleString('default', { month: 'short' })} {c.year}</td>
                <td className="py-3 px-4 text-right font-bold text-orange-600">Rs. {c.grand_total?.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {challans.length === 0 && <p className="text-gray-400 text-center py-12">No arrears found</p>}
      </div>
    </div>
  );
}
