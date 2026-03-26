'use client';

import { useEffect, useState, useCallback } from 'react';
import { useCampus } from '@/components/layout/CampusContext';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import {
  Search, DollarSign, Download, Users, Calendar, History,
  CheckCircle, CreditCard, Banknote, Receipt, FileText
} from 'lucide-react';

type Tab = 'collect' | 'family' | 'today' | 'history';

const PAYMENT_MODES = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank_deposit', label: 'Bank Deposit' },
  { value: 'online_transfer', label: 'Online Transfer' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'jazzcash', label: 'JazzCash' },
  { value: 'easypaisa', label: 'EasyPaisa' },
];

export default function CollectionsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('collect');
  const tabs: { key: Tab; label: string; icon: typeof DollarSign }[] = [
    { key: 'collect', label: 'Collect Fee', icon: DollarSign },
    { key: 'family', label: 'Family Collection', icon: Users },
    { key: 'today', label: "Today's Collection", icon: Calendar },
    { key: 'history', label: 'Collection History', icon: History },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Fee Collection</h1>
        <p className="text-gray-500 mt-1">Collect fees, track payments, and manage daily collections</p>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-sm font-medium transition ${activeTab === t.key ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}>
            <t.icon size={16} />
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'collect' && <CollectFee />}
      {activeTab === 'family' && <FamilyCollection />}
      {activeTab === 'today' && <TodaysCollection />}
      {activeTab === 'history' && <CollectionHistory />}
    </div>
  );
}

/* ─────────────────────────────── Tab 1: Collect Fee ─────────────────────────────── */

interface ChallanResult {
  id: number;
  challan_no: string;
  student_name: string;
  grand_total: number;
  amount_paid: number;
  status: string;
  month: number;
  year: number;
}

