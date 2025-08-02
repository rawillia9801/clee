import React from 'react';
import { cn } from '@/lib/utils';

const statusStyles = {
  Available: 'bg-green-100 text-green-800 border-green-200',
  Sold: 'bg-blue-100 text-blue-800 border-blue-200',
  Hold: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'Deposit Received': 'bg-orange-100 text-orange-800 border-orange-200',
  Kept: 'bg-purple-100 text-purple-800 border-purple-200',
};

export const StatusBadge = ({ status }) => {
  const style = statusStyles[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  return (
    <span className={cn('px-2 py-0.5 text-xs font-medium rounded-full border whitespace-nowrap', style)}>
      {status}
    </span>
  );
};