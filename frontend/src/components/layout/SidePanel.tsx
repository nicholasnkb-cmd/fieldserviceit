'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Bot,
  Boxes,
  Building2,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  CreditCard,
  FileText,
  Gauge,
  GitFork,
  Home,
  KeyRound,
  LayoutDashboard,
  Lock,
  Map,
  PackageSearch,
  RefreshCw,
  Route,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Smartphone,
  Ticket,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { cn } from '../../lib/utils';
import { api } from '../../lib/api';

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  feature?: string;
};

const SIDE_PANEL_COLLAPSED_KEY = 'fsit.sidePanelCollapsed';

const navItems = {
  public: [
    { label: 'My Tickets', href: '/my-tickets', icon: Ticket, feature: 'tickets' },
    { label: 'Service Catalog', href: '/catalog-requests', icon: ShoppingCart, feature: 'catalogRequests' },
    { label: 'Customer Portal', href: '/customer-portal', icon: Home, feature: 'tickets' },
    { label: 'Submit Ticket', href: '/submit-ticket', icon: FileText, feature: 'tickets' },
  ],
  business: [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Tickets', href: '/tickets', icon: Ticket, feature: 'tickets' },
    { label: 'Assets', href: '/assets', icon: PackageSearch, feature: 'assets' },
    { label: 'Service Catalog', href: '/catalog-requests', icon: ShoppingCart, feature: 'catalogRequests' },
    { label: 'Network', href: '/network', icon: GitFork, feature: 'network' },
    { label: 'AI Agent', href: '/ai-agent', icon: Bot, feature: 'aiAgent' },
    { label: 'Customer Portal', href: '/customer-portal', icon: Home, feature: 'tickets' },
    { label: 'Technician Mobile', href: '/technician-mobile', icon: Smartphone, feature: 'dispatch' },
    { label: 'Field Service', href: '/dispatch', icon: Route, feature: 'dispatch' },
    { label: 'Inventory', href: '/inventory', icon: Boxes, feature: 'assets' },
    { label: 'Quotes & Invoices', href: '/quotes-invoices', icon: CreditCard, feature: 'billing' },
    { label: 'SLA Tracking', href: '/sla', icon: Gauge, feature: 'tickets' },
    { label: 'Maintenance', href: '/maintenance', icon: CalendarClock, feature: 'dispatch' },
    { label: 'Knowledge Base', href: '/knowledge-base', icon: ClipboardList, feature: 'kb' },
    { label: 'Advanced Alerting', href: '/alerting', icon: AlertTriangle, feature: 'network' },
    { label: 'Topology Map', href: '/topology', icon: Map, feature: 'network' },
    { label: 'Security Center', href: '/security-center', icon: ShieldCheck, feature: 'auditLogs' },
    { label: 'Reports', href: '/reports', icon: BarChart3, feature: 'reporting' },
    { label: 'RMM Integrations', href: '/integrations/rmm', icon: RefreshCw, feature: 'rmmIntegration' },
    { label: 'Settings', href: '/settings', icon: Settings, feature: 'settings' },
  ],
  globalTech: [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Tickets', href: '/tickets', icon: Ticket, feature: 'tickets' },
    { label: 'Technician Mobile', href: '/technician-mobile', icon: Smartphone, feature: 'dispatch' },
    { label: 'Knowledge Base', href: '/knowledge-base', icon: ClipboardList, feature: 'kb' },
  ],
  admin: [
    { label: 'Super Admin', href: '/admin', icon: LayoutDashboard },
    { label: 'All Tickets', href: '/tickets', icon: Ticket },
    { label: 'Users', href: '/admin/users', icon: Users },
    { label: 'Companies', href: '/admin/companies', icon: Building2 },
    { label: 'System Controls', href: '/admin/system', icon: Settings },
    { label: 'Security Center', href: '/security-center', icon: ShieldCheck },
    { label: 'Audit Logs', href: '/admin/audit-logs', icon: ClipboardList, feature: 'auditLogs' },
    { label: 'Permissions', href: '/admin/permissions', icon: Lock },
    { label: 'Roles', href: '/admin/roles', icon: KeyRound },
  ],
  tenantAdmin: [
    { label: 'Company Users', href: '/admin/company', icon: Users },
    { label: 'Roles', href: '/admin/roles', icon: KeyRound },
    { label: 'Security Center', href: '/security-center', icon: ShieldCheck },
    { label: 'RMM Integrations', href: '/integrations/rmm', icon: RefreshCw, feature: 'rmmIntegration' },
    { label: 'Settings', href: '/settings', icon: Settings, feature: 'settings' },
  ],
} satisfies Record<string, NavItem[]>;

export function SidePanel() {
  const pathname = usePathname();
  const { user, authChecked, isAuthenticated } = useAuthStore();
  const [features, setFeatures] = useState<Record<string, boolean>>({});
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(SIDE_PANEL_COLLAPSED_KEY) === 'true');
    } catch {}
  }, []);

  useEffect(() => {
    if (!authChecked || !isAuthenticated) return;
    api.get('/users/me/features').then((data) => setFeatures(data.features || {})).catch(() => {});
  }, [authChecked, isAuthenticated]);

  if (!user) return null;

  const items = [
    ...(user.role === 'GLOBAL_TECH' ? navItems.globalTech : user.userType === 'PUBLIC' ? navItems.public : navItems.business),
    ...(user.role === 'SUPER_ADMIN' ? navItems.admin : []),
    ...(user.role === 'TENANT_ADMIN' ? navItems.tenantAdmin : []),
  ].filter((item, index, allItems) => {
    const isFirstHref = allItems.findIndex((candidate) => candidate.href === item.href) === index;
    const isEnabled = !item.feature || features[item.feature] !== false;
    return isFirstHref && isEnabled;
  });

  const toggleCollapsed = () => {
    setCollapsed((current) => {
      const next = !current;
      try {
        localStorage.setItem(SIDE_PANEL_COLLAPSED_KEY, String(next));
      } catch {}
      return next;
    });
  };

  return (
    <aside className={cn(
      'bg-white border-r border-gray-200 min-h-screen flex flex-col transition-[width] duration-200 ease-in-out',
      collapsed ? 'w-20' : 'w-64',
    )}>
      <div className={cn('flex items-center border-b border-gray-100 px-3 py-3', collapsed ? 'justify-center' : 'justify-between')}>
        {!collapsed && <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Navigation</span>}
        <button
          type="button"
          onClick={toggleCollapsed}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-900"
          aria-label={collapsed ? 'Expand side menu' : 'Collapse side menu'}
          title={collapsed ? 'Expand side menu' : 'Collapse side menu'}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav className={cn('flex-1 py-4 space-y-1', collapsed ? 'px-2' : 'px-3')}>
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group relative flex h-10 items-center rounded-md text-sm font-medium transition-colors',
                collapsed ? 'justify-center px-0' : 'gap-3 px-3',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
              )}
              aria-label={collapsed ? item.label : undefined}
              title={collapsed ? item.label : undefined}
            >
              <item.icon size={17} className="shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
              {collapsed && (
                <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 hidden -translate-y-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1.5 text-xs font-semibold text-white shadow-lg group-hover:block">
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
