'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Printer, ArrowLeft, DollarSign } from 'lucide-react';
import Link from 'next/link';

interface FeeItem {
  fee_head_name: string;
  original_amount: number;
  concession_amount: number;
  net_amount: number;
}

interface VoucherStudent {
  student_id: number;
  student_name: string;
  father_name: string;
  roll_no: string;
  class_name: string;
  section_name: string;
  campus_name: string;
  subtotal: number;
  fees: FeeItem[];
}

interface VoucherDetail {
  id: number;
  voucher_no: string;
  family_name: string;
  guardian_name: string;
  contact_phone: string;
  family_address: string;
  campus_name: string;
  campus_code: string;
  campus_address: string;
  campus_phone: string;
  campus_email: string;
  campus_tagline: string;
  month: number;
  year: number;
  total_amount: number;
  concession_amount: number;
  net_amount: number;
  status: string;
  generated_at: string;
  students: VoucherStudent[];
  settings: Record<string, string>;
  bank: { bank_name: string; branch_name: string; account_title: string; account_number: string; iban: string } | null;
}

export default function FamilyVoucherPrintPage() {
  const params = useParams();
  const [voucher, setVoucher] = useState<VoucherDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/family-vouchers/${params.id}`)
      .then(r => r.json())
      .then(d => { setVoucher(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [params.id]);

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
  if (!voucher) return <div className="text-center py-20 text-gray-500">Voucher not found</div>;

  const monthName = new Date(2026, voucher.month - 1).toLocaleString('default', { month: 'long' });
  const issueDate = new Date(voucher.generated_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const orgName = voucher.settings?.organization_name || 'Educational Institute';
  const tagline = voucher.campus_tagline || voucher.settings?.tagline || 'Excellence in Education';
  const academicYear = voucher.settings?.academic_year || `${voucher.year - 1} – ${voucher.year}`;
  const logoBase64 = voucher.settings?.logo_base64 || null;

  // Get all unique fee heads across students
  const allFeeHeads: string[] = [];
  voucher.students.forEach(s => {
    s.fees.forEach(f => {
      if (!allFeeHeads.includes(f.fee_head_name)) allFeeHeads.push(f.fee_head_name);
    });
  });

  // Calculate due date
  const dueDay = voucher.settings?.default_due_date || '10';
  const dueDateStr = `${dueDay} ${new Date(2026, voucher.month, 0).toLocaleString('default', { month: 'short' })} ${voucher.year}`;

  return (
    <>
      {/* Screen-only toolbar */}
      <div className="print:hidden mb-6 flex items-center gap-4">
        <Link href="/family-voucher" className="p-2 hover:bg-gray-100 rounded-lg transition"><ArrowLeft size={20} /></Link>
        <h1 className="text-xl font-bold text-gray-900 flex-1">Family Voucher — {voucher.voucher_no}</h1>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
          voucher.status === 'paid' ? 'bg-green-100 text-green-700' :
          voucher.status === 'partially_paid' ? 'bg-yellow-100 text-yellow-700' :
          'bg-red-100 text-red-700'
        }`}>{voucher.status.replace('_', ' ').toUpperCase()}</span>
        <button onClick={() => {
          const originalTitle = document.title;
          const monthStr = new Date(2026, voucher.month - 1).toLocaleString('default', { month: 'long' });
          document.title = `${voucher.family_name} - Family Voucher ${monthStr} ${voucher.year}`;
          window.print();
          document.title = originalTitle;
        }} className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-lg hover:bg-gray-800 transition text-sm font-medium">
          <Printer size={16} /> Print Voucher
        </button>
      </div>

      {/* ─── PRINTABLE VOUCHER ─── */}
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
          </div>
          <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 13, letterSpacing: 2, textTransform: 'uppercase' }}>Family Fee Voucher</div>
        </div>

        <div style={{ padding: '0 48px 70px' }}>

          {/* ── Meta Row ── */}
          <div className="grid grid-cols-4" style={{ marginTop: 24, border: '1px solid #D0D0D0', borderRadius: 4, overflow: 'hidden' }}>
            {[
              { label: 'Voucher No.', value: voucher.voucher_no },
              { label: 'Issue Date', value: issueDate },
              { label: 'Valid Until', value: dueDateStr },
              { label: 'Academic Year', value: academicYear },
            ].map((m, i) => (
              <div key={i} style={{ padding: '12px 16px', borderRight: i < 3 ? '1px solid #D0D0D0' : 'none' }}>
                <div style={{ fontSize: 8.5, letterSpacing: 2, textTransform: 'uppercase', color: '#888', fontWeight: 600, marginBottom: 3 }}>{m.label}</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{m.value}</div>
              </div>
            ))}
          </div>

          {/* ── Guardian Information ── */}
          <div style={{ fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', color: '#888', fontWeight: 700, marginTop: 28, marginBottom: 10 }}>Guardian Information</div>
          <div className="grid grid-cols-2" style={{ border: '1px solid #D0D0D0', borderRadius: 4, overflow: 'hidden' }}>
            {[
              { label: 'Parent Name', value: voucher.guardian_name || '—' },
              { label: 'Contact', value: voucher.contact_phone || '—' },
              { label: 'Family Name', value: voucher.family_name || '—' },
              { label: 'Address', value: voucher.family_address || '—' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2" style={{
                padding: '10px 16px',
                borderBottom: i < 2 ? '1px solid #D0D0D0' : 'none',
                borderRight: i % 2 === 0 ? '1px solid #D0D0D0' : 'none',
              }}>
                <span style={{ fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase', color: '#888', fontWeight: 600, whiteSpace: 'nowrap', minWidth: 90 }}>{item.label}</span>
                <span style={{ flex: 1, borderBottom: '1px dotted #D0D0D0', minHeight: 18, fontSize: 12 }}>{item.value}</span>
              </div>
            ))}
          </div>

          {/* ── Enrolled Siblings Table ── */}
          <div style={{ fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', color: '#888', fontWeight: 700, marginTop: 28, marginBottom: 10 }}>Enrolled Siblings</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #D0D0D0', borderRadius: 4, overflow: 'hidden' }}>
            <thead>
              <tr>
                <th style={{ background: '#111', color: '#fff', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', fontWeight: 600, padding: '10px 14px', textAlign: 'left', width: 30 }}>#</th>
                <th style={{ background: '#111', color: '#fff', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', fontWeight: 600, padding: '10px 14px', textAlign: 'left' }}>Student Name</th>
                <th style={{ background: '#111', color: '#fff', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', fontWeight: 600, padding: '10px 14px', textAlign: 'left' }}>Class</th>
                {allFeeHeads.map(fh => (
                  <th key={fh} style={{ background: '#111', color: '#fff', fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600, padding: '10px 10px', textAlign: 'right' }}>{fh.replace(' Fee', '')}</th>
                ))}
                <th style={{ background: '#111', color: '#fff', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', fontWeight: 600, padding: '10px 14px', textAlign: 'right' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {voucher.students.map((s, i) => (
                <tr key={s.student_id}>
                  <td style={{ padding: '10px 14px', fontSize: 12, borderBottom: i < voucher.students.length - 1 ? '1px solid #E8E8E8' : 'none' }}>{i + 1}</td>
                  <td style={{ padding: '10px 14px', fontSize: 12, borderBottom: i < voucher.students.length - 1 ? '1px solid #E8E8E8' : 'none', fontWeight: 500 }}>{s.student_name}</td>
                  <td style={{ padding: '10px 14px', fontSize: 12, borderBottom: i < voucher.students.length - 1 ? '1px solid #E8E8E8' : 'none' }}>{s.class_name} {s.section_name}</td>
                  {allFeeHeads.map(fh => {
                    const fee = s.fees.find(f => f.fee_head_name === fh);
                    return (
                      <td key={fh} style={{ padding: '10px 10px', fontSize: 12, borderBottom: i < voucher.students.length - 1 ? '1px solid #E8E8E8' : 'none', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>
                        {fee ? `Rs. ${fee.net_amount.toLocaleString()}` : '—'}
                      </td>
                    );
                  })}
                  <td style={{ padding: '10px 14px', fontSize: 12, borderBottom: i < voucher.students.length - 1 ? '1px solid #E8E8E8' : 'none', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                    Rs. {s.subtotal.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* ── Fee Summary ── */}
          <div style={{ fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', color: '#888', fontWeight: 700, marginTop: 28, marginBottom: 10 }}>Fee Summary</div>
          <div style={{ border: '1px solid #D0D0D0', borderRadius: 4, overflow: 'hidden' }}>
            {/* Per fee head totals */}
            {allFeeHeads.map((fh, i) => {
              const total = voucher.students.reduce((sum, s) => {
                const fee = s.fees.find(f => f.fee_head_name === fh);
                return sum + (fee ? fee.net_amount : 0);
              }, 0);
              return (
                <div key={fh} className="flex justify-between items-center" style={{ padding: '10px 18px', borderBottom: '1px solid #E8E8E8', fontSize: 12.5 }}>
                  <span style={{ color: '#444', fontWeight: 500 }}>Total {fh}</span>
                  <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>Rs. {total.toLocaleString()}</span>
                </div>
              );
            })}

            {/* Gross */}
            <div className="flex justify-between items-center" style={{ padding: '10px 18px', borderBottom: '1px solid #E8E8E8', fontSize: 12.5 }}>
              <span style={{ color: '#444', fontWeight: 500 }}>Gross Amount</span>
              <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>Rs. {voucher.total_amount.toLocaleString()}</span>
            </div>

            {/* Concession/Discount */}
            {voucher.concession_amount > 0 && (
              <div className="flex justify-between items-center" style={{ padding: '10px 18px', borderBottom: '1px solid #E8E8E8', fontSize: 12.5 }}>
                <span style={{ color: '#444', fontWeight: 500 }}>Concession / Sibling Discount</span>
                <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: '#B91C1C' }}>– Rs. {voucher.concession_amount.toLocaleString()}</span>
              </div>
            )}

            {/* Net Payable */}
            <div className="flex justify-between items-center" style={{ padding: '13px 18px', background: '#111' }}>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>Net Payable</span>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 14, fontVariantNumeric: 'tabular-nums' }}>Rs. {voucher.net_amount.toLocaleString()}</span>
            </div>
          </div>

          {/* ── Bank Details ── */}
          {voucher.bank && (
            <>
              <div style={{ fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', color: '#888', fontWeight: 700, marginTop: 28, marginBottom: 10 }}>Bank Details</div>
              <div className="grid grid-cols-2" style={{ border: '1px solid #D0D0D0', borderRadius: 4, overflow: 'hidden' }}>
                {[
                  { label: 'Bank', value: `${voucher.bank.bank_name} — ${voucher.bank.branch_name}` },
                  { label: 'Account Title', value: voucher.bank.account_title },
                  { label: 'Account No.', value: voucher.bank.account_number },
                  { label: 'IBAN', value: voucher.bank.iban || '—' },
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

          {/* ── Terms & Conditions ── */}
          <div style={{ fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', color: '#888', fontWeight: 700, marginTop: 28, marginBottom: 10 }}>Terms &amp; Conditions</div>
          <ol style={{ listStyle: 'none', counterReset: 't', padding: 0, margin: 0 }}>
            {[
              'Applicable only for siblings enrolled simultaneously in the same academic year.',
              'Discount applies to the younger sibling\'s fee; the elder pays standard fee.',
              'Voucher must be presented at the time of fee submission and is non-transferable.',
              'The institute reserves the right to revoke the discount upon withdrawal of any sibling.',
              'Valid only for the academic period mentioned above; must be renewed annually.',
              'Outstanding dues must be cleared before the sibling discount is applied.',
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
          <span style={{ fontSize: 9, color: '#888' }}>{voucher.campus_address || '123 Education Avenue, Lahore'}</span>
          <span style={{ fontSize: 9, color: '#888' }}>{voucher.campus_phone || ''}</span>
          <span style={{ fontSize: 9, color: '#888' }}>{voucher.campus_email || ''}</span>
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
    </>
  );
}
