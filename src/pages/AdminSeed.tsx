import { useState } from "react";
import { registerProfile, facultyIdExists } from "@/integrations/firebase/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";

type SeedResult =
  | { type: "faculty"; faculty_id: string; password: string; role: string; department: string }
  | { type: "student"; enrollment_number: string; password: string; course: string; year: number };

const defaultPassword = "Test@123";
const adminPassword = "Admin@123";

export default function AdminSeed() {
  const [results, setResults] = useState<SeedResult[]>([]);
  const [loading, setLoading] = useState(false);

  const createIfMissing = async (
    faculty_id: string,
    name: string,
    department: string,
    role: string,
    isAdmin: boolean
  ) => {
    const exists = await facultyIdExists(faculty_id);
    if (exists) return;

    const newId = crypto.randomUUID();
    await registerProfile(
      "faculty_profiles",
      {
        id: newId,
        name,
        faculty_id,
        email: `${faculty_id.toLowerCase()}@example.com`,
        department,
        role,
        verify: true,
        profile_completed: false,
      },
      isAdmin ? adminPassword : defaultPassword
    );

    if (isAdmin) {
      await supabase.from("user_roles").insert({ user_id: newId, role: "admin" });
    }

    setResults((prev) => [
      ...prev,
      {
        type: "faculty",
        faculty_id,
        password: isAdmin ? adminPassword : defaultPassword,
        role: isAdmin ? "admin" : role,
        department,
      },
    ]);
  };

  const createStudentIfMissing = async (
    enrollment_number: string,
    name: string,
    course: string,
    year: number
  ) => {
    const exists = await supabase
      .from("profiles")
      .select("id")
      .eq("enrollment_number", enrollment_number)
      .limit(1);
    if (exists.data && exists.data.length > 0) return;

    const newId = crypto.randomUUID();
    await registerProfile(
      "profiles",
      {
        id: newId,
        name,
        enrollment_number,
        student_id: enrollment_number,
        email: `${enrollment_number}@example.com`,
        course_name: course,
        course,
        year,
        admission_year: 2023,
        section: "DBIT",
        verify: true,
        profile_completed: false,
      },
      defaultPassword
    );

    setResults((prev) => [
      ...prev,
      {
        type: "student",
        enrollment_number,
        password: defaultPassword,
        course,
        year,
      },
    ]);
  };

  const ensureDoc = async (table: string, field: string, value: string, data: Record<string, unknown>) => {
    const { data: existing } = await supabase
      .from(table)
      .select("*")
      .eq(field, value)
      .limit(1);
    if (existing && existing.length > 0) return;
    await supabase.from(table).insert(data);
  };

  const seed = async () => {
    setLoading(true);
    setResults([]);
    try {
      // Ensure base collections exist
      await ensureDoc("departments", "name", "BCA", { name: "BCA" });
      await ensureDoc("departments", "name", "BBA", { name: "BBA" });
      await ensureDoc("departments", "name", "MCA", { name: "MCA" });
      await ensureDoc("departments", "name", "BCOM", { name: "BCOM" });
      await ensureDoc("departments", "name", "MBA", { name: "MBA" });

      await ensureDoc("courses", "name", "BCA", { name: "BCA", department: "BCA" });
      await ensureDoc("courses", "name", "BBA", { name: "BBA", department: "BBA" });
      await ensureDoc("courses", "name", "MCA", { name: "MCA", department: "MCA" });
      await ensureDoc("courses", "name", "BCOM", { name: "BCOM", department: "BCOM" });
      await ensureDoc("courses", "name", "MBA", { name: "MBA", department: "MBA" });

      await createIfMissing("ADMIN001", "Admin User", "ADMIN", "Administrator", true);

      await createIfMissing("BCA001", "BCA Faculty", "BCA", "Assistant Professor", false);
      await createIfMissing("BBA001", "BBA Faculty", "BBA", "Assistant Professor", false);
      await createIfMissing("MCA001", "MCA Faculty", "MCA", "Assistant Professor", false);
      await createIfMissing("BCOM001", "BCOM Faculty", "BCOM", "Assistant Professor", false);
      await createIfMissing("MBA001", "MBA Faculty", "MBA", "Assistant Professor", false);

      await createStudentIfMissing("2023001", "Student One", "BCA", 1);
      await createStudentIfMissing("2023002", "Student Two", "BBA", 1);
      await createStudentIfMissing("2023003", "Student Three", "MCA", 1);

      toast.success("Seed complete");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Seed failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Seed Test Admin + Faculty</CardTitle>
          <CardDescription>
            Creates one admin and one faculty for each department (BCA, BBA, MCA, BCOM, MBA).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={seed} disabled={loading}>
            {loading ? "Seeding..." : "Create Test Credentials"}
          </Button>
          {results.length > 0 && (
            <div className="text-sm space-y-2">
              {results.map((r) => {
                if (r.type === "faculty") {
                  return (
                    <div key={r.faculty_id}>
                      <strong>{r.faculty_id}</strong> — {r.department} — {r.role} — password: <code>{r.password}</code>
                    </div>
                  );
                }
                return (
                  <div key={r.enrollment_number}>
                    <strong>{r.enrollment_number}</strong> — {r.course} Year {r.year} — password: <code>{r.password}</code>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
