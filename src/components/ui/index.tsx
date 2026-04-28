import React from 'react';

// ─────────────────────────────────────────────
// BUTTON
// ─────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}) => {
  const base =
    'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-[#0B0B0B]';

  const variants = {
    primary:
      'bg-primary-500 text-[#0B0B0B] hover:bg-primary-400 shadow-teal',
    secondary:
      'bg-surface-2 text-white border border-surface-5 hover:border-primary-500 hover:text-primary-500',
    ghost:
      'text-ink-secondary hover:text-white hover:bg-surface-2',
    outline:
      'border border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-[#0B0B0B]',
    danger:
      'bg-danger/10 text-danger border border-danger/30 hover:bg-danger hover:text-white',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-5 py-2.5 text-sm gap-2',
    lg: 'px-7 py-3.5 text-base gap-2',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

// ─────────────────────────────────────────────
// INPUT
// ─────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  hint,
  className = '',
  ...props
}) => (
  <div className="w-full">
    {label && (
      <label className="block text-sm font-medium text-ink-secondary mb-1.5">
        {label}
      </label>
    )}
    <input
      className={`w-full px-4 py-3 bg-surface-2 border rounded-xl text-white placeholder-ink-muted
        transition-all duration-150
        ${error ? 'border-danger focus:ring-danger/30' : 'border-surface-5 focus:border-primary-500 focus:ring-primary-500/15'}
        focus:outline-none focus:ring-2
        ${className}`}
      {...props}
    />
    {hint && !error && <p className="mt-1.5 text-xs text-ink-muted">{hint}</p>}
    {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
  </div>
);

// ─────────────────────────────────────────────
// CARD
// ─────────────────────────────────────────────
interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  glow?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  padding = 'md',
  glow = false,
}) => {
  const pads = { none: '', sm: 'p-4', md: 'p-6', lg: 'p-8' };

  return (
    <div
      className={`
        bg-surface-1 border border-surface-4 rounded-2xl
        shadow-surface bg-card-gradient
        ${glow ? 'border-primary-500/30 shadow-teal' : ''}
        ${pads[padding]}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

// ─────────────────────────────────────────────
// BADGE
// ─────────────────────────────────────────────
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'default' | 'teal';
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  dot = false,
}) => {
  const variants = {
    success: 'bg-success/10 text-success border border-success/20',
    warning: 'bg-warning/10 text-warning border border-warning/20',
    danger:  'bg-danger/10  text-danger  border border-danger/20',
    info:    'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    teal:    'bg-primary-500/10 text-primary-400 border border-primary-500/20',
    default: 'bg-surface-3 text-ink-secondary border border-surface-5',
  };

  const dots = {
    success: 'bg-success',
    warning: 'bg-warning',
    danger:  'bg-danger',
    info:    'bg-blue-400',
    teal:    'bg-primary-500',
    default: 'bg-ink-muted',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${variants[variant]}`}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dots[variant]}`} />
      )}
      {children}
    </span>
  );
};

// ─────────────────────────────────────────────
// MODAL
// ─────────────────────────────────────────────
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-surface-1 border border-surface-4 rounded-2xl shadow-surface max-w-md w-full max-h-[90vh] overflow-y-auto animate-scaleIn">
        <div className="p-6">
          {title && (
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-bold text-white">{title}</h3>
              <button
                onClick={onClose}
                className="text-ink-muted hover:text-white transition-colors p-1 rounded-lg hover:bg-surface-3"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// STAT CARD
// ─────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon?: React.ReactNode;
  accent?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  sub,
  icon,
  accent = false,
}) => (
  <Card className={accent ? 'border-primary-500/30 bg-primary-500/5' : ''}>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-ink-secondary mb-1">{label}</p>
        <p className={`text-3xl font-bold ${accent ? 'text-primary-400' : 'text-white'}`}>
          {value}
        </p>
        {sub && <p className="text-xs text-ink-muted mt-1">{sub}</p>}
      </div>
      {icon && (
        <div className={`p-3 rounded-xl ${accent ? 'bg-primary-500/15' : 'bg-surface-3'}`}>
          {icon}
        </div>
      )}
    </div>
  </Card>
);
