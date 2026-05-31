export const routeFeatureMap: Array<{ prefix: string; feature: string }> = [
  { prefix: '/tickets', feature: 'tickets' },
  { prefix: '/my-tickets', feature: 'tickets' },
  { prefix: '/assets', feature: 'assets' },
  { prefix: '/network', feature: 'network' },
  { prefix: '/ai-agent', feature: 'aiAgent' },
  { prefix: '/dispatch', feature: 'dispatch' },
  { prefix: '/reports', feature: 'reporting' },
  { prefix: '/integrations/rmm', feature: 'rmmIntegration' },
  { prefix: '/billing', feature: 'billing' },
  { prefix: '/settings', feature: 'settings' },
  { prefix: '/admin/audit-logs', feature: 'auditLogs' },
];

export function featureForPath(pathname: string): string | null {
  const match = routeFeatureMap.find((item) => pathname === item.prefix || pathname.startsWith(`${item.prefix}/`));
  return match?.feature || null;
}

export function featureLabel(feature: string) {
  return feature.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase());
}
