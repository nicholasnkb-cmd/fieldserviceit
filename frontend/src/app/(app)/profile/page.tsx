'use client';
import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import { useToast } from '../../../components/ui/Toast';

const notificationEvents = [
  ['ticket_created', 'New tickets'],
  ['ticket_comments', 'Comments and email replies'],
  ['ticket_assignment', 'Assignments'],
  ['ticket_attachments', 'Attachments'],
  ['ticket_time', 'Work log updates'],
  ['dispatch', 'Field service updates'],
  ['automated', 'Automated monitoring updates'],
] as const;

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '' });
  const [pw, setPw] = useState({ oldPassword: '', newPassword: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [preferences, setPreferences] = useState<any>(null);
  const [preferenceSaving, setPreferenceSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    api.get('/users/me').then((d) => { setProfile(d); setForm({ firstName: d.firstName, lastName: d.lastName, phone: d.phone || '' }); }).catch(() => {}).finally(() => setLoading(false));
    api.get('/notifications/preferences').then(setPreferences).catch(() => {});
  }, []);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try { await api.patch('/users/me', form); toast('success', 'Profile updated'); } catch (err: any) { toast('error', err.message); }
    finally { setSaving(false); }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault(); setPwSaving(true);
    try { await api.post('/users/me/change-password', pw); toast('success', 'Password changed'); setPw({ oldPassword: '', newPassword: '' }); } catch (err: any) { toast('error', err.message); }
    finally { setPwSaving(false); }
  };

  const savePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setPreferenceSaving(true);
    try {
      const updated = await api.patch('/notifications/preferences', preferences);
      setPreferences(updated);
      toast('success', 'Email preferences updated');
    } catch (err: any) {
      toast('error', err.message);
    } finally {
      setPreferenceSaving(false);
    }
  };

  const resubscribe = async () => {
    setPreferenceSaving(true);
    try {
      const updated = await api.post('/notifications/preferences/resubscribe', {});
      setPreferences(updated);
      toast('success', 'Optional email notifications restored');
    } catch (err: any) {
      toast('error', err.message);
    } finally {
      setPreferenceSaving(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Profile</h1>
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Account Info</h2>
        <p className="text-sm text-gray-600 mb-4">Email: <span className="font-medium">{profile?.email}</span> &middot; Role: <span className="font-medium">{profile?.role}</span></p>
        <form onSubmit={saveProfile} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700">First Name</label>
              <input value={form.firstName} onChange={(e) => setForm({...form, firstName: e.target.value})} className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm" /></div>
            <div><label className="block text-sm font-medium text-gray-700">Last Name</label>
              <input value={form.lastName} onChange={(e) => setForm({...form, lastName: e.target.value})} className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm" /></div>
          </div>
          <div><label className="block text-sm font-medium text-gray-700">Phone</label>
            <input value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm" /></div>
          <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-white text-sm rounded-md hover:bg-primary/90 disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
        </form>
      </div>
      {preferences && (
        <div className="mb-6 rounded-lg bg-white p-6 shadow">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Email Notifications</h2>
            <p className="mt-1 text-sm text-gray-500">Choose immediate updates or a daily ticket digest.</p>
          </div>
          <form onSubmit={savePreferences} className="space-y-5">
            <div className="flex items-center justify-between gap-4 rounded border border-gray-200 p-3">
              <div>
                <div className="text-sm font-medium text-gray-900">Optional email updates</div>
                <div className="text-xs text-gray-500">Status, resolution, SLA, and security notices remain enabled.</div>
              </div>
              <input
                type="checkbox"
                checked={!!preferences.emailEnabled}
                onChange={(e) => setPreferences({ ...preferences, emailEnabled: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {notificationEvents.map(([key, label]) => (
                <label key={key} className="flex items-center gap-3 rounded border border-gray-200 p-3 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={preferences.events?.[key] !== false}
                    disabled={!preferences.emailEnabled}
                    onChange={(e) => setPreferences({
                      ...preferences,
                      events: { ...preferences.events, [key]: e.target.checked },
                    })}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary disabled:opacity-50"
                  />
                  {label}
                </label>
              ))}
            </div>

            <div className="rounded border border-gray-200 p-3">
              <label className="flex items-center justify-between gap-4">
                <span>
                  <span className="block text-sm font-medium text-gray-900">Daily digest</span>
                  <span className="block text-xs text-gray-500">Bundle optional updates into one scheduled email.</span>
                </span>
                <input
                  type="checkbox"
                  checked={!!preferences.digestDaily}
                  disabled={!preferences.emailEnabled}
                  onChange={(e) => setPreferences({ ...preferences, digestDaily: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary disabled:opacity-50"
                />
              </label>
              {preferences.digestDaily && (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-600">Delivery hour</label>
                    <select
                      value={preferences.digestHour ?? 8}
                      onChange={(e) => setPreferences({ ...preferences, digestHour: Number(e.target.value) })}
                      className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                    >
                      {Array.from({ length: 24 }, (_, hour) => (
                        <option key={hour} value={hour}>{String(hour).padStart(2, '0')}:00</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600">Timezone</label>
                    <input
                      value={preferences.timezone || 'UTC'}
                      onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
                      className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                      placeholder="America/New_York"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <button type="submit" disabled={preferenceSaving} className="rounded-md bg-primary px-4 py-2 text-sm text-white hover:bg-primary/90 disabled:opacity-50">
                {preferenceSaving ? 'Saving...' : 'Save Preferences'}
              </button>
              {!preferences.emailEnabled && (
                <button type="button" onClick={resubscribe} disabled={preferenceSaving} className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                  Restore Optional Emails
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Change Password</h2>
        <form onSubmit={changePassword} className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700">Current Password</label>
            <input type="password" required value={pw.oldPassword} onChange={(e) => setPw({...pw, oldPassword: e.target.value})} className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm" /></div>
          <div><label className="block text-sm font-medium text-gray-700">New Password</label>
            <input type="password" required minLength={6} value={pw.newPassword} onChange={(e) => setPw({...pw, newPassword: e.target.value})} className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm" /></div>
          <button type="submit" disabled={pwSaving} className="px-4 py-2 bg-primary text-white text-sm rounded-md hover:bg-primary/90 disabled:opacity-50">{pwSaving ? 'Changing...' : 'Change Password'}</button>
        </form>
      </div>
    </div>
  );
}
