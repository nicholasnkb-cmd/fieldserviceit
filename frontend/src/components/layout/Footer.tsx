'use client';

import Link from 'next/link';

const supportLinks = [
  { href: '/login', label: 'Sign In', bold: true },
  { href: '/track', label: 'Track a Ticket' },
  { href: '/legal-disclaimer', label: 'Legal Disclaimer' },
  { href: '/terms', label: 'Terms of Service' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/security-overview', label: 'Security' },
  { href: '/status', label: 'Service Status' },
];

const platformLinks = [
  { href: '/msp-ticketing-software', label: 'MSP Ticketing' },
  { href: '/field-service-management-software', label: 'Field Service Management' },
  { href: '/it-asset-management-software', label: 'IT Asset Management' },
  { href: '/technician-dispatch-software', label: 'Technician Dispatch' },
];

const companyLinks = [
  { href: '/about', label: 'About Us', bold: true },
  { href: '/contact', label: 'Contact Us', bold: true },
  { href: '/register-business', label: 'Register a Business' },
  { href: '/submit-ticket', label: 'Submit a Ticket', bold: true },
];

export function Footer({ compact = false }: { compact?: boolean }) {
  const year = new Date().getFullYear();

  return (
    <footer className={`mt-auto border-t border-gray-700 bg-gray-900 px-6 text-gray-300 ${compact ? 'py-6' : 'py-8'}`}>
      <nav aria-label="Footer navigation" className={`mx-auto grid max-w-7xl grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 ${compact ? 'gap-5' : 'gap-8'}`}>
        <div>
          <h3 className="text-white font-semibold mb-3">FieldserviceIT</h3>
          <p className="text-sm text-gray-400">Multi-tenant ITSM &amp; MSP platform for field service management.</p>
        </div>
        <div>
          <h3 className="text-white font-semibold mb-3">Platform</h3>
          <ul className="space-y-2 text-sm">
            {platformLinks.map((link) => <li key={link.href}><Link href={link.href} className="transition-colors hover:text-white">{link.label}</Link></li>)}
          </ul>
        </div>
        <div>
          <h3 className="text-white font-semibold mb-3">Company</h3>
          <ul className="space-y-2 text-sm">
            {companyLinks.map((link) => (
              <li key={link.href}><Link href={link.href} className={`${link.bold ? 'font-bold ' : ''}transition-colors hover:text-white`}>{link.label}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-white font-semibold mb-3">Support</h3>
          <ul className="space-y-2 text-sm">
            {supportLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={`${link.bold ? 'font-bold ' : ''}hover:text-white transition-colors`}>
                  {link.label}
                </Link>
              </li>
            ))}
            <li><a href="mailto:support@fieldserviceit.com" className="hover:text-white transition-colors">Contact Support</a></li>
          </ul>
        </div>
      </nav>
      <div className={`mx-auto max-w-7xl border-t border-gray-700 text-center text-sm text-gray-400 ${compact ? 'mt-5 pt-4' : 'mt-8 pt-6'}`}>
        <p aria-label={`Copyright ${year} FieldserviceIT`}>&copy; {year} FieldserviceIT. All rights reserved.</p>
      </div>
    </footer>
  );
}
