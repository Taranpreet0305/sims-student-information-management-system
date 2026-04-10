import { useEffect, useState } from "react";
import { getSession } from "@/integrations/firebase/session";
import { getDocById, listDocs } from "@/integrations/firebase/firestore";

export interface FacultyProfile {
  id: string;
  name: string;
  email: string;
  faculty_id: string;
  department: string | null;
  assigned_course: string | null;
  assigned_year: number | null;
  assigned_section: string | null;
  phone: string | null;
  verify: boolean;
}

export interface UserRole {
  role: string;
}

export interface AssignedClass {
  course: string;
  semester: number;
  section: string;
  subject: string;
  time_slot: string;
  department?: string | null;
}

export function useFacultyRole() {
  const [profile, setProfile] = useState<FacultyProfile | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [assignedClasses, setAssignedClasses] = useState<AssignedClass[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const session = getSession();
      if (!session?.user) {
        setLoading(false);
        return;
      }

      const profileData = await getDocById<FacultyProfile>("faculty_profiles", session.user.id);

      if (profileData) {
        setProfile(profileData);
      }

      const rolesData = await listDocs<UserRole>("user_roles", {
        where: [{ field: "user_id", op: "==", value: session.user.id }],
      });

      if (rolesData) {
        setRoles(rolesData);
      }

      if (profileData?.faculty_id) {
        const assignments = await listDocs<any>("faculty_assignments", {
          where: [{ field: "faculty_id", op: "==", value: profileData.faculty_id }],
        });
        const classes = assignments.flatMap((a) => a.assigned_classes || []);
        setAssignedClasses(classes);
      }
    } catch (error) {
      console.error("Error loading faculty profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const hasRole = (role: string) => {
    return roles.some(r => r.role === role);
  };

  const isAdmin = hasRole("admin");
  const isModerator = hasRole("moderator");
  const isClassCoordinator = assignedClasses.length > 0;

  return {
    profile,
    roles,
    loading,
    hasRole,
    isAdmin,
    isModerator,
    isClassCoordinator: !!isClassCoordinator,
    assignedClasses,
  };
}
