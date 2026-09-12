// src/components/ui/Button.tsx
import React from 'react';
import { LucideIcon } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'icon';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  // Optional icon component from Lucide
  Icon?: LucideIcon;
  children?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  Icon,
  children,
  className = '',
  ...rest
}) => {
  const baseClass = 'btn';
  const variantClass = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    danger: 'btn-danger',
    icon: 'btn-icon',
  }[variant];

  return (
    <button className={`${baseClass} ${variantClass} ${className}`} {...rest}>
      {Icon && <Icon size={16} />}
      {children}
    </button>
  );
};
