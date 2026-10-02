import { ImageResponse } from 'next/og';

// Route segment config
export const runtime = 'edge';

// Image metadata
export const size = {
  width: 512,
  height: 512,
};
export const contentType = 'image/png';

// Generate icon dynamically
export default function Icon({
  searchParams,
}: {
  searchParams: { size?: string };
}) {
  const customSize = searchParams.size ? parseInt(searchParams.size, 10) : 512;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#050505',
          border: '12px solid #12141D',
          borderRadius: '25%',
        }}
      >
        <div
          style={{
            fontSize: customSize * 0.4,
            fontWeight: 800,
            color: '#E50914',
            fontFamily: 'sans-serif',
            letterSpacing: '-0.05em',
            textShadow: '0 0 40px rgba(229,9,20,0.8)',
          }}
        >
          GB
        </div>
      </div>
    ),
    {
      width: customSize,
      height: customSize,
    }
  );
}
