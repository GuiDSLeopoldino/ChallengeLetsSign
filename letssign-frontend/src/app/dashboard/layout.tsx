'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { FileText, Users, Shield, LogOut, Menu, X, ChevronDown, Home, BarChart2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { clsx } from 'clsx';
import { DashboardNav } from '@/components/dashboard-nav';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-label="Sidebar"
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-2 px-6 py-5 border-b border-gray-200">
            <div className="h-10 w-10 rounded-lg bg-pink-600 flex items-center justify-center">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">LetsSign</span>
          </div>

          {/* Navigation */}
          <Suspense fallback={<div className="flex-1 px-4 py-6 space-y-1" />}>
            <DashboardNav />
          </Suspense>

          {/* User section */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="h-9 w-9 rounded-full bg-pink-100 flex items-center justify-center">
                <span className="text-pink-700 font-medium text-sm">
                  {user?.nome?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user?.nome}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
            <div className="mt-2">
              <Button variant="outline" size="sm" className="w-full" onClick={logout}>
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            <button
              type="button"
              className="lg:hidden p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir menu"
              aria-expanded={sidebarOpen}
            >
              <Menu className="h-6 w-6" />
            </button>

            <div className="flex-1 lg:flex-none" />

            {/* User menu */}
            <div className="relative">
              <button
                type="button"
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                aria-expanded={userMenuOpen}
                aria-haspopup="true"
              >
                <div className="h-8 w-8 rounded-full bg-pink-100 flex items-center justify-center">
                  <span className="text-pink-700 font-medium text-sm">
                    {user?.nome?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="hidden sm:block text-sm font-medium text-gray-700">{user?.nome}</span>
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{user?.nome}</p>
                      <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                      <p className="text-xs text-gray-400 capitalize">{user?.role?.toLowerCase()}</p>
                    </div>
                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Sair
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8" role="main">
          {children}
        </main>
      </div>
    </div>
  );
}