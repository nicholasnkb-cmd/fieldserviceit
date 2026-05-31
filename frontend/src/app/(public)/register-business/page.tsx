'use client';

import { Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '../../../stores/authStore';
import { unwrapResponseBody } from '../../../lib/api';

function RegisterBusinessForm() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [location, setLocation] = useState('');
  const [preferredContactMethod, setPreferredContactMethod] = useState('Email');
  const [timezone, setTimezone] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPlan = useMemo(() => {
    const requestedPlan = searchParams.get('plan') || '';
    return requestedPlan === 'Business' ? requestedPlan : 'Business';
  }, [searchParams]);
  const selectedPlan = initialPlan;

  const startCheckout = async (apiUrl: string, planName: string) => {
    const plansRes = await fetch(`${apiUrl}/v1/plans`, { credentials: 'include' });
    if (!plansRes.ok) throw new Error('Account created, but plans could not be loaded');

    const plansData = await plansRes.json();
    const plan = (plansData.data || []).find((item: any) => item.name?.toLowerCase() === planName.toLowerCase());
    if (!plan || plan.monthlyPrice === 0) throw new Error('Companies must choose a paid plan');

    const checkoutRes = await fetch(`${apiUrl}/v1/billing/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        planId: plan.id,
        successUrl: `${window.location.origin}/billing?success=1`,
        cancelUrl: `${window.location.origin}/billing?canceled=1&plan=${encodeURIComponent(plan.name)}`,
      }),
    });

    if (!checkoutRes.ok) {
      const err = await checkoutRes.json().catch(() => ({}));
      throw new Error(err.message || 'Account created, but checkout could not be started');
    }

    const checkout = unwrapResponseBody(await checkoutRes.json());
    if (checkout.url) {
      window.location.href = checkout.url;
      return;
    }

    router.push('/billing');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    if (!inviteCode && !companyName.trim()) {
      setError('Company name is required when creating a new workspace');
      setLoading(false);
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${apiUrl}/v1/auth/register-business`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email,
          password,
          firstName,
          lastName,
          phone,
          jobTitle,
          department,
          location,
          preferredContactMethod,
          timezone,
          planName: selectedPlan,
          ...(inviteCode ? { inviteCode } : { companyName: companyName.trim() }),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Registration failed');
      }

      const data = unwrapResponseBody(await res.json());
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(data.user);

      await startCheckout(apiUrl, selectedPlan);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 py-12">
      <div className="w-full max-w-md space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="text-3xl font-bold text-center">Register Your Business</h2>
          <p className="mt-2 text-sm text-gray-600 text-center">
            Join your company&apos;s IT service portal
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <div className="bg-red-50 text-red-600 p-3 rounded text-sm">{error}</div>}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">First name</label>
              <input type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)}
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Last name</label>
              <input type="text" required value={lastName} onChange={(e) => setLastName(e.target.value)}
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Company name</label>
            <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Acme IT Services"
              className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
            <p className="text-xs text-gray-400 mt-1">
              Required for a new workspace; optional when using an invite code
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Selected plan</label>
            <div className="mt-1 rounded border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900">
              Business - $79/month
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Companies have one plan; Free and Starter are for individuals
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Work email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
            <p className="text-xs text-gray-400 mt-1">
              Use the email address you want attached to your company workspace
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Phone number</label>
            <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)}
              className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Job title</label>
              <input type="text" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)}
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Department</label>
              <input type="text" value={department} onChange={(e) => setDepartment(e.target.value)}
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Location</label>
              <input type="text" value={location} onChange={(e) => setLocation(e.target.value)}
                placeholder="City, state"
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Timezone</label>
              <input type="text" value={timezone} onChange={(e) => setTimezone(e.target.value)}
                placeholder="Eastern"
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Preferred contact method</label>
            <select
              value={preferredContactMethod}
              onChange={(e) => setPreferredContactMethod(e.target.value)}
              className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option>Email</option>
              <option>Phone</option>
              <option>Text message</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Invite code <span className="text-gray-400">(optional)</span>
            </label>
            <input type="text" value={inviteCode} onChange={(e) => setInviteCode(e.target.value)}
              placeholder="e.g. A1B2C3D4"
              className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
            <p className="text-xs text-gray-400 mt-1">
              Leave blank to create a new company workspace
            </p>
          </div>

          <button type="submit" disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50">
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <div className="text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link href="/login" className="text-primary hover:underline">Sign in</Link>
        </div>
      </div>
    </div>
  );
}

export default function RegisterBusinessPage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh] flex items-center justify-center bg-gray-50 py-12">Loading registration...</div>}>
      <RegisterBusinessForm />
    </Suspense>
  );
}
