'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { cn } from '../../lib/utils';
import { api } from '../../lib/api';

const navItems = {
  public: [
    { label: 'My Tickets', href: '/my-tickets', icon: '🎫', feature: 'tickets' },
    { label: 'Submit Ticket', href: '/submit-ticket', icon: '+', feature: 'tickets' },
  ],
  business: [
    { label: 'Dashboard', href: '/dashboard', icon: '📊' },
    { label: 'Tickets', href: '/tickets', icon: '🎫', feature: 'tickets' },
    { label: 'Assets', href: '/assets', icon: '💻', feature: 'assets' },
    { label: 'Network', href: '/network', icon: 'LAN', feature: 'network' },
    { label: 'AI Agent', href: '/ai-agent', icon: 'AI', feature: 'aiAgent' },
    { label: 'Field Service', href: '/dispatch', icon: '🚚', feature: 'dispatch' },
    { label: 'Reports', href: '/reports', icon: '📈', feature: 'reporting' },
    { label: 'RMM Integrations', href: '/integrations/rmm', icon: '🔄', feature: 'rmmIntegration' },
    { label: 'Settings', href: '/settings', icon: '⚙️', feature: 'settings' },
  ],
  globalTech: [
    { label: 'Dashboard', href: '/dashboard', icon: '📊' },
    { label: 'Tickets', href: '/tickets', icon: '🎫', feature: 'tickets' },
  ],
  admin: [
    { label: 'Super Admin', href: '/admin', icon: '📊' },
    { label: 'All Tickets', href: '/tickets', icon: '🎫' },
    { label: 'Users', href: '/admin/users', icon: '👥' },
    { label: 'Companies', href: '/admin/companies', icon: '🏢' },
    { label: 'System Controls', href: '/admin/system', icon: '⚙️' },
    { label: 'Audit Logs', href: '/admin/audit-logs', icon: '📋', feature: 'auditLogs' },
    { label: 'Permissions', href: '/admin/permissions', icon: '🔒' },
    { label: 'Roles', href: '/admin/roles', icon: '🔑' },
  ],
  tenantAdmin: [
    { label: 'Company Users', href: '/admin/company', icon: '👥' },
    { label: 'Roles', href: '/admin/roles', icon: '🔑' },
    { label: 'RMM Integrations', href: '/integrations/rmm', icon: '🔄', feature: 'rmmIntegration' },
    { label: 'Settings', href: '/settings', icon: '⚙️', feature: 'settings' },
  ],
};

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
  ].filter((item) => !('feature' in item) || !item.feature || features[item.feature] !== false);

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
              <span>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
