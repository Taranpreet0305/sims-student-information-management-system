import { listDocs, getOneDoc, setDocById } from "./firestore";
import { saveSession, type SessionUser, type UserType } from "./session";

type PasswordRecord = {
  password_hash?: string;
  password_salt?: string;
};

const encodeHex = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

const encodeBase64 = (buffer: ArrayBuffer | Uint8Array) => {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
};

export async function hashPassword(password: string, salt: string) {
  const data = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return encodeHex(digest);
}

export function createSalt() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return encodeBase64(bytes);
}

export async function createPasswordRecord(password: string): Promise<PasswordRecord> {
  const salt = createSalt();
  const hash = await hashPassword(password, salt);
  return { password_hash: hash, password_salt: salt };
}

export async function verifyPassword(
  password: string,
  record: PasswordRecord | null | undefined
) {
  if (!record?.password_hash || !record?.password_salt) return false;
  const hash = await hashPassword(password, record.password_salt);
  return hash === record.password_hash;
}

export async function signInWithProfile(
  collectionName: "profiles" | "faculty_profiles",
  idField: "enrollment_number" | "faculty_id",
  idValue: string,
  password: string,
  userType: UserType
) {
  const profile = await getOneDoc<SessionUser & PasswordRecord>(collectionName, [
    { field: idField, op: "==", value: idValue },
  ]);

  if (!profile) {
    return { error: "Profile not found" };
  }

  const ok = await verifyPassword(password, profile);
  if (!ok) {
    return { error: "Invalid credentials" };
  }

  const sessionUser: SessionUser = {
    id: profile.id,
    name: profile.name,
    enrollment_number: profile.enrollment_number,
    faculty_id: profile.faculty_id,
    email: profile.email,
    verify: profile.verify ?? null,
    profile_completed: profile.profile_completed ?? null,
  };

  saveSession({ user: sessionUser, userType });
  return { user: sessionUser };
}

export async function registerProfile(
  collectionName: "profiles" | "faculty_profiles",
  profile: SessionUser & {
    enrollment_number?: string;
    faculty_id?: string;
    email?: string;
    verify?: boolean | null;
    course_name?: string;
    year?: number;
    section?: string;
    student_id?: string;
    phone?: string | null;
    department?: string;
  },
  password: string
) {
  const passwordRecord = await createPasswordRecord(password);
  const id = profile.id;
  const sanitized: Record<string, unknown> = {};
  Object.entries(profile).forEach(([key, value]) => {
    if (value !== undefined) {
      sanitized[key] = value;
    }
  });
  await setDocById(collectionName, id, {
    ...sanitized,
    ...passwordRecord,
    created_at: profile?.["created_at"] ?? new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  return id;
}

export async function enrollmentExists(enrollment: string) {
  const existing = await listDocs<SessionUser>("profiles", {
    where: [{ field: "enrollment_number", op: "==", value: enrollment }],
    limit: 1,
  });
  return existing.length > 0;
}

export async function facultyIdExists(facultyId: string) {
  const existing = await listDocs<SessionUser>("faculty_profiles", {
    where: [{ field: "faculty_id", op: "==", value: facultyId }],
    limit: 1,
  });
  return existing.length > 0;
}
