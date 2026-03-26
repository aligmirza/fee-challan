'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Printer, DollarSign, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';

interface ChallanDetail {
  id: number; challan_no: string; student_name: string; father_name: string; class_name: string;
  section_name: string; roll_no: string; campus_name: string; campus_code: string;
  campus_address: string; campus_phone: string; month: number; year: number;
  total_amount: number; concession_amount: number; net_amount: number; arrears: number;
  late_fee: number; grand_total: number; due_date: string; status: string; generated_at: string;
  items: { fee_head_name: string; original_amount: number; concession_amount: number; net_amount: number }[];
  settings: Record<string, string>;
  bank: { bank_name: string; branch_name: string; account_title: string; account_number: string; iban: string } | null;
}

export default function ChallanDetailPage() {
  const params = useParams();
  const [challan, setChallan] = useState<ChallanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentModal, setPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ amount: 0, mode: 'cash', notes: '' });
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    fetch(`/api/challans/${params.id}`).then(r => r.json()).then(d => { setChallan(d); setLoading(false); }).catch(() => setLoading(false));
  }, [params.id]);

  const recordPayment = async () => {
    if (!challan) return;
    setPaying(true);
    try {
      await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campus_id: 1, challan_id: challan.id, amount_paid: paymentForm.amount || challan.grand_total, payment_date: new Date().toISOString().split('T')[0], payment_mode: paymentForm.mode, notes: paymentForm.notes }),
      });
      setPaymentModal(false);
      const res = await fetch(`/api/challans/${params.id}`);
      setChallan(await res.json());
    } catch { /* ignore */ }
    setPaying(false);
  };

  const handlePrint = () => {
    if (!challan) return;
    const monthStr = new Date(2026, challan.month - 1).toLocaleString('default', { month: 'long' });
    const originalTitle = document.title;
    document.title = `${challan.student_name} - Fee Challan ${monthStr} ${challan.year}`;
    window.print();
    document.title = originalTitle;
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
  if (!challan) return <div className="text-center py-20 text-gray-500">Challan not found</div>;

  const monthName = new Date(2026, challan.month - 1).toLocaleString('default', { month: 'long' });
  const orgName = challan.settings?.organization_name || 'Educational Institute';
  const tagline = challan.settings?.tagline || 'Excellence in Education';
  const logoBase64 = challan.settings?.logo_base64 || null;
  const bank = challan.bank;

  return (
    <>
      {/* Screen-only toolbar */}
      <div className="print:hidden mb-6 flex items-center gap-4">
        <Link href="/search" className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft size={20} /></Link>
        <h1 className="text-xl font-bold text-gray-900 flex-1">Challan — {challan.challan_no}</h1>
        <StatusBadge status={challan.status} />
        {challan.status !== 'paid' && (
          <button onClick={() => { setPaymentForm({ amount: challan.grand_total, mode: 'cash', notes: '' }); setPaymentModal(true); }}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-lg hover:bg-green-700 transition text-sm font-medium">
            <DollarSign size={16} /> Record Payment
          </button>
        )}
        <button onClick={handlePrint} className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-lg hover:bg-gray-800 transition text-sm font-medium">
          <Printer size={16} /> Print Challan
        </button>
      </div>

      {/* ─── PRINTABLE CHALLAN ─── */}
      <div className="voucher-page bg-white relative mx-auto" style={{ width: '210mm', minHeight: '297mm', fontFamily: "'DM Sans', 'Inter', system-ui, sans-serif" }}>

        {/* ── Header ── */}
        <div className="flex items-center gap-5 pb-5" style={{ borderBottom: '2px solid #111', padding: '40px 48px 22px' }}>
          {logoBase64 ? (
            <img src={logoBase64} alt="Logo" style={{ width: 52, height: 52, objectFit: 'contain', borderRadius: 8 }} />
          ) : (
            <div className="flex items-center justify-center flex-shrink-0" style={{ width: 52, height: 52, border: '2px solid #111', borderRadius: '50%' }}>
              <svg viewBox="0 0 24 24" style={{ width: 26, height: 26, fill: '#111' }}><path d="M12 2L1 9l3 2v7c0 1 2 3 8 4 6-1 8-3 8-4v-7l3-2L12 2zm0 3l7 4.5V16c0 .5-1.5 2-7 3-5.5-1-7-2.5-7-3V9.5L12 5z"/></svg>
            </div>
          )}
          <div className="flex-1">
            <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 22 }}>{orgName}</div>
            <div style={{ fontSize: 11, color: '#888', letterSpacing: 3, textTransform: 'uppercase', marginTop: 2, fontWeight: 500 }}>{tagline}</div>
            <div style={{ fontSize: 10, color: '#aaa', marginTop: 2 }}>{challan.campus_name}</div>
          </div>
          <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 13, letterSpacing: 2, textTransform: 'uppercase' }}>Fee Challan</div>
        </div>

        <div style={{ padding: '0 48px 70px' }}>

          {/* ── Meta Row ── */}
          <div className="grid grid-cols-4" style={{ marginTop: 24, border: '1px solid #D0D0D0', borderRadius: 4, overflow: 'hidden' }}>
            {[
              { label: 'Challan No.', value: challan.challan_no },
              { label: 'Fee Month', value: `${monthName} ${challan.year}` },
              { label: 'Due Date', value: challan.due_date },
              { label: 'Status', value: challan.status.replace('_', ' ').toUpperCase() },
            ].map((m, i) => (
              <div key={i} style={{ padding: '12px 16px', borderRight: i < 3 ? '1px solid #D0D0D0' : 'none' }}>
                <div style={{ fontSize: 8.5, letterSpacing: 2, textTransform: 'uppercase', color: '#888', fontWeight: 600, marginBottom: 3 }}>{m.label}</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{m.value}</div>
              </div>
            ))}
          </div>

          {/* ── Student Information ── */}
          <div style={{ fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', color: '#888', fontWeight: 700, marginTop: 28, marginBottom: 10 }}>Student Information</div>
          <div className="grid grid-cols-2" style={{ border: '1px solid #D0D0D0', borderRadius: 4, overflow: 'hidden' }}>
            {[
              { label: 'Student Name', value: challan.student_name },
              { label: 'Father Name', value: challan.father_name },
              { label: 'Class / Section', value: `${challan.class_name} - ${challan.section_name}` },
              { label: 'Roll No.', value: challan.roll_no || '—' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2" style={{
                padding: '10px 16px',
                borderBottom: i < 2 ? '1px solid #D0D0D0' : 'none',
                borderRight: i % 2 === 0 ? '1px solid #D0D0D0' : 'none',
              }}>
                <span style={{ fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase', color: '#888', fontWeight: 600, whiteSpace: 'nowrap', minWidth: 90 }}>{item.label}</span>
                <span style={{ flex: 1, borderBottom: '1px dotted #D0D0D0', minHeight: 18, fontSize: 12, fontWeight: 500 }}>{item.value}</span>
              </div>
            ))}
          </div>

          {/* ── Fee Breakdown Table ── */}
          <div style={{ fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', color: '#888', fontWeight: 700, marginTop: 28, marginBottom: 10 }}>Fee Breakdown</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #D0D0D0', borderRadius: 4, overflow: 'hidden' }}>
            <thead>
              <tr>
                <th style={{ background: '#111', color: '#fff', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', fontWeight: 600, padding: '10px 14px', textAlign: 'left', width: 30 }}>#</th>
                <th style={{ background: '#111', color: '#fff', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', fontWeight: 600, padding: '10px 14px', textAlign: 'left' }}>Fee Description</th>
                <th style={{ background: '#111', color: '#fff', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', fontWeight: 600, padding: '10px 14px', textAlign: 'right' }}>Amount</th>
                <th style={{ background: '#111', color: '#fff', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', fontWeight: 600, padding: '10px 14px', textAlign: 'right' }}>Concession</th>
                <th style={{ background: '#111', color: '#fff', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', fontWeight: 600, padding: '10px 14px', textAlign: 'right' }}>Net Amount</th>
              </tr>
            </thead>
            <tbody>
              {(challan.items || []).map((item, i) => (
                <tr key={i}>
                  <td style={{ padding: '10px 14px', fontSize: 12, borderBottom: i < challan.items.length - 1 ? '1px solid #E8E8E8' : 'none' }}>{i + 1}</td>
                  <td style={{ padding: '10px 14px', fontSize: 12, borderBottom: i < challan.items.length - 1 ? '1px solid #E8E8E8' : 'none', fontWeight: 500 }}>{item.fee_head_name}</td>
                  <td style={{ padding: '10px 14px', fontSize: 12, borderBottom: i < challan.items.length - 1 ? '1px solid #E8E8E8' : 'none', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>Rs. {item.original_amount.toLocaleString()}</td>
                  <td style={{ padding: '10px 14px', fontSize: 12, borderBottom: i < challan.items.length - 1 ? '1px solid #E8E8E8' : 'none', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: item.concession_amount > 0 ? '#B91C1C' : '#aaa' }}>
                    {item.concession_amount > 0 ? `– Rs. ${item.concession_amount.toLocaleString()}` : '—'}
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: 12, borderBottom: i < challan.items.length - 1 ? '1px solid #E8E8E8' : 'none', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>Rs. {item.net_amount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* ── Fee Summary ── */}
          <div style={{ border: '1px solid #D0D0D0', borderRadius: 4, overflow: 'hidden', marginTop: 16 }}>
            <div className="flex justify-between items-center" style={{ padding: '10px 18px', borderBottom: '1px solid #E8E8E8', fontSize: 12.5 }}>
              <span style={{ color: '#444', fontWeight: 500 }}>Gross Amount</span>
              <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>Rs. {challan.total_amount.toLocaleString()}</span>
            </div>
            {challan.concession_amount > 0 && (
              <div className="flex justify-between items-center" style={{ padding: '10px 18px', borderBottom: '1px solid #E8E8E8', fontSize: 12.5 }}>
                <span style={{ color: '#444', fontWeight: 500 }}>Concession</span>
                <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: '#B91C1C' }}>– Rs. {challan.concession_amount.toLocaleString()}</span>
              </div>
            )}
            {(challan.arrears > 0) && (
              <div className="flex justify-between items-center" style={{ padding: '10px 18px', borderBottom: '1px solid #E8E8E8', fontSize: 12.5 }}>
                <span style={{ color: '#444', fontWeight: 500 }}>Arrears</span>
                <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>Rs. {challan.arrears.toLocaleString()}</span>
              </div>
            )}
            {(challan.late_fee > 0) && (
              <div className="flex justify-between items-center" style={{ padding: '10px 18px', borderBottom: '1px solid #E8E8E8', fontSize: 12.5 }}>
                <span style={{ color: '#444', fontWeight: 500 }}>Late Fee</span>
                <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>Rs. {challan.late_fee.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between items-center" style={{ padding: '13px 18px', background: '#111' }}>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>Net Payable</span>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 14, fontVariantNumeric: 'tabular-nums' }}>Rs. {challan.grand_total.toLocaleString()}</span>
            </div>
          </div>

          {/* ── Bank Details ── */}
          {bank && (
            <>
              <div style={{ fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', color: '#888', fontWeight: 700, marginTop: 28, marginBottom: 10 }}>Bank Details</div>
              <div className="grid grid-cols-2" style={{ border: '1px solid #D0D0D0', borderRadius: 4, overflow: 'hidden' }}>
                {[
                  { label: 'Bank', value: `${bank.bank_name} — ${bank.branch_name}` },
                  { label: 'Account Title', value: bank.account_title },
                  { label: 'Account No.', value: bank.account_number },
                  { label: 'IBAN', value: bank.iban || '—' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2" style={{
                    padding: '10px 16px',
                    borderBottom: i < 2 ? '1px solid #D0D0D0' : 'none',
                    borderRight: i % 2 === 0 ? '1px solid #D0D0D0' : 'none',
                  }}>
                    <span style={{ fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase', color: '#888', fontWeight: 600, whiteSpace: 'nowrap', minWidth: 90 }}>{item.label}</span>
                    <span style={{ flex: 1, borderBottom: '1px dotted #D0D0D0', minHeight: 18, fontSize: 12, fontFamily: item.label.includes('Account') || item.label === 'IBAN' ? 'monospace' : 'inherit' }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── Terms ── */}
          <div style={{ fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', color: '#888', fontWeight: 700, marginTop: 28, marginBottom: 10 }}>Terms &amp; Conditions</div>
          <ol style={{ listStyle: 'none', counterReset: 't', padding: 0, margin: 0 }}>
            {[
              'Fee must be deposited before the due date to avoid late fee charges.',
              'This challan is valid only for the month mentioned above.',
              'Deposit the exact amount. Partial payments may not be accepted.',
              'Keep the bank-stamped copy as proof of payment.',
            ].map((term, i) => (
              <li key={i} style={{ counterIncrement: 't', fontSize: 10.5, color: '#888', lineHeight: 1.7, paddingLeft: 22, position: 'relative', marginBottom: 2 }}>
                <span style={{ position: 'absolute', left: 0, fontWeight: 700, color: '#444', fontSize: 10 }}>{i + 1}.</span>
                {term}
              </li>
            ))}
          </ol>

          {/* ── Signatures ── */}
          <div className="flex justify-between items-end" style={{ marginTop: 44 }}>
            <div style={{ textAlign: 'center', width: 160 }}>
              <div style={{ borderTop: '1.2px solid #111', marginBottom: 6 }}></div>
              <div style={{ fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: '#888', fontWeight: 600 }}>Parent / Guardian</div>
            </div>
            <div style={{ width: 68, height: 68, border: '1px dashed #D0D0D0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, letterSpacing: 2, textTransform: 'uppercase', color: '#D0D0D0', fontWeight: 600 }}>Stamp</div>
            <div style={{ textAlign: 'center', width: 160 }}>
              <div style={{ borderTop: '1.2px solid #111', marginBottom: 6 }}></div>
              <div style={{ fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: '#888', fontWeight: 600 }}>Accounts</div>
            </div>
            <div style={{ textAlign: 'center', width: 160 }}>
              <div style={{ borderTop: '1.2px solid #111', marginBottom: 6 }}></div>
              <div style={{ fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: '#888', fontWeight: 600 }}>Principal</div>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex justify-between" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '14px 48px', borderTop: '1px solid #D0D0D0' }}>
          <span style={{ fontSize: 9, color: '#888' }}>{challan.campus_address || ''}</span>
          <span style={{ fontSize: 9, color: '#888' }}>{challan.campus_phone || ''}</span>
          <span style={{ fontSize: 9, color: '#888' }}>{challan.challan_no}</span>
        </div>
      </div>

      {/* ── Fonts + Print Styles ── */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600;700&display=swap" />
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body { background: white !important; }
          .print\\:hidden { display: none !important; }
          .voucher-page { box-shadow: none !important; margin: 0 !important; }
          @page { size: A4 portrait; margin: 0; }
        }
        @media screen {
          .voucher-page { box-shadow: 0 4px 30px rgba(0,0,0,0.1); border-radius: 4px; }
        }
      `}} />

      {/* Payment Modal */}
      <Modal isOpen={paymentModal} onClose={() => setPaymentModal(false)} title="Record Payment">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Amount</label>
            <input type="number" value={paymentForm.amount} onChange={e => setPaymentForm(p => ({ ...p, amount: Number(e.target.value) }))} className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Payment Mode</label>
            <select value={paymentForm.mode} onChange={e => setPaymentForm(p => ({ ...p, mode: e.target.value }))} className="w-full border rounded-lg px-3 py-2">
              <option value="cash">Cash</option><option value="bank">Bank Deposit</option><option value="online">Online Transfer</option>
              <option value="cheque">Cheque</option><option value="jazzcash">JazzCash</option><option value="easypaisa">EasyPaisa</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea value={paymentForm.notes} onChange={e => setPaymentForm(p => ({ ...p, notes: e.target.value }))} className="w-full border rounded-lg px-3 py-2" rows={2} />
          </div>
          <button onClick={recordPayment} disabled={paying} className="w-full bg-green-600 text-white py-2.5 rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium">
            {paying ? 'Processing...' : 'Confirm Payment'}
          </button>
        </div>
      </Modal>
    </>
  );
}
