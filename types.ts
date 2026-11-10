export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;
export type BloodGroup = (typeof BLOOD_GROUPS)[number];

export type Role = 'seeker' | 'donor' | 'volunteer';
export type Urgency = 'critical' | 'urgent' | 'normal';
export type RequestStatus = 'open' | 'in_progress' | 'fulfilled';
export type PermissionStatus = 'pending' | 'approved' | 'denied';
export type LogCategory = 'visit' | 'donation' | 'awareness' | 'other';

export interface Location {
  district: string;
  thana: string;
}

export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  bloodGroup: BloodGroup;
  location: Location;
  role: Role;
  verified: boolean;
}

export interface Donor {
  id: string;
  name: string;
  phone: string;
  bloodGroup: BloodGroup;
  location: Location;
  available: boolean;
  lastDonated: string | null;
  donations: number;
}

export interface BloodRequest {
  id: string;
  patientName: string;
  bloodGroup: BloodGroup;
  unitsNeeded: number;
  location: Location;
  hospital: string;
  urgency: Urgency;
  status: RequestStatus;
  deadline: string;
  contactPhone: string;
  notes: string;
  createdAt: string;
}

export interface PermissionRequest {
  id: string;
  donorId: string;
  requesterId: string;
  requesterName: string;
  reason: string;
  status: PermissionStatus;
  createdAt: string;
}

export interface VolunteerTask {
  id: string;
  title: string;
  location: Location;
  requestId: string | null;
  done: boolean;
  dueAt: string;
}

export interface ActivityLog {
  id: string;
  volunteerId: string;
  category: LogCategory;
  note: string;
  createdAt: string;
}
