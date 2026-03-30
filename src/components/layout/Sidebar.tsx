'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Search,
  FileText,
  Users,
  Layers,
  Receipt,
  GraduationCap,
  Building2,
  BookMarked,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Banknote,
  ClipboardList,
  History,
  Wallet,
  BookOpen,
  HelpCircle,
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Student Search', href: '/search', icon: Search },
  { label: 'Fee Management', href: '/fee-management', icon: Wallet },
  { label: 'Challan Generation', href: '/challan', icon: FileText },
  { label: 'Family Voucher', href: '/family-voucher', icon: Users },
  { label: 'Bulk Generation', href: '/bulk-generation', icon: Layers },
  { label: 'View Vouchers', href: '/vouchers', icon: ClipboardList },
  { label: 'Fee Collection', href: '/collections', icon: Banknote },
  { label: 'Fee Tracker', href: '/fee-tracker', icon: Receipt },
  { label: 'Student Management', href: '/students', icon: GraduationCap },
  { label: 'Class Management', href: '/classes', icon: BookMarked },
  { label: 'Campus Management', href: '/campus', icon: Building2 },
  { label: 'Reports', href: '/reports', icon: BarChart3 },
  { label: 'History', href: '/history', icon: History },
  { label: 'Settings', href: '/settings', icon: Settings },
  { label: 'API Docs', href: '/api-docs', icon: BookOpen },
  { label: 'Help', href: '/help', icon: HelpCircle },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }

  return (
    <aside
      className={[
        'flex-shrink-0 flex flex-col z-50',
        // Mobile: fixed drawer, slides in/out
        'fixed inset-y-0 left-0 h-full w-[260px]',
        'transition-transform duration-300',
        mobileOpen ? 'translate-x-0' : '-translate-x-full',
        // Desktop: sticky, collapsible
        'md:sticky md:top-0 md:h-screen md:translate-x-0 md:transition-all md:duration-300',
        collapsed ? 'md:w-[68px]' : 'md:w-[260px]',
      ].join(' ')}
      style={{ backgroundColor: '#1a365d' }}
    >
      {/* Logo / Institute Name */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
        <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center">
          <GraduationCap className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden flex-1">
            <h1 className="text-white font-bold text-sm leading-tight truncate">
              Fee Challan
            </h1>
            <p className="text-blue-200 text-xs truncate">Management System</p>
          </div>
        )}
        {/* Mobile close button */}
        {onMobileClose && (
          <button
            onClick={onMobileClose}
            className="md:hidden ml-auto p-1 text-white/70 hover:text-white"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onMobileClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                active
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-blue-100 hover:bg-white/10 hover:text-white'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon
                className={`w-5 h-5 flex-shrink-0 transition-colors ${
                  active ? 'text-white' : 'text-blue-300 group-hover:text-white'
                }`}
              />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center py-3 border-t border-white/10 text-blue-200 hover:text-white hover:bg-white/10 transition-colors"
      >
        {collapsed ? (
          <ChevronRight className="w-5 h-5" />
        ) : (
          <ChevronLeft className="w-5 h-5" />
        )}
      </button>
    </aside>
  );
}
