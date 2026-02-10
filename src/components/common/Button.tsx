// src/components/common/Button.tsx
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'custom';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    leftIcon,
    rightIcon,
    disabled,
    className = '',
    ...props
}) => {
    const baseStyles = `
    inline-flex items-center justify-center gap-2 font-semibold
    rounded-md transition-all duration-300 ease-out
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#050816]
    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
  `;

    const variantStyles = {
        primary: `
      bg-gradient-to-r from-[#C8AA6E] to-[#A08050]
      text-[#0A0A0A] font-bold
      hover:shadow-[0_0_20px_rgba(200,170,110,0.5)]
      hover:-translate-y-0.5
      focus:ring-[#C8AA6E]
    `,
        secondary: `
      bg-gradient-to-r from-[#00C8FF] to-[#1BA9FF]
      text-[#0A0A0A] font-bold
      hover:shadow-[0_0_20px_rgba(0,200,255,0.5)]
      hover:-translate-y-0.5
      focus:ring-[#00C8FF]
    `,
        ghost: `
      bg-transparent border border-[#1E3A5F]
      text-[#F0F0F0]
      hover:border-[#00C8FF]
      hover:shadow-[0_0_15px_rgba(0,200,255,0.3)]
      focus:ring-[#00C8FF]
    `,
        danger: `
      bg-gradient-to-r from-[#E84057] to-[#C73048]
      text-white font-bold
      hover:shadow-[0_0_20px_rgba(232,64,87,0.5)]
      hover:-translate-y-0.5
      focus:ring-[#E84057]
    `,
        custom: '',
    };

    const sizeStyles = {
        sm: 'px-3 py-1.5 text-xs',
        md: 'px-5 py-2.5 text-sm',
        lg: 'px-7 py-3 text-base',
    };

    return (
        <button
            className={`${baseStyles} ${variantStyles[variant]} ${size ? sizeStyles[size] : ''} ${className}`}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? (
                <>
                    <svg
                        className="animate-spin h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        />
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                    </svg>
                    <span>로딩 중...</span>
                </>
            ) : (
                <>
                    {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
                    {children}
                    {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
                </>
            )}
        </button>
    );
};

export default Button;
