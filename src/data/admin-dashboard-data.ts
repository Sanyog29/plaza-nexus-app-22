
import { format, subDays } from 'date-fns';

export const generatePerformanceData = () => {
  const result = [];
  for (let i = 30; i >= 0; i--) {
    const date = subDays(new Date(), i);
    result.push({
      date: format(date, 'MMM dd'),
      totalRequests: 0,
      completed: 0,
      breached: 0,
    });
  }
  return result;
};

export const staff = [];

export const equipment = [];

export const tickets = [];

export const slaCompliance = [];
