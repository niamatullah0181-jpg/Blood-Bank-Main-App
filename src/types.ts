export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;
export type BloodGroup = (typeof BLOOD_GROUPS)[number];

export type Role = 'seeker' | 'donor' | 'volunteer';
export type MemberRole = 'admin' | 'volunteer';
export type Urgency = 'critical' | 'urgent' | 'normal';
export type RequestStatus = 'open' | 'in_progress' | 'fulfilled';
export type PermissionStatus = 'pending' | 'approved' | 'denied';
export type LogCategory = 'visit' | 'donation' | 'awareness' | 'other';

export interface Location {
  district: string;
  thana: string;
}

export interface Organization extends Location {
  id: string;
  name: string;
}

export interface Profile {
  id: string;
  fullName: string;
  phone: string;
  bloodGroup: BloodGroup;
  location: Location;
  role: Role;
}

export interface Membership {
  id: string;
  organizationId: string;
  organizationName: string;
  role: MemberRole;
  verified: boolean;
}

export interface DonorResult {
  userId: string;
  organizationId: string | null;
  organizationName: string | null;
  name: string;
  bloodGroup: BloodGroup;
  location: Location;
  available: boolean;
  lastDonatedAt: string | null;
  donationsCount: number;
  contactVisible: boolean;
  phone: string | null;
}

export interface BloodRequest {
  id: string;
  requesterId: string;
  patientName: string;
  bloodGroup: BloodGroup;
  unitsNeeded: number;
  location: Location;
  organizationId: string | null;
  organizationName: string | null;
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
  donorUserId: string;
  donorName: string;
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

export interface PendingVolunteer {
  id: string;
  name: string;
  phone: string | null;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  requestId: string | null;
  createdAt: string;
  readAt: string | null;
}
