import { Header } from './Header';

export function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <a href="#main-content" className="sr-only z-50 rounded bg-white px-4 py-2 text-gray-950 shadow focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Skip to main content</a>
      <Header />
      <main id="main-content" tabIndex={-1} className="flex-1">{children}</main>
    </div>
  );
}
