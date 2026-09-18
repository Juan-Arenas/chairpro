'use client';

import React from 'react';

interface ShopLogoProps {
  logoUrl?: string;
  name?: string;
  shopName?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  primaryColor?: string;
  className?: string;
  fallbackEmoji?: string;
  style?: React.CSSProperties;
}

const SIZE_CLASSES = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-9 h-9 text-base',
  lg: 'w-12 h-12 text-xl',
  xl: 'w-16 h-16 text-3xl',
};

export function ShopLogo({
  logoUrl,
  name,
  shopName,
  size,
  primaryColor,
  className = '',
  fallbackEmoji = '✂️',
  style,
}: ShopLogoProps) {
  const displayName = shopName || name || 'Barbería';
  const sizeClass = size ? SIZE_CLASSES[size] : 'w-9 h-9 text-sm';
  const combinedStyle: React.CSSProperties = {
    ...(primaryColor ? { backgroundColor: primaryColor, boxShadow: `0 0 12px ${primaryColor}40` } : {}),
    ...style,
  };

  const isImage = Boolean(
    logoUrl &&
    (logoUrl.startsWith('http://') ||
     logoUrl.startsWith('https://') ||
     logoUrl.startsWith('data:image/') ||
     logoUrl.startsWith('/') ||
     logoUrl.startsWith('blob:'))
  );

  if (isImage && logoUrl) {
    return (
      <div
        className={`${sizeClass} ${className} rounded-xl overflow-hidden flex items-center justify-center shrink-0 border border-white/10 shadow-sm relative select-none`}
        style={combinedStyle}
      >
        <img
          src={logoUrl}
          alt={displayName}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      </div>
    );
  }

  // Safe text / emoji render (never render huge strings as text)
  const safeText = logoUrl && logoUrl.length <= 6 ? logoUrl : fallbackEmoji;

  return (
    <div
      className={`${sizeClass} ${className} rounded-xl flex items-center justify-center shrink-0 shadow-sm select-none`}
      style={combinedStyle}
    >
      <span>{safeText}</span>
    </div>
  );
}
