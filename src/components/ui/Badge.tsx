// src/components/ui/Badge.tsx
import React from 'react';

type Status = 'success' | 'warning' | 'danger' | 'default';

interface BadgeProps {
  status?: Status;
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ status = 'default', children, className = '' }) => {
  const base = 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium';
  const colors: Record<Status, string> = {
    success: 'bg-success-color text-white',
    warning: 'bg-warning-color text-white',
    danger: 'bg-danger-color text-white',
    default: 'bg-border-color text-text-secondary',
  };
  return (
    <span className={`${base} ${colors[status]} ${className}`}>{children}</span>
  );
};
