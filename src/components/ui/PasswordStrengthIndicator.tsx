// ABOUTME: Visual password strength feedback component with requirements checklist

import React from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
}

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

const requirements: PasswordRequirement[] = [
  {
    label: 'Mínimo 8 caracteres',
    test: (password) => password.length >= 8,
  },
  {
    label: 'Pelo menos uma letra',
    test: (password) => /[a-zA-Z]/.test(password),
  },
  {
    label: 'Pelo menos um número',
    test: (password) => /[0-9]/.test(password),
  },
];

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  className,
}) => {
  if (!password) return null;

  return (
    <div className={cn("mt-2 space-y-1", className)}>
      {requirements.map((req, index) => {
        const isValid = req.test(password);
        return (
          <div key={index} className="flex items-center gap-2 text-xs">
            {isValid ? (
              <Check className="w-3 h-3 text-green-600" />
            ) : (
              <X className="w-3 h-3 text-red-500" />
            )}
            <span className={cn(
              "transition-colors",
              isValid ? "text-green-700" : "text-gray-600"
            )}>
              {req.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};