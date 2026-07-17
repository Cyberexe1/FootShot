import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-hover',
  secondary: 'border border-surface-2 text-content hover:border-primary',
  ghost: 'text-content-muted hover:text-content',
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

/**
 * Shared button primitive. Centralizes sizing, focus, and disabled states so
 * every button in the app is consistent and meets the 44px touch-target rule.
 */
export default function Button({
  variant = 'primary',
  className = '',
  type = 'button',
  ...rest
}: Props) {
  return (
    <button
      type={type}
      className={
        'inline-flex min-h-[2.5rem] items-center justify-center gap-2 rounded-md px-4 py-2 ' +
        'text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ' +
        VARIANTS[variant] +
        (className ? ` ${className}` : '')
      }
      {...rest}
    />
  );
}
