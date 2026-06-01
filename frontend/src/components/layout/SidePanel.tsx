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

const navItems = {
  public: [
    { label: 'My Tickets', href: '/my-tickets', icon: Ticket, feature: 'tickets' },
    { label: 'Customer Portal', href: '/customer-portal', icon: Home, feature: 'tickets' },
    { label: 'Submit Ticket', href: '/submit-ticket', icon: FileText, feature: 'tickets' },
  ],
  business: [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Tickets', href: '/tickets', icon: Ticket, feature: 'tickets' },
    { label: 'Assets', href: '/assets', icon: PackageSearch, feature: 'assets' },
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

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col">
      <nav className="flex-1 py-4 px-3 space-y-1">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
              )}
            >
              <item.icon size={17} className="shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
