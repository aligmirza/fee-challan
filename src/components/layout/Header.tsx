'use client';

import { usePathname } from 'next/navigation';
import { Bell, ChevronDown, User, Menu } from 'lucide-react';
import { useCampus } from './CampusContext';

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/search': 'Student Search',
  '/fee-management': 'Fee Management',
  '/challan': 'Challan Generation',
  '/family-voucher': 'Family Voucher',
  '/bulk-generation': 'Bulk Generation',
  '/vouchers': 'View Vouchers',
  '/collections': 'Fee Collection',
  '/fee-tracker': 'Fee Tracker',
  '/students': 'Student Management',
  '/campus': 'Campus Management',
  '/reports': 'Reports',
  '/history': 'History',
  '/settings': 'Settings',
  '/classes': 'Class Management',
  '/api-docs': 'API Documentation',
  '/help': 'Help Center',
};

function getPageTitle(pathname: string): string {
  if (pageTitles[pathname]) return pageTitles[pathname];
  for (const [path, title] of Object.entries(pageTitles)) {
    if (path !== '/' && pathname.startsWith(path)) return title;
  }
  return 'Dashboard';
}

interface HeaderProps {
  onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname();
  const { selectedCampusId, setSelectedCampusId, campuses, loading } = useCampus();
  const title = getPageTitle(pathname);

  return (
    <header className="sticky top-0 z-20 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-6 shadow-sm">
      {/* Left: Hamburger (mobile) + Page Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 -ml-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h2 className="text-base md:text-xl font-semibold text-gray-800 truncate">{title}</h2>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
        {/* Campus Selector */}
        <div className="relative">
          <select
            value={selectedCampusId}
            onChange={(e) => setSelectedCampusId(Number(e.target.value))}
            disabled={loading}
            className="appearance-none bg-gray-50 border border-gray-200 rounded-lg pl-2 md:pl-3 pr-6 md:pr-8 py-1.5 md:py-2 text-xs md:text-sm text-gray-700 font-medium cursor-pointer hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors max-w-[110px] md:max-w-none"
          >
            {loading ? (
              <option>Loading...</option>
            ) : campuses.length === 0 ? (
              <option>No campuses</option>
            ) : (
              campuses.map((campus) => (
                <option key={campus.id} value={campus.id}>
                  {campus.name}
                </option>
              ))
            )}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>

        {/* Notifications */}
        <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-2 pl-2 md:pl-4 border-l border-gray-200">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-white" />
          </div>
          <span className="hidden md:block text-sm font-medium text-gray-700">Admin</span>
        </div>
      </div>
    </header>
  );
}
