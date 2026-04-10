const SESSION_KEY = "sims_session";
const USER_TYPE_KEY = "user_type";
const LAST_ACTIVITY_KEY = "last_activity";

export type UserType = "student" | "faculty";

export type SessionUser = {
  id: string;
  name: string;
  enrollment_number?: string;
  faculty_id?: string;
  email?: string;
  verify?: boolean | null;
  profile_completed?: boolean | null;
};

export type Session = {
  user: SessionUser;
  userType: UserType;
};

export function saveSession(session: Session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  localStorage.setItem(USER_TYPE_KEY, session.userType);
  localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
}

export function getSession(): Session | null {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(USER_TYPE_KEY);
  localStorage.removeItem(LAST_ACTIVITY_KEY);
}

export function updateLastActivity() {
  localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
}

export function getLastActivity() {
  const raw = localStorage.getItem(LAST_ACTIVITY_KEY);
  if (!raw) return null;
  const value = Number(raw);
  return Number.isNaN(value) ? null : value;
}
