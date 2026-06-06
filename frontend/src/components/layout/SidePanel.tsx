'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Bot,
  Boxes,
  Building2,
  CalendarClock,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  CreditCard,
  FileText,
  Gauge,
  GitFork,
  GripVertical,
  Home,
  KeyRound,
  LayoutDashboard,
  Lock,
  LogOut,
  Mail,
  Map as MapIcon,
  PackageSearch,
  RefreshCw,
  Route,
  Search,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Smartphone,
  Star,
  Ticket,
  User,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';
import { api, getResponseMeta } from '../../lib/api';
import {
  NAV_DRAWER_EVENT,
  NAV_FAVORITES_EVENT,
  navigationStorageKey,
  readRecentPages,
  type RecentPage,
} from '../../lib/navigation';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../stores/authStore';

type BadgeKey = 'tickets' | 'alerts';

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  feature?: string;
  badge?: BadgeKey;
};

type NavGroup = {
  id: string;
  label: string;
  items: NavItem[];
  dynamic?: boolean;
};

type FavoritePage = {
  id: string;
  label: string;
  path: string;
};

const MAX_RECENT_PAGES = 6;

const navGroups = {
  public: [
    {
      id: 'support',
      label: 'Support',
      items: [
        { label: 'My Tickets', href: '/my-tickets', icon: Ticket, feature: 'tickets', badge: 'tickets' },
        { label: 'Submit Ticket', href: '/submit-ticket', icon: FileText, feature: 'tickets' },
        { label: 'Customer Portal', href: '/customer-portal', icon: Home, feature: 'tickets' },
      ],
    },
    {
      id: 'requests',
      label: 'Requests',
      items: [
        { label: 'Service Catalog', href: '/catalog-requests', icon: ShoppingCart, feature: 'catalogRequests' },
      ],
    },
  ],
  business: [
    {
      id: 'overview',
      label: 'Overview',
      items: [
        { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      ],
    },
    {
      id: 'service-desk',
      label: 'Service Desk',
      items: [
        { label: 'Tickets', href: '/tickets', icon: Ticket, feature: 'tickets', badge: 'tickets' },
        { label: 'Service Catalog', href: '/catalog-requests', icon: ShoppingCart, feature: 'catalogRequests' },
        { label: 'Customer Portal', href: '/customer-portal', icon: Home, feature: 'tickets' },
        { label: 'SLA Tracking', href: '/sla', icon: Gauge, feature: 'tickets' },
        { label: 'Knowledge Base', href: '/knowledge-base', icon: ClipboardList, feature: 'kb' },
        { label: 'AI Agent', href: '/ai-agent', icon: Bot, feature: 'aiAgent' },
      ],
    },
    {
      id: 'field-operations',
      label: 'Field Operations',
      items: [
        { label: 'Field Service', href: '/dispatch', icon: Route, feature: 'dispatch' },
        { label: 'Technician Mobile', href: '/technician-mobile', icon: Smartphone, feature: 'dispatch' },
        { label: 'Maintenance', href: '/maintenance', icon: CalendarClock, feature: 'dispatch' },
        { label: 'Inventory', href: '/inventory', icon: Boxes, feature: 'assets' },
      ],
    },
    {
      id: 'infrastructure',
      label: 'Infrastructure',
      items: [
        { label: 'Assets', href: '/assets', icon: PackageSearch, feature: 'assets' },
        { label: 'Network', href: '/network', icon: GitFork, feature: 'network' },
        { label: 'Advanced Alerting', href: '/alerting', icon: AlertTriangle, feature: 'network', badge: 'alerts' },
        { label: 'Topology Map', href: '/topology', icon: MapIcon, feature: 'network' },
        { label: 'RMM Integrations', href: '/integrations/rmm', icon: RefreshCw, feature: 'rmmIntegration' },
      ],
    },
    {
      id: 'business',
      label: 'Business',
      items: [
        { label: 'Quotes & Invoices', href: '/quotes-invoices', icon: CreditCard, feature: 'billing' },
        { label: 'Reports', href: '/reports', icon: BarChart3, feature: 'reporting' },
      ],
    },
    {
      id: 'administration',
      label: 'Administration',
      items: [
        { label: 'Security Center', href: '/security-center', icon: ShieldCheck, feature: 'auditLogs' },
        { label: 'Settings', href: '/settings', icon: Settings, feature: 'settings' },
      ],
    },
  ],
  globalTech: [
    {
      id: 'overview',
      label: 'Overview',
      items: [
        { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      ],
    },
    {
      id: 'service-desk',
      label: 'Service Desk',
      items: [
        { label: 'Tickets', href: '/tickets', icon: Ticket, feature: 'tickets', badge: 'tickets' },
        { label: 'Technician Mobile', href: '/technician-mobile', icon: Smartphone, feature: 'dispatch' },
        { label: 'Knowledge Base', href: '/knowledge-base', icon: ClipboardList, feature: 'kb' },
      ],
    },
  ],
  admin: [
    {
      id: 'platform-administration',
      label: 'Platform Administration',
      items: [
        { label: 'Super Admin', href: '/admin', icon: LayoutDashboard },
        { label: 'All Tickets', href: '/tickets', icon: Ticket, badge: 'tickets' },
        { label: 'Users', href: '/admin/users', icon: Users },
        { label: 'Companies', href: '/admin/companies', icon: Building2 },
        { label: 'System Controls', href: '/admin/system', icon: Settings },
        { label: 'Email Operations', href: '/admin/email-operations', icon: Mail },
        { label: 'Security Center', href: '/security-center', icon: ShieldCheck },
        { label: 'Audit Logs', href: '/admin/audit-logs', icon: ClipboardList, feature: 'auditLogs' },
        { label: 'Permissions', href: '/admin/permissions', icon: Lock },
        { label: 'Roles', href: '/admin/roles', icon: KeyRound },
      ],
    },
  ],
  tenantAdmin: [
    {
      id: 'company-administration',
      label: 'Company Administration',
      items: [
        { label: 'Company Users', href: '/admin/company', icon: Users },
        { label: 'Roles', href: '/admin/roles', icon: KeyRound },
        { label: 'Security Center', href: '/security-center', icon: ShieldCheck },
        { label: 'RMM Integrations', href: '/integrations/rmm', icon: RefreshCw, feature: 'rmmIntegration' },
        { label: 'Email Operations', href: '/admin/email-operations', icon: Mail },
        { label: 'Settings', href: '/settings', icon: Settings, feature: 'settings' },
      ],
    },
  ],
} satisfies Record<string, NavGroup[]>;

const allStaticItems = Object.values(navGroups).flatMap((groups) => groups.flatMap((group) => group.items));

function findStaticItem(path: string) {
  return [...allStaticItems]
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => path === item.href || path.startsWith(`${item.href}/`));
}

function fallbackLabel(path: string) {
  const segment = path.split('/').filter(Boolean).pop() || 'Dashboard';
  return segment
    .replaceAll('-', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function readStoredObject<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

export function SidePanel() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, authChecked, isAuthenticated, activeCompanyContext, logout } = useAuthStore();
  const [features, setFeatures] = useState<Record<string, boolean>>({});
  const [collapsed, setCollapsed] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [groupOrder, setGroupOrder] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<FavoritePage[]>([]);
  const [recentPages, setRecentPages] = useState<RecentPage[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [draggedGroupId, setDraggedGroupId] = useState<string | null>(null);
  const [badgeCounts, setBadgeCounts] = useState<Record<BadgeKey, number>>({ tickets: 0, alerts: 0 });
  const navRef = useRef<HTMLElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const autoCollapseRef = useRef(false);

  const userStorageKey = useCallback(
    (setting: string) => navigationStorageKey(user?.id || 'anonymous', setting),
    [user?.id],
  );

  const fetchFavorites = useCallback(() => {
    if (!authChecked || !isAuthenticated) return;
    api.get<FavoritePage[]>('/users/me/favorites')
      .then((items) => setFavorites(Array.isArray(items) ? items : []))
      .catch(() => setFavorites([]));
  }, [authChecked, isAuthenticated]);

  useEffect(() => {
    if (!user?.id) return;

    const collapseKey = userStorageKey('collapsed');
    const storedCollapsed = localStorage.getItem(collapseKey);
    const media = window.matchMedia('(min-width: 768px) and (max-width: 1279px)');
    autoCollapseRef.current = storedCollapsed === null;
    setCollapsed(storedCollapsed === null ? media.matches : storedCollapsed === 'true');
    setCollapsedGroups(readStoredObject(userStorageKey('collapsedGroups'), {}));
    setGroupOrder(readStoredObject(userStorageKey('groupOrder'), []));
    setRecentPages(readRecentPages(user.id));

    const handleLaptopWidth = (event: MediaQueryListEvent) => {
      if (autoCollapseRef.current) setCollapsed(event.matches);
    };
    media.addEventListener('change', handleLaptopWidth);
    return () => media.removeEventListener('change', handleLaptopWidth);
  }, [user?.id, userStorageKey]);

  useEffect(() => {
    if (!authChecked || !isAuthenticated) return;
    api.get('/users/me/features').then((data) => setFeatures(data.features || {})).catch(() => {});
    fetchFavorites();
  }, [authChecked, fetchFavorites, isAuthenticated]);

  useEffect(() => {
    const handleFavoritesChanged = () => fetchFavorites();
    const openDrawer = () => setMobileOpen(true);
    window.addEventListener(NAV_FAVORITES_EVENT, handleFavoritesChanged);
    window.addEventListener(NAV_DRAWER_EVENT, openDrawer);
    return () => {
      window.removeEventListener(NAV_FAVORITES_EVENT, handleFavoritesChanged);
      window.removeEventListener(NAV_DRAWER_EVENT, openDrawer);
    };
  }, [fetchFavorites]);

  useEffect(() => {
    if (!mobileOpen) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleEscape);
    };
  }, [mobileOpen]);

  useEffect(() => {
    setMobileOpen(false);
    setSearchQuery('');
  }, [pathname]);

  useEffect(() => {
    if (!user?.id || !pathname.startsWith('/') || pathname === '/history' || pathname === '/favorites') return;
    const item = findStaticItem(pathname);
    const nextPage: RecentPage = {
      label: item?.label || fallbackLabel(pathname),
      path: pathname,
      visitedAt: new Date().toISOString(),
    };
    const next = [nextPage, ...readRecentPages(user.id).filter((page) => page.path !== pathname)]
      .slice(0, MAX_RECENT_PAGES);
    localStorage.setItem(userStorageKey('recentPages'), JSON.stringify(next));
    setRecentPages(next);
  }, [pathname, user?.id, userStorageKey]);

  useEffect(() => {
    if (!user?.id || !navRef.current) return;
    const scrollTop = Number(localStorage.getItem(userStorageKey('scrollTop')) || 0);
    const frame = requestAnimationFrame(() => {
      if (navRef.current) navRef.current.scrollTop = scrollTop;
    });
    return () => cancelAnimationFrame(frame);
  }, [user?.id, userStorageKey]);

  useEffect(() => {
    if (!authChecked || !isAuthenticated) return;

    const fetchBadges = async () => {
      const [ticketResult, alertResult] = await Promise.allSettled([
        api.get('/tickets?status=OPEN&limit=1'),
        user?.userType === 'BUSINESS'
          ? api.get('/assets/network/monitoring/summary')
          : Promise.resolve(null),
      ]);
      setBadgeCounts({
        tickets: ticketResult.status === 'fulfilled'
          ? Number(getResponseMeta(ticketResult.value)?.total || ticketResult.value?.meta?.total || 0)
          : 0,
        alerts: alertResult.status === 'fulfilled'
          ? Number(alertResult.value?.activeAlerts || 0)
          : 0,
      });
    };

    fetchBadges();
    const interval = window.setInterval(fetchBadges, 60000);
    return () => window.clearInterval(interval);
  }, [authChecked, isAuthenticated, user?.userType]);

  const baseGroups = useMemo(() => {
    if (!user) return [];
    const sourceGroups: NavGroup[] = [
      ...(user.role === 'GLOBAL_TECH'
        ? navGroups.globalTech
        : user.userType === 'PUBLIC'
          ? navGroups.public
          : navGroups.business),
      ...(user.role === 'SUPER_ADMIN' ? navGroups.admin : []),
      ...(user.role === 'TENANT_ADMIN' ? navGroups.tenantAdmin : []),
    ];
    const seenHrefs = new Set<string>();
    return sourceGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => {
          const isEnabled = !item.feature || features[item.feature] !== false;
          if (!isEnabled || seenHrefs.has(item.href)) return false;
          seenHrefs.add(item.href);
          return true;
        }),
      }))
      .filter((group) => group.items.length > 0);
  }, [features, user]);

  const availableItems = useMemo(
    () => baseGroups.flatMap((group) => group.items),
    [baseGroups],
  );

  const personalizedGroups = useMemo(() => {
    const iconForPath = (path: string, fallback: LucideIcon) => (
      availableItems.find((item) => item.href === path)?.icon
      || findStaticItem(path)?.icon
      || fallback
    );
    const favoriteGroup: NavGroup | null = favorites.length > 0
      ? {
          id: 'favorites',
          label: 'Favorites',
          dynamic: true,
          items: favorites.map((favorite) => ({
            label: favorite.label,
            href: favorite.path,
            icon: iconForPath(favorite.path, Star),
          })),
        }
      : null;
    const recentGroup: NavGroup | null = recentPages.length > 0
      ? {
          id: 'recent',
          label: 'Recent',
          dynamic: true,
          items: recentPages.map((page) => ({
            label: page.label,
            href: page.path,
            icon: iconForPath(page.path, Clock),
          })),
        }
      : null;

    const groups = [
      ...(favoriteGroup ? [favoriteGroup] : []),
      ...(recentGroup ? [recentGroup] : []),
      ...baseGroups,
    ];
    const orderIndex = new Map(groupOrder.map((id, index) => [id, index]));
    return groups.sort((a, b) => {
      const aIndex = orderIndex.get(a.id);
      const bIndex = orderIndex.get(b.id);
      if (aIndex === undefined && bIndex === undefined) return 0;
      if (aIndex === undefined) return 1;
      if (bIndex === undefined) return -1;
      return aIndex - bIndex;
    });
  }, [availableItems, baseGroups, favorites, groupOrder, recentPages]);

  const visibleGroups = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return personalizedGroups;
    return personalizedGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => (
          item.label.toLowerCase().includes(query)
          || group.label.toLowerCase().includes(query)
        )),
      }))
      .filter((group) => group.items.length > 0);
  }, [personalizedGroups, searchQuery]);

  if (!user) return null;

  const compact = collapsed && !mobileOpen;
  const contextName = activeCompanyContext?.name || null;

  const toggleCollapsed = () => {
    setCollapsed((current) => {
      const next = !current;
      autoCollapseRef.current = false;
      localStorage.setItem(userStorageKey('collapsed'), String(next));
      return next;
    });
  };

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups((current) => {
      const next = { ...current, [groupId]: !current[groupId] };
      localStorage.setItem(userStorageKey('collapsedGroups'), JSON.stringify(next));
      return next;
    });
  };

  const handleGroupDrop = (targetGroupId: string) => {
    if (!draggedGroupId || draggedGroupId === targetGroupId) return;
    const ids = personalizedGroups.map((group) => group.id);
    const sourceIndex = ids.indexOf(draggedGroupId);
    const targetIndex = ids.indexOf(targetGroupId);
    if (sourceIndex < 0 || targetIndex < 0) return;
    ids.splice(targetIndex, 0, ids.splice(sourceIndex, 1)[0]);
    setGroupOrder(ids);
    localStorage.setItem(userStorageKey('groupOrder'), JSON.stringify(ids));
    setDraggedGroupId(null);
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const renderBadge = (item: NavItem) => {
    if (!item.badge) return null;
    const count = badgeCounts[item.badge];
    if (!count) return null;
    return (
      <span className={cn(
        'flex h-5 min-w-5 items-center justify-center rounded-full bg-red-100 px-1.5 text-[10px] font-bold text-red-700',
        compact && 'absolute right-1 top-0',
      )}>
        {count > 99 ? '99+' : count}
      </span>
    );
  };

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-[60] bg-gray-950/40 md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation menu"
        />
      )}

      <aside className={cn(
        'fixed inset-y-0 left-0 z-[70] flex h-screen w-72 shrink-0 flex-col border-r border-gray-200 bg-white shadow-xl transition-[transform,width] duration-200 ease-in-out',
        mobileOpen ? 'translate-x-0' : '-translate-x-full',
        'md:sticky md:top-14 md:z-30 md:h-[calc(100vh-3.5rem)] md:translate-x-0 md:shadow-none',
        compact ? 'md:w-20' : 'md:w-64',
      )}>
        <div className={cn(
          'flex min-h-14 items-center border-b border-gray-100 px-3',
          compact ? 'justify-center' : 'justify-between',
        )}>
          {!compact && <span className="text-xs font-semibold uppercase text-gray-500">Navigation</span>}
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-900 md:hidden"
            aria-label="Close navigation menu"
            title="Close navigation menu"
          >
            <X size={19} />
          </button>
          <button
            type="button"
            onClick={toggleCollapsed}
            className="hidden h-9 w-9 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-900 md:inline-flex"
            aria-label={collapsed ? 'Expand side menu' : 'Collapse side menu'}
            title={collapsed ? 'Expand side menu' : 'Collapse side menu'}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <div className={cn('border-b border-gray-100 py-3', compact ? 'px-2' : 'px-3')}>
          {compact ? (
            <button
              type="button"
              onClick={() => {
                setCollapsed(false);
                autoCollapseRef.current = false;
                localStorage.setItem(userStorageKey('collapsed'), 'false');
                window.setTimeout(() => searchRef.current?.focus(), 50);
              }}
              className="inline-flex h-10 w-full items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-900"
              aria-label="Search navigation"
              title="Search navigation"
            >
              <Search size={18} />
            </button>
          ) : (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                ref={searchRef}
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Find a page"
                className="h-10 w-full rounded-md border border-gray-300 bg-white pl-9 pr-8 text-sm text-gray-900 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                aria-label="Search navigation"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-1.5 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                  aria-label="Clear navigation search"
                >
                  <X size={15} />
                </button>
              )}
            </div>
          )}
        </div>

        {user.role === 'SUPER_ADMIN' && (
          <div className={cn(
            'border-b border-amber-200 bg-amber-50 text-amber-800',
            compact ? 'flex justify-center px-2 py-3' : 'px-4 py-3',
          )} title={compact ? (contextName ? `Managing ${contextName}` : 'Global scope') : undefined}>
            {compact ? (
              <Building2 size={18} />
            ) : (
              <div className="flex items-start gap-2">
                <Building2 className="mt-0.5 shrink-0" size={17} />
                <div className="min-w-0">
                  <div className="text-[10px] font-bold uppercase">
                    {contextName ? 'Managing tenant' : 'Tenant context'}
                  </div>
                  <div className="truncate text-sm font-semibold">{contextName || 'Global scope'}</div>
                </div>
              </div>
            )}
          </div>
        )}

        <nav
          ref={navRef}
          onScroll={(event) => localStorage.setItem(userStorageKey('scrollTop'), String(event.currentTarget.scrollTop))}
          className={cn('flex-1 overflow-y-auto py-3', compact ? 'px-2' : 'px-3')}
          aria-label="Application navigation"
        >
          {visibleGroups.length === 0 && !compact && (
            <p className="px-3 py-6 text-center text-sm text-gray-500">No pages match “{searchQuery}”.</p>
          )}

          {visibleGroups.map((group, groupIndex) => {
            const containsActiveRoute = group.items.some(
              (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
            );
            const isGroupOpen = searchQuery ? true : !collapsedGroups[group.id];
            const groupItemsId = `side-panel-${group.id}`;

            return (
              <div
                key={group.id}
                onDragOver={(event) => {
                  if (!compact && !searchQuery) event.preventDefault();
                }}
                onDrop={() => handleGroupDrop(group.id)}
                className={cn(
                  compact && groupIndex > 0 && 'mt-2 border-t border-gray-200 pt-2',
                  draggedGroupId === group.id && 'opacity-50',
                )}
              >
                {!compact && (
                  <div className="flex h-8 items-center">
                    <button
                      type="button"
                      draggable={!searchQuery}
                      onDragStart={(event) => {
                        setDraggedGroupId(group.id);
                        event.dataTransfer.effectAllowed = 'move';
                      }}
                      onDragEnd={() => setDraggedGroupId(null)}
                      className="inline-flex h-8 w-7 shrink-0 cursor-grab items-center justify-center rounded text-gray-300 hover:bg-gray-50 hover:text-gray-600 active:cursor-grabbing"
                      aria-label={`Move ${group.label} group`}
                      title={`Drag to reorder ${group.label}`}
                    >
                      <GripVertical size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleGroup(group.id)}
                      className={cn(
                        'flex h-8 min-w-0 flex-1 items-center justify-between rounded-md px-2 text-xs font-semibold uppercase hover:bg-gray-50',
                        containsActiveRoute ? 'text-primary' : 'text-gray-500 hover:text-gray-800',
                      )}
                      aria-expanded={isGroupOpen}
                      aria-controls={groupItemsId}
                    >
                      <span className="truncate">{group.label}</span>
                      <ChevronDown
                        size={15}
                        className={cn('shrink-0 transition-transform', !isGroupOpen && '-rotate-90')}
                      />
                    </button>
                  </div>
                )}

                <div
                  id={groupItemsId}
                  className={cn('space-y-1', !compact && 'mb-2', !compact && !isGroupOpen && 'hidden')}
                >
                  {group.items.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                    const compactLabel = `${group.label}: ${item.label}`;

                    return (
                      <Link
                        key={`${group.id}-${item.href}`}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          'group relative flex h-10 items-center rounded-md text-sm font-medium transition-colors',
                          compact ? 'justify-center px-0' : 'gap-3 px-3',
                          isActive
                            ? 'bg-primary/10 text-primary'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                        )}
                        aria-label={compact ? compactLabel : undefined}
                        title={compact ? compactLabel : undefined}
                      >
                        <item.icon size={17} className="shrink-0" />
                        {!compact && <span className="min-w-0 flex-1 truncate">{item.label}</span>}
                        {renderBadge(item)}
                        {compact && (
                          <span className="pointer-events-none absolute left-full top-1/2 z-[80] ml-2 hidden -translate-y-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1.5 text-xs font-semibold text-white shadow-lg group-hover:block">
                            <span className="text-gray-300">{group.label}</span>
                            <span className="px-1 text-gray-500">/</span>
                            {item.label}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        <div className={cn('shrink-0 border-t border-gray-200 bg-white py-3', compact ? 'px-2' : 'px-3')}>
          {!compact && (
            <div className="mb-2 flex items-center gap-3 px-2">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                {user.firstName?.[0]}{user.lastName?.[0]}
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-gray-900">{user.firstName} {user.lastName}</div>
                <div className="truncate text-xs text-gray-500">{user.role.replaceAll('_', ' ')}</div>
              </div>
            </div>
          )}
          <div className={cn('grid gap-1', compact ? 'grid-cols-1' : 'grid-cols-3')}>
            <Link
              href="/profile"
              onClick={() => setMobileOpen(false)}
              className={cn(
                'inline-flex h-9 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-900',
                !compact && 'gap-1 text-xs font-medium',
              )}
              aria-label={compact ? 'Profile' : undefined}
              title="Profile"
            >
              <User size={17} />
              {!compact && <span>Profile</span>}
            </Link>
            <Link
              href="/settings"
              onClick={() => setMobileOpen(false)}
              className={cn(
                'inline-flex h-9 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-900',
                !compact && 'gap-1 text-xs font-medium',
              )}
              aria-label={compact ? 'Settings' : undefined}
              title="Settings"
            >
              <Settings size={17} />
              {!compact && <span>Settings</span>}
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className={cn(
                'inline-flex h-9 items-center justify-center rounded-md text-gray-500 hover:bg-red-50 hover:text-red-700',
                !compact && 'gap-1 text-xs font-medium',
              )}
              aria-label={compact ? 'Sign out' : undefined}
              title="Sign out"
            >
              <LogOut size={17} />
              {!compact && <span>Sign out</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
