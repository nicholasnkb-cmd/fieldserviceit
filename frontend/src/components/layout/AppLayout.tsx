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
    <div className="min-h-screen flex flex-col">
      <BannerMenu />
      <div className="flex flex-1">
        <SidePanel />
        <main className="min-w-0 flex-1 bg-background">
          <ImpersonationBanner />
          <TenantContextBanner />
          <BillingStatusBanner />
          <TenantAnnouncementBanner />
          <FeatureAccessGate>{children}</FeatureAccessGate>
        </main>
      </div>
      <Footer />
    </div>
  );
}
