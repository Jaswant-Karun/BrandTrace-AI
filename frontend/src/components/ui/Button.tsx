import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'secondary',
      size = 'sm',
      isLoading = false,
      icon,
      iconPosition = 'left',
      fullWidth = false,
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      xs: 'px-2 py-1 text-[11px] gap-1 rounded-md font-medium',
      sm: 'px-3 py-1.5 text-xs gap-1.5 rounded-lg font-medium',
      md: 'px-4 py-2 text-xs gap-2 rounded-lg font-semibold',
      lg: 'px-5 py-2.5 text-sm gap-2.5 rounded-xl font-semibold',
    };

    const variantClasses = {
      primary: 'bg-slate-900 hover:bg-slate-800 text-white border border-slate-900 shadow-xs focus:ring-slate-900',
      secondary: 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 shadow-2xs focus:ring-slate-400',
      outline: 'bg-transparent hover:bg-slate-50 text-slate-700 border border-slate-300 focus:ring-slate-400',
      ghost: 'bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-transparent focus:ring-slate-300',
      danger: 'bg-rose-600 hover:bg-rose-700 text-white border border-rose-600 shadow-xs focus:ring-rose-500',
      success: 'bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-600 shadow-xs focus:ring-emerald-500',
    };

    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={`inline-flex items-center justify-center transition-all cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed ${
          sizeClasses[size]
        } ${variantClasses[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
        {...props}
      >
        {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />}
        {!isLoading && icon && iconPosition === 'left' && <span className="shrink-0">{icon}</span>}
        {children && <span>{children}</span>}
        {!isLoading && icon && iconPosition === 'right' && <span className="shrink-0">{icon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';

