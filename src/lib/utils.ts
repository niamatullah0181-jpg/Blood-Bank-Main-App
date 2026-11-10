import type { BloodGroup } from '@/types';
import { BLOOD_GROUP_NORMALIZED } from '@/lib/constants';

export function hoursFromNow(hours: number): string {
  return new Date(Date.now() + hours * 3600_000).toISOString();
}

export function parseBloodGroupQuery(query: string): BloodGroup | null {
  const key = query.trim().toLowerCase().replace(/\s+/g, '');
  return BLOOD_GROUP_NORMALIZED[key] ?? null;
}
