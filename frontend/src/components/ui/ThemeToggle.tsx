import React from 'react';

interface ThemeToggleProps {
  className?: string;
  variant?: 'navbar' | 'compact' | 'pill';
}

/**
 * ThemeToggle is deprecated and disabled.
 * BrandTrace AI runs exclusively in permanent dark mode.
 */
export const ThemeToggle: React.FC<ThemeToggleProps> = () => {
  return null;
};
