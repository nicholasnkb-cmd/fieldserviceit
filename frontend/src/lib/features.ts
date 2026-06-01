export const routeFeatureMap: Array<{ prefix: string; feature: string }> = [
  { prefix: '/tickets', feature: 'tickets' },
  { prefix: '/my-tickets', feature: 'tickets' },
  { prefix: '/customer-portal', feature: 'tickets' },
  { prefix: '/assets', feature: 'assets' },
  { prefix: '/inventory', feature: 'assets' },
  { prefix: '/network', feature: 'network' },
  { prefix: '/alerting', feature: 'network' },
  { prefix: '/topology', feature: 'network' },
  { prefix: '/ai-agent', feature: 'aiAgent' },
  { prefix: '/knowledge-base', feature: 'kb' },
  { prefix: '/dispatch', feature: 'dispatch' },
  { prefix: '/technician-mobile', feature: 'dispatch' },
  { prefix: '/maintenance', feature: 'dispatch' },
  { prefix: '/reports', feature: 'reporting' },
  { prefix: '/integrations/rmm', feature: 'rmmIntegration' },
  { prefix: '/billing', feature: 'billing' },
  { prefix: '/quotes-invoices', feature: 'billing' },
  { prefix: '/settings', feature: 'settings' },
  { prefix: '/admin/audit-logs', feature: 'auditLogs' },
  { prefix: '/security-center', feature: 'auditLogs' },
];

export function featureForPath(pathname: string): string | null {
  const match = routeFeatureMap.find((item) => pathname === item.prefix || pathname.startsWith(`${item.prefix}/`));
  return match?.feature || null;
}

export function featureLabel(feature: string) {
  return feature.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase());
}
