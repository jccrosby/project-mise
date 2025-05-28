import React from 'react';
import { clsx } from 'clsx';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  className?: string;
}

export function Badge({
  children,
  variant = 'secondary',
  className,
}: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        {
          'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200':
            variant === 'primary',
          'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200':
            variant === 'secondary',
          'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200':
            variant === 'success',
          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200':
            variant === 'warning',
          'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200':
            variant === 'error',
        },
        className
      )}
    >
      {children}
    </span>
  );
}
