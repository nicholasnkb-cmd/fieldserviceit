'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { api } from '../../lib/api';
import { featureForPath, featureLabel } from '../../lib/features';
import { useAuthStore } from '../../stores/authStore';

export function FeatureAccessGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isAuthenticated } = useAuthStore();
  const [features, setFeatures] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!isAuthenticated) return;
    api.get('/users/me/features')
      .then((data) => setFeatures(data.features || {}))
      .catch(() => {});
  }, [isAuthenticated]);

  const disabledFeature = useMemo(() => {
    const feature = featureForPath(pathname);
    return feature && features[feature] === false ? feature : null;
  }, [features, pathname]);

  if (disabledFeature) {
    return (
      <div className="p-8">
        <div className="mx-auto max-w-xl rounded border border-amber-200 bg-amber-50 p-6 text-center">
          <h1 className="text-xl font-semibold text-amber-900">{featureLabel(disabledFeature)} is disabled</h1>
          <p className="mt-2 text-sm text-amber-800">
            This function has been turned off for your business or user account by a super admin.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
