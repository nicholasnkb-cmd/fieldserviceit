'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, Menu, Search, Star } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { formatDate } from '../../lib/utils';
import { api, getListData } from '../../lib/api';
import { DarkModeToggle } from '../ui/DarkModeToggle';
import { NAV_DRAWER_EVENT, NAV_FAVORITES_EVENT } from '../../lib/navigation';

interface CompanyOption {
  id: string;
  name: string;
  slug?: string;
}

export function BannerMenu() {
  const { user, company, activeCompanyContext, authChecked, isAuthenticated, setActiveCompanyContext } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [companyOptions, setCompanyOptions] = useState<CompanyOption[]>([]);
  const [favoritePaths, setFavoritePaths] = useState<Set<string>>(new Set());
  const [notifCount, setNotifCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);

  const fetchNotifCount = useCallback(async () => {
    try {
      const data = await api.get('/notifications/unread-count');
      setNotifCount(data.count);
    } catch {}
  }, []);

  useEffect(() => {
    if (!authChecked || !isAuthenticated) return;
    fetchNotifCount();
    api.get('/users/me/favorites')
      .then((items) => setFavoritePaths(new Set((items || []).map((item: any) => item.path))))
      .catch(() => {});
    const interval = window.setInterval(fetchNotifCount, 30000);
    return () => window.clearInterval(interval);
  }, [authChecked, fetchNotifCount, isAuthenticated]);

  useEffect(() => {
    if (!authChecked || !isAuthenticated || user?.role !== 'SUPER_ADMIN') return;
    api.get('/admin/companies?limit=100')
      .then((data) => {
        const companies = getListData<CompanyOption>(data);
        setCompanyOptions(companies);
        if (activeCompanyContext && !companies.some((item) => item.id === activeCompanyContext.id)) {
          setActiveCompanyContext(null);
        }
      })
      .catch(() => {});
  }, [activeCompanyContext, authChecked, isAuthenticated, setActiveCompanyContext, user?.role]);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) setShowNotifs(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    setSearchQuery('');
  };

  const toggleFavorite = async () => {
    const label = pathname.split('/').filter(Boolean).pop()?.replaceAll('-', ' ') || 'Dashboard';
    if (favoritePaths.has(pathname)) {
      await api.delete('/users/me/favorites', { body: JSON.stringify({ path: pathname }) } as any);
      setFavoritePaths((current) => {
        const next = new Set(current);
        next.delete(pathname);
        return next;
      });
    } else {
      await api.post('/users/me/favorites', { path: pathname, label: label.replace(/^./, (letter) => letter.toUpperCase()) });
      setFavoritePaths((current) => new Set(current).add(pathname));
    }
    window.dispatchEvent(new Event(NAV_FAVORITES_EVENT));
  };

  const handleCompanyContextChange = (companyId: string) => {
    const selectedCompany = companyOptions.find((item) => item.id === companyId) || null;
    if (selectedCompany) api.post('/admin/company-context/audit', { companyId: selectedCompany.id }).catch(() => {});
    setActiveCompanyContext(selectedCompany);
    window.location.reload();
  };

  const toggleNotifications = () => {
    setShowNotifs((current) => {
      if (!current) api.get('/notifications?limit=10').then((data) => setNotifications(getListData(data))).catch(() => {});
      return !current;
    });
  };

  if (!isAuthenticated || !user) return null;

  const displayCompanyName = activeCompanyContext?.name || company?.name || 'FieldserviceIT';
  const branding = activeCompanyContext?.branding || company?.branding || {};
  const displayLogo = branding.logoUrl || activeCompanyContext?.logo || company?.logo;

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="flex h-14 items-center gap-3 px-3 sm:px-4">
        <button type="button" onClick={() => window.dispatchEvent(new Event(NAV_DRAWER_EVENT))}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-gray-600 hover:bg-gray-100 md:hidden"
          aria-label="Open navigation menu">
          <Menu size={20} />
        </button>

        <Link href="/dashboard" className="flex min-w-0 shrink-0 items-center gap-2">
          {displayLogo && <img src={displayLogo} alt="" className="h-8 w-8 rounded object-contain" />}
          <span className="max-w-52 truncate text-base font-bold text-primary">{branding.companyName || displayCompanyName}</span>
        </Link>

        <form onSubmit={handleSearch} className="mx-auto hidden w-full max-w-xl sm:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search tickets, assets, users, and pages"
              className="h-9 w-full rounded-md border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm outline-none focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary" />
          </div>
        </form>

        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          {user.role === 'SUPER_ADMIN' && (
            <select value={activeCompanyContext?.id || ''} onChange={(event) => handleCompanyContextChange(event.target.value)}
              className="hidden max-w-48 rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-700 lg:block"
              aria-label="Company context">
              <option value="">Global admin</option>
              {companyOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          )}

          <button onClick={toggleFavorite}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-amber-500 hover:bg-amber-50"
            aria-label={favoritePaths.has(pathname) ? 'Remove page from favorites' : 'Add page to favorites'}>
            <Star size={18} fill={favoritePaths.has(pathname) ? 'currentColor' : 'none'} />
          </button>

          <DarkModeToggle />

          <div className="relative" ref={notifRef}>
            <button onClick={toggleNotifications}
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-800"
              aria-label="Notifications">
              <Bell size={18} />
              {notifCount > 0 && <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">{notifCount > 99 ? '99+' : notifCount}</span>}
            </button>
            {showNotifs && (
              <div className="absolute right-0 top-full mt-2 max-h-96 w-80 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                <div className="flex items-center justify-between border-b px-4 py-3">
                  <span className="text-sm font-semibold text-gray-900">Notifications</span>
                  <button onClick={async () => { await api.post('/notifications/read-all', {}).catch(() => {}); setNotifCount(0); }} className="text-xs font-medium text-primary">Mark all read</button>
                </div>
                {notifications.length === 0 ? <p className="p-6 text-center text-sm text-gray-500">No notifications</p> : notifications.map((item) => (
                  <Link key={item.id} href={item.link || '#'} onClick={() => setShowNotifs(false)} className="block border-b border-gray-100 px-4 py-3 hover:bg-gray-50">
                    <p className="truncate text-sm font-medium text-gray-900">{item.title}</p>
                    {item.body && <p className="mt-1 line-clamp-2 text-xs text-gray-500">{item.body}</p>}
                    <p className="mt-1 text-[10px] text-gray-400">{formatDate(item.createdAt)}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link href="/profile" className="ml-1 hidden h-9 items-center rounded-md px-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 xl:inline-flex">
            {user.firstName}
          </Link>
        </div>
      </div>

      {user.role === 'SUPER_ADMIN' && (
        <div className="border-t border-gray-100 px-3 py-2 lg:hidden">
          <select value={activeCompanyContext?.id || ''} onChange={(event) => handleCompanyContextChange(event.target.value)}
            className="w-full rounded-md border border-gray-200 bg-white px-2 py-2 text-sm" aria-label="Mobile company context">
            <option value="">Global admin</option>
            {companyOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </div>
      )}
    </header>
  );
}
