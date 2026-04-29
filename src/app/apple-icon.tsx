import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#00D1B2',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '38px',
        }}
      >
        <span
          style={{
            color: '#0B0B0B',
            fontSize: 118,
            fontWeight: 800,
            letterSpacing: '-8px',
            fontFamily: 'system-ui',
            marginRight: '-8px',
          }}
        >
          F
        </span>
      </div>
    ),
    { ...size }
  );
}
