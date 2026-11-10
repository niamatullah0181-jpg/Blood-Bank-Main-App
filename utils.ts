import type { BloodGroup } from '@/types';
import { BLOOD_GROUP_NORMALIZED } from '@/lib/constants';

export function createId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function hoursFromNow(hours: number): string {
  return new Date(Date.now() + hours * 3600_000).toISOString();
}

export function parseBloodGroupQuery(query: string): BloodGroup | null {
  const key = query.trim().toLowerCase().replace(/\s+/g, '');
  return BLOOD_GROUP_NORMALIZED[key] ?? null;
}

export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return `${digits.slice(0, 5)}-***${digits.slice(-3)}`;
}
