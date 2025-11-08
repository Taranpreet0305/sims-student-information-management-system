import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import FacultyLayout from "@/components/FacultyLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UserCheck, X, AlertCircle, Settings } from "lucide-react";
import { toast } from "sonner";
import { useFacultyRole } from "@/hooks/useFacultyRole";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function ApproveFaculty() {
  const { isAdmin, loading: roleLoading } = useFacultyRole();
  const [faculty, setFaculty] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState<any>(null);

  useEffect(() => {
    if (isAdmin) {
      loadPendingFaculty();
    }
  }, [isAdmin]);

  const loadPendingFaculty = async () => {
    const { data } = await supabase
      .from("faculty_profiles")
      .select("*")
      .eq("verify", false)
      .order("created_at", { ascending: false });

    if (data) {
      setFaculty(data);
    }
  };

  const handleApprove = async (facultyData: any, e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const assignedCourse = formData.get("assigned_course") as string || null;
    const assignedYear = formData.get("assigned_year") ? parseInt(formData.get("assigned_year") as string) : null;
    const assignedSection = formData.get("assigned_section") as string || null;
    const role = formData.get("role") as string;

    // Update faculty profile
    const { error: profileError } = await supabase
      .from("faculty_profiles")
      .update({
        verify: true,
        assigned_course: assignedCourse,
        assigned_year: assignedYear,
        assigned_section: assignedSection,
      })
      .eq("id", facultyData.id);

    if (profileError) {
      toast.error("Failed to approve faculty");
      setLoading(false);
      return;
    }

    // Add role to user_roles table
    if (role) {
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({
          user_id: facultyData.id,
          role: role as any,
        });

      if (roleError) {
        console.error("Role error:", roleError);
        toast.error("Failed to assign role");
        setLoading(false);
        return;
      }
    }

    toast.success("Faculty approved successfully!");
    setSelectedFaculty(null);
    await loadPendingFaculty();
    setLoading(false);
  };

  const handleReject = async (facultyId: string) => {
    setLoading(true);

    const { error } = await supabase
      .from("faculty_profiles")
      .delete()
      .eq("id", facultyId);

    if (error) {
      toast.error("Failed to reject faculty");
    } else {
      toast.success("Faculty registration rejected");
      await loadPendingFaculty();
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

  if (!isAdmin) {
    return (
      <FacultyLayout>
        <Card>
          <CardContent className="py-8">
            <div className="flex flex-col items-center gap-4">
              <AlertCircle className="h-12 w-12 text-muted-foreground" />
              <p className="text-center text-muted-foreground">
                Access Denied: Only Administrators can approve faculty members
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
          <h1 className="text-3xl font-bold mb-2">Approve Faculty</h1>
          <p className="text-muted-foreground">
            Review and approve pending faculty registrations
          </p>
        </div>

        {faculty.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">No pending faculty approvals</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Pending Approvals ({faculty.length})</CardTitle>
              <CardDescription>Faculty members waiting for verification</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Faculty ID</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {faculty.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">{member.name}</TableCell>
                        <TableCell>{member.faculty_id}</TableCell>
                        <TableCell>{member.email}</TableCell>
                        <TableCell>
                          {member.department ? (
                            <Badge variant="outline">{member.department}</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>{member.phone || "-"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  onClick={() => setSelectedFaculty(member)}
                                >
                                  <Settings className="h-4 w-4 mr-1" />
                                  Configure & Approve
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Approve Faculty Member</DialogTitle>
                                  <DialogDescription>
                                    Assign role and class coordination responsibilities to {member.name}
                                  </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={(e) => handleApprove(member, e)} className="space-y-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="role">Role</Label>
                                    <Select name="role" required>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select role" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="admin">Administrator</SelectItem>
                                        <SelectItem value="moderator">Moderator</SelectItem>
                                        <SelectItem value="user">Faculty</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <div className="space-y-2">
                                    <Label>Class Coordination (Optional)</Label>
                                    <div className="grid grid-cols-3 gap-2">
                                      <Input
                                        name="assigned_course"
                                        placeholder="Course"
                                      />
                                      <Input
                                        name="assigned_year"
                                        type="number"
                                        placeholder="Year"
                                        min="1"
                                        max="6"
                                      />
                                      <Input
                                        name="assigned_section"
                                        placeholder="Section"
                                      />
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                      Leave empty if not assigning class coordination
                                    </p>
                                  </div>

                                  <div className="flex gap-2">
                                    <Button type="submit" disabled={loading}>
                                      <UserCheck className="h-4 w-4 mr-1" />
                                      {loading ? "Approving..." : "Approve"}
                                    </Button>
                                  </div>
                                </form>
                              </DialogContent>
                            </Dialog>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleReject(member.id)}
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
