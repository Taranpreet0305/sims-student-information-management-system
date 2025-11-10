import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import FacultyLayout from "@/components/FacultyLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserCheck, X, AlertCircle, Mail, User, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { useFacultyRole } from "@/hooks/useFacultyRole";

export default function ApproveStudents() {
  const { profile, isAdmin, isClassCoordinator, loading: roleLoading } = useFacultyRole();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      loadPendingStudents();
    }
  }, [profile]);

  const loadPendingStudents = async () => {
    if (!profile) return;

    let query = supabase
      .from("profiles")
      .select("*")
      .eq("verify", false);

    // Class coordinators can only see students in their assigned class
    if (!isAdmin && isClassCoordinator) {
      query = query
        .eq("course_name", profile.assigned_course)
        .eq("year", profile.assigned_year)
        .eq("section", profile.assigned_section);
    }

    const { data } = await query.order("created_at", { ascending: false });

    if (data) {
      setStudents(data);
    }
  };

  const handleApprove = async (studentId: string) => {
    setLoading(true);

    const { error } = await supabase
      .from("profiles")
      .update({ verify: true })
      .eq("id", studentId);

    if (error) {
      toast.error("Failed to approve student");
    } else {
      toast.success("Student approved successfully!");
      await loadPendingStudents();
    }

    setLoading(false);
  };

  const handleReject = async (studentId: string) => {
    setLoading(true);

    const { error } = await supabase
      .from("profiles")
      .delete()
      .eq("id", studentId);

    if (error) {
      toast.error("Failed to reject student");
    } else {
      toast.success("Student registration rejected");
      await loadPendingStudents();
    }

    setLoading(false);
  };

  if (roleLoading) {
    return (
      <FacultyLayout>
        <div className="flex items-center justify-center h-96">Loading...</div>
      </FacultyLayout>
    );
  }

  if (!isAdmin && !isClassCoordinator) {
    return (
      <FacultyLayout>
        <Card>
          <CardContent className="py-8">
            <div className="flex flex-col items-center gap-4">
              <AlertCircle className="h-12 w-12 text-muted-foreground" />
              <p className="text-center text-muted-foreground">
                Access Denied: Only Class Coordinators and Administrators can approve students
              </p>
            </div>
          </CardContent>
        </Card>
      </FacultyLayout>
    );
  }

  return (
    <FacultyLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Approve Students</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Review and approve pending student registrations
            {isClassCoordinator && !isAdmin && ` for ${profile?.assigned_course} Year ${profile?.assigned_year} (${profile?.assigned_section})`}
          </p>
        </div>

        {students.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">No pending student approvals</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">Pending Approvals ({students.length})</CardTitle>
              <CardDescription className="text-sm">Students waiting for verification</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {students.map((student) => (
                  <Card key={student.id} className="border-2">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                            <p className="font-semibold truncate">{student.name}</p>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3 flex-shrink-0" />
                            <p className="truncate">{student.email}</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-muted-foreground text-xs">Enrollment</p>
                          <p className="font-medium truncate">{student.enrollment_number}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Student ID</p>
                          <p className="font-medium truncate">{student.student_id}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-1">
                          <GraduationCap className="h-3 w-3 text-muted-foreground" />
                          <Badge variant="outline" className="text-xs">{student.course_name}</Badge>
                        </div>
                        <Badge variant="secondary" className="text-xs">Year {student.year}</Badge>
                        <Badge variant="secondary" className="text-xs">Section {student.section}</Badge>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => handleApprove(student.id)}
                          disabled={loading}
                        >
                          <UserCheck className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="flex-1"
                          onClick={() => handleReject(student.id)}
                          disabled={loading}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </FacultyLayout>
  );
}
