/**
 * Password strength indicator component
 */

import { useMemo } from 'react';
import { calculatePasswordStrength, getPasswordStrengthLabel } from '../../lib/validation/auth';

interface PasswordStrengthIndicatorProps {
  password: string;
  showRequirements?: boolean;
}

export function PasswordStrengthIndicator({ 
  password, 
  showRequirements = true 
}: PasswordStrengthIndicatorProps) {
  const { score, feedback } = useMemo(
    () => calculatePasswordStrength(password),
    [password]
  );

  const { label, color } = useMemo(
    () => getPasswordStrengthLabel(score),
    [score]
  );

  if (!password) return null;

  const strengthPercentage = Math.min((score / 5) * 100, 100);

  const colorClasses = {
    red: 'bg-red-500',
    orange: 'bg-orange-500',
    yellow: 'bg-yellow-500',
    blue: 'bg-blue-500',
    green: 'bg-green-500',
  };

  const textColorClasses = {
    red: 'text-red-600',
    orange: 'text-orange-600',
    yellow: 'text-yellow-600',
    blue: 'text-blue-600',
    green: 'text-green-600',
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">Password strength</span>
        <span className={`font-medium ${textColorClasses[color as keyof typeof textColorClasses]}`}>
          {label}
        </span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${colorClasses[color as keyof typeof colorClasses]}`}
          style={{ width: `${strengthPercentage}%` }}
        />
      </div>

      {showRequirements && (
        <div className="space-y-1">
          <p className="text-xs text-gray-600 font-medium">Password requirements:</p>
          <ul className="text-xs space-y-1">
            <li className={`flex items-center space-x-2 ${password.length >= 8 ? 'text-green-600' : 'text-gray-500'}`}>
              <span className={`w-4 h-4 rounded-full flex items-center justify-center ${password.length >= 8 ? 'bg-green-100' : 'bg-gray-100'}`}>
                {password.length >= 8 ? '✓' : '○'}
              </span>
              <span>At least 8 characters</span>
            </li>
            <li className={`flex items-center space-x-2 ${/[a-z]/.test(password) ? 'text-green-600' : 'text-gray-500'}`}>
              <span className={`w-4 h-4 rounded-full flex items-center justify-center ${/[a-z]/.test(password) ? 'bg-green-100' : 'bg-gray-100'}`}>
                {/[a-z]/.test(password) ? '✓' : '○'}
              </span>
              <span>One lowercase letter</span>
            </li>
            <li className={`flex items-center space-x-2 ${/[A-Z]/.test(password) ? 'text-green-600' : 'text-gray-500'}`}>
              <span className={`w-4 h-4 rounded-full flex items-center justify-center ${/[A-Z]/.test(password) ? 'bg-green-100' : 'bg-gray-100'}`}>
                {/[A-Z]/.test(password) ? '✓' : '○'}
              </span>
              <span>One uppercase letter</span>
            </li>
            <li className={`flex items-center space-x-2 ${/[0-9]/.test(password) ? 'text-green-600' : 'text-gray-500'}`}>
              <span className={`w-4 h-4 rounded-full flex items-center justify-center ${/[0-9]/.test(password) ? 'bg-green-100' : 'bg-gray-100'}`}>
                {/[0-9]/.test(password) ? '✓' : '○'}
              </span>
              <span>One number</span>
            </li>
            <li className={`flex items-center space-x-2 ${/[^a-zA-Z0-9]/.test(password) ? 'text-green-600' : 'text-gray-500'}`}>
              <span className={`w-4 h-4 rounded-full flex items-center justify-center ${/[^a-zA-Z0-9]/.test(password) ? 'bg-green-100' : 'bg-gray-100'}`}>
                {/[^a-zA-Z0-9]/.test(password) ? '✓' : '○'}
              </span>
              <span>One special character</span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}