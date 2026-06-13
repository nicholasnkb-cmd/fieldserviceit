import { BannerMenu } from './BannerMenu';
import { SidePanel } from './SidePanel';
import { Footer } from './Footer';
import { TenantContextBanner } from './TenantContextBanner';
import { FeatureAccessGate } from './FeatureAccessGate';
import { BillingStatusBanner } from './BillingStatusBanner';
import { ImpersonationBanner } from './ImpersonationBanner';
import { TenantAnnouncementBanner } from './TenantAnnouncementBanner';

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <BannerMenu />
      <div className="flex flex-1">
        <SidePanel />
        <main className="min-w-0 flex-1 bg-slate-50">
          <ImpersonationBanner />
          <TenantContextBanner />
          <BillingStatusBanner />
          <TenantAnnouncementBanner />
          <div className="app-content">
            <FeatureAccessGate>{children}</FeatureAccessGate>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
