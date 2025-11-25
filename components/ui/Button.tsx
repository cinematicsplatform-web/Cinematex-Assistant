import React from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  className, 
  variant = 'primary', 
  isLoading, 
  icon,
  children, 
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center px-4 py-2 rounded-xl font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-500/20 focus:ring-indigo-500",
    secondary: "bg-slate-700 hover:bg-slate-600 text-slate-100 border border-slate-600 focus:ring-slate-500",
    danger: "bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/30 focus:ring-red-500",
    ghost: "bg-transparent hover:bg-white/5 text-slate-300 hover:text-white"
  };

  return (
    <button 
      className={cn(baseStyles, variants[variant], className)}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && <Loader2 className="w-5 h-5 ml-2 animate-spin" />}
      {!isLoading && icon && <span className="ml-2">{icon}</span>}
      {children}
    </button>
  );
};