function CollectFee() {
  const { selectedCampusId } = useCampus();
  const [searchQuery, setSearchQuery] = useState('');
  const [challans, setChallans] = useState<ChallanResult[]>([]);
  const [selectedChallan, setSelectedChallan] = useState<ChallanResult | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [form, setForm] = useState({
    amount: 0,
    mode: 'cash',
    date: new Date().toISOString().split('T')[0],
    receipt_ref: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [successResult, setSuccessResult] = useState<{ receipt_no: string } | null>(null);

  useEffect(() => {
    if (searchQuery.length < 2) { setChallans([]); return; }
    const timer = setTimeout(() => {
      fetch(`/api/challans?campus_id=${selectedCampusId}&search=${encodeURIComponent(searchQuery)}&status=unpaid,partially_paid`)
        .then(r => r.json())
        .then((data: ChallanResult[]) => setChallans(Array.isArray(data) ? data : []))
        .catch(() => {});
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCampusId]);

  const openPayment = (challan: ChallanResult) => {
    const due = (challan.grand_total || 0) - (challan.amount_paid || 0);
    setSelectedChallan(challan);
    setForm({ amount: due > 0 ? due : challan.grand_total, mode: 'cash', date: new Date().toISOString().split('T')[0], receipt_ref: '', notes: '' });
    setShowPaymentModal(true);
    setSuccessResult(null);
  };

  const submitPayment = async () => {
    if (!selectedChallan || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campus_id: selectedCampusId,
          challan_id: selectedChallan.id,
          amount_paid: form.amount,
          payment_date: form.date,
          payment_mode: form.mode,
          reference_no: form.receipt_ref || null,
          notes: form.notes || null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessResult({ receipt_no: data.receipt_no || `PAY-${data.id}` });
        // Remove from list
        setChallans(prev => prev.filter(c => c.id !== selectedChallan.id));
        setSearchQuery('');
      } else {
        alert(data.error || 'Payment failed');
      }
    } catch {
      alert('Network error. Please try again.');
    }
    setSubmitting(false);
  };

  const closeModal = () => {
    setShowPaymentModal(false);
    setSelectedChallan(null);
    setSuccessResult(null);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-blue-50 rounded-lg"><DollarSign size={20} className="text-blue-600" /></div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Collect Fee Payment</h2>
          <p className="text-sm text-gray-500">Search by student name or challan number</p>
        </div>
      </div>

      <div className="relative">
        <Search size={18} className="absolute left-3 top-3 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Enter challan number or student name..."
          className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
      </div>

      {challans.length > 0 && (
        <div className="border rounded-lg max-h-96 overflow-y-auto divide-y">
          {challans.map(c => {
            const due = (c.grand_total || 0) - (c.amount_paid || 0);
            return (
              <button key={c.id} onClick={() => openPayment(c)}
                className="w-full text-left px-4 py-3 hover:bg-blue-50 transition">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-gray-600">{c.challan_no}</span>
                      <StatusBadge status={c.status} />
                    </div>
                    <div className="font-medium text-gray-900">{c.student_name}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">Rs. {due.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">Due Amount</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {searchQuery.length >= 2 && challans.length === 0 && (
        <p className="text-gray-400 text-center py-8">No unpaid challans found</p>
      )}

      {/* Payment Modal */}
      <Modal isOpen={showPaymentModal} onClose={closeModal} title="Record Payment" size="md"
        footer={
          successResult ? (
            <button onClick={closeModal} className="bg-gray-100 text-gray-700 px-6 py-2.5 rounded-lg hover:bg-gray-200 font-medium">
              Close
            </button>
          ) : (
            <>
              <button onClick={closeModal} className="text-gray-600 px-4 py-2.5 rounded-lg hover:bg-gray-100 font-medium">Cancel</button>
              <button onClick={submitPayment} disabled={submitting || !form.amount}
                className="flex items-center gap-2 bg-green-600 text-white px-6 py-2.5 rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                <DollarSign size={16} />
                {submitting ? 'Processing...' : 'Collect Payment'}
              </button>
            </>
          )
        }
      >
        {successResult ? (
          <div className="text-center py-6 space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle size={32} className="text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Payment Collected Successfully!</h3>
              <p className="text-gray-500 mt-1">Receipt Number</p>
              <p className="text-xl font-mono font-bold text-green-700 mt-1">{successResult.receipt_no}</p>
            </div>
          </div>
        ) : selectedChallan && (
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm">{selectedChallan.challan_no}</span>
                <StatusBadge status={selectedChallan.status} />
              </div>
              <div className="font-medium mt-1">{selectedChallan.student_name}</div>
              <div className="flex justify-between mt-2 text-sm">
                <span className="text-gray-600">Total: Rs. {selectedChallan.grand_total?.toLocaleString()}</span>
                <span className="font-bold text-blue-700">
                  Due: Rs. {((selectedChallan.grand_total || 0) - (selectedChallan.amount_paid || 0)).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: Number(e.target.value) }))}
                  className="w-full border rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
                <select value={form.mode} onChange={e => setForm(f => ({ ...f, mode: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                  {PAYMENT_MODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
                <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Receipt / Ref #</label>
                <input type="text" value={form.receipt_ref} onChange={e => setForm(f => ({ ...f, receipt_ref: e.target.value }))}
                  placeholder="Optional" className="w-full border rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <input type="text" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Optional notes..." className="w-full border rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

/* ─────────────────────────────── Tab 2: Family Collection ─────────────────────────────── */

interface FamilyResult {
  id: number;
  family_name: string;
  guardian_name: string;
  contact_phone: string;
}

interface FamilyVoucher {
  id: number;
  voucher_no: string;
  family_name: string;
  guardian_name: string;
  month: number;
  year: number;
  total_amount: number;
  net_amount: number;
  concession_amount: number;
  status: string;
  students: { student_name: string; class_name: string; subtotal: number }[];
}

function FamilyCollection() {
  const { selectedCampusId } = useCampus();
  const [searchQuery, setSearchQuery] = useState('');
  const [families, setFamilies] = useState<FamilyResult[]>([]);
  const [selectedFamily, setSelectedFamily] = useState<FamilyResult | null>(null);
  const [vouchers, setVouchers] = useState<FamilyVoucher[]>([]);
  const [loadingVouchers, setLoadingVouchers] = useState(false);

  // Payment modal state
  const [payVoucher, setPayVoucher] = useState<FamilyVoucher | null>(null);
  const [payForm, setPayForm] = useState({
    amount: 0, mode: 'cash', date: new Date().toISOString().split('T')[0], receipt_ref: '', notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [successResult, setSuccessResult] = useState<{ receipt_no: string } | null>(null);

  useEffect(() => {
    if (searchQuery.length < 2) { setFamilies([]); return; }
    const timer = setTimeout(() => {
      fetch(`/api/families?search=${encodeURIComponent(searchQuery)}`)
        .then(r => r.json())
        .then((data: FamilyResult[]) => setFamilies(Array.isArray(data) ? data : []))
        .catch(() => {});
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const selectFamily = async (family: FamilyResult) => {
    setSelectedFamily(family);
    setSearchQuery('');
    setFamilies([]);
    setLoadingVouchers(true);
    try {
      const res = await fetch(`/api/family-vouchers?family_id=${family.id}&status=unpaid`);
      const data = await res.json();
      // Also fetch partially paid
      const res2 = await fetch(`/api/family-vouchers?family_id=${family.id}&status=partially_paid`);
      const data2 = await res2.json();
      setVouchers([...(Array.isArray(data) ? data : []), ...(Array.isArray(data2) ? data2 : [])]);
    } catch {
      setVouchers([]);
    }
    setLoadingVouchers(false);
  };

  const openPayment = (voucher: FamilyVoucher) => {
    setPayVoucher(voucher);
    setPayForm({ amount: voucher.net_amount, mode: 'cash', date: new Date().toISOString().split('T')[0], receipt_ref: '', notes: '' });
    setSuccessResult(null);
  };

  const submitPayment = async () => {
    if (!payVoucher || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campus_id: selectedCampusId,
          voucher_id: payVoucher.id,
          amount_paid: payForm.amount,
          payment_date: payForm.date,
          payment_mode: payForm.mode,
          reference_no: payForm.receipt_ref || null,
          notes: payForm.notes || null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessResult({ receipt_no: data.receipt_no || `PAY-${data.id}` });
        setVouchers(prev => prev.filter(v => v.id !== payVoucher.id));
      } else {
        alert(data.error || 'Payment failed');
      }
    } catch {
      alert('Network error. Please try again.');
    }
    setSubmitting(false);
  };

  const collectAll = async () => {
    if (vouchers.length === 0 || submitting) return;
    setSubmitting(true);
    try {
      for (const v of vouchers) {
        await fetch('/api/payments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            campus_id: selectedCampusId,
            voucher_id: v.id,
            amount_paid: v.net_amount,
            payment_date: new Date().toISOString().split('T')[0],
            payment_mode: 'cash',
            notes: 'Bulk family collection',
          }),
        });
      }
      setVouchers([]);
      setSuccessResult({ receipt_no: 'All vouchers collected' });
    } catch {
      alert('Some payments may have failed. Please check.');
    }
    setSubmitting(false);
  };

  const closeModal = () => {
    setPayVoucher(null);
    setSuccessResult(null);
  };

  const monthName = (m: number) => new Date(2026, m - 1).toLocaleString('default', { month: 'short' });
  const familyTotal = vouchers.reduce((s, v) => s + (v.net_amount || 0), 0);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-purple-50 rounded-lg"><Users size={20} className="text-purple-600" /></div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Family Collection</h2>
            <p className="text-sm text-gray-500">Search families and collect fees for all children at once</p>
          </div>
        </div>

        {!selectedFamily ? (
          <>
            <div className="relative">
              <Search size={18} className="absolute left-3 top-3 text-gray-400" />
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by family name or guardian name..."
                className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
            </div>
            {families.length > 0 && (
              <div className="border rounded-lg max-h-64 overflow-y-auto divide-y">
                {families.map(f => (
                  <button key={f.id} onClick={() => selectFamily(f)}
                    className="w-full text-left px-4 py-3 hover:bg-purple-50 transition">
                    <div className="font-medium text-gray-900">{f.family_name}</div>
                    <div className="text-sm text-gray-500">Guardian: {f.guardian_name} {f.contact_phone && `| ${f.contact_phone}`}</div>
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center justify-between bg-purple-50 rounded-lg p-4">
              <div>
                <div className="font-semibold text-gray-900">{selectedFamily.family_name}</div>
                <div className="text-sm text-gray-600">Guardian: {selectedFamily.guardian_name}</div>
              </div>
              <button onClick={() => { setSelectedFamily(null); setVouchers([]); }}
                className="text-sm text-purple-600 hover:underline font-medium">Change Family</button>
            </div>

            {loadingVouchers ? (
              <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" /></div>
            ) : vouchers.length > 0 ? (
              <>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">{vouchers.length} unpaid voucher{vouchers.length > 1 ? 's' : ''} found</div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-gray-900">Total: Rs. {familyTotal.toLocaleString()}</span>
                    {vouchers.length > 1 && (
                      <button onClick={collectAll} disabled={submitting}
                        className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm font-medium disabled:opacity-50">
                        <DollarSign size={14} /> Collect All
                      </button>
                    )}
                  </div>
                </div>
                <div className="space-y-3">
                  {vouchers.map(v => (
                    <div key={v.id} className="border rounded-lg p-4 hover:border-purple-200 transition">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">{v.voucher_no}</span>
                          <StatusBadge status={v.status} />
                          <span className="text-sm text-gray-500">{monthName(v.month)} {v.year}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-gray-900">Rs. {v.net_amount?.toLocaleString()}</span>
                          <button onClick={() => openPayment(v)}
                            className="flex items-center gap-1.5 bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 text-sm font-medium">
                            <DollarSign size={14} /> Collect
                          </button>
                        </div>
                      </div>
                      {v.students && v.students.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {v.students.map((s, i) => (
                            <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                              {s.student_name} ({s.class_name}) - Rs. {s.subtotal?.toLocaleString()}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-gray-400 text-center py-8">No unpaid vouchers found for this family</p>
            )}
          </>
        )}
      </div>

      {/* Payment Modal for single voucher */}
      <Modal isOpen={!!payVoucher} onClose={closeModal} title="Collect Family Voucher Payment" size="md"
        footer={
          successResult ? (
            <button onClick={closeModal} className="bg-gray-100 text-gray-700 px-6 py-2.5 rounded-lg hover:bg-gray-200 font-medium">Close</button>
          ) : (
            <>
              <button onClick={closeModal} className="text-gray-600 px-4 py-2.5 rounded-lg hover:bg-gray-100 font-medium">Cancel</button>
              <button onClick={submitPayment} disabled={submitting || !payForm.amount}
                className="flex items-center gap-2 bg-green-600 text-white px-6 py-2.5 rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                <DollarSign size={16} />
                {submitting ? 'Processing...' : 'Collect Payment'}
              </button>
            </>
          )
        }
      >
        {successResult ? (
          <div className="text-center py-6 space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle size={32} className="text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Payment Collected Successfully!</h3>
              <p className="text-xl font-mono font-bold text-green-700 mt-2">{successResult.receipt_no}</p>
            </div>
          </div>
        ) : payVoucher && (
          <div className="space-y-4">
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm">{payVoucher.voucher_no}</span>
                <StatusBadge status={payVoucher.status} />
              </div>
              <div className="font-medium mt-1">{payVoucher.family_name}</div>
              <div className="text-lg font-bold mt-1">Amount: Rs. {payVoucher.net_amount?.toLocaleString()}</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <input type="number" value={payForm.amount} onChange={e => setPayForm(f => ({ ...f, amount: Number(e.target.value) }))}
                  className="w-full border rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
                <select value={payForm.mode} onChange={e => setPayForm(f => ({ ...f, mode: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                  {PAYMENT_MODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
                <input type="date" value={payForm.date} onChange={e => setPayForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Receipt / Ref #</label>
                <input type="text" value={payForm.receipt_ref} onChange={e => setPayForm(f => ({ ...f, receipt_ref: e.target.value }))}
                  placeholder="Optional" className="w-full border rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <input type="text" value={payForm.notes} onChange={e => setPayForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Optional notes..." className="w-full border rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

/* ─────────────────────────────── Tab 3: Today's Collection ─────────────────────────────── */

interface Payment {
  id: number;
  receipt_no: string;
  student_name: string;
  challan_no: string;
  voucher_no: string;
  amount_paid: number;
  payment_mode: string;
  payment_date: string;
  notes: string;
}

function TodaysCollection() {
  const { selectedCampusId } = useCampus();
  const today = new Date().toISOString().split('T')[0];
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPayments = useCallback(() => {
    setLoading(true);
    fetch(`/api/payments?campus_id=${selectedCampusId}&date_from=${today}&date_to=${today}`)
      .then(r => r.json())
      .then((data: Payment[]) => setPayments(Array.isArray(data) ? data : []))
      .catch(() => setPayments([]))
      .finally(() => setLoading(false));
  }, [selectedCampusId, today]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const total = payments.reduce((s, p) => s + (p.amount_paid || 0), 0);
  const byMode: Record<string, number> = {};
  payments.forEach(p => { byMode[p.payment_mode] = (byMode[p.payment_mode] || 0) + (p.amount_paid || 0); });

  const modeIcons: Record<string, typeof Banknote> = {
    cash: Banknote, bank_deposit: CreditCard, online_transfer: CreditCard,
    cheque: FileText, jazzcash: Receipt, easypaisa: Receipt,
  };
  const modeColors: Record<string, string> = {
    cash: 'bg-green-50 text-green-700', bank_deposit: 'bg-blue-50 text-blue-700',
    online_transfer: 'bg-indigo-50 text-indigo-700', cheque: 'bg-orange-50 text-orange-700',
    jazzcash: 'bg-red-50 text-red-700', easypaisa: 'bg-teal-50 text-teal-700',
  };

  return (
    <div className="space-y-4">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg"><DollarSign size={20} className="text-green-600" /></div>
            <div>
              <div className="text-sm text-gray-500">Total Collected</div>
              <div className="text-xl font-bold text-gray-900">Rs. {total.toLocaleString()}</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg"><Receipt size={20} className="text-blue-600" /></div>
            <div>
              <div className="text-sm text-gray-500">Transactions</div>
              <div className="text-xl font-bold text-gray-900">{payments.length}</div>
            </div>
          </div>
        </div>
        {Object.entries(byMode).slice(0, 2).map(([mode, amount]) => {
          const ModeIcon = modeIcons[mode] || Receipt;
          const colors = modeColors[mode] || 'bg-gray-50 text-gray-700';
          return (
            <div key={mode} className="bg-white rounded-xl shadow-sm border p-5">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${colors.split(' ')[0]}`}><ModeIcon size={20} className={colors.split(' ')[1]} /></div>
                <div>
                  <div className="text-sm text-gray-500 capitalize">{mode.replace('_', ' ')}</div>
                  <div className="text-xl font-bold text-gray-900">Rs. {amount.toLocaleString()}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Breakdown by mode */}
      {Object.keys(byMode).length > 2 && (
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Collection by Mode</h3>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {Object.entries(byMode).map(([mode, amount]) => (
              <div key={mode} className={`rounded-lg p-3 text-center ${modeColors[mode] || 'bg-gray-50'}`}>
                <div className="text-xs capitalize font-medium">{mode.replace('_', ' ')}</div>
                <div className="text-sm font-bold mt-0.5">Rs. {amount.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment List */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Today&apos;s Payments</h3>
          <button onClick={fetchPayments} className="text-sm text-blue-600 hover:underline font-medium">Refresh</button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
        ) : payments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left py-2.5 px-3 font-medium text-gray-600">Receipt #</th>
                  <th className="text-left py-2.5 px-3 font-medium text-gray-600">Student / Voucher</th>
                  <th className="text-left py-2.5 px-3 font-medium text-gray-600">Challan #</th>
                  <th className="text-right py-2.5 px-3 font-medium text-gray-600">Amount</th>
                  <th className="text-left py-2.5 px-3 font-medium text-gray-600">Mode</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id} className="border-b hover:bg-gray-50">
                    <td className="py-2.5 px-3 font-mono text-xs">{p.receipt_no || `PAY-${p.id}`}</td>
                    <td className="py-2.5 px-3 font-medium">{p.student_name || p.voucher_no || '-'}</td>
                    <td className="py-2.5 px-3 font-mono text-xs">{p.challan_no || '-'}</td>
                    <td className="py-2.5 px-3 text-right font-bold">Rs. {p.amount_paid?.toLocaleString()}</td>
                    <td className="py-2.5 px-3 capitalize">{(p.payment_mode || '').replace('_', ' ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-400 text-center py-8">No payments collected today</p>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────── Tab 4: Collection History ─────────────────────────────── */

function CollectionHistory() {
  const { selectedCampusId } = useCampus();
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [modeFilter, setModeFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchHistory = useCallback(() => {
    setLoading(true);
    let url = `/api/payments?campus_id=${selectedCampusId}&date_from=${dateFrom}&date_to=${dateTo}`;
    fetch(url)
      .then(r => r.json())
      .then((data: Payment[]) => setPayments(Array.isArray(data) ? data : []))
      .catch(() => setPayments([]))
      .finally(() => setLoading(false));
  }, [selectedCampusId, dateFrom, dateTo]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  // Client-side filtering for mode and search
  const filtered = payments.filter(p => {
    if (modeFilter && p.payment_mode !== modeFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchesStudent = (p.student_name || '').toLowerCase().includes(q);
      const matchesReceipt = (p.receipt_no || `PAY-${p.id}`).toLowerCase().includes(q);
      const matchesChallan = (p.challan_no || '').toLowerCase().includes(q);
      const matchesVoucher = (p.voucher_no || '').toLowerCase().includes(q);
      if (!matchesStudent && !matchesReceipt && !matchesChallan && !matchesVoucher) return false;
    }
    return true;
  });

  const totalFiltered = filtered.reduce((s, p) => s + (p.amount_paid || 0), 0);

  const exportCSV = () => {
    const headers = ['Receipt #', 'Student', 'Challan #', 'Amount', 'Mode', 'Date', 'Notes'];
    const rows = filtered.map(p => [
      p.receipt_no || `PAY-${p.id}`,
      p.student_name || p.voucher_no || '',
      p.challan_no || '',
      p.amount_paid,
      (p.payment_mode || '').replace('_', ' '),
      p.payment_date,
      p.notes || '',
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `collections_${dateFrom}_to_${dateTo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-amber-50 rounded-lg"><History size={20} className="text-amber-600" /></div>
          <h2 className="text-lg font-semibold text-gray-900">Collection History</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="w-full border rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="w-full border rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
            <select value={modeFilter} onChange={e => setModeFilter(e.target.value)}
              className="w-full border rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
              <option value="">All Modes</option>
              {PAYMENT_MODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search size={18} className="absolute left-3 top-3 text-gray-400" />
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Student name, receipt #, challan #..."
                className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Summary & Export */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{filtered.length} payment{filtered.length !== 1 ? 's' : ''} found</span>
          <span className="text-sm font-bold text-gray-900">Total: Rs. {totalFiltered.toLocaleString()}</span>
        </div>
        <button onClick={exportCSV}
          className="flex items-center gap-2 border rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
        ) : filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left py-2.5 px-4 font-medium text-gray-600">Receipt #</th>
                  <th className="text-left py-2.5 px-4 font-medium text-gray-600">Student</th>
                  <th className="text-left py-2.5 px-4 font-medium text-gray-600">Challan #</th>
                  <th className="text-right py-2.5 px-4 font-medium text-gray-600">Amount</th>
                  <th className="text-left py-2.5 px-4 font-medium text-gray-600">Mode</th>
                  <th className="text-left py-2.5 px-4 font-medium text-gray-600">Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} className="border-b hover:bg-gray-50 transition">
                    <td className="py-2.5 px-4 font-mono text-xs">{p.receipt_no || `PAY-${p.id}`}</td>
                    <td className="py-2.5 px-4 font-medium">{p.student_name || p.voucher_no || '-'}</td>
                    <td className="py-2.5 px-4 font-mono text-xs">{p.challan_no || '-'}</td>
                    <td className="py-2.5 px-4 text-right font-bold">Rs. {p.amount_paid?.toLocaleString()}</td>
                    <td className="py-2.5 px-4 capitalize">{(p.payment_mode || '').replace('_', ' ')}</td>
                    <td className="py-2.5 px-4">{p.payment_date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-400 text-center py-12">No payments found for the selected criteria</p>
        )}
      </div>
    </div>
  );
}
