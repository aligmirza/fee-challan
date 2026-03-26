'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useCampus } from '@/components/layout/CampusContext';
import StatusBadge from '@/components/ui/StatusBadge';
import {
  FileText,
  Users,
  Search,
  Download,
  CheckCircle,
  Clock,
  AlertTriangle,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Eye,
} from 'lucide-react';

type Tab = 'challans' | 'family';

interface Challan {
  id: number;
  challan_no: string;
  student_name: string;
  father_name: string;
  class_name: string;
  section_name: string;
  month: number;
  year: number;
  grand_total: number;
  total_amount: number;
  concession_amount: number;
  net_amount: number;
  status: string;
  generated_at: string;
}

interface FamilyVoucher {
  id: number;
  voucher_no: string;
  family_name: string;
  guardian_name: string;
  month: number;
  year: number;
  total_amount: number;
  concession_amount: number;
  net_amount: number;
  status: string;
  generated_at: string;
  students: { student_name: string }[];
}

const MONTHS = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: new Date(2026, i).toLocaleString('default', { month: 'long' }),
}));

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'paid', label: 'Paid' },
  { value: 'partially_paid', label: 'Partially Paid' },
  { value: 'overdue', label: 'Overdue' },
];

const PAGE_SIZE = 20;

function formatMonth(m: number, y: number) {
  if (!m) return '-';
  return `${new Date(2026, m - 1).toLocaleString('default', { month: 'short' })} ${y}`;
}

function formatRs(n: number) {
  return `Rs. ${(n || 0).toLocaleString()}`;
}

