'use client';

import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 border-t border-gray-700 py-8 px-6 mt-auto">
      <div className="max-w-7xl mx-auto grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <h3 className="text-white font-semibold mb-3">FieldserviceIT</h3>
          <p className="text-sm text-gray-400">Multi-tenant ITSM &amp; MSP platform for field service management.</p>
        </div>
        <div>
          <h3 className="text-white font-semibold mb-3">Platform</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/msp-ticketing-software" className="hover:text-white transition-colors">MSP Ticketing</Link></li>
            <li><Link href="/field-service-management-software" className="hover:text-white transition-colors">Field Service Management</Link></li>
            <li><Link href="/it-asset-management-software" className="hover:text-white transition-colors">IT Asset Management</Link></li>
            <li><Link href="/technician-dispatch-software" className="hover:text-white transition-colors">Technician Dispatch</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-white font-semibold mb-3">Company</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/about" className="font-bold hover:text-white transition-colors">About Us</Link></li>
            <li><Link href="/contact" className="font-bold hover:text-white transition-colors">Contact Us</Link></li>
            <li><Link href="/register-business" className="hover:text-white transition-colors">Register a Business</Link></li>
            <li><Link href="/submit-ticket" className="font-bold hover:text-white transition-colors">Submit a Ticket</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-white font-semibold mb-3">Support</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/login" className="font-bold hover:text-white transition-colors">Sign In</Link></li>
            <li><Link href="/track" className="hover:text-white transition-colors">Track a Ticket</Link></li>
            <li><Link href="/legal-disclaimer" className="hover:text-white transition-colors">Legal Disclaimer</Link></li>
            <li><a href="mailto:support@fieldserviceit.com" className="hover:text-white transition-colors">Contact Support</a></li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-gray-700 text-center text-sm text-gray-500">
        &copy; {new Date().getFullYear()} FieldserviceIT. All rights reserved.
      </div>
    </footer>
  );
}
