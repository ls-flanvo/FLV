'use client';

export default function SocialButtons() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-surface-4" />
        <span className="text-xs text-ink-muted">oppure continua con</span>
        <div className="flex-1 h-px bg-surface-4" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <a href="/api/auth/google"
          className="flex items-center justify-center gap-2.5 px-4 py-3 bg-surface-2 border border-surface-5 rounded-xl hover:border-surface-4 hover:bg-surface-3 transition-all group">
          {/* Google icon */}
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          <span className="text-sm font-semibold text-white">Google</span>
        </a>
        <a href="/api/auth/apple"
          className="flex items-center justify-center gap-2.5 px-4 py-3 bg-surface-2 border border-surface-5 rounded-xl hover:border-surface-4 hover:bg-surface-3 transition-all group">
          {/* Apple icon */}
          <svg width="16" height="20" viewBox="0 0 814 1000" fill="currentColor" className="text-white">
            <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105-34.2-155.5-127.1c-42.8-77.1-78-203.2-78-320.1 0-190.8 124.5-291.5 246.8-291.5 66.1 0 121 43.4 162.7 43.4 39.5 0 101.1-46 176.3-46 28.5 0 130.9 2.6 198.3 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z"/>
          </svg>
          <span className="text-sm font-semibold text-white">Apple</span>
        </a>
      </div>
    </div>
  );
}
