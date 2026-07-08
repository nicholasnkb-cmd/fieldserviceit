'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

type MfaSetupCardProps = {
  secret: string;
  otpauthUri: string;
};

export function MfaSetupCard({ secret, otpauthUri }: MfaSetupCardProps) {
  const [qrDataUrl, setQrDataUrl] = useState('');

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(otpauthUri, {
      errorCorrectionLevel: 'M',
      margin: 2,
      scale: 6,
      width: 192,
      color: {
        dark: '#111827',
        light: '#ffffff',
      },
    }).then((value) => {
      if (active) setQrDataUrl(value);
    }).catch(() => {
      if (active) setQrDataUrl('');
    });
    return () => {
      active = false;
    };
  }, [otpauthUri]);

  return (
    <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
      <div className="flex h-48 w-48 items-center justify-center rounded-md border border-blue-200 bg-white p-3">
        {qrDataUrl ? (
          <img src={qrDataUrl} alt="Authenticator app setup QR code" className="h-full w-full" />
        ) : (
          <span className="text-center text-xs font-medium text-gray-500">QR code unavailable</span>
        )}
      </div>
      <div className="space-y-3 text-sm text-blue-950">
        <p>Open Google Authenticator, tap Add code, then scan this QR code.</p>
        <div>
          <p className="mb-1 text-xs font-semibold uppercase text-blue-700">Manual setup key</p>
          <p className="break-all rounded-md bg-white px-3 py-2 font-mono text-sm font-semibold text-gray-950">{secret}</p>
        </div>
        <p className="text-xs text-blue-700">Use time-based setup with 6 digits and a 30-second refresh.</p>
      </div>
    </div>
  );
}
