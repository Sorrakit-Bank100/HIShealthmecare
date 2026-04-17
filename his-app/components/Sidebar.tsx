'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, Activity, FileText, Settings, HeartPulse } from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: HeartPulse },
  { name: 'Patients', href: '/patients', icon: Users },
  { name: 'Encounters', href: '/encounters', icon: Activity },
  { name: 'Observations', href: '/observations', icon: FileText },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col border-r border-[var(--border)] bg-[var(--sidebar-bg)] shadow-sm">
      <div className="flex h-16 items-center gap-2 border-b border-[var(--border)] px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <HeartPulse size={20} />
        </div>
        <span className="text-lg font-bold text-[var(--foreground)]">HIS Care</span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const isDashboard = item.href === '/';
          const reallyActive = isDashboard ? pathname === '/' : isActive;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 ease-in-out ${
                reallyActive
                  ? 'bg-[var(--sidebar-active)] text-[var(--sidebar-active-fg)]'
                  : 'text-[var(--sidebar-fg)] hover:bg-[var(--sidebar-active)] hover:text-[var(--sidebar-active-fg)]'
              }`}
            >
              <item.icon
                className={`h-5 w-5 flex-shrink-0 ${
                  reallyActive ? 'text-[var(--sidebar-active-fg)]' : 'text-[var(--sidebar-fg)] group-hover:text-[var(--sidebar-active-fg)]'
                }`}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[var(--border)] p-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
            Dr
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-[var(--foreground)]">Dr. Admin</span>
            <span className="text-xs text-[var(--sidebar-fg)]">admin@his.local</span>
          </div>
        </div>
      </div>
    </div>
  );
}
