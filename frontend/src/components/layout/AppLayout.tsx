import { BannerMenu } from './BannerMenu';
import { SidePanel } from './SidePanel';
import { Footer } from './Footer';
import { TenantContextBanner } from './TenantContextBanner';
import { FeatureAccessGate } from './FeatureAccessGate';

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <BannerMenu />
      <div className="flex flex-1">
        <SidePanel />
        <main className="flex-1 bg-gray-50">
          <TenantContextBanner />
          <FeatureAccessGate>{children}</FeatureAccessGate>
        </main>
      </div>
      <Footer />
    </div>
  );
}
