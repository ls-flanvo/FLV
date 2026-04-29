import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#000000',
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
            color: '#ffffff',
            fontSize: 19,
            fontWeight: 800,
            letterSpacing: '-1.5px',
            fontFamily: 'system-ui',
          }}
        >
          F
        </span>
      </div>
    ),
    { ...size }
  );
}
