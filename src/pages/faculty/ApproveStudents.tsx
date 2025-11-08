import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import FacultyLayout from "@/components/FacultyLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UserCheck, X, AlertCircle } from "lucide-react";
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

    // Delete the profile and auth user
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
          <h1 className="text-3xl font-bold mb-2">Approve Students</h1>
          <p className="text-muted-foreground">
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
              <CardTitle>Pending Approvals ({students.length})</CardTitle>
              <CardDescription>Students waiting for verification</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Enrollment</TableHead>
                      <TableHead>Student ID</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Year</TableHead>
                      <TableHead>Section</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">{student.name}</TableCell>
                        <TableCell>{student.enrollment_number}</TableCell>
                        <TableCell>{student.student_id}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{student.course_name}</Badge>
                        </TableCell>
                        <TableCell>{student.year}</TableCell>
                        <TableCell>{student.section}</TableCell>
                        <TableCell>{student.email}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleApprove(student.id)}
                              disabled={loading}
                            >
                              <UserCheck className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleReject(student.id)}
                              disabled={loading}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </FacultyLayout>
  );
}
