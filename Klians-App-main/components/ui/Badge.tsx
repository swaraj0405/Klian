
import React from 'react';
import { Role } from '../../types';

interface BadgeProps {
  role: Role;
}

export const Badge: React.FC<BadgeProps> = ({ role }) => {
  // Normalize role to handle case-insensitive matching
  const normalizedRole = role ? String(role).toLowerCase() : 'student';
  
  const roleColors: Record<string, string> = {
    'student': 'bg-green-500 text-white dark:bg-green-600 dark:text-white',
    'teacher': 'bg-red-500 text-white dark:bg-red-600 dark:text-white',
    'admin': 'bg-purple-600 text-white dark:bg-purple-700 dark:text-white',
    'faculty': 'bg-red-500 text-white dark:bg-red-600 dark:text-white', // Fallback for faculty
  };

  const colorClass = roleColors[normalizedRole] || roleColors['student'];

  return (
    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${colorClass}`}>
      {role || 'Student'}
    </span>
  );
};
