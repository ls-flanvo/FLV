import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
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
          borderRadius: '7px',
        }}
      >
        <span
          style={{
            color: '#0B0B0B',
            fontSize: 21,
            fontWeight: 800,
            letterSpacing: '-1.5px',
            fontFamily: 'system-ui',
            marginTop: '1px',
          }}
        >
          F
        </span>
      </div>
    ),
    { ...size }
  );
}
