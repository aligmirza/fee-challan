'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useCampus } from '@/components/layout/CampusContext';
import StatusBadge from '@/components/ui/StatusBadge';
import {
  Search,
  Filter,
  Download,
  Calendar,
  FileText,
  CreditCard,
  Users,
  X,
  Loader2,
  ClipboardList,
  Banknote,
  Clock,
} from 'lucide-react';

// --- Types ---

interface ChallanRecord {
  id: number;
  challan_no: string;
  student_name: string;
  father_name: string;
  class_name: string;
  section_name: string;
  grand_total: number;
  status: string;
  generated_at: string;
  month: number;
  year: number;
}

interface PaymentRecord {
  id: number;
  receipt_no: string;
  student_name: string;
  challan_no: string;
  voucher_no: string;
  amount_paid: number;
  payment_mode: string;
  payment_date: string;
  created_at: string;
}

interface FamilyVoucherRecord {
  id: number;
  voucher_no: string;
  family_name: string;
  guardian_name: string;
  net_amount: number;
  status: string;
  generated_at: string;
  month: number;
  year: number;
}

interface UnifiedItem {
  id: number;
  date: string;
  type: 'challan' | 'payment' | 'voucher';
  reference: string;
  name: string;
  amount: number;
  status: string;
  link: string | null;
}

type TypeFilter = 'all' | 'challan' | 'payment' | 'voucher';
type StatusFilter = 'all' | 'paid' | 'unpaid' | 'partially_paid';

// --- Helpers ---

