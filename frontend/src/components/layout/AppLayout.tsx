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
      <a href="#main-content" className="sr-only z-[120] rounded bg-white px-4 py-2 text-gray-950 shadow focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Skip to main content</a>
      <BannerMenu />
      <div className="flex flex-1">
        <SidePanel />
        <main id="main-content" tabIndex={-1} className="min-w-0 flex-1 bg-background">
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
