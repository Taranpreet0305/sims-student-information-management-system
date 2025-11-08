import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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

export function useFacultyRole() {
  const [profile, setProfile] = useState<FacultyProfile | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: profileData } = await supabase
        .from("faculty_profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
      }

      const { data: rolesData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      if (rolesData) {
        setRoles(rolesData);
      }
    } catch (error) {
      console.error("Error loading faculty profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const hasRole = (role: "admin" | "moderator" | "user") => {
    return roles.some(r => r.role === role);
  };

  const isAdmin = hasRole("admin");
  const isModerator = hasRole("moderator");
  const isClassCoordinator = profile?.assigned_course && profile?.assigned_year && profile?.assigned_section;

  return {
    profile,
    roles,
    loading,
    hasRole,
    isAdmin,
    isModerator,
    isClassCoordinator: !!isClassCoordinator,
  };
}