function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-PK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function typeBadge(type: UnifiedItem['type']) {
  const config = {
    challan: { label: 'Challan', bg: 'bg-blue-50 text-blue-700 ring-blue-600/20', icon: <FileText size={12} /> },
    payment: { label: 'Payment', bg: 'bg-green-50 text-green-700 ring-green-600/20', icon: <CreditCard size={12} /> },
    voucher: { label: 'Voucher', bg: 'bg-purple-50 text-purple-700 ring-purple-600/20', icon: <Users size={12} /> },
  };
  const c = config[type];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${c.bg}`}>
      {c.icon} {c.label}
    </span>
  );
}

// --- Component ---

export default function HistoryPage() {
  const { selectedCampusId } = useCampus();

  // Raw data
  const [challans, setChallans] = useState<ChallanRecord[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [vouchers, setVouchers] = useState<FamilyVoucherRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Applied filters (only update on Apply click)
  const [appliedFilters, setAppliedFilters] = useState({
    dateFrom: '',
    dateTo: '',
    typeFilter: 'all' as TypeFilter,
    statusFilter: 'all' as StatusFilter,
    searchQuery: '',
  });

  // Fetch all data
  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      try {
        const [challansRes, paymentsRes, vouchersRes] = await Promise.all([
          fetch(`/api/challans?campus_id=${selectedCampusId}`),
          fetch(`/api/payments?campus_id=${selectedCampusId}`),
          fetch(`/api/family-vouchers?campus_id=${selectedCampusId}`),
        ]);

        const [challansData, paymentsData, vouchersData] = await Promise.all([
          challansRes.ok ? challansRes.json() : [],
          paymentsRes.ok ? paymentsRes.json() : [],
          vouchersRes.ok ? vouchersRes.json() : [],
        ]);

        setChallans(Array.isArray(challansData) ? challansData : []);
        setPayments(Array.isArray(paymentsData) ? paymentsData : []);
        setVouchers(Array.isArray(vouchersData) ? vouchersData : []);
      } catch (error) {
        console.error('Failed to fetch history data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, [selectedCampusId]);

  // Build unified list
  const allItems: UnifiedItem[] = useMemo(() => {
    const items: UnifiedItem[] = [];

    challans.forEach((ch) => {
      items.push({
        id: ch.id,
        date: ch.generated_at || '',
        type: 'challan',
        reference: ch.challan_no || '-',
        name: ch.student_name || '-',
        amount: ch.grand_total || 0,
        status: ch.status || 'unpaid',
        link: `/challan/${ch.id}`,
      });
    });

    payments.forEach((p) => {
      items.push({
        id: p.id,
        date: p.payment_date || p.created_at || '',
        type: 'payment',
        reference: p.receipt_no || '-',
        name: p.student_name || '-',
        amount: p.amount_paid || 0,
        status: 'paid',
        link: null,
      });
    });

    vouchers.forEach((v) => {
      items.push({
        id: v.id,
        date: v.generated_at || '',
        type: 'voucher',
        reference: v.voucher_no || '-',
        name: v.family_name || v.guardian_name || '-',
        amount: v.net_amount || 0,
        status: v.status || 'unpaid',
        link: `/family-voucher/${v.id}`,
      });
    });

    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return items;
  }, [challans, payments, vouchers]);

  // Filtered list
  const filteredItems = useMemo(() => {
    const { dateFrom: df, dateTo: dt, typeFilter: tf, statusFilter: sf, searchQuery: sq } = appliedFilters;
    let result = allItems;

    if (df) {
      const from = new Date(df);
      result = result.filter((item) => new Date(item.date) >= from);
    }
    if (dt) {
      const to = new Date(dt);
      to.setHours(23, 59, 59, 999);
      result = result.filter((item) => new Date(item.date) <= to);
    }
    if (tf !== 'all') {
      result = result.filter((item) => item.type === tf);
    }
    if (sf !== 'all') {
      result = result.filter((item) => item.status === sf);
    }
    if (sq.trim()) {
      const q = sq.trim().toLowerCase();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.reference.toLowerCase().includes(q)
      );
    }

    return result;
  }, [allItems, appliedFilters]);

  // Stats
  const stats = useMemo(() => {
    const challanCount = filteredItems.filter((i) => i.type === 'challan').length;
    const paymentTotal = filteredItems
      .filter((i) => i.type === 'payment')
      .reduce((sum, i) => sum + i.amount, 0);
    const voucherCount = filteredItems.filter((i) => i.type === 'voucher').length;
    const pendingAmount = filteredItems
      .filter((i) => (i.type === 'challan' || i.type === 'voucher') && i.status !== 'paid')
      .reduce((sum, i) => sum + i.amount, 0);
    return { challanCount, paymentTotal, voucherCount, pendingAmount };
  }, [filteredItems]);

  // Apply filters
  const handleApply = useCallback(() => {
    setAppliedFilters({ dateFrom, dateTo, typeFilter, statusFilter, searchQuery });
  }, [dateFrom, dateTo, typeFilter, statusFilter, searchQuery]);

  // Clear filters
  const handleClear = useCallback(() => {
    setDateFrom('');
    setDateTo('');
    setTypeFilter('all');
    setStatusFilter('all');
    setSearchQuery('');
    setAppliedFilters({
      dateFrom: '',
      dateTo: '',
      typeFilter: 'all',
      statusFilter: 'all',
      searchQuery: '',
    });
  }, []);

  // CSV Export
  const handleExportCSV = useCallback(() => {
    const headers = ['Date', 'Type', 'Reference #', 'Student/Family', 'Amount', 'Status'];
    const rows = filteredItems.map((item) => [
      formatDate(item.date),
      item.type.charAt(0).toUpperCase() + item.type.slice(1),
      item.reference,
      item.name,
      item.amount.toString(),
      item.status,
    ]);

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredItems]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Activity History</h1>
          <p className="text-sm text-gray-500 mt-1">
            Unified timeline of all challans, payments, and family vouchers
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={filteredItems.length === 0}
          className="flex items-center gap-2 bg-white border rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          <Download size={14} /> Export CSV
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={16} className="text-gray-500" />
          <span className="text-sm font-semibold text-gray-700">Filters</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Date From */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">From Date</label>
            <div className="relative">
              <Calendar size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full border rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Date To */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">To Date</label>
            <div className="relative">
              <Calendar size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full border rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="challan">Challans</option>
              <option value="payment">Payments</option>
              <option value="voucher">Family Vouchers</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
              <option value="partially_paid">Partially Paid</option>
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Search</label>
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleApply()}
                placeholder="Name, challan #, receipt #..."
                className="w-full border rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-end gap-2">
            <button
              onClick={handleApply}
              className="flex-1 bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 transition"
            >
              Apply
            </button>
            <button
              onClick={handleClear}
              className="flex items-center justify-center border rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50">
              <ClipboardList size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Challans</p>
              <p className="text-xl font-bold text-gray-900">{stats.challanCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-50">
              <Banknote size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Payments Collected</p>
              <p className="text-xl font-bold text-gray-900">Rs. {stats.paymentTotal.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-50">
              <Users size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Family Vouchers</p>
              <p className="text-xl font-bold text-gray-900">{stats.voucherCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-orange-50">
              <Clock size={20} className="text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Pending Amount</p>
              <p className="text-xl font-bold text-gray-900">Rs. {stats.pendingAmount.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            {filteredItems.length} result{filteredItems.length !== 1 ? 's' : ''}
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-gray-400" />
            <span className="ml-2 text-gray-500 text-sm">Loading activity history...</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20">
            <FileText size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-400 text-sm">No activity found matching your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Type</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Reference #</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Student / Family</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Amount</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => {
                  const row = (
                    <tr
                      key={`${item.type}-${item.id}`}
                      className={`border-b hover:bg-gray-50 transition ${item.link ? 'cursor-pointer' : ''}`}
                    >
                      <td className="py-3 px-4 text-gray-700 whitespace-nowrap">{formatDate(item.date)}</td>
                      <td className="py-3 px-4">{typeBadge(item.type)}</td>
                      <td className="py-3 px-4 font-mono text-xs text-gray-800">{item.reference}</td>
                      <td className="py-3 px-4 font-medium text-gray-900">{item.name}</td>
                      <td className="py-3 px-4 text-right font-semibold text-gray-900 whitespace-nowrap">
                        Rs. {item.amount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={item.status} />
                      </td>
                    </tr>
                  );

                  if (item.link) {
                    return (
                      <Link key={`${item.type}-${item.id}`} href={item.link} className="contents">
                        {row}
                      </Link>
                    );
                  }
                  return row;
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
