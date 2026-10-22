'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText, Users, Shield, Home, BarChart2 } from 'lucide-react';
import { clsx } from 'clsx';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Documentos', href: '/dashboard/documents', icon: FileText },
  { name: 'Signatários', href: '/dashboard/signers', icon: Users },
  { name: 'Relatórios', href: '/dashboard/reports', icon: BarChart2 },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto" role="navigation" aria-label="Principal">
      {navigation.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
        const Icon = item.icon;
        return (
          <Link
            key={item.name}
            href={item.href}
            className={clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              isActive
                ? 'bg-pink-50 text-pink-700'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            )}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}