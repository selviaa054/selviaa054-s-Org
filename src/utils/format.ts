import type { OrderStatus } from '../types.ts';

export function formatIDR(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

export function formatDate(isoDate: string): string {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(isoDate));
  } catch {
    return isoDate;
  }
}

export function getStatusLabelStyle(status: OrderStatus): {
  textColor: string;
  description: string;
} {
  switch (status) {
    case 'Pending':
      return {
        textColor: 'text-[#B45309]',
        description: 'Awaiting confirmation',
      };
    case 'Processing':
      return {
        textColor: 'text-[#6D28D9]',
        description: 'Packing your snacks',
      };
    case 'Shipped':
      return {
        textColor: 'text-[#0369A1]',
        description: 'On the way to you',
      };
    case 'Delivered':
      return {
        textColor: 'text-[#15803D]',
        description: 'Delivered safely',
      };
    case 'Cancelled':
      return {
        textColor: 'text-[#B91C1C]',
        description: 'Order cancelled',
      };
  }
}
