import type { ReactNode } from 'react';

interface CardProps {
  title?: string;
  icon?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * Consistent surface panel used across the dashboard. Optional header with an
 * icon, title, and an action slot (e.g. a button) on the right.
 */
export default function Card({ title, icon, action, children, className = '' }: CardProps) {
  return (
    <section
      className={
        'rounded-lg border border-surface-2/60 bg-surface p-4 shadow-sm sm:p-5 ' +
        className
      }
    >
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="font-heading flex items-center gap-2 text-lg font-semibold">
            {icon && (
              <span aria-hidden="true" className="text-xl">
                {icon}
              </span>
            )}
            {title}
          </h3>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
