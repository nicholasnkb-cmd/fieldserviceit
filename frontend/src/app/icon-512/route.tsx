import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export function GET() {
  return new ImageResponse(<AppIcon size={512} markSize={224} border={42} />, {
    width: 512,
    height: 512,
  });
}

function AppIcon({ size, markSize, border }: { size: number; markSize: number; border: number }) {
  return (
    <div
      style={{
        alignItems: 'center',
        background: '#111827',
        border: `${border}px solid #2563eb`,
        color: 'white',
        display: 'flex',
        fontSize: markSize,
        fontWeight: 800,
        height: size,
        justifyContent: 'center',
        letterSpacing: 0,
        width: size,
      }}
    >
      FS
    </div>
  );
}