export default function VouchersPage() {
  const [activeTab, setActiveTab] = useState<Tab>('challans');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Vouchers</h1>
          <p className="text-sm text-gray-500 mt-1">View and manage individual challans and family vouchers</p>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        {[
          { key: 'challans' as Tab, label: 'Individual Challans', icon: <FileText size={14} /> },
          { key: 'family' as Tab, label: 'Family Vouchers', icon: <Users size={14} /> },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-sm font-medium transition ${
              activeTab === t.key ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'challans' && <IndividualChallansTab />}
      {activeTab === 'family' && <FamilyVouchersTab />}
    </div>
  );
}

/* ================================================================
   INDIVIDUAL CHALLANS TAB
   ================================================================ */
function IndividualChallansTab() {
  const { selectedCampusId } = useCampus();
  const [challans, setChallans] = useState<Challan[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const fetchChallans = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ campus_id: String(selectedCampusId) });
    if (statusFilter) params.set('status', statusFilter);
    if (monthFilter) params.set('month', monthFilter);
    if (yearFilter) params.set('year', yearFilter);
    fetch(`/api/challans?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setChallans(Array.isArray(data) ? data : []);
        setPage(1);
      })
      .catch(() => setChallans([]))
      .finally(() => setLoading(false));
  }, [selectedCampusId, statusFilter, monthFilter, yearFilter]);

  useEffect(() => {
    fetchChallans();
  }, [fetchChallans]);

  // Client-side search (API doesn't support search param yet)
  const filtered = useMemo(() => {
    if (!search.trim()) return challans;
    const q = search.toLowerCase();
    return challans.filter(
      (c) =>
        (c.student_name || '').toLowerCase().includes(q) ||
        (c.challan_no || '').toLowerCase().includes(q) ||
        (c.father_name || '').toLowerCase().includes(q)
    );
  }, [challans, search]);

  // Stats
  const stats = useMemo(() => {
    const total = filtered.length;
    const paid = filtered.filter((c) => c.status === 'paid').length;
    const unpaid = filtered.filter((c) => c.status === 'unpaid').length;
    const overdue = filtered.filter((c) => c.status === 'overdue').length;
    const totalAmount = filtered.reduce((s, c) => s + (c.grand_total || 0), 0);
    const paidAmount = filtered.filter((c) => c.status === 'paid').reduce((s, c) => s + (c.grand_total || 0), 0);
    const unpaidAmount = filtered.filter((c) => c.status !== 'paid').reduce((s, c) => s + (c.grand_total || 0), 0);
    return { total, paid, unpaid, overdue, totalAmount, paidAmount, unpaidAmount };
  }, [filtered]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const exportCSV = () => {
    const headers = ['Challan#', 'Student Name', 'Father Name', 'Class', 'Month', 'Amount', 'Status'];
    const rows = filtered.map((c) => [
      c.challan_no,
      c.student_name,
      c.father_name,
      `${c.class_name || ''} ${c.section_name || ''}`.trim(),
      formatMonth(c.month, c.year),
      c.grand_total || 0,
      c.status,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `challans_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCardInline icon={<FileText size={20} />} label="Total Challans" value={stats.total} sub={formatRs(stats.totalAmount)} color="blue" />
        <StatCardInline icon={<CheckCircle size={20} />} label="Paid" value={stats.paid} sub={formatRs(stats.paidAmount)} color="green" />
        <StatCardInline icon={<Clock size={20} />} label="Unpaid" value={stats.unpaid} sub={formatRs(stats.unpaidAmount)} color="orange" />
        <StatCardInline icon={<AlertTriangle size={20} />} label="Overdue" value={stats.overdue} sub="" color="red" />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search student name or challan number..."
              className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
            <option value="">All Months</option>
            {MONTHS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
          <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
            <option value="">All Years</option>
            <option value="2025">2025</option>
            <option value="2026">2026</option>
          </select>
          <button onClick={exportCSV} className="flex items-center gap-2 border rounded-lg px-4 py-2 text-sm hover:bg-gray-50 transition">
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Challan #</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Student Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Father</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Class</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Month</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-600">Amount</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-600">Status</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((c) => (
                    <tr key={c.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 font-mono text-xs text-blue-700">{c.challan_no}</td>
                      <td className="py-3 px-4 font-medium text-gray-900">{c.student_name}</td>
                      <td className="py-3 px-4 text-gray-600">{c.father_name}</td>
                      <td className="py-3 px-4 text-gray-600">
                        {c.class_name}{c.section_name ? ` ${c.section_name}` : ''}
                      </td>
                      <td className="py-3 px-4 text-gray-600">{formatMonth(c.month, c.year)}</td>
                      <td className="py-3 px-4 text-right font-semibold">{formatRs(c.grand_total)}</td>
                      <td className="py-3 px-4 text-center">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/challan/${c.id}`}
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          <Eye size={14} /> View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filtered.length === 0 && (
              <p className="text-gray-400 text-center py-12">No challans found</p>
            )}
            {/* Pagination */}
            {filtered.length > PAGE_SIZE && (
              <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
                <span className="text-sm text-gray-500">
                  Showing {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-8 h-8 rounded text-sm font-medium ${
                          page === pageNum ? 'bg-blue-600 text-white' : 'hover:bg-gray-200 text-gray-700'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ================================================================
   FAMILY VOUCHERS TAB
   ================================================================ */
function FamilyVouchersTab() {
  const { selectedCampusId } = useCampus();
  const [vouchers, setVouchers] = useState<FamilyVoucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const fetchVouchers = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ campus_id: String(selectedCampusId) });
    if (statusFilter) params.set('status', statusFilter);
    fetch(`/api/family-vouchers?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setVouchers(Array.isArray(data) ? data : []);
        setPage(1);
      })
      .catch(() => setVouchers([]))
      .finally(() => setLoading(false));
  }, [selectedCampusId, statusFilter]);

  useEffect(() => {
    fetchVouchers();
  }, [fetchVouchers]);

  // Client-side filtering for month, year, and search
  const filtered = useMemo(() => {
    let result = vouchers;
    if (monthFilter) result = result.filter((v) => v.month === Number(monthFilter));
    if (yearFilter) result = result.filter((v) => v.year === Number(yearFilter));
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (v) =>
          (v.family_name || '').toLowerCase().includes(q) ||
          (v.voucher_no || '').toLowerCase().includes(q) ||
          (v.guardian_name || '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [vouchers, monthFilter, yearFilter, search]);

  // Stats
  const stats = useMemo(() => {
    const total = filtered.length;
    const paid = filtered.filter((v) => v.status === 'paid').length;
    const unpaid = filtered.filter((v) => v.status === 'unpaid').length;
    const overdue = filtered.filter((v) => v.status === 'overdue').length;
    const totalAmount = filtered.reduce((s, v) => s + (v.net_amount || v.total_amount || 0), 0);
    const paidAmount = filtered.filter((v) => v.status === 'paid').reduce((s, v) => s + (v.net_amount || v.total_amount || 0), 0);
    const unpaidAmount = filtered.filter((v) => v.status !== 'paid').reduce((s, v) => s + (v.net_amount || v.total_amount || 0), 0);
    return { total, paid, unpaid, overdue, totalAmount, paidAmount, unpaidAmount };
  }, [filtered]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const exportCSV = () => {
    const headers = ['Voucher#', 'Family Name', 'Guardian', 'Children', 'Amount', 'Concession', 'Net', 'Status'];
    const rows = filtered.map((v) => [
      v.voucher_no,
      v.family_name,
      v.guardian_name,
      v.students?.length || 0,
      v.total_amount || 0,
      v.concession_amount || 0,
      v.net_amount || 0,
      v.status,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((val) => `"${val}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `family_vouchers_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCardInline icon={<Users size={20} />} label="Total Vouchers" value={stats.total} sub={formatRs(stats.totalAmount)} color="blue" />
        <StatCardInline icon={<CheckCircle size={20} />} label="Paid" value={stats.paid} sub={formatRs(stats.paidAmount)} color="green" />
        <StatCardInline icon={<Clock size={20} />} label="Unpaid" value={stats.unpaid} sub={formatRs(stats.unpaidAmount)} color="orange" />
        <StatCardInline icon={<AlertTriangle size={20} />} label="Overdue" value={stats.overdue} sub="" color="red" />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search family name, guardian, or voucher number..."
              className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
            <option value="">All Months</option>
            {MONTHS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
          <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
            <option value="">All Years</option>
            <option value="2025">2025</option>
            <option value="2026">2026</option>
          </select>
          <button onClick={exportCSV} className="flex items-center gap-2 border rounded-lg px-4 py-2 text-sm hover:bg-gray-50 transition">
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Voucher #</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Family Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Guardian</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-600">Children</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-600">Amount</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-600">Concession</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-600">Net</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-600">Status</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((v) => (
                    <tr key={v.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 font-mono text-xs text-purple-700">{v.voucher_no}</td>
                      <td className="py-3 px-4 font-medium text-gray-900">{v.family_name}</td>
                      <td className="py-3 px-4 text-gray-600">{v.guardian_name}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold">
                          {v.students?.length || 0}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-gray-700">{formatRs(v.total_amount)}</td>
                      <td className="py-3 px-4 text-right text-green-600">
                        {v.concession_amount ? `-${formatRs(v.concession_amount)}` : '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold">{formatRs(v.net_amount)}</td>
                      <td className="py-3 px-4 text-center">
                        <StatusBadge status={v.status} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/family-voucher/${v.id}`}
                          className="inline-flex items-center gap-1 text-purple-600 hover:text-purple-800 text-sm font-medium"
                        >
                          <Eye size={14} /> View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filtered.length === 0 && (
              <p className="text-gray-400 text-center py-12">No family vouchers found</p>
            )}
            {/* Pagination */}
            {filtered.length > PAGE_SIZE && (
              <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
                <span className="text-sm text-gray-500">
                  Showing {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-8 h-8 rounded text-sm font-medium ${
                          page === pageNum ? 'bg-blue-600 text-white' : 'hover:bg-gray-200 text-gray-700'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ================================================================
   INLINE STAT CARD (small, used at top of each tab)
   ================================================================ */
function StatCardInline({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  sub: string;
  color: 'blue' | 'green' | 'orange' | 'red';
}) {
  const palette: Record<string, { bg: string; iconBg: string; text: string }> = {
    blue: { bg: 'bg-blue-50 border-blue-100', iconBg: 'bg-blue-100 text-blue-600', text: 'text-blue-900' },
    green: { bg: 'bg-green-50 border-green-100', iconBg: 'bg-green-100 text-green-600', text: 'text-green-900' },
    orange: { bg: 'bg-orange-50 border-orange-100', iconBg: 'bg-orange-100 text-orange-600', text: 'text-orange-900' },
    red: { bg: 'bg-red-50 border-red-100', iconBg: 'bg-red-100 text-red-600', text: 'text-red-900' },
  };
  const p = palette[color];

  return (
    <div className={`${p.bg} border rounded-xl p-4`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500">{label}</p>
          <p className={`text-2xl font-bold mt-1 ${p.text}`}>{value}</p>
          {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
        </div>
        <div className={`p-2 rounded-lg ${p.iconBg}`}>{icon}</div>
      </div>
    </div>
  );
}
