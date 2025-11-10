import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import FacultyLayout from "@/components/FacultyLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { UserCheck, X, AlertCircle, Settings, Mail, Phone, User, Building } from "lucide-react";
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
  const [dialogOpen, setDialogOpen] = useState(false);

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
    setDialogOpen(false);
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
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Approve Faculty</h1>
          <p className="text-sm md:text-base text-muted-foreground">
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
              <CardTitle className="text-lg md:text-xl">Pending Approvals ({faculty.length})</CardTitle>
              <CardDescription className="text-sm">Faculty members waiting for verification</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {faculty.map((member) => (
                  <Card key={member.id} className="border-2">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                            <p className="font-semibold truncate">{member.name}</p>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3 flex-shrink-0" />
                            <p className="truncate">{member.email}</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-muted-foreground text-xs">Faculty ID</p>
                          <p className="font-medium truncate">{member.faculty_id}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Phone</p>
                          <p className="font-medium truncate">{member.phone || "-"}</p>
                        </div>
                      </div>

                      {member.department && (
                        <div className="flex items-center gap-2">
                          <Building className="h-3 w-3 text-muted-foreground" />
                          <Badge variant="outline" className="text-xs">{member.department}</Badge>
                        </div>
                      )}

                      <div className="flex gap-2 pt-2">
                        <Dialog open={dialogOpen && selectedFaculty?.id === member.id} onOpenChange={(open) => {
                          setDialogOpen(open);
                          if (!open) setSelectedFaculty(null);
                        }}>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              className="flex-1"
                              onClick={() => {
                                setSelectedFaculty(member);
                                setDialogOpen(true);
                              }}
                            >
                              <Settings className="h-4 w-4 mr-1" />
                              Configure
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="text-lg">Approve Faculty Member</DialogTitle>
                              <DialogDescription className="text-sm">
                                Assign role and class coordination to {member.name}
                              </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={(e) => handleApprove(member, e)} className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="role" className="text-sm">Role *</Label>
                                <Select name="role" required>
                                  <SelectTrigger className="text-sm">
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
                                <Label className="text-sm">Class Coordination (Optional)</Label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                  <Input
                                    name="assigned_course"
                                    placeholder="Course"
                                    className="text-sm"
                                  />
                                  <Input
                                    name="assigned_year"
                                    type="number"
                                    placeholder="Year"
                                    min="1"
                                    max="6"
                                    className="text-sm"
                                  />
                                  <Input
                                    name="assigned_section"
                                    placeholder="Section"
                                    className="text-sm"
                                  />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  Leave empty if not assigning class coordination
                                </p>
                              </div>

                              <div className="flex gap-2">
                                <Button type="submit" disabled={loading} className="flex-1">
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
