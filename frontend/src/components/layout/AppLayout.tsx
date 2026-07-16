import { BannerMenu } from './BannerMenu';
import { SidePanel } from './SidePanel';
import { TenantContextBanner } from './TenantContextBanner';
import { FeatureAccessGate } from './FeatureAccessGate';
import { BillingStatusBanner } from './BillingStatusBanner';
import { ImpersonationBanner } from './ImpersonationBanner';
import { TenantAnnouncementBanner } from './TenantAnnouncementBanner';
import { OnboardingChecklist } from './OnboardingChecklist';

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col bg-background text-foreground">
      <BannerMenu />
      <div className="flex flex-1">
        <SidePanel />
        <main className="min-w-0 flex-1 bg-background">
          <ImpersonationBanner />
          <TenantContextBanner />
          <BillingStatusBanner />
          <TenantAnnouncementBanner />
          <OnboardingChecklist />
          <div className="app-content">
            <FeatureAccessGate>{children}</FeatureAccessGate>
          </div>
        </main>
      </div>
    </div>
  );
}
