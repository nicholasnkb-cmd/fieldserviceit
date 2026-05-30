'use client';

import { Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '../../../stores/authStore';

const individualPlans = ['Free', 'Starter'];

function RegisterForm() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [preferredContactMethod, setPreferredContactMethod] = useState('Email');
  const [timezone, setTimezone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPlan = useMemo(() => {
    const requestedPlan = searchParams.get('plan') || '';
    return individualPlans.includes(requestedPlan) ? requestedPlan : 'Free';
  }, [searchParams]);
  const [selectedPlan, setSelectedPlan] = useState(initialPlan);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${apiUrl}/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          firstName,
          lastName,
          phone,
          location,
          preferredContactMethod,
          timezone,
          planName: selectedPlan,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Registration failed');
      }

      const data = await res.json();
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      setUser(data.user);

      router.push('/submit-ticket');
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
          <h2 className="text-3xl font-bold text-center">Create Account</h2>
          <p className="mt-2 text-sm text-gray-600 text-center">
            Register to submit and track service requests
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <div className="bg-red-50 text-red-600 p-3 rounded text-sm">{error}</div>}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                First name
              </label>
              <input
                id="firstName"
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                Last name
              </label>
              <input
                id="lastName"
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label htmlFor="selectedPlan" className="block text-sm font-medium text-gray-700">
              Selected plan
            </label>
            <select
              id="selectedPlan"
              value={selectedPlan}
              onChange={(e) => setSelectedPlan(e.target.value)}
              className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="Free">Free</option>
              <option value="Starter">Starter - $29/month</option>
            </select>
            <p className="text-xs text-gray-400 mt-1">
              Business signup is handled separately
            </p>
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              Phone number
            </label>
            <input
              id="phone"
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                Location
              </label>
              <input
                id="location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City, state"
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label htmlFor="timezone" className="block text-sm font-medium text-gray-700">
                Timezone
              </label>
              <input
                id="timezone"
                type="text"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                placeholder="Eastern"
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label htmlFor="preferredContactMethod" className="block text-sm font-medium text-gray-700">
              Preferred contact method
            </label>
            <select
              id="preferredContactMethod"
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
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <div className="text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link href="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh] flex items-center justify-center bg-gray-50 py-12">Loading registration...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
