import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionHref,
  actionLabel,
}: {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center">
      {Icon && <Icon aria-hidden="true" className="mb-3 text-gray-400" size={30} />}
      <h3 className="font-semibold text-gray-950">{title}</h3>
      <p className="mt-2 max-w-lg text-sm text-gray-600">{description}</p>
      {actionHref && actionLabel && (
        <Link href={actionHref} className="mt-5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
