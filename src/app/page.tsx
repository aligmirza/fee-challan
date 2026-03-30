'use client';

import { useEffect, useState } from 'react';
import { useCampus } from '@/components/layout/CampusContext';
import {
  DollarSign,
  FileText,
  AlertTriangle,
  Users,
  TrendingUp,
  ArrowRight,
  Receipt,
  Printer,
  Eye,
} from 'lucide-react';
import Link from 'next/link';

interface DashboardStats {
  todayCollections: number;
  pendingChallans: number;
  overdueCount: number;
  activeStudents: number;
  monthlyCollections: { month: string; amount: number }[];
  recentPayments: {
    id: number;
    receipt_no: string;
    amount_paid: number;
    payment_date: string;
    payment_mode: string;
    student_name: string;
  }[];
}

export default function Dashboard() {
  const { selectedCampusId } = useCampus();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/dashboard?campus_id=${selectedCampusId}`)
      .then((res) => res.json())
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedCampusId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back! Here&apos;s your fee collection overview.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link
            href="/challan"
            className="flex items-center gap-2 bg-blue-600 text-white px-3 md:px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
          >
            <FileText size={16} /> <span className="hidden sm:inline">Generate </span>Challan
          </Link>
          <Link
            href="/bulk-generation"
            className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-3 md:px-4 py-2 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
          >
            <Printer size={16} /> <span className="hidden sm:inline">Bulk </span>Print
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Today's Collections" value={`Rs. ${(stats?.todayCollections ?? 0).toLocaleString()}`} icon={<DollarSign size={24} />} color="green" />
        <StatCard title="Pending Challans" value={String(stats?.pendingChallans ?? 0)} icon={<FileText size={24} />} color="yellow" />
        <StatCard title="Overdue Students" value={String(stats?.overdueCount ?? 0)} icon={<AlertTriangle size={24} />} color="red" />
        <StatCard title="Active Students" value={String(stats?.activeStudents ?? 0)} icon={<Users size={24} />} color="blue" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Collections */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Collections</h2>
          <div className="space-y-3">
            {(stats?.monthlyCollections ?? []).map((mc) => {
              const max = Math.max(...(stats?.monthlyCollections ?? []).map((m) => m.amount || 1));
              return (
                <div key={mc.month} className="flex items-center gap-4">
                  <span className="text-sm text-gray-500 w-12">{mc.month}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                    <div className="bg-blue-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (mc.amount / max) * 100)}%` }} />
                  </div>
                  <span className="text-xs md:text-sm font-medium text-gray-700 w-20 md:w-28 text-right">Rs. {mc.amount.toLocaleString()}</span>
                </div>
              );
            })}
            {(!stats?.monthlyCollections || stats.monthlyCollections.length === 0) && (
              <p className="text-gray-400 text-center py-8">No collection data yet</p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            {[
              { href: '/search', icon: <Users size={18} />, label: 'Search Students' },
              { href: '/challan', icon: <FileText size={18} />, label: 'Generate Challan' },
              { href: '/family-voucher', icon: <Users size={18} />, label: 'Family Voucher' },
              { href: '/bulk-generation', icon: <Printer size={18} />, label: 'Bulk Generation' },
              { href: '/fee-tracker', icon: <Receipt size={18} />, label: 'Record Payment' },
              { href: '/reports', icon: <Eye size={18} />, label: 'View Defaulters' },
            ].map((a) => (
              <Link key={a.href} href={a.href} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition border border-gray-100 group">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition">{a.icon}</div>
                <span className="text-sm font-medium text-gray-700">{a.label}</span>
                <ArrowRight size={14} className="ml-auto text-gray-400 group-hover:text-blue-600 transition" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Payments */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Payments</h2>
          <Link href="/fee-tracker" className="text-blue-600 text-sm hover:underline flex items-center gap-1">View All <ArrowRight size={14} /></Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Receipt #</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Student</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Amount</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Mode</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {(stats?.recentPayments ?? []).map((p) => (
                <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono text-xs">{p.receipt_no}</td>
                  <td className="py-3 px-4">{p.student_name}</td>
                  <td className="py-3 px-4 font-medium">Rs. {p.amount_paid.toLocaleString()}</td>
                  <td className="py-3 px-4"><span className="px-2 py-1 bg-gray-100 rounded text-xs capitalize">{p.payment_mode}</span></td>
                  <td className="py-3 px-4 text-gray-500">{p.payment_date}</td>
                </tr>
              ))}
              {(!stats?.recentPayments || stats.recentPayments.length === 0) && (
                <tr><td colSpan={5} className="py-8 text-center text-gray-400">No recent payments</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string; value: string; icon: React.ReactNode; color: 'green' | 'yellow' | 'red' | 'blue' }) {
  const colors = { green: 'bg-green-50 text-green-600', yellow: 'bg-yellow-50 text-yellow-600', red: 'bg-red-50 text-red-600', blue: 'bg-blue-50 text-blue-600' };
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colors[color]}`}>{icon}</div>
        <TrendingUp size={14} className="text-green-500" />
      </div>
      <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
      <p className="text-sm text-gray-500 mt-1">{title}</p>
    </div>
  );
}
