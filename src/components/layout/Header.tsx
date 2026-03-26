'use client';

import { usePathname } from 'next/navigation';
import { Bell, ChevronDown, User } from 'lucide-react';
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

export default function Header() {
  const pathname = usePathname();
  const { selectedCampusId, setSelectedCampusId, campuses, loading } = useCampus();
  const title = getPageTitle(pathname);

  return (
    <header className="sticky top-0 z-20 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm">
      {/* Page Title */}
      <h2 className="text-xl font-semibold text-gray-800">{title}</h2>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* Campus Selector */}
        <div className="relative">
          <select
            value={selectedCampusId}
            onChange={(e) => setSelectedCampusId(Number(e.target.value))}
            disabled={loading}
            className="appearance-none bg-gray-50 border border-gray-200 rounded-lg pl-3 pr-8 py-2 text-sm text-gray-700 font-medium cursor-pointer hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
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
        <div className="flex items-center gap-2 pl-4 border-l border-gray-200">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-medium text-gray-700">Admin</span>
        </div>
      </div>
    </header>
  );
}
