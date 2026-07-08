import { notFound } from 'next/navigation';
import { ProfileSecuritySection } from '../../../../components/profile/ProfileSecuritySection';

type ProfileSectionPageProps = {
  params: Promise<{ section: string }>;
};

export default async function ProfileSectionPage({ params }: ProfileSectionPageProps) {
  const { section } = await params;

  if (section.toLowerCase() !== 'mfa') {
    notFound();
  }

  return (
    <div className="max-w-4xl p-8">
      <header className="mb-6 border-b border-gray-200 pb-5">
        <p className="text-xs font-semibold uppercase text-primary">Account protection</p>
        <h1 className="mt-2 text-3xl font-bold text-gray-950">MFA and Sessions</h1>
        <p className="mt-2 text-sm text-gray-600">Set up authenticator MFA, manage recovery codes, and revoke active device sessions.</p>
      </header>
      <ProfileSecuritySection />
    </div>
  );
}
