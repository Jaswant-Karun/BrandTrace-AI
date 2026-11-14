import React, { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  prefixIcon?: React.ReactNode;
  suffixIcon?: React.ReactNode;
  requiredIndicator?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      error,
      prefixIcon,
      suffixIcon,
      requiredIndicator,
      id,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    return (
      <div className="w-full space-y-1">
        {label && (
          <div className="flex items-center justify-between">
            <label
              htmlFor={inputId}
              className="block text-xs font-semibold text-slate-800"
            >
              {label}
              {requiredIndicator && <span className="text-rose-500 ml-0.5">*</span>}
            </label>
          </div>
        )}

        <div className="relative rounded-lg shadow-2xs">
          {prefixIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              {prefixIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-help` : undefined}
            className={`block w-full text-xs rounded-lg border transition-colors bg-white text-slate-900 placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed ${
              prefixIcon ? 'pl-9' : 'pl-3'
            } ${suffixIcon ? 'pr-9' : 'pr-3'} py-2 ${
              error
                ? 'border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200'
                : 'border-slate-200 hover:border-slate-300 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10'
            } focus:outline-none ${className}`}
            {...props}
          />

          {suffixIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
              {suffixIcon}
            </div>
          )}
        </div>

        {error && (
          <p id={`${inputId}-error`} className="text-[11px] text-rose-600 font-medium">
            {error}
          </p>
        )}

        {!error && helperText && (
          <p id={`${inputId}-help`} className="text-[11px] text-slate-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

