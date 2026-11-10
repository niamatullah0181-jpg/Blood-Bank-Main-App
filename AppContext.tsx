import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState, type ReactNode } from 'react';
import type {
  ActivityLog,
  BloodRequest,
  Donor,
  LogCategory,
  PermissionRequest,
  PermissionStatus,
  RequestStatus,
  UserProfile,
  VolunteerTask,
} from '@/types';
import { INITIAL_DONORS, INITIAL_LOGS, INITIAL_PERMISSIONS, INITIAL_REQUESTS, INITIAL_TASKS } from '@/data/mockData';
import { createId } from '@/lib/utils';

export type ProfileInput = Pick<UserProfile, 'name' | 'bloodGroup' | 'location' | 'role' | 'phone'>;
export type NewRequestInput = Omit<BloodRequest, 'id' | 'createdAt' | 'status'>;

interface AppState {
  user: UserProfile | null;
  donors: Donor[];
  requests: BloodRequest[];
  permissions: PermissionRequest[];
  tasks: VolunteerTask[];
  logs: ActivityLog[];
}

type Action =
  | { type: 'CREATE_PROFILE'; profile: UserProfile }
  | { type: 'SIGN_OUT' }
  | { type: 'REGISTER_DONOR'; donor: Donor }
  | { type: 'ADD_REQUEST'; request: BloodRequest }
  | { type: 'SET_REQUEST_STATUS'; id: string; status: RequestStatus }
  | { type: 'ADD_PERMISSION'; permission: PermissionRequest }
  | { type: 'SET_PERMISSION_STATUS'; id: string; status: PermissionStatus }
  | { type: 'TOGGLE_TASK'; id: string }
  | { type: 'ADD_LOG'; log: ActivityLog };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'CREATE_PROFILE':
      return { ...state, user: action.profile };
    case 'SIGN_OUT':
      return { ...state, user: null };
    case 'REGISTER_DONOR':
      return {
        ...state,
        donors: [action.donor, ...state.donors],
        user: state.user && state.user.role === 'seeker' ? { ...state.user, role: 'donor' } : state.user,
      };
    case 'ADD_REQUEST':
      return { ...state, requests: [action.request, ...state.requests] };
    case 'SET_REQUEST_STATUS':
      return {
        ...state,
        requests: state.requests.map((r) => (r.id === action.id ? { ...r, status: action.status } : r)),
      };
    case 'ADD_PERMISSION':
      return { ...state, permissions: [action.permission, ...state.permissions] };
    case 'SET_PERMISSION_STATUS':
      return {
        ...state,
        permissions: state.permissions.map((p) => (p.id === action.id ? { ...p, status: action.status } : p)),
      };
    case 'TOGGLE_TASK':
      return {
        ...state,
        tasks: state.tasks.map((t) => (t.id === action.id ? { ...t, done: !t.done } : t)),
      };
    case 'ADD_LOG':
      return { ...state, logs: [action.log, ...state.logs] };
    default:
      return state;
  }
}

const initialState: AppState = {
  user: null,
  donors: INITIAL_DONORS,
  requests: INITIAL_REQUESTS,
  permissions: INITIAL_PERMISSIONS,
  tasks: INITIAL_TASKS,
  logs: INITIAL_LOGS,
};

interface AppContextValue {
  state: AppState;
  canViewContacts: boolean;
  permissionStatusFor: (donorId: string) => PermissionStatus | null;
  createProfile: (input: ProfileInput) => void;
  signOut: () => void;
  registerAsDonor: () => void;
  addRequest: (input: NewRequestInput) => void;
  setRequestStatus: (id: string, status: RequestStatus) => void;
  requestPermission: (donorId: string, reason: string) => void;
  resolvePermission: (id: string, status: Exclude<PermissionStatus, 'pending'>) => void;
  toggleTask: (id: string) => void;
  addLog: (category: LogCategory, note: string) => void;
  notify: (message: string) => void;
  toast: string | null;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(id);
  }, [toast]);

  const notify = useCallback((message: string) => setToast(message), []);

  const createProfile = useCallback<AppContextValue['createProfile']>((input) => {
    dispatch({
      type: 'CREATE_PROFILE',
      profile: {
        ...input,
        id: createId('user'),
        verified: input.role === 'volunteer',
      },
    });
  }, []);

  const signOut = useCallback(() => dispatch({ type: 'SIGN_OUT' }), []);

  const registerAsDonor = useCallback(() => {
    const user = state.user;
    if (!user) return;
    if (state.donors.some((d) => d.id === user.id)) {
      notify('You are already registered as a donor');
      return;
    }
    dispatch({
      type: 'REGISTER_DONOR',
      donor: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        bloodGroup: user.bloodGroup,
        location: user.location,
        available: true,
        lastDonated: null,
        donations: 0,
      },
    });
    notify('Thank you! You are now listed as a donor');
  }, [state.user, state.donors, notify]);

  const addRequest = useCallback<AppContextValue['addRequest']>((input) => {
    dispatch({
      type: 'ADD_REQUEST',
      request: { ...input, id: createId('r'), status: 'open', createdAt: new Date().toISOString() },
    });
    notify('Blood request posted to nearby donors');
  }, [notify]);

  const setRequestStatus = useCallback((id: string, status: RequestStatus) => {
    dispatch({ type: 'SET_REQUEST_STATUS', id, status });
  }, []);

  const permissionStatusFor = useCallback(
    (donorId: string): PermissionStatus | null => {
      const userId = state.user?.id;
      if (!userId) return null;
      const mine = state.permissions.find((p) => p.donorId === donorId && p.requesterId === userId);
      return mine ? mine.status : null;
    },
    [state.permissions, state.user],
  );

  const requestPermission = useCallback<AppContextValue['requestPermission']>((donorId, reason) => {
    const user = state.user;
    if (!user) return;
    dispatch({
      type: 'ADD_PERMISSION',
      permission: {
        id: createId('p'),
        donorId,
        requesterId: user.id,
        requesterName: user.name,
        reason,
        status: 'pending',
        createdAt: new Date().toISOString(),
      },
    });
    notify('Permission request sent to the volunteer team');
  }, [state.user, notify]);

  const resolvePermission = useCallback<AppContextValue['resolvePermission']>((id, status) => {
    dispatch({ type: 'SET_PERMISSION_STATUS', id, status });
    notify(status === 'approved' ? 'Contact access approved' : 'Request denied');
  }, [notify]);

  const toggleTask = useCallback((id: string) => dispatch({ type: 'TOGGLE_TASK', id }), []);

  const addLog = useCallback<AppContextValue['addLog']>((category, note) => {
    const volunteerId = state.user?.id;
    if (!volunteerId) return;
    dispatch({
      type: 'ADD_LOG',
      log: { id: createId('l'), volunteerId, category, note, createdAt: new Date().toISOString() },
    });
    notify('Field activity logged');
  }, [state.user, notify]);

  const canViewContacts = state.user?.role === 'volunteer' && state.user.verified;

  const value = useMemo<AppContextValue>(
    () => ({
      state,
      canViewContacts,
      permissionStatusFor,
      createProfile,
      signOut,
      registerAsDonor,
      addRequest,
      setRequestStatus,
      requestPermission,
      resolvePermission,
      toggleTask,
      addLog,
      notify,
      toast,
    }),
    [
      state,
      canViewContacts,
      permissionStatusFor,
      createProfile,
      signOut,
      registerAsDonor,
      addRequest,
      setRequestStatus,
      requestPermission,
      resolvePermission,
      toggleTask,
      addLog,
      notify,
      toast,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
