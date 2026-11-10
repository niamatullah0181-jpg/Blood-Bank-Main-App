import type { BloodGroup, LogCategory, RequestStatus, Urgency } from '@/types';

export const DISTRICT_THANAS: Record<string, string[]> = {
  Dhaka: ['Dhanmondi', 'Gulshan', 'Mirpur', 'Uttara', 'Mohammadpur', 'Motijheel', 'Tejgaon'],
  Chattogram: ['Kotwali', 'Pahartali', 'Patenga', 'Halishahar', 'Sitakunda'],
  Sylhet: ['Sylhet Sadar', 'Companiganj', 'Beanibazar', 'Jalalabad'],
  Rajshahi: ['Boalia', 'Motihar', 'Paba', 'Godagari'],
  Khulna: ['Khalishpur', 'Sonadanga', 'Daulatpur', 'Dumuria'],
};

export const DISTRICTS = Object.keys(DISTRICT_THANAS);

export const URGENCY_META: Record<Urgency, { label: string; badge: string; dot: string }> = {
  critical: { label: 'Critical', badge: 'bg-brand-600 text-white', dot: 'bg-brand-600' },
  urgent: { label: 'Urgent', badge: 'bg-amber-100 text-amber-800', dot: 'bg-amber-500' },
  normal: { label: 'Normal', badge: 'bg-gray-100 text-gray-700', dot: 'bg-gray-400' },
};

export const STATUS_META: Record<RequestStatus, { label: string; badge: string }> = {
  open: { label: 'Open', badge: 'bg-red-50 text-brand-700 ring-1 ring-brand-200' },
  in_progress: { label: 'In progress', badge: 'bg-amber-50 text-amber-800 ring-1 ring-amber-200' },
  fulfilled: { label: 'Fulfilled', badge: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' },
};

export const LOG_CATEGORY_META: Record<LogCategory, string> = {
  visit: 'Field visit',
  donation: 'Donation drive',
  awareness: 'Awareness',
  other: 'Other',
};

export const DONATION_COOLDOWN_DAYS = 90;

export const BLOOD_GROUP_NORMALIZED: Record<string, BloodGroup> = {
  'a+': 'A+',
  'a-': 'A-',
  'b+': 'B+',
  'b-': 'B-',
  'ab+': 'AB+',
  'ab-': 'AB-',
  'o+': 'O+',
  'o-': 'O-',
};
