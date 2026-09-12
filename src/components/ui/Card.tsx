// src/components/ui/Card.tsx
import React from 'react';

interface CardProps {
  title?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ title, children, className = '' }) => {
  return (
    <div className={`card ${className}`}>
      {title && <div className="card-header mb-4 text-lg font-semibold text-text-primary">{title}</div>}
      <div className="card-body">{children}</div>
    </div>
  );
};
