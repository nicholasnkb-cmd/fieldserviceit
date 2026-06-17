import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: 'center',
          background: '#111827',
          border: '14px solid #2563eb',
          color: 'white',
          display: 'flex',
          fontSize: 78,
          fontWeight: 800,
          height: '100%',
          justifyContent: 'center',
          letterSpacing: 0,
          width: '100%',
        }}
      >
        FS
      </div>
    ),
    size,
  );
}
