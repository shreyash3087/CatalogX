'use client';

import React, { useState, useEffect } from 'react';

interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showBorder?: boolean;
  borderColor?: string;
  fallbackBg?: string;
}

const sizeClasses = {
  xs: 'w-5 h-5 text-[10px]',
  sm: 'w-6 h-6 text-[11px]',
  md: 'w-7 h-7 text-[12px]',
  lg: 'w-8 h-8 text-[13px]',
  xl: 'w-11 h-11 text-base font-bold',
};

export default function UserAvatar({
  src,
  name = 'User',
  size = 'md',
  className = '',
  showBorder = true,
  borderColor = 'border-emerald-500/80',
  fallbackBg = 'bg-blue-600',
}: UserAvatarProps) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  const initial = (name && name.trim().length > 0 ? name.trim().charAt(0) : 'U').toUpperCase();
  const dimension = sizeClasses[size] || sizeClasses.md;
  const borderStyle = showBorder ? `border ${borderColor}` : '';

  if (src && !hasError) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name || 'User avatar'}
        referrerPolicy="no-referrer"
        crossOrigin="anonymous"
        onError={() => setHasError(true)}
        className={`${dimension} rounded-full object-cover flex-shrink-0 ${borderStyle} ${className}`}
      />
    );
  }

  return (
    <div
      className={`${dimension} rounded-full ${fallbackBg} text-white font-bold flex items-center justify-center flex-shrink-0 select-none ${borderStyle} ${className}`}
      title={name || 'User'}
    >
      {initial}
    </div>
  );
}
