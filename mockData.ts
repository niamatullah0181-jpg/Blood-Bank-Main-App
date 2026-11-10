import type { ActivityLog, BloodRequest, Donor, PermissionRequest, VolunteerTask } from '@/types';
import { hoursFromNow } from '@/lib/utils';

export const INITIAL_DONORS: Donor[] = [
  { id: 'd-1', name: 'Rafiul Islam', phone: '+8801712345601', bloodGroup: 'O+', location: { district: 'Dhaka', thana: 'Dhanmondi' }, available: true, lastDonated: null, donations: 14 },
  { id: 'd-2', name: 'Nusrat Jahan', phone: '+8801812345602', bloodGroup: 'B-', location: { district: 'Dhaka', thana: 'Mirpur' }, available: true, lastDonated: '2026-06-10T00:00:00Z', donations: 5 },
  { id: 'd-3', name: 'Tanvir Ahmed', phone: '+8801912345603', bloodGroup: 'AB-', location: { district: 'Dhaka', thana: 'Uttara' }, available: false, lastDonated: '2026-10-20T00:00:00Z', donations: 3 },
  { id: 'd-4', name: 'Sadia Akter', phone: '+8801612345604', bloodGroup: 'A+', location: { district: 'Chattogram', thana: 'Pahartali' }, available: true, lastDonated: '2026-02-02T00:00:00Z', donations: 9 },
  { id: 'd-5', name: 'Mahmud Hasan', phone: '+8801512345605', bloodGroup: 'O-', location: { district: 'Sylhet', thana: 'Sylhet Sadar' }, available: true, lastDonated: null, donations: 7 },
  { id: 'd-6', name: 'Farhana Yasmin', phone: '+8801712345606', bloodGroup: 'B+', location: { district: 'Rajshahi', thana: 'Boalia' }, available: false, lastDonated: '2026-09-01T00:00:00Z', donations: 2 },
  { id: 'd-7', name: 'Imran Khan', phone: '+8801812345607', bloodGroup: 'AB+', location: { district: 'Dhaka', thana: 'Gulshan' }, available: true, lastDonated: '2026-03-15T00:00:00Z', donations: 11 },
  { id: 'd-8', name: 'Shahana Parvin', phone: '+8801912345608', bloodGroup: 'A-', location: { district: 'Khulna', thana: 'Sonadanga' }, available: true, lastDonated: null, donations: 1 },
];

export const INITIAL_REQUESTS: BloodRequest[] = [
  {
    id: 'r-1', patientName: 'Abdullah Al Mamun', bloodGroup: 'O-', unitsNeeded: 3, location: { district: 'Dhaka', thana: 'Mohammadpur' },
    hospital: 'Dhaka Medical College Hospital', urgency: 'critical', status: 'open', deadline: hoursFromNow(3.5),
    contactPhone: '+8801700000011', notes: 'Accident case, needed before surgery.', createdAt: hoursFromNow(-0.5),
  },
  {
    id: 'r-2', patientName: 'Rina Begum', bloodGroup: 'B+', unitsNeeded: 2, location: { district: 'Dhaka', thana: 'Dhanmondi' },
    hospital: 'Square Hospital', urgency: 'urgent', status: 'in_progress', deadline: hoursFromNow(9),
    contactPhone: '+8801700000012', notes: 'Delivery complication, donor arranged.', createdAt: hoursFromNow(-2),
  },
  {
    id: 'r-3', patientName: 'Kamal Uddin', bloodGroup: 'A+', unitsNeeded: 1, location: { district: 'Chattogram', thana: 'Kotwali' },
    hospital: 'Chattogram Maa-O-Shishu Hospital', urgency: 'urgent', status: 'open', deadline: hoursFromNow(14),
    contactPhone: '+8801700000013', notes: 'Thalassemia patient, regular need.', createdAt: hoursFromNow(-1),
  },
  {
    id: 'r-4', patientName: 'Mira Sultana', bloodGroup: 'AB+', unitsNeeded: 2, location: { district: 'Sylhet', thana: 'Sylhet Sadar' },
    hospital: 'Sylhet MAG Osmani Medical College', urgency: 'critical', status: 'open', deadline: hoursFromNow(1.25),
    contactPhone: '+8801700000014', notes: 'Post-operative bleeding.', createdAt: hoursFromNow(-0.2),
  },
  {
    id: 'r-5', patientName: 'Jamil Hossain', bloodGroup: 'O+', unitsNeeded: 1, location: { district: 'Dhaka', thana: 'Mirpur' },
    hospital: 'Mirpur Shah Ali Hospital', urgency: 'normal', status: 'fulfilled', deadline: hoursFromNow(30),
    contactPhone: '+8801700000015', notes: '', createdAt: hoursFromNow(-6),
  },
  {
    id: 'r-6', patientName: 'Sumaiya Rahman', bloodGroup: 'A-', unitsNeeded: 2, location: { district: 'Khulna', thana: 'Khalishpur' },
    hospital: 'Khulna Medical College Hospital', urgency: 'urgent', status: 'open', deadline: hoursFromNow(6),
    contactPhone: '+8801700000016', notes: 'Scheduled surgery tomorrow morning.', createdAt: hoursFromNow(-3),
  },
];

export const INITIAL_PERMISSIONS: PermissionRequest[] = [
  {
    id: 'p-1', donorId: 'd-4', requesterId: 'user-demo-1', requesterName: 'Kamal Uddin (family)',
    reason: 'Thalassemia patient needs O+ or A+ donor for weekly transfusion. Please connect us.',
    status: 'pending', createdAt: hoursFromNow(-1.5),
  },
  {
    id: 'p-2', donorId: 'd-1', requesterId: 'user-demo-2', requesterName: 'Lubna Chowdhury',
    reason: 'My father needs immediate O+ blood after a fall. Hospital is Square Hospital.',
    status: 'pending', createdAt: hoursFromNow(-0.4),
  },
];

export const INITIAL_TASKS: VolunteerTask[] = [
  { id: 't-1', title: 'Confirm donor availability for Abdullah Al Mamun', location: { district: 'Dhaka', thana: 'Mohammadpur' }, requestId: 'r-1', done: false, dueAt: hoursFromNow(1) },
  { id: 't-2', title: 'Escort donor to Dhaka Medical blood bank', location: { district: 'Dhaka', thana: 'Mohammadpur' }, requestId: 'r-1', done: false, dueAt: hoursFromNow(2) },
  { id: 't-3', title: 'Weekly camp setup at Pahartali union', location: { district: 'Chattogram', thana: 'Pahartali' }, requestId: null, done: true, dueAt: hoursFromNow(-4) },
];

export const INITIAL_LOGS: ActivityLog[] = [
  { id: 'l-1', volunteerId: 'vol-demo', category: 'donation', note: 'Organised a 20-donor drive at Gulshan community center.', createdAt: hoursFromNow(-26) },
  { id: 'l-2', volunteerId: 'vol-demo', category: 'awareness', note: 'Talked to 40 families about blood donation myths in Sylhet.', createdAt: hoursFromNow(-50) },
];
